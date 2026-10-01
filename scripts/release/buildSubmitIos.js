/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const {
  readAppStoreCredentials,
  setTestFlightNotes,
} = require("./appStoreConnect");
const { runPreflight } = require("./iosReleasePreflight");
// Run by plain `node` in CI, where the babel @app alias does not resolve.
// eslint-disable-next-line module-resolver/use-alias
const { updateInfoPlist } = require("../update-version/versionNumber");

const ROOT = path.resolve(__dirname, "../..");

function buildArguments() {
  return [
    "build",
    "--platform",
    "ios",
    "--profile",
    "production",
    "--non-interactive",
    "--wait",
    "--json",
  ];
}

function submitArguments(buildId) {
  return [
    "submit",
    "--platform",
    "ios",
    "--profile",
    "production",
    "--non-interactive",
    "--wait",
    "--id",
    buildId,
  ];
}

function parseBuildOutput(output) {
  const parsed = JSON.parse(output.trim());
  const builds = Array.isArray(parsed) ? parsed : [parsed];
  const build = builds.find((candidate) => candidate.platform === "IOS") || builds[0];

  if (!build?.id || !build?.appBuildVersion) {
    throw new Error("EAS did not return an exact iOS build ID and build number");
  }

  return build;
}

function metadataArguments({ nonInteractive = false } = {}) {
  return [
    "metadata:push",
    "--profile",
    "production",
    ...(nonInteractive ? ["--non-interactive"] : []),
  ];
}

function readWhatToTest(version, root = ROOT) {
  const notesPath = path.join(root, "store", "testflight", `${version}.txt`);

  if (!fs.existsSync(notesPath)) {
    throw new Error(
      `Missing ${path.relative(root, notesPath)}. Add focused TestFlight instructions ` +
      "for this version before building."
    );
  }

  const notes = fs.readFileSync(notesPath, "utf8").trim();
  if (!notes) throw new Error(`${path.relative(root, notesPath)} is empty`);
  return notes;
}

/**
 * Writes the build number Apple just accepted into app.json and Info.plist.
 *
 * With appVersionSource "local", the next build increments whatever app.json
 * holds. EAS does not reliably write its increment back, and in CI the
 * checkout is thrown away, so without this master stays one build behind
 * App Store Connect and a rebuild of the same train reuses a consumed number.
 */
function recordBuildNumber(buildNumber, root = ROOT) {
  const appJsonPath = path.join(root, "app.json");
  const infoPlistPath = path.join(root, "ios/Collect/Info.plist");

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
  appJson.expo.ios.buildNumber = String(buildNumber);
  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`, "utf8");

  const plist = fs.readFileSync(infoPlistPath, "utf8");
  fs.writeFileSync(
    infoPlistPath,
    updateInfoPlist(plist, { buildNumber: String(buildNumber) }),
    "utf8"
  );
}

/** Hands the submitted build to later workflow steps; a no-op outside Actions. */
function writeWorkflowOutputs(outputs, outputPath = process.env.GITHUB_OUTPUT) {
  if (!outputPath) return;
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}\n`);
  fs.appendFileSync(outputPath, lines.join(""));
}

async function main() {
  const { localVersion } = await runPreflight();
  const whatToTest = readWhatToTest(localVersion);
  const appStoreCredentials = readAppStoreCredentials();
  const lintResult = spawnSync("eas", ["metadata:lint", "--profile", "production"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (lintResult.error) throw lintResult.error;
  if (lintResult.status !== 0) process.exit(lintResult.status || 1);

  const buildResult = spawnSync("eas", buildArguments(), {
    cwd: ROOT,
    stdio: ["inherit", "pipe", "inherit"],
    encoding: "utf8",
  });

  if (buildResult.error) throw buildResult.error;
  if (buildResult.status !== 0) process.exit(buildResult.status || 1);

  const build = parseBuildOutput(buildResult.stdout);
  console.log(`✅ EAS built ${localVersion} (${build.appBuildVersion}): ${build.id}`);

  const submitResult = spawnSync("eas", submitArguments(build.id), {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (submitResult.error) throw submitResult.error;
  if (submitResult.status !== 0) process.exit(submitResult.status || 1);

  // Recorded before the notes and metadata steps: the number is consumed the
  // moment Apple accepts the binary, whether or not those later steps succeed.
  recordBuildNumber(build.appBuildVersion);
  writeWorkflowOutputs({ version: localVersion, build_number: build.appBuildVersion });
  console.log(`✅ Recorded build ${build.appBuildVersion} in app.json and Info.plist`);

  await setTestFlightNotes({
    appId: "1362371696",
    marketingVersion: localVersion,
    buildNumber: build.appBuildVersion,
    notes: whatToTest,
    credentials: appStoreCredentials,
  });

  const metadataResult = spawnSync(
    "eas",
    metadataArguments({ nonInteractive: Boolean(process.env.CI) }),
    { cwd: ROOT, stdio: "inherit" }
  );

  if (metadataResult.error) throw metadataResult.error;
  if (metadataResult.status !== 0) process.exit(metadataResult.status || 1);
}

module.exports = {
  buildArguments,
  metadataArguments,
  parseBuildOutput,
  readWhatToTest,
  recordBuildNumber,
  submitArguments,
  writeWorkflowOutputs,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(`❌ iOS build and submit failed: ${error.message}`);
    process.exit(1);
  });
}
