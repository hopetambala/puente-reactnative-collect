const { execFileSync } = require("child_process");
const path = require("path");

const appRoot = path.resolve(__dirname, "../../..");
const notificationsRoot = path.dirname(require.resolve("expo-notifications/package.json"));
// Resolve the same installed autolinker that Android's settings.gradle uses.
const autolinkingRoot = path.dirname(
  require.resolve("expo-modules-autolinking/package.json", {
    paths: [require.resolve("expo/package.json")],
  })
);

function resolveInstalledModules(platform, nativeDirectory) {
  return JSON.parse(
    execFileSync(
      process.execPath,
      [
        path.join(autolinkingRoot, "bin/expo-modules-autolinking.js"),
        "resolve",
        "--platform",
        platform,
        "--json",
      ],
      { cwd: path.join(appRoot, nativeDirectory), encoding: "utf8" }
    )
  );
}

describe("installed Expo notification autolinking", () => {
  it("selects only the patched notification Android project for compilation from source", () => {
    const android = resolveInstalledModules("android", "android");
    const projects = android.modules.flatMap((module) => module.projects || []);
    const notifications = projects.find((project) => project.name === "expo-notifications");

    expect(notifications).toBeDefined();
    expect(notifications.sourceDir).toBe(path.join(notificationsRoot, "android"));

    // Expo's installed Gradle resolver consumes these patterns with
    // Regex.matches(project.name), a full-string match. A patched Kotlin file
    // alone cannot pass: the actual resolver must opt its project into source.
    const sourcePatterns = (android.configuration?.buildFromSource || []).map(
      (pattern) => new RegExp(`^(?:${pattern})$`)
    );
    const selectedProjects = projects
      .filter((project) => sourcePatterns.some((pattern) => pattern.test(project.name)))
      .map((project) => ({ name: project.name, sourceDir: project.sourceDir }));

    expect(selectedProjects).toEqual([
      { name: "expo-notifications", sourceDir: path.join(notificationsRoot, "android") },
    ]);

    // An unrelated module must retain its ordinary prebuilt publication.
    expect(projects.find((project) => project.name === "expo-camera").publication).toEqual(
      expect.objectContaining({ artifactId: "expo.modules.camera" })
    );
  });

  it("preserves ordinary iOS notification pod resolution", () => {
    const apple = resolveInstalledModules("apple", "ios");
    const notifications = apple.modules.find((module) => module.packageName === "expo-notifications");

    expect(apple.configuration?.buildFromSource || []).toEqual([]);
    expect(notifications.pods).toEqual([
      { podName: "ExpoNotifications", podspecDir: path.join(notificationsRoot, "ios") },
    ]);
  });
});
