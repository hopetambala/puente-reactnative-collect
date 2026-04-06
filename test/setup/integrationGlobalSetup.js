const { MongoMemoryServer } = require('mongodb-memory-server'); // eslint-disable-line import/no-extraneous-dependencies
const express = require('express'); // eslint-disable-line import/no-extraneous-dependencies
const http = require('http');
const fs = require('fs');
const path = require('path');

const seedTestData = require('./seedTestData'); // eslint-disable-line import/no-extraneous-dependencies

const APP_ID = 'test-app-id';
const MASTER_KEY = 'test-master-key';
const PORT = 1337;
const SERVER_URL = `http://127.0.0.1:${PORT}/parse`;

/**
 * extract-files@9.0.0 uses the deprecated trailing-slash exports pattern
 * ("./public/": "./public/") which Node 17+ does not support. Patch the
 * package.json to add the specific named export before parse-server loads.
 */
function patchExtractFiles() {
  const pkgPaths = [
    path.resolve(__dirname, '../../node_modules/extract-files/package.json'),
    path.resolve(
      __dirname,
      '../../node_modules/apollo-upload-client/node_modules/extract-files/package.json'
    ),
  ];
  pkgPaths.forEach((pkgPath) => {
    if (!fs.existsSync(pkgPath)) return;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.exports) {
      const needsPatch =
        pkg.exports['./public/'] ||
        (pkg.exports['./public/*'] && !pkg.exports['./public/*'].endsWith('.js'));
      if (needsPatch) {
        pkg.exports['./public/*'] = './public/*.js';
        delete pkg.exports['./public/'];
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }
    }
  });
}

async function waitForServer(url, retries = 30, delay = 500) {
  for (let i = 0; i < retries; i++) { // eslint-disable-line no-plusplus
    try {
      await new Promise((resolve, reject) => { // eslint-disable-line no-await-in-loop
        http
          .get(`${url}/health`, (res) => {
            if (res.statusCode === 200) resolve();
            else reject(new Error(`Status: ${res.statusCode}`));
          })
          .on('error', reject);
      });
      return;
    } catch (e) {
      await new Promise((r) => { setTimeout(r, delay); }); // eslint-disable-line no-await-in-loop
    }
  }
  throw new Error('Parse Server did not become healthy in time');
}

module.exports = async function globalSetup() {
  patchExtractFiles();

  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod; // eslint-disable-line no-underscore-dangle

  // Prevent cloud error.js from routing errors to Slack (read at module-load time)
  process.env.PUENTE_ENV = 'dev';

  const { ParseServer } = require('parse-server'); // eslint-disable-line global-require, import/no-extraneous-dependencies

  const parseServer = new ParseServer({
    databaseURI: mongod.getUri(),
    appId: APP_ID,
    masterKey: MASTER_KEY,
    serverURL: SERVER_URL,
    cloud: path.resolve(__dirname, './cloudCode.js'),
    silent: true,
    logLevel: 'error',
  });

  const app = express();
  app.use('/parse', parseServer);

  const httpServer = http.createServer(app);
  global.__HTTP_SERVER__ = httpServer; // eslint-disable-line no-underscore-dangle

  await new Promise((resolve, reject) => {
    httpServer.listen(PORT, '127.0.0.1', (err) => (err ? reject(err) : resolve()));
  });

  await waitForServer(SERVER_URL);
  console.log('✓ Parse Server is healthy and ready at', SERVER_URL);

  // Initialize Parse to seed test data
  const Parse = require('parse/node'); // eslint-disable-line global-require, import/no-extraneous-dependencies
  Parse.initialize(APP_ID);
  Parse.serverURL = SERVER_URL;
  Parse.masterKey = MASTER_KEY;
  console.log('✓ Parse Client initialized with:');
  console.log('  - App ID:', APP_ID);
  console.log('  - Server URL:', Parse.serverURL);
  console.log('  - Master Key:', MASTER_KEY ? '[set]' : '[not set]');

  // Seed test data (create test users)
  console.log('🌱 Creating test users...');
  const testUsers = await seedTestData(APP_ID, SERVER_URL, MASTER_KEY);

  if (!testUsers || Object.keys(testUsers).length === 0) {
    throw new Error('Failed to seed test data - no users created');
  }
  console.log('✓ Test users created:', Object.keys(testUsers).join(', '));

  // Store test credentials in global for tests to access
  global.testParseConfig = {
    appId: APP_ID,
    serverUrl: SERVER_URL,
    masterKey: MASTER_KEY,
    users: testUsers,
    user: testUsers.regularUser,
  };

  // Set environment variables BEFORE tests import modules (critical for Parse initialization)
  process.env.APP_ENV = 'test';
  process.env.PARSE_APP_ID = APP_ID;
  process.env.PARSE_SERVER_URL = SERVER_URL;
  process.env.PARSE_JAVASCRIPT_KEY = 'test-js-key';
  process.env.PARSE_MASTER_KEY = MASTER_KEY;

  console.log('✓ Global setup complete - Parse Server ready for integration tests');
};
