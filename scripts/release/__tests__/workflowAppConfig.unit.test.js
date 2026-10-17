const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { createRequire } = require("module");
// ESLint is a declared project dependency and owns this YAML parser.
const eslintRequire = createRequire(require.resolve("eslint/package.json"));
const yaml = eslintRequire("js-yaml");

const repoRoot = path.resolve(__dirname, "../../..");
const workflowsRoot = path.join(repoRoot, ".github/workflows");
const workflowJobs = fs
  .readdirSync(workflowsRoot)
  .filter((file) => /\.ya?ml$/.test(file))
  .sort()
  .flatMap((file) => {
    const workflow = yaml.load(fs.readFileSync(path.join(workflowsRoot, file), "utf8"));
    return Object.entries(workflow.jobs || {}).map(([job, definition]) => [
      file,
      job,
      definition.steps || [],
    ]);
  });

describe("GitHub workflows preserve the authoritative release app configuration", () => {
  it("uses a tracked app.json containing the release plugins and build settings", () => {
    const trackedFiles = execFileSync("git", ["ls-files", "--", "app.json"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    const { expo } = JSON.parse(fs.readFileSync(path.join(repoRoot, "app.json"), "utf8"));

    expect(trackedFiles.trim()).toBe("app.json");
    expect(expo.plugins).toEqual(
      expect.arrayContaining([
        "./plugins/withAndroidLargeScreen",
        "./plugins/withAndroidR8Optimization",
        [
          "expo-build-properties",
          expect.objectContaining({
            android: expect.objectContaining({
              enableMinifyInReleaseBuilds: true,
              enableShrinkResourcesInReleaseBuilds: true,
            }),
          }),
        ],
      ])
    );
  });

  it.each(workflowJobs)("%s / %s does not bootstrap app.json from the sample", (file, job, steps) => {
    // Check the real workflow definitions, including preview and standalone
    // lint/test jobs. Runtime environment.js fixtures remain independent of
    // app.json: replacing the tracked app config drops native release plugins
    // before the existing release regression tests ever execute.
    const sampleAppConfigSteps = steps
      .filter((step) => typeof step.run === "string" && /\bapp-example\.json\b/.test(step.run))
      .map((step) => ({
        workflow: file,
        job,
        step: step.name || step.id || "unnamed shell step",
        run: step.run,
      }));

    expect(sampleAppConfigSteps).toEqual([]);
  });
});
