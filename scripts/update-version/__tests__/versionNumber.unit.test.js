const { computeVersionUpdates, updateInfoPlist } = require("@app/scripts/update-version/versionNumber");

describe("computeVersionUpdates", () => {
  it("uses the version string as both the train and the build number", () => {
    // The version is what Apple gates submissions on. A build number higher
    // than the last one does not help if the train is closed - that is exactly
    // what got build 90186 rejected.
    expect(computeVersionUpdates("15.7.0")).toMatchObject({
      version: "15.7.0",
      buildNumber: "15.7.0",
    });
  });

  it("encodes the versionCode as 490 plus zero-padded major/minor/patch", () => {
    expect(computeVersionUpdates("15.7.0").versionCode).toEqual(490150700);
    expect(computeVersionUpdates("15.6.1").versionCode).toEqual(490150601);
  });

  it("keeps versionCode monotonically increasing across a minor bump", () => {
    // Play refuses a versionCode that does not increase.
    expect(computeVersionUpdates("15.7.0").versionCode)
      .toBeGreaterThan(computeVersionUpdates("15.6.1").versionCode);
  });
});

describe("updateInfoPlist", () => {
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
	<key>CFBundleShortVersionString</key>
	<string>15.6.1</string>
	<key>CFBundleVersion</key>
	<string>15.6.2</string>
	<key>CFBundleName</key>
	<string>Collect</string>
</dict>
</plist>`;

  it("updates BOTH the train and the build number", () => {
    // This file is what EAS actually reads, and standard-version never touched
    // it - so every release until now needed a hand edit that was easy to
    // forget. A stale Info.plist is how the build and the store metadata
    // quietly disagree.
    const out = updateInfoPlist(plist, "15.7.0");

    expect(out).toContain("<key>CFBundleShortVersionString</key>\n\t<string>15.7.0</string>");
    expect(out).toContain("<key>CFBundleVersion</key>\n\t<string>15.7.0</string>");
  });

  it("leaves every other key alone", () => {
    const out = updateInfoPlist(plist, "15.7.0");

    expect(out).toContain("<key>CFBundleName</key>\n\t<string>Collect</string>");
  });

  it("is idempotent", () => {
    const once = updateInfoPlist(plist, "15.7.0");

    expect(updateInfoPlist(once, "15.7.0")).toEqual(once);
  });
});
