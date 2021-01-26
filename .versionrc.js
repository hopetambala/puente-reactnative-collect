module.exports = {
  bumpFiles: [
    {
      filename: 'package.json',
    },
    {
      filename: 'app.json',
      updater: require.resolve('standard-version-expo'),
    },
    {
      filename: 'app.json',
      updater: require.resolve('standard-version-expo/android'),
    },
    {
      filename: 'app.json',
      updater: require.resolve('standard-version-expo/ios'),
    }
  ],
  types: [
    { type: 'chore', section: 'Housekeeping Tasks', hidden: true },
    { type: 'ci', section: 'Pipeline Changes' },
    { type: 'docs', section: 'Documentation Changes' },
    { type: 'feat', section: 'New Features' },
    { type: 'fix', section: 'Bug fixes' },
    { type: 'perf', hidden: true },
    { type: 'refactor', section: 'Code Refactors' },
    { type: 'release', hidden: true },
    { type: 'style', hidden: true },
    { type: 'test', hidden: true },
  ],
};