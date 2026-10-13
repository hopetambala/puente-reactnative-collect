/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");

function buildArguments() {
  return [
    "build",
    "--platform",
    "android",
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
    "android",
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
  const androidBuilds = builds.filter((candidate) => candidate?.platform === "ANDROID");
  const build = androidBuilds[0];
  const versionCode = Number(build?.appBuildVersion);

  if (
    androidBuilds.length !== 1 ||
    typeof build?.id !== "string" ||
    !build.id.trim() ||
    !Number.isSafeInteger(versionCode) ||
    versionCode <= 0 ||
    (build.status && build.status !== "FINISHED")
  ) {
    throw new Error("EAS did not return an exact finished Android build ID and version code");
  }

  return build;
}

function recordVersionCode(versionCode, root = ROOT) {
  const appJsonPath = path.join(root, "app.json");
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
  appJson.expo.android.versionCode = Number(versionCode);
  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`, "utf8");
}

async function main(args = process.argv.slice(2)) {
  if (args.includes("--promote-build")) {
    const { promoteAndroid } = require("./promoteAndroid"); // eslint-disable-line global-require
    await promoteAndroid(args, { root: ROOT, parseBuildOutput, recordVersionCode });
    return;
  }
  const buildResult = spawnSync("eas", buildArguments(), {
    cwd: ROOT,
    stdio: ["inherit", "pipe", "inherit"],
    encoding: "utf8",
  });

  if (buildResult.error) throw buildResult.error;
  if (buildResult.status !== 0) process.exit(buildResult.status || 1);

  const build = parseBuildOutput(buildResult.stdout);
  console.log(`EAS built Android version code ${build.appBuildVersion}: ${build.id}`);

  const submitResult = spawnSync("eas", submitArguments(build.id), {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (submitResult.error) throw submitResult.error;
  if (submitResult.status !== 0) process.exit(submitResult.status || 1);

  recordVersionCode(build.appBuildVersion);
  console.log(`Recorded Android version code ${build.appBuildVersion} in app.json`);
}

module.exports = {
  buildArguments,
  main,
  parseBuildOutput,
  recordVersionCode,
  submitArguments,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(`Android build and submit failed: ${error.message}`);
    process.exit(1);
  });
}
