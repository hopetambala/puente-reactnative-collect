/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const { runPreflight } = require("./iosReleasePreflight");

const ROOT = path.resolve(__dirname, "../..");

function buildArguments(whatToTest) {
  return [
    "build",
    "--platform",
    "ios",
    "--profile",
    "production",
    "--non-interactive",
    "--auto-submit",
    "--what-to-test",
    whatToTest,
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

async function main() {
  const { localVersion } = await runPreflight();
  const whatToTest = readWhatToTest(localVersion);
  const result = spawnSync("eas", buildArguments(whatToTest), {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

module.exports = { buildArguments, readWhatToTest };

if (require.main === module) {
  main().catch((error) => {
    console.error(`❌ iOS build and submit failed: ${error.message}`);
    process.exit(1);
  });
}
