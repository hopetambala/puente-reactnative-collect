const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");
// Exercise the config tools owned by the installed Expo SDK, not a second copy.
const expoRequire = createRequire(require.resolve("expo/package.json"));
const configPluginsRequire = createRequire(require.resolve("@expo/config-plugins/package.json"));
const plist = configPluginsRequire("@expo/plist").default;
const { getConfig } = expoRequire("@expo/config");
const { AndroidConfig, IOSConfig } = require("@expo/config-plugins");

const repoRoot = path.resolve(__dirname, "../../..");
const scannerName =
  "com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity";

// The activity in play-services-code-scanner:16.1.0, used by expo-camera.
// Keep the library declaration separate: deleting an app attribute alone does
// not remove an orientation inherited during Android's manifest merge.
const libraryScanner = {
  "android:name": scannerName,
  "android:exported": "false",
  "android:screenOrientation": "portrait",
};

function mergeScannerAttributes(appAttributes = {}) {
  const merged = { ...libraryScanner };
  const removed = (appAttributes["tools:remove"] || "").split(/\s*,\s*/);
  const replaced = (appAttributes["tools:replace"] || "").split(/\s*,\s*/);
  const conflicts = [];

  removed.forEach((attribute) => delete merged[attribute]);
  Object.entries(appAttributes).forEach(([attribute, value]) => {
    if (attribute.startsWith("tools:")) return;
    if (
      merged[attribute] !== undefined &&
      merged[attribute] !== value &&
      !replaced.includes(attribute)
    ) {
      conflicts.push(attribute);
    }
    merged[attribute] = value;
  });
  return { merged, conflicts };
}

describe("Android large-screen release configuration", () => {
  it("generates unrestricted, resizable main and merged barcode activities while preserving iOS orientations", async () => {
    let config = getConfig(repoRoot, {
      isModdedConfig: true,
      skipSDKVersionRequirement: true,
    }).exp;
    const modRawConfig = JSON.parse(JSON.stringify(config));
    // Match prebuild ordering: app plugins register before Expo's defaults.
    config = AndroidConfig.Orientation.withOrientation(config);
    config = IOSConfig.Orientation.withOrientation(config);

    const androidManifest = {
      manifest: {
        $: { "xmlns:android": "http://schemas.android.com/apk/res/android" },
        application: [{
          $: { "android:name": ".MainApplication" },
          activity: [{
            $: { "android:name": ".MainActivity", "android:exported": "true" },
          }],
        }],
      },
    };
    const androidResult = await config.mods.android.manifest({
      ...config,
      modRawConfig,
      modResults: androidManifest,
      modRequest: { projectRoot: repoRoot, platform: "android", modName: "manifest" },
    });
    const application = androidResult.modResults.manifest.application[0];
    const main = application.activity.find(
      (activity) => activity.$["android:name"] === ".MainActivity"
    ).$;
    const scanner = application.activity.find(
      (activity) => activity.$["android:name"] === scannerName
    );
    const { merged, conflicts } = mergeScannerAttributes(scanner?.$);
    const unrestrictedOrientations = [undefined, "unspecified", "user", "fullUser", "sensor", "fullSensor"];
    const activities = [main, merged];

    const iosResult = await config.mods.ios.infoPlist({
      ...config,
      modRawConfig,
      modResults: plist.parse(fs.readFileSync(path.join(repoRoot, "ios/Collect/Info.plist"), "utf8")),
      modRequest: { projectRoot: repoRoot, platform: "ios", modName: "infoPlist" },
    });

    expect({
      restrictedActivities: activities
        .filter((activity) => !unrestrictedOrientations.includes(activity["android:screenOrientation"]))
        .map((activity) => ({
          name: activity["android:name"],
          orientation: activity["android:screenOrientation"],
        })),
      nonResizableActivities: activities
        .filter((activity) => String(activity["android:resizeableActivity"] ?? application.$["android:resizeableActivity"] ?? true) === "false")
        .map((activity) => activity["android:name"]),
      scannerMergeConflicts: conflicts,
      iosOrientations: iosResult.modResults.UISupportedInterfaceOrientations,
      ipadOrientations: iosResult.modResults["UISupportedInterfaceOrientations~ipad"],
    }).toEqual({
      restrictedActivities: [],
      nonResizableActivities: [],
      scannerMergeConflicts: [],
      iosOrientations: ["UIInterfaceOrientationPortrait", "UIInterfaceOrientationPortraitUpsideDown"],
      ipadOrientations: [
        "UIInterfaceOrientationPortrait",
        "UIInterfaceOrientationPortraitUpsideDown",
        "UIInterfaceOrientationLandscapeLeft",
        "UIInterfaceOrientationLandscapeRight",
      ],
    });
  });
});
