/* eslint-disable */

const fs = require("fs");
const path = require("path");

// Read package.json to get the version
const packageJsonPath = path.join(__dirname, "../../package.json");
const appJsonPath = path.join(__dirname, "../../app.json");

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

  const newVersion = packageJson.version;
  const oldVersion = appJson.expo.version;

  // Update app.json version
  appJson.expo.version = newVersion;
  appJson.expo.ios.buildNumber = newVersion;

  // Update Android versionCode: convert "X.Y.Z" to format "49XXYYZZ"
  const [major, minor, patch] = newVersion.split(".").map(Number);
  const paddedMajor = String(major).padStart(2, "0");
  const paddedMinor = String(minor).padStart(2, "0");
  const paddedPatch = String(patch).padStart(2, "0");
  appJson.expo.android.versionCode = parseInt(`490${paddedMajor}${paddedMinor}${paddedPatch}`);

  // Write the updated app.json
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n", "utf8");

  console.log(`✅ Updated app.json version from ${oldVersion} to ${newVersion}`);
  console.log(`   iOS buildNumber: ${newVersion}`);
  console.log(`   Android versionCode: ${appJson.expo.android.versionCode}`);
} catch (error) {
  console.error("❌ Error updating app.json:", error.message);
  process.exit(1);
}
