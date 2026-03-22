module.exports = {
  bumpFiles: [
    {
      filename: "package.json",
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
