const { withAppBuildGradle, withGradleProperties } = require("@expo/config-plugins");

module.exports = function withAndroidR8Optimization(config) {
  const withOptimizingDefaults = withAppBuildGradle(config, (modConfig) => {
    const buildGradle = modConfig.modResults;
    buildGradle.contents = buildGradle.contents.replace(
      /getDefaultProguardFile\((["'])proguard-android\.txt\1\)/g,
      "getDefaultProguardFile('proguard-android-optimize.txt')"
    );
    return modConfig;
  });

  return withGradleProperties(withOptimizingDefaults, (modConfig) => {
    const key = "android.r8.optimizedResourceShrinking";
    const properties = modConfig.modResults.filter(
      (entry) => entry.type !== "property" || entry.key !== key
    );
    properties.push({ type: "property", key, value: "true" });
    const jvmKey = "org.gradle.jvmargs";
    const jvmProperty = properties.find((entry) => entry.type === "property" && entry.key === jvmKey);
    const jvmOptions = (jvmProperty?.value ?? "").split(/\s+/).filter(
      (argument) => argument && !argument.startsWith("-Xmx") && !argument.startsWith("-XX:MaxMetaspaceSize=")
    );
    const jvmValue = [...jvmOptions, "-Xmx4g", "-XX:MaxMetaspaceSize=1g"].join(" ");
    if (jvmProperty) {
      jvmProperty.value = jvmValue;
    } else {
      properties.push({ type: "property", key: jvmKey, value: jvmValue });
    }
    return { ...modConfig, modResults: properties };
  });
};
