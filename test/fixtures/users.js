/**
 * Test user fixtures for integration tests
 * These are used across all integration test suites
 */

const testUsers = {
  admin: {
    username: 'test.admin',
    password: 'TestAdmin@123',
    email: 'admin@test.puente.org',
    phonenumber: '+15551001000',
    firstname: 'Admin',
    lastname: 'User',
    organization: 'Puente Test Org',
  },
  regularUser: {
    username: 'test.user',
    password: 'TestUser@123',
    email: 'user@test.puente.org',
    phonenumber: '+15551001001',
    firstname: 'Test',
    lastname: 'User',
    organization: 'Puente Test Org',
  },
  dataCollector: {
    username: 'test.collector',
    password: 'TestCollector@123',
    email: 'collector@test.puente.org',
    phonenumber: '+15551001002',
    firstname: 'Collector',
    lastname: 'User',
    organization: 'Puente Test Org',
  },
};

module.exports = testUsers;
