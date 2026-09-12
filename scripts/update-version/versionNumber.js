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

/**
 * The values every non-package.json file derives from the version string.
 *
 * `current` is what app.json holds right now — `{ versionCode, buildNumber }`.
 * Both matter because EAS moves them too: `autoIncrement` bumps each on every
 * build and writes it back. So the values derived here are FLOORS, not
 * answers. Deriving a number EAS has already used hands the store something it
 * has seen, and the store refuses the upload.
 */
function computeVersionUpdates(version, current = {}) {
  const [major, minor, patch] = version.split(".").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  const currentVersionCode = current.versionCode;
  // Anything that is not WHOLLY digits — notably the version-shaped build
  // numbers this scheme replaced ("15.7.4") — restarts the counter. A version
  // bump is a new CFBundleShortVersionString train, and build numbers only
  // have to be unique WITHIN a train, so restarting is safe exactly there.
  //
  // The test is a regex rather than parseInt: `parseInt("15.7.4", 10)` is 15,
  // not NaN, so the old value would have quietly become "16" and carried the
  // confusion forward.
  const currentBuildNumber = /^\d+$/.test(String(current.buildNumber ?? "").trim())
    ? Number(current.buildNumber)
    : NaN;

  return {
    version,
    // A PLAIN COUNTER, not the version.
    //
    // CFBundleVersion is the build; CFBundleShortVersionString is the train
    // Apple gates submissions on. Setting the build to the version conflated
    // the two and made App Store Connect read "Version 15.7.2 / Build 15.7.4"
    // — a build number that looks like a release that does not exist.
    buildNumber: String(
      Number.isFinite(currentBuildNumber) ? currentBuildNumber + 1 : 1
    ),
    // Play refuses a versionCode it has already seen, so this must be strictly
    // greater than anything used before — including values EAS produced, which
    // is why the current code is taken into account rather than assumed lower.
    //
    // The 490MMmmpp encoding is kept because it makes a code readable at a
    // glance (490150703 is 15.7.3), but readability yields to monotonicity:
    // a rebuilt version leaves the code one step ahead of its encoding, and
    // that is correct.
    versionCode: Math.max(
      parseInt(`490${pad(major)}${pad(minor)}${pad(patch)}`, 10),
      Number(currentVersionCode || 0) + 1
    ),
  };
}

/**
 * Rewrites the version keys in an Info.plist, leaving every other key alone.
 *
 * The two keys have different owners, so each is optional:
 *   CFBundleShortVersionString  the train — standard-version's bumpFiles
 *                               updater knows this and nothing else
 *   CFBundleVersion             the build counter — only the postbump hook
 *                               knows it
 *
 * Passing one leaves the other exactly as it was. An updater that wrote both
 * would stamp the version over the build number, and only the fact that
 * postbump runs afterwards would hide it.
 */
function updateInfoPlist(contents, { shortVersion, buildNumber } = {}) {
  const replaceKey = (text, key, value) =>
    (value === undefined
      ? text
      : text.replace(
        new RegExp(`(<key>${key}</key>\\s*\\n\\s*<string>)[^<]*(</string>)`),
        `$1${value}$2`
      ));

  return replaceKey(
    replaceKey(contents, "CFBundleShortVersionString", shortVersion),
    "CFBundleVersion",
    buildNumber
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
  const updates = computeVersionUpdates(packageJson.version, {
    versionCode: appJson.expo.android.versionCode,
    buildNumber: appJson.expo.ios.buildNumber,
  });

  appJson.expo.version = updates.version;
  appJson.expo.ios.buildNumber = updates.buildNumber;
  appJson.expo.android.versionCode = updates.versionCode;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n", "utf8");

  console.log(`✅ Updated app.json version from ${oldVersion} to ${updates.version}`);
  console.log(`   iOS buildNumber: ${updates.buildNumber}`);
  console.log(`   Android versionCode: ${updates.versionCode}`);

  if (fs.existsSync(infoPlistPath)) {
    const plist = fs.readFileSync(infoPlistPath, "utf8");
    fs.writeFileSync(
      infoPlistPath,
      updateInfoPlist(plist, {
        shortVersion: updates.version,
        buildNumber: updates.buildNumber,
      }),
      "utf8"
    );
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
