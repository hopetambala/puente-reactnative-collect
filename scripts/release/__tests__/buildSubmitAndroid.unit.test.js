const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

describe("Android build and submit package command", () => {
  const repoRoot = path.resolve(__dirname, "../../..");
  const buildId = "android-build-returned-by-this-command";
  const buildVersionCode = 490150708;
  let fixtureRoot;
  let callLog;
  let originalApp;

  beforeEach(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "android-release-"));
    callLog = path.join(fixtureRoot, "eas-calls.jsonl");
    fs.copyFileSync(path.join(repoRoot, "package.json"), path.join(fixtureRoot, "package.json"));
    fs.copyFileSync(path.join(repoRoot, "app.json"), path.join(fixtureRoot, "app.json"));
    originalApp = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "app.json"), "utf8"));
    const entrypoint = path.join(repoRoot, "scripts/release/buildSubmitAndroid.js");
    if (fs.existsSync(entrypoint)) {
      fs.mkdirSync(path.join(fixtureRoot, "scripts/release"), { recursive: true });
      fs.copyFileSync(entrypoint, path.join(fixtureRoot, "scripts/release/buildSubmitAndroid.js"));
    }

    // Only fixture executables are on PATH: this test cannot run the real EAS CLI.
    fs.symlinkSync(process.execPath, path.join(fixtureRoot, "node"));
    fs.writeFileSync(
      path.join(fixtureRoot, "eas"),
      `#!${process.execPath}\n` +
        'const fs = require("fs");\n' +
        "const args = process.argv.slice(2);\n" +
        'const versionCode = JSON.parse(fs.readFileSync("app.json", "utf8")).expo.android.versionCode;\n' +
        'fs.appendFileSync(process.env.EAS_CALL_LOG, JSON.stringify({ args, versionCode }) + "\\n");\n' +
        'if (args[0] === "build") {\n' +
        '  console.log(JSON.stringify([{ id: process.env.EAS_BUILD_ID, platform: "ANDROID", status: "FINISHED", appBuildVersion: process.env.EAS_BUILD_VERSION_CODE }]));\n' +
        "}\n" +
        'if (args[0] === "submit") process.exit(Number(process.env.EAS_SUBMIT_EXIT_CODE || 0));\n',
      { mode: 0o755 }
    );
  });

  afterEach(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

  function runRelease(submitExitCode = 0) {
    const releaseScript = JSON.parse(
      fs.readFileSync(path.join(fixtureRoot, "package.json"), "utf8")
    ).scripts["build-submit-android"];

    return spawnSync("/bin/sh", ["-c", releaseScript], {
      cwd: fixtureRoot,
      encoding: "utf8",
      timeout: 10000,
      env: {
        PATH: fixtureRoot,
        EAS_CALL_LOG: callLog,
        EAS_BUILD_ID: buildId,
        EAS_BUILD_VERSION_CODE: String(buildVersionCode),
        EAS_SUBMIT_EXIT_CODE: String(submitExitCode),
      },
    });
  }

  function readCalls() {
    return fs
      .readFileSync(callLog, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
  }

  function readApp() {
    return JSON.parse(fs.readFileSync(path.join(fixtureRoot, "app.json"), "utf8"));
  }

  it("waits for the Android build and submits its returned ID without prompts", () => {
    const result = runRelease();

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);

    const optionValue = (args, ...names) => {
      const index = args.findIndex((arg) => names.includes(arg));
      return index === -1 ? undefined : args[index + 1];
    };

    expect(
      readCalls().map(({ args }) => ({
        command: args[0],
        platform: optionValue(args, "--platform", "-p"),
        id: optionValue(args, "--id"),
        wait: args.includes("--wait"),
        json: args.includes("--json"),
        nonInteractive: args.includes("--non-interactive"),
        latest: args.includes("--latest"),
      }))
    ).toEqual([
      {
        command: "build",
        platform: "android",
        id: undefined,
        wait: true,
        json: true,
        nonInteractive: true,
        latest: false,
      },
      {
        command: "submit",
        platform: "android",
        id: buildId,
        wait: true,
        json: false,
        nonInteractive: true,
        latest: false,
      },
    ]);
  });

  it("records the exact returned version code only after submission succeeds", () => {
    const result = runRelease();

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(readCalls().map(({ versionCode }) => versionCode)).toEqual([
      originalApp.expo.android.versionCode,
      originalApp.expo.android.versionCode,
    ]);
    expect(readApp()).toEqual({
      ...originalApp,
      expo: {
        ...originalApp.expo,
        android: { ...originalApp.expo.android, versionCode: buildVersionCode },
      },
    });
  });

  it("leaves the version code unchanged when submission fails", () => {
    const result = runRelease(17);

    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(readCalls().map(({ args }) => args[0])).toEqual(["build", "submit"]);
    expect(readApp()).toEqual(originalApp);
  });
});
