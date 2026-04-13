/**
 * UpdateObjectInClass Integration Tests
 * Tests with real Parse Server + MongoDB (in-memory)
 * Verifies end-to-end edit functionality via cloud function
 */
import { updateObjectInClass } from '@app/services/parse/crud';

// Note: These tests run during the integration test suite only
// They require Parse Server to be initialized (see jest.config.js testEnvironment)
// Parse is initialized by test/setup/integrationGlobalSetup.js before tests run

describe('updateObjectInClass - INTEGRATION', () => {
  let testUser;
  let testSurveyData;

  beforeAll(async () => {
    // Get test user from seeded data (created during globalSetup)
    const Parse = require('parse/node'); // eslint-disable-line global-require
    const userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo('username', 'testuser');
    testUser = await userQuery.first({ useMasterKey: true });

    if (!testUser) {
      throw new Error('Test user not found - integration setup failed');
    }
  });

  beforeEach(async () => {
    // Create a test SurveyData record to update in each test
    const Parse = require('parse/node'); // eslint-disable-line global-require
    const SurveyData = Parse.Object.extend('SurveyData');
    testSurveyData = new SurveyData();
    testSurveyData.set('fname', 'John');
    testSurveyData.set('lname', 'Doe');
    testSurveyData.set('dob', '1990-01-15');
    testSurveyData.set('sex', 'M');

    // Set ACL so only admin role can write (matches production)
    const acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setRoleReadAccess('admin', true);
    acl.setRoleWriteAccess('admin', true);
    testSurveyData.setACL(acl);

    await testSurveyData.save(null, { useMasterKey: true });
  });

  describe('RED: Update via cloud function', () => {
    test('should update a single field on SurveyData record', async () => {
      const Parse = require('parse/node'); // eslint-disable-line global-require
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        { fname: 'Jane' },
        testUser.id
      );

      const updated = await new Parse.Query('SurveyData').get(testSurveyData.id, {
        useMasterKey: true,
      });
      expect(updated.get('fname')).toBe('Jane');
      expect(updated.get('lname')).toBe('Doe'); // unchanged
    });

    test('should update multiple fields in single call', async () => {
      const Parse = require('parse/node'); // eslint-disable-line global-require
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        { fname: 'Jane', lname: 'Smith', sex: 'F' },
        testUser.id
      );

      const updated = await new Parse.Query('SurveyData').get(testSurveyData.id, {
        useMasterKey: true,
      });
      expect(updated.get('fname')).toBe('Jane');
      expect(updated.get('lname')).toBe('Smith');
      expect(updated.get('sex')).toBe('F');
      expect(updated.get('dob')).toBe('1990-01-15'); // unchanged
    });

    test('should add audit trail fields', async () => {
      const Parse = require('parse/node'); // eslint-disable-line global-require
      const beforeTime = new Date();
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        { fname: 'Jane' },
        'test-editor-id'
      );
      const afterTime = new Date();

      const updated = await new Parse.Query('SurveyData').get(testSurveyData.id, {
        useMasterKey: true,
      });
      expect(updated.get('editedBy')).toBe('test-editor-id');
      const editedAt = updated.get('editedAt');
      expect(editedAt).toBeInstanceOf(Date);
      expect(editedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(editedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    test('should not allow user-supplied audit fields to override', async () => {
      const Parse = require('parse/node'); // eslint-disable-line global-require
      const fakeDate = new Date('2000-01-01');
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        {
          fname: 'Jane',
          editedBy: 'hacker-id',
          editedAt: fakeDate,
        },
        'test-editor-id'
      );

      const updated = await new Parse.Query('SurveyData').get(testSurveyData.id, {
        useMasterKey: true,
      });
      expect(updated.get('editedBy')).toBe('test-editor-id');
      expect(updated.get('editedAt').getTime()).not.toBe(fakeDate.getTime());
      expect(updated.get('editedAt')).toBeInstanceOf(Date);
    });

    test('should not affect other records', async () => {
      const Parse = require('parse/node'); // eslint-disable-line global-require
      // Create another record
      const SurveyData = Parse.Object.extend('SurveyData');
      const other = new SurveyData();
      other.set('fname', 'Other');
      other.set('lname', 'Person');
      const acl = new Parse.ACL();
      acl.setRoleWriteAccess('admin', true);
      other.setACL(acl);
      await other.save(null, { useMasterKey: true });

      // Update testSurveyData
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        { fname: 'Jane' },
        testUser.id
      );

      // Verify other record unchanged
      const otherStill = await new Parse.Query('SurveyData').get(other.id, {
        useMasterKey: true,
      });
      expect(otherStill.get('fname')).toBe('Other');
      expect(otherStill.get('lname')).toBe('Person');
    });
  });

  describe('RED: Different Parse classes', () => {
    test('should update Vitals record', async () => {
      // eslint-disable-next-line global-require
      const Parse = require('parse/node');
      const Vitals = Parse.Object.extend('Vitals');
      const vitals = new Vitals();
      vitals.set('height', 180);
      vitals.set('weight', 75);
      const acl = new Parse.ACL();
      acl.setRoleWriteAccess('admin', true);
      vitals.setACL(acl);
      await vitals.save(null, { useMasterKey: true });

      await updateObjectInClass(
        'Vitals',
        vitals.id,
        { height: 185, weight: 80 },
        testUser.id
      );

      const updated = await new Parse.Query('Vitals').get(vitals.id, {
        useMasterKey: true,
      });
      expect(updated.get('height')).toBe(185);
      expect(updated.get('weight')).toBe(80);
    });
  });

  describe('RED: Error handling', () => {
    test('should reject if object does not exist', async () => {
      await expect(
        updateObjectInClass(
          'SurveyData',
          'nonexistent-id',
          { fname: 'Jane' },
          testUser.id
        )
      ).rejects.toThrow();
    });

    test('should reject if surveyingUser is missing', async () => {
      await expect(
        updateObjectInClass('SurveyData', testSurveyData.id, { fname: 'Jane' }, null)
      ).rejects.toThrow('surveyingUser is required');
    });
  });
});
