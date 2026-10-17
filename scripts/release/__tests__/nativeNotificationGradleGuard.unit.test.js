const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "../../..");
const initScript = path.join(repoRoot, "scripts/native-notification-images.gradle");
const gradle = process.env.NOTIFICATION_GUARD_GRADLE;
const connectedTask = ":expo-notifications:connectedDebugAndroidTest";

// This executes Gradle itself, with an offline local plugin and inert tasks.
// Node-only CI does not need Java/Gradle. Opt in with an installed Gradle 9
// executable in NOTIFICATION_GUARD_GRADLE and a compatible JAVA_HOME.
const describeWithGradle = gradle ? describe : describe.skip;

describeWithGradle("notification instrumentation Gradle build boundaries", () => {
  let fixtureRoot;

  beforeAll(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "notification-gradle-guard-"));
    fs.cpSync(path.join(__dirname, "fixtures/notification-gradle-guard"), fixtureRoot, { recursive: true });
    ["app", "other-module", "native-fixtures"].forEach(directory => {
      fs.mkdirSync(path.join(fixtureRoot, directory));
    });
  });

  afterAll(() => {
    if (fixtureRoot) fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  function runGuard(tasks, extraArgs = [], useGuard = true) {
    const result = spawnSync(gradle, [
      ...tasks,
      ...(useGuard ? ["--init-script", initScript] : []),
      `-PnotificationImagesSourceDir=${path.join(fixtureRoot, "source-linked-module")}`,
      `-PnotificationImagesFixtures=${path.join(fixtureRoot, "native-fixtures")}`,
      "--offline", "--no-daemon", "--no-configuration-cache", "--console=plain",
      ...extraArgs,
    ], {
      cwd: fixtureRoot,
      encoding: "utf8",
      timeout: 120000,
      env: { ...process.env, ANDROID_HOME: "", ANDROID_SDK_ROOT: "", ANDROID_SERIAL: "" },
    });
    return { exitCode: result.status, error: result.error?.message, output: `${result.stdout || ""}${result.stderr || ""}` };
  }

  it("allows included plugin builds while enforcing the root notification test boundary", () => {
    // Prove the SDK-free composite itself runs before attributing a failure to
    // the guard. This is the same task graph, without the policy init script.
    const baseline = runGuard([connectedTask], [], false);
    expect(baseline).toEqual(expect.objectContaining({ exitCode: 0, error: undefined }));
    expect(baseline.output).toContain("NOTIFICATION_FIXTURE_TEST_EXECUTED");
    expect(baseline.output).toContain(":notification-plugin:compileGroovy");

    const result = runGuard([connectedTask]);

    // Keep the complete Gradle diagnostic in assertion output: a real policy
    // rejection must be distinguishable from a missing Java/Gradle executable.
    expect(result).toEqual(expect.objectContaining({ exitCode: 0, error: undefined }));
    expect(result.output).toContain("NOTIFICATION_FIXTURE_TEST_EXECUTED");
    expect(result.output).toContain(":notification-plugin:compileGroovy");

    // These controls must reject at the intended boundary, before any inert
    // task body executes. An unrelated plugin compilation failure is not proof.
    [":app:assembleDebug", ":other-module:connectedDebugAndroidTest"].forEach(forbiddenTask => {
      const rejected = runGuard([connectedTask, forbiddenTask]);
      expect(rejected.exitCode).not.toBe(0);
      expect(rejected.output).toContain("must not build, install, or test the Collect app or another module");
      expect(rejected.output).not.toMatch(/(?:APP_FIXTURE_TASK|OTHER_FIXTURE_TEST|NOTIFICATION_FIXTURE_TEST)_EXECUTED/);
    });
    const wrongSource = runGuard([connectedTask], ["-PfixtureWrongSource=true"]);
    expect(wrongSource.exitCode).not.toBe(0);
    expect(wrongSource.output).toContain("requires the source-linked installed module");
    expect(wrongSource.output).not.toContain("NOTIFICATION_FIXTURE_TEST_EXECUTED");
  }, 600000);
});
