import { Parse } from "parse/react-native";

import { ensureParseInitialized } from "./helpers/parseInitializer";

// https://medium.com/@phatdev/testing-everything-against-the-real-database-in-nodejs-typescript-application-by-integrating-unit-31b12866d538
export default function hooks() {
  process.env.APP_ENV = "test";
  beforeAll(async () => {
    // Ensure Parse is initialized with Master Key from globalSetup
    await ensureParseInitialized();

    // Get test config from environment (stored by globalSetup for Jest worker access)
    // In main process: global.testParseConfig, In Jest workers: process.env.PARSE_TEST_CONFIG
    // eslint-disable-next-line prefer-destructuring
    let testParseConfig = global.testParseConfig;

    if (!testParseConfig && process.env.PARSE_TEST_CONFIG) {
      testParseConfig = JSON.parse(process.env.PARSE_TEST_CONFIG);
    }

    if (!testParseConfig) {
      throw new Error(
        'Integration test requires testParseConfig to be set by globalSetup. '
        + 'This means globalSetup did not complete or failed.'
      );
    }

    // Initialize Parse with app ID and master key for test operations
    Parse.initialize(testParseConfig.appId);
    Parse.serverURL = testParseConfig.serverUrl;
    Parse.masterKey = testParseConfig.masterKey;

    // Verify Parse is properly configured
    if (!Parse.masterKey) {
      throw new Error(
        'Parse.masterKey was not set. This will cause all tests to fail with "Cannot use the Master Key" errors.'
      );
    }

    // Set authenticated user from global test data
    // This restores the session of an already-logged-in test user
    if (testParseConfig.user && testParseConfig.user.sessionToken) {
      const user = new Parse.User();
      user.id = testParseConfig.user.objectId;
      user._sessionToken = testParseConfig.user.sessionToken; // eslint-disable-line no-underscore-dangle
      Parse.User._currentUser = user; // eslint-disable-line no-underscore-dangle
    }
  });
}
