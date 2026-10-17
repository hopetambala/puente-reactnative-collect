const { AndroidConfig, withAndroidManifest } = require("@expo/config-plugins");

const scannerActivityName =
  "com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity";

module.exports = function withAndroidLargeScreen(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults;
    AndroidConfig.Manifest.ensureToolsAvailable(manifest);
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
    // App plugins run after Expo's default manifest mods during prebuild.
    mainActivity.$["android:screenOrientation"] = "unspecified";
    mainActivity.$["android:resizeableActivity"] = "true";

    let scannerActivity = application.activity.find(
      (activity) => activity.$["android:name"] === scannerActivityName
    );
    if (!scannerActivity) {
      scannerActivity = { $: { "android:name": scannerActivityName } };
      application.activity.push(scannerActivity);
    }

    // Removing an app attribute alone leaves the library's portrait lock intact.
    delete scannerActivity.$["android:screenOrientation"];
    const removedAttributes = new Set(
      (scannerActivity.$["tools:remove"] || "").split(/\s*,\s*/).filter(Boolean)
    );
    removedAttributes.add("android:screenOrientation");
    scannerActivity.$["tools:remove"] = [...removedAttributes].join(",");
    scannerActivity.$["android:resizeableActivity"] = "true";
    return modConfig;
  });
};
