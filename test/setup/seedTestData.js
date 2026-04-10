/**
 * Seed Test Data - Initialize Parse and create test users
 * Called after Parse Server starts during globalSetup
 */

const testUsers = require('../fixtures/users');

/**
 * Initialize Parse Client and create test users
 * @param {string} parseAppId - Parse App ID
 * @param {string} parseServerUrl - Parse Server URL
 * @param {string} parseMasterKey - Parse Master Key
 * @returns {Promise<Object>} Test user credentials and tokens
 */
async function seedTestData(parseAppId, parseServerUrl, parseMasterKey) {
  // eslint-disable-next-line global-require
  const Parse = require('parse/node');

  // Initialize Parse with test credentials
  Parse.initialize(parseAppId);
  Parse.serverURL = parseServerUrl;
  Parse.masterKey = parseMasterKey;

  console.log('🌱 Seeding test data...');

  const createdUsers = {};

  try {
    // Create each test user
    for (const [userType, userData] of Object.entries(testUsers)) {
      try {
        // Check if user already exists
        const query = new Parse.Query(Parse.User);
        query.equalTo('username', userData.username);
        const existingUser = await query.first({ useMasterKey: true });

        let user;
        if (existingUser) {
          user = existingUser;
          console.log(`  ℹ User already exists: ${userData.username}`);
        } else {
          // Create new user
          user = new Parse.User();
          user.set('username', userData.username);
          user.set('password', userData.password);
          user.set('email', userData.email);
          user.set('firstname', userData.firstname);
          user.set('lastname', userData.lastname);
          user.set('organization', userData.organization);

          await user.save(null, { useMasterKey: true });
          console.log(`  ✓ Created user: ${userData.username}`);
        }

        // Get fresh session token
        const loginResult = await Parse.User.logIn(userData.username, userData.password);
        createdUsers[userType] = {
          objectId: loginResult.id,
          username: loginResult.getUsername(),
          sessionToken: loginResult.getSessionToken(),
          ...userData,
        };
      } catch (err) {
        console.error(`  ✗ Failed to create user ${userType}:`, err.message);
        throw err;
      }
    }

    console.log('✓ Test data seeded successfully');

    return createdUsers;
  } catch (error) {
    console.error('✗ Failed to seed test data:', error);
    throw error;
  }
}

module.exports = seedTestData;
