const path = require("path");

const {
  buildArguments,
  metadataArguments,
  readWhatToTest,
} = require("@app/scripts/release/buildSubmitIos");

describe("iOS build and submit", () => {
  it("auto-submits the exact build and sends the versioned TestFlight instructions", () => {
    const args = buildArguments("Please test Find Records");

    expect(args).toEqual([
      "build",
      "--platform",
      "ios",
      "--profile",
      "production",
      "--non-interactive",
      "--auto-submit",
      "--what-to-test",
      "Please test Find Records",
    ]);
    expect(args).not.toContain("--latest");
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
