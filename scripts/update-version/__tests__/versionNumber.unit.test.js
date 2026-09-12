const eas = require("@app/eas.json");
const { computeVersionUpdates, updateInfoPlist } = require("@app/scripts/update-version/versionNumber");

describe("computeVersionUpdates", () => {
  it("sets the train to the version and the build number to a counter", () => {
    // The TRAIN is what Apple gates submissions on — a build number higher
    // than the last one does not help if the train is closed, which is what
    // got build 90186 rejected. The build number is a separate thing and is
    // no longer conflated with it.
    expect(computeVersionUpdates("15.7.0")).toMatchObject({
      version: "15.7.0",
      buildNumber: "1",
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

  it("updates both keys when both are known", () => {
    // This file is what EAS actually reads, and standard-version never touched
    // it - so every release until now needed a hand edit that was easy to
    // forget. A stale Info.plist is how the build and the store metadata
    // quietly disagree.
    const out = updateInfoPlist(plist, { shortVersion: "15.7.0", buildNumber: "1" });

    expect(out).toContain("<key>CFBundleShortVersionString</key>\n\t<string>15.7.0</string>");
    expect(out).toContain("<key>CFBundleVersion</key>\n\t<string>1</string>");
  });

  it("leaves every other key alone", () => {
    const out = updateInfoPlist(plist, { shortVersion: "15.7.0", buildNumber: "1" });

    expect(out).toContain("<key>CFBundleName</key>\n\t<string>Collect</string>");
  });

  it("is idempotent", () => {
    const args = { shortVersion: "15.7.0", buildNumber: "1" };
    const once = updateInfoPlist(plist, args);

    expect(updateInfoPlist(once, args)).toEqual(once);
  });
});

/**
 * The Android versionCode must only ever go UP — including past a value EAS
 * already burned.
 *
 * Play identifies a release by `expo.android.versionCode` and refuses one it
 * has seen:
 *
 *   ✖ Something went wrong when submitting your app to Google Play Store.
 *     You've already submitted this version of the app.
 *
 * That happened on 2026-09-11 because only iOS had `autoIncrement` in
 * eas.json, so two builds of 15.7.2 both carried versionCode 490150702.
 * Turning autoIncrement on for Android fixes the rebuild case and creates a
 * WORSE one on its own: EAS bumps 490150702 -> 490150703, and the next
 * `release-patch` to 15.7.3 makes this function derive 490150703 again — a
 * number Play has already taken.
 *
 * So the derived code is a FLOOR, not an answer. Whatever is already in
 * app.json wins if it is higher.
 */
describe("computeVersionUpdates — versionCode never regresses", () => {
  it("uses the derived code when nothing higher has been used", () => {
    expect(computeVersionUpdates("15.7.3", { versionCode: 490150702 }).versionCode).toBe(490150703);
  });

  it("steps past a code EAS already incremented to", () => {
    // EAS took 490150703 for the second build of 15.7.2. Deriving it again for
    // 15.7.3 is the collision Play rejects.
    expect(computeVersionUpdates("15.7.3", { versionCode: 490150703 }).versionCode).toBe(490150704);
  });

  it("steps past a code far ahead of the derived one", () => {
    expect(computeVersionUpdates("15.7.3", { versionCode: 490150799 }).versionCode).toBe(490150800);
  });

  it("still works when the current code is unknown", () => {
    expect(computeVersionUpdates("15.7.3").versionCode).toBe(490150703);
  });
});

/**
 * Both platforms must auto-increment, or one of them cannot be rebuilt.
 *
 * iOS had it and Android did not, which is the whole reason the Play
 * submission above failed while the App Store one went through.
 */
describe("eas.json build numbering", () => {
  it.each(["ios", "android"])(
    "auto-increments the %s build number, so a rebuild is submittable",
    (platform) => {
      expect(eas.build.production[platform].autoIncrement).toBe(true);
    }
  );
});

/**
 * The iOS build number is a PLAIN INTEGER, not the version string.
 *
 * It used to be set to the version, and EAS `autoIncrement` then moved it, so
 * App Store Connect read:
 *
 *     Version 15.7.2
 *       BUILD  15.7.4
 *       BUILD  15.7.3
 *
 * Three numbers that look like versions, none of which is the version. Not
 * incorrect — CFBundleVersion only has to be unique inside its
 * CFBundleShortVersionString train — but it reads as though build 15.7.4
 * belongs to a release that does not exist yet, and it is the reason "what we
 * post does not match what we say locally" kept coming up.
 *
 * The train is CFBundleShortVersionString and stays the version. The build
 * number is now a counter that only goes up, seeded past whatever is already
 * there so it can never repeat inside a train.
 */
describe("computeVersionUpdates — iOS build number", () => {
  it("is a plain integer, not the version string", () => {
    expect(computeVersionUpdates("15.7.3", { buildNumber: "4" }).buildNumber).toBe("5");
  });

  it("starts the counter at 1 when the current value is version-shaped", () => {
    // The one-time transition off "15.7.4". A new version is a new train, so
    // Apple accepts a build number that does not continue the old sequence.
    expect(computeVersionUpdates("15.7.3", { buildNumber: "15.7.4" }).buildNumber).toBe("1");
  });

  it("starts at 1 when there is nothing to continue from", () => {
    expect(computeVersionUpdates("15.7.3").buildNumber).toBe("1");
  });

  it("leaves the train as the version string", () => {
    expect(computeVersionUpdates("15.7.3", { buildNumber: "8" }).version).toBe("15.7.3");
  });
});

/**
 * The two Info.plist keys are written by different owners now, so the writer
 * must be able to touch one without the other.
 *
 * standard-version's bumpFiles updater knows the VERSION and nothing about
 * build numbers; the postbump hook knows both. If the updater kept writing
 * both keys it would stamp the version over the build number, and only the
 * fact that postbump runs afterwards would hide it.
 */
describe("updateInfoPlist — writing one key at a time", () => {
  const PLIST = [
    "<dict>",
    "  <key>CFBundleShortVersionString</key>",
    "  <string>15.7.2</string>",
    "  <key>CFBundleVersion</key>",
    "  <string>15.7.4</string>",
    "</dict>",
  ].join("\n");

  it("writes the train alone, leaving the build number untouched", () => {
    const out = updateInfoPlist(PLIST, { shortVersion: "15.7.3" });

    expect(out).toContain("<key>CFBundleShortVersionString</key>\n  <string>15.7.3</string>");
    expect(out).toContain("<key>CFBundleVersion</key>\n  <string>15.7.4</string>");
  });

  it("writes both when both are known", () => {
    const out = updateInfoPlist(PLIST, { shortVersion: "15.7.3", buildNumber: "1" });

    expect(out).toContain("<key>CFBundleShortVersionString</key>\n  <string>15.7.3</string>");
    expect(out).toContain("<key>CFBundleVersion</key>\n  <string>1</string>");
  });
});
