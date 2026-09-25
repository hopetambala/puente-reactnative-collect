const {
  didVersionChange,
  packageVersion,
} = require("@app/scripts/release/versionChanged");

describe("iOS release workflow gate", () => {
  const packageJson = (version, scripts = {}) => JSON.stringify({ version, scripts });

  it("runs when the marketing version changes", () => {
    expect(didVersionChange(packageJson("15.7.4"), packageJson("15.7.5"))).toBe(true);
  });

  it("does not release for an unrelated package.json edit", () => {
    expect(
      didVersionChange(
        packageJson("15.7.5", { test: "jest" }),
        packageJson("15.7.5", { test: "jest --runInBand" })
      )
    ).toBe(false);
  });

  it("reads the package version", () => {
    expect(packageVersion(packageJson("15.7.5"))).toBe("15.7.5");
  });
});
