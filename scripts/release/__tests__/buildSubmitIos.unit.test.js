const path = require("path");

const {
  buildArguments,
  metadataArguments,
  parseBuildOutput,
  readWhatToTest,
  submitArguments,
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
});
