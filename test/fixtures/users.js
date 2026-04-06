/**
 * Test user fixtures for integration tests
 * These are used across all integration test suites
 */

const testUsers = {
  admin: {
    username: 'test.admin',
    password: 'TestAdmin@123',
    email: 'admin@test.puente.org',
    firstname: 'Admin',
    lastname: 'User',
    organization: 'Puente Test Org',
  },
  regularUser: {
    username: 'test.user',
    password: 'TestUser@123',
    email: 'user@test.puente.org',
    firstname: 'Test',
    lastname: 'User',
    organization: 'Puente Test Org',
  },
  dataCollector: {
    username: 'test.collector',
    password: 'TestCollector@123',
    email: 'collector@test.puente.org',
    firstname: 'Collector',
    lastname: 'User',
    organization: 'Puente Test Org',
  },
};

module.exports = testUsers;
