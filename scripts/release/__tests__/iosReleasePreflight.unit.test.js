const {
  assertGitReleaseState,
  assertVersionIsNewer,
  assertVersionsAgree,
  compareVersions,
  fetchPublicVersion,
  plistValue,
} = require("@app/scripts/release/iosReleasePreflight");

describe("iOS release preflight", () => {
  it.each([
    ["15.7.5", "15.7.4", 1],
    ["15.7.4", "15.7.4", 0],
    ["15.7.3", "15.7.4", -1],
    ["16.0.0", "15.99.99", 1],
  ])("compares %s with %s", (left, right, expected) => {
    expect(compareVersions(left, right)).toBe(expected);
  });

  it("rejects an App Store train that is already live", () => {
    expect(() => assertVersionIsNewer("15.7.4", "15.7.4")).toThrow(
      /Run yarn release-patch/
    );
  });

  it("accepts a newer marketing version", () => {
    expect(() => assertVersionIsNewer("15.7.5", "15.7.4")).not.toThrow();
  });

  it("requires every version-bearing file to agree", () => {
    expect(() =>
      assertVersionsAgree({
        packageJson: "15.7.5",
        appJson: "15.7.5",
        infoPlist: "15.7.4",
        storeConfig: "15.7.5",
      })
    ).toThrow(/infoPlist=15.7.4/);
  });

  it("reads the marketing train rather than the build number", () => {
    const plist = [
      "<key>CFBundleShortVersionString</key>",
      "<string>15.7.5</string>",
      "<key>CFBundleVersion</key>",
      "<string>7</string>",
    ].join("\n");

    expect(plistValue(plist, "CFBundleShortVersionString")).toBe("15.7.5");
  });

  it.each([
    { branch: "release", status: "", head: "a", remoteHead: "a" },
    { branch: "master", status: " M app.json", head: "a", remoteHead: "a" },
    { branch: "master", status: "", head: "a", remoteHead: "b" },
  ])("rejects an unsafe git state %#", (state) => {
    expect(() => assertGitReleaseState(state)).toThrow();
  });

  it("accepts a clean master at the remote head", () => {
    expect(() =>
      assertGitReleaseState({ branch: "master", status: "", head: "a", remoteHead: "a" })
    ).not.toThrow();
  });

  it("reads the current public version from Apple's lookup response", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ version: "15.7.4" }] }),
    });

    await expect(fetchPublicVersion("1362371696", fetchImpl)).resolves.toBe("15.7.4");
  });
});
