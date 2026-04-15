import { Parse } from "parse/react-native";

// https://medium.com/@phatdev/testing-everything-against-the-real-database-in-nodejs-typescript-application-by-integrating-unit-31b12866d538
export default function hooks() {
  process.env.APP_ENV = "test";
  beforeAll(async () => {
    // Configure Parse for integration tests with test server and master key
    const { testParseConfig } = global;
    if (testParseConfig) {
      // Initialize Parse with app ID and master key for test operations
      Parse.initialize(testParseConfig.appId);
      Parse.serverURL = testParseConfig.serverUrl;
      Parse.masterKey = testParseConfig.masterKey;

      // Set authenticated user from global test data
      // This restores the session of an already-logged-in test user
      if (testParseConfig.user && testParseConfig.user.sessionToken) {
        const user = new Parse.User();
        user.id = testParseConfig.user.objectId;
        user._sessionToken = testParseConfig.user.sessionToken; // eslint-disable-line no-underscore-dangle
        Parse.User._currentUser = user; // eslint-disable-line no-underscore-dangle
      }
    }
  });
}
