/**
 * standard-version updater for the App Store metadata train.
 *
 * Keeping this in bumpFiles makes the release commit and tag carry the same
 * marketing version that EAS Metadata will create in App Store Connect.
 */
module.exports.readVersion = function readVersion(contents) {
  return JSON.parse(contents).apple.version;
};

module.exports.writeVersion = function writeVersion(contents, version) {
  const config = JSON.parse(contents);
  config.apple.version = version;
  return `${JSON.stringify(config, null, 2)}\n`;
};
