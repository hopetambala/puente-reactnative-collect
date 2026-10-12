const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

describe("Android promotion through the existing package command", () => {
  const repoRoot = path.resolve(__dirname, "../../..");
  const buildId = "already-tested-production-android-build";
  const releaseNotes = "Improved field collection and offline synchronization.";
  let fixtureRoot;
  let callLog;
  let originalApp;

  beforeEach(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "android-promotion-"));
    callLog = path.join(fixtureRoot, "release-calls.jsonl");
    ["package.json", "app.json", "eas.json"].forEach((filename) => {
      fs.copyFileSync(path.join(repoRoot, filename), path.join(fixtureRoot, filename));
    });
    originalApp = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "app.json"), "utf8"));
    fs.cpSync(path.join(repoRoot, "scripts/release"), path.join(fixtureRoot, "scripts/release"), {
      recursive: true,
      filter: (source) => path.basename(source) !== "__tests__",
    });
    fs.writeFileSync(path.join(fixtureRoot, "release-notes.txt"), releaseNotes);

    // Every subprocess and Google response is confined to this copied checkout.
    // No caller environment, real CLI, credentials, or network are inherited.
    fs.symlinkSync(process.execPath, path.join(fixtureRoot, "node"));
    fs.writeFileSync(
      path.join(fixtureRoot, "eas"),
      `#!${process.execPath}\n` +
        'const fs = require("fs");\n' +
        "const args = process.argv.slice(2);\n" +
        'fs.appendFileSync(process.env.RELEASE_CALL_LOG, JSON.stringify({ transport: "eas", args }) + "\\n");\n' +
        'const record = JSON.parse(process.env.EAS_BUILD_RECORD);\n' +
        'if (args[0] === "build:view") console.log(JSON.stringify(record));\n' +
        // Existing behavior can complete, so RED is an assertion failure rather
        // than a fixture crash when the current command wrongly starts a build.
        'if (args[0] === "build") console.log(JSON.stringify([record]));\n',
      { mode: 0o755 }
    );
    fs.writeFileSync(
      path.join(fixtureRoot, "google-transport.cjs"),
      'const fs = require("fs");\n' +
        "global.fetch = async (input, options = {}) => {\n" +
        "  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);\n" +
        "  const method = options.method || 'GET';\n" +
        "  const headers = new Headers(options.headers);\n" +
        "  const body = options.body ? JSON.parse(options.body) : undefined;\n" +
        "  const call = { transport: 'google', url: url.href, method, authorization: headers.get('authorization'), body };\n" +
        "  fs.appendFileSync(process.env.RELEASE_CALL_LOG, JSON.stringify(call) + '\\n');\n" +
        "  let status = 200;\n" +
        "  let data = {};\n" +
        "  const base = '/androidpublisher/v3/applications/' + process.env.GOOGLE_PACKAGE + '/edits';\n" +
        "  if (url.origin !== 'https://androidpublisher.googleapis.com' || call.authorization !== 'Bearer fixture-google-token') {\n" +
        "    status = 401; data = { error: { message: 'Fixture requires authenticated Google Play transport' } };\n" +
        "  } else if (url.pathname === base && method === 'POST') {\n" +
        "    data = { id: 'fixture-edit-id' };\n" +
        "  } else if (url.pathname === base + '/fixture-edit-id/bundles' && method === 'GET') {\n" +
        "    data = { bundles: process.env.BUILD_UPLOADED === 'no' ? [] : [{ versionCode: Number(process.env.GOOGLE_VERSION_CODE) }] };\n" +
        "  } else if (url.pathname === base + '/fixture-edit-id/tracks' && method === 'GET') {\n" +
        "    data = { tracks: [{ track: 'internal', releases: [{ status: 'completed', versionCodes: [process.env.GOOGLE_VERSION_CODE] }] }, { track: 'production', releases: [] }] };\n" +
        "  } else if (url.pathname === base + '/fixture-edit-id/tracks/production' && method === 'GET') {\n" +
        "    data = { track: 'production', releases: process.env.NEWER_PRODUCTION === 'yes' ? [{versionCodes: [String(Number(process.env.GOOGLE_VERSION_CODE) + 1)], status: 'completed'}] : [] };\n" +
        "  } else if (url.pathname === base + '/fixture-edit-id/tracks/production' && method === 'PUT') {\n" +
        "    data = body;\n" +
        "  } else if (url.pathname === base + '/fixture-edit-id:validate' && method === 'POST') {\n" +
        "    if (process.env.VALIDATE_FAIL === 'yes') { status = 400; data = { error: { message: 'Google Play validation failed' } }; }\n" +
        "  } else if (url.pathname === base + '/fixture-edit-id:commit' && method === 'POST') {\n" +
        "    data = { id: 'fixture-edit-id' };\n" +
        "  } else if (url.pathname === base + '/fixture-edit-id' && method === 'DELETE') {\n" +
        "    status = 204;\n" +
        "  } else {\n" +
        "    status = 404; data = { error: { message: 'Unexpected fixture request: ' + method + ' ' + url.pathname } };\n" +
        "  }\n" +
        "  return new Response(status === 204 ? null : JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });\n" +
        "};\n" +
        // Catch transports that bypass fetch; this fixture must never connect.
        "require('http').request = require('https').request = () => { throw new Error('Network disabled in release fixture'); };\n"
    );
  });

  afterEach(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

  function runPromotion({ buildOverrides = {}, uploaded = true, validationFails = false, newerProduction = false } = {}) {
    const releaseScript = JSON.parse(
      fs.readFileSync(path.join(fixtureRoot, "package.json"), "utf8")
    ).scripts["build-submit-android"];
    const build = {
      id: buildId,
      platform: "ANDROID",
      status: "FINISHED",
      buildProfile: "production",
      distribution: "STORE",
      appVersion: originalApp.expo.version,
      appBuildVersion: String(originalApp.expo.android.versionCode),
      appIdentifier: originalApp.expo.android.package,
      gitCommitHash: "1234567890abcdef1234567890abcdef12345678",
      artifacts: { applicationArchiveUrl: "https://fixture.invalid/tested-production.aab" },
      ...buildOverrides,
    };
    return spawnSync("/bin/sh", ["-c", `${releaseScript} "$@"`, "release-fixture", "--promote-build", buildId, "--release-notes", path.join(fixtureRoot, "release-notes.txt")], {
      cwd: fixtureRoot,
      encoding: "utf8",
      timeout: 10000,
      env: {
        PATH: fixtureRoot,
        NODE_OPTIONS: `--require=${path.join(fixtureRoot, "google-transport.cjs")}`,
        RELEASE_CALL_LOG: callLog,
        EAS_BUILD_RECORD: JSON.stringify(build),
        GOOGLE_PLAY_ACCESS_TOKEN: "fixture-google-token",
        GOOGLE_PACKAGE: originalApp.expo.android.package,
        GOOGLE_VERSION_CODE: String(originalApp.expo.android.versionCode),
        BUILD_UPLOADED: uploaded ? "yes" : "no",
        VALIDATE_FAIL: validationFails ? "yes" : "no",
        NEWER_PRODUCTION: newerProduction ? "yes" : "no",
      },
    });
  }

  function readCalls() {
    return fs.existsSync(callLog)
      ? fs.readFileSync(callLog, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line))
      : [];
  }

  function assertExistingBuildOnly(calls) {
    const easCalls = calls.filter(({ transport }) => transport === "eas");
    expect(easCalls.map(({ args }) => args[0])).toEqual(["build:view"]);
    expect(easCalls[0].args).toEqual(expect.arrayContaining([buildId, "--json"]));
    expect(easCalls.some(({ args }) => args.includes("--latest"))).toBe(false);
  }

  it("promotes the exact finished uploaded production build with notes, validates, and commits under ERROR_IF_IN_REVIEW", () => {
    const result = runPromotion();
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    const calls = readCalls();
    assertExistingBuildOnly(calls);

    const googleCalls = calls.filter(({ transport }) => transport === "google");
    expect(googleCalls.every(({ authorization }) => authorization === "Bearer fixture-google-token")).toBe(true);
    const uploadedIndex = googleCalls.findIndex(({ method, url }) => method === "GET" && new URL(url).pathname.endsWith("/bundles"));
    const updateIndex = googleCalls.findIndex(({ method, url }) => method === "PUT" && new URL(url).pathname.endsWith("/tracks/production"));
    const validateIndex = googleCalls.findIndex(({ method, url }) => method === "POST" && new URL(url).pathname.endsWith(":validate"));
    const commitIndex = googleCalls.findIndex(({ method, url }) => method === "POST" && new URL(url).pathname.endsWith(":commit"));
    expect(uploadedIndex).toBeGreaterThanOrEqual(0);
    expect(updateIndex).toBeGreaterThan(uploadedIndex);
    expect(validateIndex).toBeGreaterThan(updateIndex);
    expect(commitIndex).toBeGreaterThan(validateIndex);
    expect(googleCalls[updateIndex].body).toEqual(expect.objectContaining({
      track: "production",
      releases: [expect.objectContaining({
        status: "completed",
        versionCodes: [String(originalApp.expo.android.versionCode)],
        releaseNotes: [{ language: "en-US", text: releaseNotes }],
      })],
    }));
    expect(new URL(googleCalls[commitIndex].url).searchParams.get("changesInReviewBehavior")).toBe("ERROR_IF_IN_REVIEW");
    expect(JSON.parse(fs.readFileSync(path.join(fixtureRoot, "app.json"), "utf8"))).toEqual(originalApp);
  });

  it("refuses to promote an existing build whose app version differs from the local release", () => {
    const result = runPromotion({ buildOverrides: { appVersion: "0.0.1" } });
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    assertExistingBuildOnly(readCalls());
    expect(readCalls().filter(({ transport }) => transport === "google")).toEqual([]);
    expect(JSON.parse(fs.readFileSync(path.join(fixtureRoot, "app.json"), "utf8"))).toEqual(originalApp);
  });

  it("accepts EAS's production build record when the optional appIdentifier is omitted", () => {
    const result = runPromotion({ buildOverrides: { appIdentifier: undefined } });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    assertExistingBuildOnly(readCalls());
    expect(readCalls().some(({ url }) => url && new URL(url).pathname.endsWith(":commit"))).toBe(true);
  });

  it("refuses to publish a build whose exact version code is absent from Google Play uploads", () => {
    const result = runPromotion({ uploaded: false });
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    assertExistingBuildOnly(readCalls());
    expect(readCalls().filter(({ transport, method }) => transport === "google" && method === "PUT")).toEqual([]);
    expect(readCalls().some(({ url }) => url && new URL(url).pathname.endsWith(":commit"))).toBe(false);
  });

  it("does not commit the production edit when Google Play validation rejects it", () => {
    const result = runPromotion({ validationFails: true });
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    assertExistingBuildOnly(readCalls());
    expect(readCalls().some(({ url }) => url && new URL(url).pathname.endsWith(":validate"))).toBe(true);
    expect(readCalls().some(({ url }) => url && new URL(url).pathname.endsWith(":commit"))).toBe(false);
    expect(JSON.parse(fs.readFileSync(path.join(fixtureRoot, "app.json"), "utf8"))).toEqual(originalApp);
  });

  it("refuses to replace a newer production version code with an older tested build", () => {
    const result = runPromotion({ newerProduction: true });
    expect(result.status).not.toBe(0);
    expect(readCalls().some(({ method }) => method === "PUT")).toBe(false);
    expect(readCalls().some(({ url }) => url && new URL(url).pathname.endsWith(":commit"))).toBe(false);
  });
});
