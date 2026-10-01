const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  buildArguments,
  metadataArguments,
  parseBuildOutput,
  readWhatToTest,
  recordBuildNumber,
  submitArguments,
  writeWorkflowOutputs,
} = require("@app/scripts/release/buildSubmitIos");

describe("iOS build and submit", () => {
  it("waits for a machine-readable iOS build result", () => {
    expect(buildArguments()).toEqual([
      "build",
      "--platform",
      "ios",
      "--profile",
      "production",
      "--non-interactive",
      "--wait",
      "--json",
    ]);
  });

  it("submits only the build ID returned by EAS", () => {
    const args = submitArguments("exact-build-id");

    expect(args).toContain("exact-build-id");
    expect(args).not.toContain("--latest");
  });

  it("extracts the exact iOS build ID and number", () => {
    expect(
      parseBuildOutput(JSON.stringify([{ id: "build-id", platform: "IOS", appBuildVersion: "8" }]))
    ).toEqual({ id: "build-id", platform: "IOS", appBuildVersion: "8" });
  });

  it("refuses build output without an exact build number", () => {
    expect(() => parseBuildOutput(JSON.stringify({ id: "build-id" }))).toThrow(
      /exact iOS build ID and build number/
    );
  });

  it("syncs App Store metadata without prompts in CI", () => {
    expect(metadataArguments({ nonInteractive: true })).toEqual([
      "metadata:push",
      "--profile",
      "production",
      "--non-interactive",
    ]);
  });

  it("allows Apple authentication locally when a session needs refreshing", () => {
    expect(metadataArguments()).toEqual([
      "metadata:push",
      "--profile",
      "production",
    ]);
  });

  it("reads the instructions for the exact marketing version", () => {
    const root = path.resolve(__dirname, "../../..");
    const notes = readWhatToTest("15.7.5", root);

    expect(notes).toContain("Open Find Records");
    expect(notes).toContain("go offline");
    expect(notes).toContain("Privacy Policy");
  });

  it("refuses a release without version-matched TestFlight instructions", () => {
    expect(() => readWhatToTest("99.99.99", "/tmp/no-such-release-root")).toThrow(
      /Missing store\/testflight\/99.99.99.txt/
    );
  });

  describe("recording the submitted build number", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    let root;

    beforeEach(() => {
      root = fs.mkdtempSync(path.join(os.tmpdir(), "record-build-"));
      fs.mkdirSync(path.join(root, "ios/Collect"), { recursive: true });
      fs.copyFileSync(path.join(repoRoot, "app.json"), path.join(root, "app.json"));
      fs.copyFileSync(
        path.join(repoRoot, "ios/Collect/Info.plist"),
        path.join(root, "ios/Collect/Info.plist")
      );
    });

    afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

    it("writes the build number to app.json and Info.plist", () => {
      recordBuildNumber("42", root);

      const appJson = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
      const plist = fs.readFileSync(path.join(root, "ios/Collect/Info.plist"), "utf8");

      expect(appJson.expo.ios.buildNumber).toBe("42");
      expect(plist).toMatch(/<key>CFBundleVersion<\/key>\s*<string>42<\/string>/);
    });

    it("leaves the marketing version and Android versionCode alone", () => {
      const before = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
      const plistBefore = fs.readFileSync(path.join(root, "ios/Collect/Info.plist"), "utf8");

      recordBuildNumber("42", root);

      const after = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
      const plistAfter = fs.readFileSync(path.join(root, "ios/Collect/Info.plist"), "utf8");
      const shortVersion = (plist) =>
        plist.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]*)/)[1];

      expect(after.expo.version).toBe(before.expo.version);
      expect(after.expo.android.versionCode).toBe(before.expo.android.versionCode);
      expect(shortVersion(plistAfter)).toBe(shortVersion(plistBefore));
    });

    it("hands the submitted build to later workflow steps", () => {
      const outputPath = path.join(root, "github-output");

      writeWorkflowOutputs({ version: "15.7.5", build_number: "8" }, outputPath);

      expect(fs.readFileSync(outputPath, "utf8")).toBe("version=15.7.5\nbuild_number=8\n");
    });

    it("writes no workflow outputs outside GitHub Actions", () => {
      expect(() => writeWorkflowOutputs({ build_number: "8" }, undefined)).not.toThrow();
    });
  });
});
