/* eslint-disable */

/**
 * Propagates package.json's version to every other file that has to agree.
 *
 * Run by standard-version's `postbump` hook (see .versionrc.js), so
 * `yarn release-minor` is the whole release bump — there is deliberately
 * nothing left to edit by hand.
 *
 * ios/Collect/Info.plist is included because EAS reads it. standard-version
 * never touched it, so every release until 15.7.0 needed a manual edit that was
 * easy to forget, and a stale Info.plist is how the build and the store
 * metadata quietly disagree.
 */

const fs = require("fs");
const path = require("path");

/** The values every non-package.json file derives from the version string. */
function computeVersionUpdates(version) {
  const [major, minor, patch] = version.split(".").map(Number);
  const pad = (n) => String(n).padStart(2, "0");

  return {
    version,
    // The version string IS the build number. It is the TRAIN Apple gates
    // submissions on: a higher build number does not help if the train is
    // closed, which is what got build 90186 rejected.
    buildNumber: version,
    // Play refuses a versionCode that does not increase, so this must be
    // monotonic across every bump.
    versionCode: parseInt(`490${pad(major)}${pad(minor)}${pad(patch)}`),
  };
}

/** Rewrites both version keys in an Info.plist, leaving every other key alone. */
function updateInfoPlist(contents, version) {
  const replaceKey = (text, key) =>
    text.replace(
      new RegExp(`(<key>${key}</key>\\s*\\n\\s*<string>)[^<]*(</string>)`),
      `$1${version}$2`
    );

  return replaceKey(
    replaceKey(contents, "CFBundleShortVersionString"),
    "CFBundleVersion"
  );
}

function main() {
  const root = path.join(__dirname, "../..");
  const packageJsonPath = path.join(root, "package.json");
  const appJsonPath = path.join(root, "app.json");
  const infoPlistPath = path.join(root, "ios/Collect/Info.plist");

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

  const oldVersion = appJson.expo.version;
  const updates = computeVersionUpdates(packageJson.version);

  appJson.expo.version = updates.version;
  appJson.expo.ios.buildNumber = updates.buildNumber;
  appJson.expo.android.versionCode = updates.versionCode;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n", "utf8");

  console.log(`✅ Updated app.json version from ${oldVersion} to ${updates.version}`);
  console.log(`   iOS buildNumber: ${updates.buildNumber}`);
  console.log(`   Android versionCode: ${updates.versionCode}`);

  if (fs.existsSync(infoPlistPath)) {
    const plist = fs.readFileSync(infoPlistPath, "utf8");
    fs.writeFileSync(infoPlistPath, updateInfoPlist(plist, updates.version), "utf8");
    console.log(`✅ Updated ios/Collect/Info.plist to ${updates.version} (both keys)`);
  } else {
    // Loud rather than silent: a missing plist means the build will ship the
    // previous train's metadata.
    console.error(`❌ ios/Collect/Info.plist not found at ${infoPlistPath}`);
    process.exit(1);
  }
}

module.exports = { computeVersionUpdates, updateInfoPlist };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error("❌ Error updating version files:", error.message);
    process.exit(1);
  }
}
