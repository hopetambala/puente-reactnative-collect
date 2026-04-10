import { initialize } from "@app/services/parse/auth";

// https://medium.com/@phatdev/testing-everything-against-the-real-database-in-nodejs-typescript-application-by-integrating-unit-31b12866d538
export default function hooks() {
  process.env.APP_ENV = "test";
  beforeAll(async () => {
    // Initialize Parse client
    await initialize();

    // CRITICAL: For integration tests, override Parse.serverURL to use the test Parse Server
    // This is set by jest.integration.config.js globalSetup
    const { testParseConfig } = global;
    if (testParseConfig) {
      const Parse = require('parse'); // eslint-disable-line global-require
      Parse.serverURL = testParseConfig.serverUrl;
      console.log('✓ Test hooks: Parse.serverURL set to', testParseConfig.serverUrl);
    }
  });
}
