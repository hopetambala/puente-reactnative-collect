/* eslint-disable */
/**
 * standard-version updater for app.json.
 *
 * MUST be referenced from .versionrc.js as a PATH, not as an inline object.
 * An inline `updater: { readVersion, writeVersion }` is serialised by
 * standard-version, which then reports
 *   Unable to obtain updater for: {"filename":"app.json","updater":{}}
 * and SKIPS the file — silently leaving it out of the release commit, which is
 * the exact bug this whole change exists to fix.
 *
 * Writes only the marketing version. `buildNumber` and `versionCode` are
 * derived values owned by the postbump hook (versionNumber.js), which runs
 * after this and would overwrite anything invented here.
 */
module.exports.readVersion = function readVersion(contents) {
  return JSON.parse(contents).expo.version;
};

module.exports.writeVersion = function writeVersion(contents, version) {
  const appJson = JSON.parse(contents);
  appJson.expo.version = version;
  // Trailing newline to match how the postbump hook writes this file, so the
  // two do not fight over a one-character diff.
  return `${JSON.stringify(appJson, null, 2)}\n`;
};
