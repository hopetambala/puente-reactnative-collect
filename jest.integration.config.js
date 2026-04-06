const baseConfig = require('./package.json').jest;

module.exports = {
  ...baseConfig,
  globalSetup: '<rootDir>/test/setup/integrationGlobalSetup.js',
  globalTeardown: '<rootDir>/test/setup/integrationGlobalTeardown.js',
  testRegex: 'integrate\\.test\\.js$',
  testTimeout: 60000,
  // Preserve jest-expo's react-native transform exceptions, plus exclude the
  // cloud code directory (plain CJS; Babel transforms break it).
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base))',
    '/node_modules/react-native-reanimated/plugin/',
    '/puente-node-cloudcode/',
  ],
};
