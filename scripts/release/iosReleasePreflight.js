/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");

function parseVersion(version) {
  const value = String(version || "").trim();
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    throw new Error(`Expected a three-part numeric version, received "${value}"`);
  }

  return match.slice(1).map(Number);
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }

  return 0;
}

function plistValue(contents, key) {
  const match = contents.match(
    new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`)
  );

  if (!match) throw new Error(`Could not read ${key} from ios/Collect/Info.plist`);
  return match[1].trim();
}

function readLocalVersions(root = ROOT) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const appJson = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
  const storeConfig = JSON.parse(
    fs.readFileSync(path.join(root, "store.config.json"), "utf8")
  );
  const plist = fs.readFileSync(path.join(root, "ios/Collect/Info.plist"), "utf8");

  return {
    packageJson: packageJson.version,
    appJson: appJson.expo.version,
    infoPlist: plistValue(plist, "CFBundleShortVersionString"),
    storeConfig: storeConfig.apple.version,
  };
}

function assertVersionsAgree(versions) {
  const entries = Object.entries(versions);
  const expected = entries[0][1];
  const mismatches = entries.filter(([, version]) => version !== expected);

  if (mismatches.length) {
    const details = entries.map(([name, version]) => `${name}=${version}`).join(", ");
    throw new Error(`Release versions disagree: ${details}`);
  }

  parseVersion(expected);
  return expected;
}

function assertVersionIsNewer(localVersion, publicVersion) {
  if (compareVersions(localVersion, publicVersion) <= 0) {
    throw new Error(
      `Local iOS version ${localVersion} must be newer than the public App Store ` +
      `version ${publicVersion}. Run yarn release-patch, open and merge the release PR, ` +
      `then run yarn build-submit-ios from the updated master branch.`
    );
  }
}

function assertGitReleaseState({ branch, status, head, remoteHead }) {
  if (branch !== "master") {
    throw new Error(`iOS releases must run from master, not ${branch || "a detached HEAD"}`);
  }

  if (status.trim()) {
    throw new Error("iOS releases require a clean working tree; commit or stash changes first");
  }

  if (head !== remoteHead) {
    throw new Error(
      `Local master (${head.slice(0, 7)}) is not the merged origin/master ` +
      `(${remoteHead.slice(0, 7)}); pull the merged release before building`
    );
  }
}

async function fetchPublicVersion(appId, fetchImpl = fetch) {
  const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=us`;
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`App Store lookup failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const version = payload.results?.[0]?.version;
  if (!version) throw new Error(`App Store lookup returned no version for Apple ID ${appId}`);
  return version;
}

function git(args, root = ROOT) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

async function main() {
  const versions = readLocalVersions();
  const localVersion = assertVersionsAgree(versions);
  const easConfig = JSON.parse(fs.readFileSync(path.join(ROOT, "eas.json"), "utf8"));
  const appId = easConfig.submit?.production?.ios?.ascAppId;

  if (!appId) throw new Error("eas.json is missing submit.production.ios.ascAppId");

  const remoteLine = git(["ls-remote", "origin", "refs/heads/master"]);
  const remoteHead = remoteLine.split(/\s+/)[0];
  if (!remoteHead) throw new Error("Could not resolve origin/master");

  assertGitReleaseState({
    branch: git(["branch", "--show-current"]),
    status: git(["status", "--porcelain"]),
    head: git(["rev-parse", "HEAD"]),
    remoteHead,
  });

  const publicVersion = await fetchPublicVersion(appId);
  assertVersionIsNewer(localVersion, publicVersion);

  console.log(`✅ iOS release preflight passed: ${localVersion} > App Store ${publicVersion}`);
  console.log("✅ Clean merged master and all version-bearing files agree");
}

module.exports = {
  assertGitReleaseState,
  assertVersionIsNewer,
  assertVersionsAgree,
  compareVersions,
  fetchPublicVersion,
  parseVersion,
  plistValue,
  readLocalVersions,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(`❌ iOS release preflight failed: ${error.message}`);
    process.exit(1);
  });
}
