/**
 * standard-version updater for ios/Collect/Info.plist.
 *
 * MUST be referenced from .versionrc.js as a PATH — see appJsonUpdater.js for
 * what happens when it is inlined instead.
 *
 * The write reuses `updateInfoPlist` from the postbump hook rather than
 * re-implementing the regex, so there is one implementation for both version
 * keys and it is already covered by versionNumber.unit.test.js.
 */
const { updateInfoPlist } = require("./versionNumber");

module.exports.readVersion = function readVersion(contents) {
  const match = contents.match(
    /<key>CFBundleShortVersionString<\/key>\s*\n\s*<string>([^<]*)<\/string>/
  );
  return match ? match[1] : null;
};

module.exports.writeVersion = function writeVersion(contents, version) {
  return updateInfoPlist(contents, { shortVersion: version });
};
