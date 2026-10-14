const path = require("path");
const { execFileSync } = require("child_process");
const { createRequire } = require("module");
const { AndroidConfig } = require("@expo/config-plugins");

const expoRequire = createRequire(require.resolve("expo/package.json"));
const expoCliRequire = createRequire(expoRequire.resolve("@expo/cli/package.json"));
const { getConfig } = expoRequire("@expo/config");
const { withAndroidExpoPlugins } = expoCliRequire("@expo/prebuild-config/build/plugins/withDefaultPlugins");
const repoRoot = path.resolve(__dirname, "../../..");

function memoryBytes(argument, prefix) {
  const value = argument?.slice(prefix.length).match(/^(\d+)([kmg]?)$/i);
  if (!value) return 0;
  const units = { "": 1, k: 1024, m: 1024 ** 2, g: 1024 ** 3 };
  return Number(value[1]) * units[value[2].toLowerCase()];
}

describe("Generated Android release Gradle memory", () => {
  it("provides at least 4 GiB heap and 1 GiB metaspace while preserving unrelated JVM options", async () => {
    const templateArchive = path.join(path.dirname(require.resolve("expo/package.json")), "template.tgz");
    const template = execFileSync("tar", ["-xOf", templateArchive, "package/android/gradle.properties"], {
      encoding: "utf8",
    });
    const unrelatedJvmOptions = ["-Dfile.encoding=UTF-8", "-XX:+HeapDumpOnOutOfMemoryError"];
    const results = await Promise.all([[], unrelatedJvmOptions].map(async (addedOptions) => {
      const properties = AndroidConfig.Properties.parsePropertiesFile(template);
      const jvmProperty = properties.find((entry) => entry.type === "property" && entry.key === "org.gradle.jvmargs");
      jvmProperty.value = [jvmProperty.value, ...addedOptions].join(" ").trim();
      let config = getConfig(repoRoot, {
        isModdedConfig: true,
        skipSDKVersionRequirement: true,
      }).exp;
      const modRawConfig = JSON.parse(JSON.stringify(config));
      config = withAndroidExpoPlugins(config, { package: config.android.package, projectRoot: repoRoot });
      const generated = await config.mods.android.gradleProperties({
        ...config,
        modRawConfig,
        modResults: properties,
        modRequest: {
          projectRoot: repoRoot,
          platformProjectRoot: path.join(repoRoot, "android"),
          platform: "android",
          modName: "gradleProperties",
        },
      });
      const generatedProperties = AndroidConfig.Properties.parsePropertiesFile(
        AndroidConfig.Properties.propertiesListToString(generated.modResults)
      );
      const args = generatedProperties
        .find((entry) => entry.type === "property" && entry.key === "org.gradle.jvmargs")
        ?.value.split(/\s+/) ?? [];
      const heap = args.filter((argument) => argument.startsWith("-Xmx")).at(-1);
      const metaspace = args.filter((argument) => argument.startsWith("-XX:MaxMetaspaceSize=")).at(-1);

      return {
        heapAtLeast4GiB: memoryBytes(heap, "-Xmx") >= 4 * 1024 ** 3,
        metaspaceAtLeast1GiB: memoryBytes(metaspace, "-XX:MaxMetaspaceSize=") >= 1024 ** 3,
        preservedJvmOptions: args.filter((argument) => addedOptions.includes(argument)),
      };
    }));

    expect(results).toEqual([
      { heapAtLeast4GiB: true, metaspaceAtLeast1GiB: true, preservedJvmOptions: [] },
      { heapAtLeast4GiB: true, metaspaceAtLeast1GiB: true, preservedJvmOptions: unrelatedJvmOptions },
    ]);
  });
});
