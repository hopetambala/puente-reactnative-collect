/**
 * `standard-version` commits exactly the files listed here, plus the CHANGELOG.
 *
 * The postbump hook writes app.json and Info.plist and runs BEFORE the release
 * commit, but until 2026-09-11 those two were absent from this list, so they
 * were never staged. Every release tagged a tree whose native version strings
 * still said the previous release, and needed a follow-up commit to record
 * them -- three releases running. Listing them makes the release commit
 * self-contained.
 *
 * The updaters below write only the marketing version. `buildNumber` and
 * `versionCode` are derived values owned by the postbump hook, which runs after
 * this and would overwrite anything invented here.
 */
module.exports = {
  bumpFiles: [
    {
      filename: "package.json",
    },
    {
      filename: "app.json",
      updater: "scripts/update-version/appJsonUpdater.js",
    },
    {
      filename: "ios/Collect/Info.plist",
      updater: "scripts/update-version/infoPlistUpdater.js",
    },
  ],
  scripts: {
    postbump: "node scripts/update-version/versionNumber.js",
  },
  types: [
    { type: "chore", section: "Housekeeping Tasks", hidden: true },
    { type: "ci", section: "Pipeline Changes" },
    { type: "docs", section: "Documentation Changes" },
    { type: "feat", section: "New Features" },
    { type: "fix", section: "Bug fixes" },
    { type: "perf", hidden: true },
    { type: "refactor", section: "Code Refactors" },
    { type: "release", hidden: true },
    { type: "style", hidden: true },
    { type: "test", hidden: true },
  ],
};
