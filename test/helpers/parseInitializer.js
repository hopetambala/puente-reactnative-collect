/**
 * Parse Initialization Helper
 * Ensures Parse is properly initialized with Master Key before tests run.
 * Handles timing issues where test modules may be imported before globalSetup completes.
 * Uses process.env.PARSE_TEST_CONFIG because global objects don't transfer to Jest workers
 * when using maxWorkers > 1.
 */

let parseInitialized = false;
let initPromise = null;

/**
 * Wait for PARSE_TEST_CONFIG to be set in process.env by globalSetup
 * with exponential backoff
 * @param {number} timeoutMs - Maximum time to wait (default 10000ms for CI)
 * @returns {Promise<object>} The parsed config object
 */
function waitForTestConfig(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const maxWait = timeoutMs;
    let attempt = 0;

    function checkConfig() {
      if (process.env.PARSE_TEST_CONFIG) {
        try {
          const config = JSON.parse(process.env.PARSE_TEST_CONFIG);
          resolve(config);
          return;
        } catch (err) {
          reject(new Error(`Failed to parse PARSE_TEST_CONFIG: ${err.message}`));
          return;
        }
      }

      const elapsed = Date.now() - startTime;
      if (elapsed > maxWait) {
        reject(
          new Error(
            `Timeout waiting for process.env.PARSE_TEST_CONFIG. Waited ${elapsed}ms. ` +
              `globalSetup may not have completed or may have failed. ` +
              `PARSE_TEST_CONFIG=${  process.env.PARSE_TEST_CONFIG}`
          )
        );
        return;
      }

      attempt += 1;
      // Exponential backoff: 10ms, 20ms, 40ms, 80ms, etc. (max 200ms)
      const delayMs = Math.min(10 * 2**(attempt - 1), 200);
      setTimeout(checkConfig, delayMs);
    }

    checkConfig();
  });
}

/**
 * Ensure Parse is initialized with Master Key from test config
 * This is called by test/hooks.js to guarantee Parse is ready before tests run
 * @returns {Promise<void>}
 */
async function ensureParseInitialized() {
  // If already initialized, return immediately
  if (parseInitialized) {
    return;
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    // eslint-disable-next-line consistent-return
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      // Wait for globalSetup to populate process.env.PARSE_TEST_CONFIG
      const config = await waitForTestConfig();

      if (!config) {
        throw new Error('config is null or undefined');
      }

      if (!config.appId || !config.serverUrl || !config.masterKey) {
        throw new Error(
          `config incomplete: appId=${config.appId}, ` +
            `serverUrl=${config.serverUrl}, masterKey=${config.masterKey ? '[set]' : '[NOT SET]'}`
        );
      }

      // Import Parse here (after config is available)
      // eslint-disable-next-line global-require
      const { Parse } = require('parse/react-native');

      // Initialize Parse with config
      Parse.initialize(config.appId);
      Parse.serverURL = config.serverUrl;
      Parse.masterKey = config.masterKey;

      // Verify initialization
      const masterKeySet = Parse.masterKey !== undefined && Parse.masterKey !== null;
      if (!masterKeySet) {
        throw new Error(
          'Failed to set Parse.masterKey. Parse.masterKey is still undefined/null ' +
            'after initialization'
        );
      }

      parseInitialized = true;
    } catch (error) {
      initPromise = null; // Reset so next call can retry
      throw new Error(
        `Parse initialization failed: ${error.message}. ` +
          'This likely means globalSetup did not complete successfully or config was not stored in process.env.'
      );
    }
  })();

  // eslint-disable-next-line consistent-return
  return initPromise;
}

/**
 * Reset initialization state (for testing purposes only)
 * @private
 */
function resetInitialization() {
  parseInitialized = false;
  initPromise = null;
}

/**
 * Get current Parse instance (assumes ensureParseInitialized has been called)
 * @returns {object} Parse instance
 */
function getParse() {
  if (!parseInitialized) {
    throw new Error(
      'Parse not initialized. Call ensureParseInitialized() before using Parse.'
    );
  }
  // eslint-disable-next-line global-require
  const { Parse } = require('parse/react-native');
  return Parse;
}

module.exports = {
  ensureParseInitialized,
  getParse,
  resetInitialization, // For testing only
};
