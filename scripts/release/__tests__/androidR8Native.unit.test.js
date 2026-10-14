const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { createRequire } = require("module");
// These prebuild internals belong to the installed Expo SDK under test.
const expoRequire = createRequire(require.resolve("expo/package.json"));
const expoCliRequire = createRequire(expoRequire.resolve("@expo/cli/package.json"));
const { getConfig } = expoRequire("@expo/config");
const { withAndroidExpoPlugins } = expoCliRequire("@expo/prebuild-config/build/plugins/withDefaultPlugins");
const { updateAndroidProguardRules } = require("expo-build-properties/build/android");

const repoRoot = path.resolve(__dirname, "../../..");

function readAndroidTemplate(relativePath) {
  const templateArchive = path.join(path.dirname(require.resolve("expo/package.json")), "template.tgz");
  return execFileSync("tar", ["-xOf", templateArchive, `package/android/${relativePath}`], {
    encoding: "utf8",
  });
}

function readProperties(contents) {
  return contents.split(/\r?\n/).filter((line) => /^\s*[^#!\s][^=]*=/.test(line)).map((line) => {
    const separator = line.indexOf("=");
    return { type: "property", key: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() };
  });
}

describe("Generated Android release R8 optimization", () => {
  it("uses optimizing ProGuard defaults and integrated resource shrinking on the installed supported AGP", async () => {
    let config = getConfig(repoRoot, {
      isModdedConfig: true,
      skipSDKVersionRequirement: true,
    }).exp;
    const modRawConfig = JSON.parse(JSON.stringify(config));
    // Run the same Gradle mods as prebuild against the installed SDK's template.
    config = withAndroidExpoPlugins(config, { package: config.android.package, projectRoot: repoRoot });
    const modRequest = {
      projectRoot: repoRoot,
      platformProjectRoot: path.join(repoRoot, "android"),
      platform: "android",
    };
    const appGradleResult = await config.mods.android.appBuildGradle({
      ...config,
      modRawConfig,
      modResults: { language: "groovy", contents: readAndroidTemplate("app/build.gradle") },
      modRequest: { ...modRequest, modName: "appBuildGradle" },
    });
    const propertiesResult = await config.mods.android.gradleProperties({
      ...config,
      modRawConfig,
      modResults: readProperties(readAndroidTemplate("gradle.properties")),
      modRequest: { ...modRequest, modName: "gradleProperties" },
    });
    const properties = Object.fromEntries(propertiesResult.modResults
      .filter((entry) => entry.type === "property")
      .map((entry) => [entry.key, entry.value]));
    const gradle = appGradleResult.modResults.contents.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    const defaultRules = [...gradle.matchAll(/getDefaultProguardFile\(\s*["']([^"']+)["']\s*\)/g)]
      .map((match) => match[1]);
    const [, buildOptions] = config.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-build-properties");
    const appRules = updateAndroidProguardRules(
      readAndroidTemplate("app/proguard-rules.pro"),
      buildOptions.android.extraProguardRules,
      "append"
    );
    const agpCatalog = fs.readFileSync(path.join(path.dirname(require.resolve("react-native/package.json")), "gradle/libs.versions.toml"), "utf8");
    const installedAgp = agpCatalog.match(/^agp\s*=\s*"([^"]+)"/m)[1];
    const [agpMajor, agpMinor] = installedAgp.split(".").map(Number);
    const supportsIntegratedShrinking = agpMajor > 8 || (agpMajor === 8 && agpMinor >= 12);

    expect({
      supportsIntegratedShrinking,
      defaultRules,
      globalOptimizationDisabled: /^\s*-dontoptimize\b/m.test(appRules.replace(/#[^\n]*/g, "")),
      minifyEnabled: properties["android.enableMinifyInReleaseBuilds"],
      shrinkResourcesEnabled: properties["android.enableShrinkResourcesInReleaseBuilds"],
      integratedResourceShrinkingEnabled: properties["android.r8.optimizedResourceShrinking"] === "true"
        || (agpMajor >= 9 && properties["android.r8.optimizedResourceShrinking"] !== "false"),
    }).toEqual({
      supportsIntegratedShrinking: true,
      defaultRules: ["proguard-android-optimize.txt"],
      globalOptimizationDisabled: false,
      minifyEnabled: "true",
      shrinkResourcesEnabled: "true",
      integratedResourceShrinkingEnabled: true,
    });
  });
});
