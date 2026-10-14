const fs = require("fs");
const path = require("path");
const { validateConfig } = require("expo-build-properties/build/pluginConfig");

describe("Android release optimization configuration", () => {
  it("explicitly enables code optimization and resource shrinking with supported build options", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const { expo } = JSON.parse(fs.readFileSync(path.join(repoRoot, "app.json"), "utf8"));
    const [, options] = expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-build-properties"
    );

    // Validate a copy: the installed plugin normalizes deprecated options in place.
    expect(() => validateConfig(JSON.parse(JSON.stringify(options)), repoRoot)).not.toThrow();
    expect(options.android).toMatchObject({
      enableMinifyInReleaseBuilds: true,
      enableShrinkResourcesInReleaseBuilds: true,
    });
  });
});
