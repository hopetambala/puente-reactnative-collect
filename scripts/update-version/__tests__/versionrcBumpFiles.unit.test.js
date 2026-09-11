/**
 * .versionrc.js bumpFiles — RED-GREEN TDD
 *
 * `standard-version` commits exactly the files listed in `bumpFiles`, plus the
 * CHANGELOG. The postbump hook writes app.json and ios/Collect/Info.plist, and
 * it runs BEFORE the release commit — but because those two were not in
 * bumpFiles they were never staged, so every release tagged a tree whose native
 * version strings still said the previous release.
 *
 * Observed three releases running:
 *   "chore(release): record the version files EAS wrote during the 15.7.1 build"
 *   "chore(release): record the version files postbump wrote for 15.7.2"
 *
 * Listing them makes the release commit self-contained again.
 */
const versionrc = require('@app/.versionrc');

const APP_JSON = JSON.stringify(
  { expo: { version: '15.7.1', ios: { buildNumber: '15.7.1' }, android: { versionCode: 490150701 } } },
  null,
  2
);

const PLIST = [
  '<plist version="1.0">',
  '  <dict>',
  '    <key>CFBundleShortVersionString</key>',
  '    <string>15.7.1</string>',
  '    <key>CFBundleVersion</key>',
  '    <string>15.7.1</string>',
  '    <key>ITSAppUsesNonExemptEncryption</key>',
  '    <false/>',
  '  </dict>',
  '</plist>',
].join('\n');

const fileEntry = (name) => versionrc.bumpFiles.find((f) => f.filename === name);

/**
 * standard-version does NOT accept an inline updater object -- it serialises the
 * entry and reports `Unable to obtain updater for: {"updater":{}}`, then skips
 * the file silently. `updater` must be a PATH to a module exporting
 * readVersion/writeVersion. Caught by `standard-version --dry-run`, which is
 * the only thing that exercises the real contract; unit tests that call the
 * functions directly pass either way.
 */
// eslint-disable-next-line global-require, import/no-dynamic-require
const updaterFor = (name) => require(`@app/${fileEntry(name).updater}`);

describe('.versionrc bumpFiles', () => {
  it('still bumps package.json', () => {
    expect(fileEntry('package.json')).toBeTruthy();
  });

  // Without these two the release commit is incomplete and the tag points at a
  // tree whose native versions are stale.
  it.each(['app.json', 'ios/Collect/Info.plist'])(
    'lists %s so the release commit contains it',
    (name) => {
      expect(fileEntry(name)).toBeTruthy();
    }
  );

  it.each(['app.json', 'ios/Collect/Info.plist'])(
    'points %s at an updater MODULE PATH, which is the only form standard-version loads',
    (name) => {
      expect(typeof fileEntry(name).updater).toBe('string');
    }
  );

  describe('app.json updater', () => {
    const updater = () => updaterFor('app.json');

    it('reads the version expo actually uses', () => {
      expect(updater().readVersion(APP_JSON)).toBe('15.7.1');
    });

    it('writes the new version without disturbing the rest of the file', () => {
      const out = JSON.parse(updater().writeVersion(APP_JSON, '15.7.2'));

      expect(out.expo.version).toBe('15.7.2');
      // postbump owns buildNumber and versionCode and runs after this; the
      // updater must not invent values that would then disagree.
      expect(out.expo.android.versionCode).toBe(490150701);
    });

    it('keeps the file valid JSON with a trailing newline, as the postbump writes it', () => {
      const out = updater().writeVersion(APP_JSON, '15.7.2');

      expect(() => JSON.parse(out)).not.toThrow();
      expect(out.endsWith('\n')).toBe(true);
    });
  });

  describe('Info.plist updater', () => {
    const updater = () => updaterFor('ios/Collect/Info.plist');

    it('reads the marketing version', () => {
      expect(updater().readVersion(PLIST)).toBe('15.7.1');
    });

    it('writes both version keys and leaves every other key alone', () => {
      const out = updater().writeVersion(PLIST, '15.7.2');

      expect(out).toContain('<key>CFBundleShortVersionString</key>\n    <string>15.7.2</string>');
      expect(out).toContain('<key>CFBundleVersion</key>\n    <string>15.7.2</string>');
      expect(out).toContain('<key>ITSAppUsesNonExemptEncryption</key>');
      expect(out).not.toContain('15.7.1');
    });
  });
});

/**
 * standard-version skips any bumpFile that `dotgitignore` reports as ignored,
 * and it does so SILENTLY (lib/lifecycles/bump.js:148).
 *
 * `app.json` sat in .gitignore while being tracked by git -- 233 commits --
 * because gitignore does not affect files already committed. Git carried on
 * versioning it; dotgitignore read the line literally; standard-version dropped
 * it from every release. That is the whole reason three releases needed a
 * follow-up "record the version files" commit.
 */
describe('bumpFiles are not gitignored', () => {
  // eslint-disable-next-line global-require
  const fs = require('fs');
  // eslint-disable-next-line global-require
  const path = require('path');

  const ignoreLines = fs
    .readFileSync(path.join(__dirname, '../../../.gitignore'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('!'));

  // Asserting on .gitignore rather than running dotgitignore: that package is
  // a TRANSITIVE dependency of standard-version, so requiring it here would
  // make this test fail whenever standard-version restructures its deps --
  // a failure that says nothing about our release config.
  it.each(versionrc.bumpFiles.map((f) => f.filename))(
    '%s is not listed in .gitignore, or standard-version will skip it without saying so',
    (filename) => {
      const names = [filename, path.basename(filename)];

      expect(ignoreLines.filter((line) => names.includes(line.replace(/^\//, '')))).toEqual([]);
    }
  );
});
