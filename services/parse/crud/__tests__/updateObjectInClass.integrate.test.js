/**
 * UpdateObjectInClass Integration Tests
 * Tests with real Parse Server + MongoDB (in-memory)
 * Verifies end-to-end edit functionality via cloud function
 *
 * Runs against real MongoDB-backed Parse Server via jest.integration.config.js
 * Use: yarn test:integration
 */
import { updateObjectInClass } from '@app/services/parse/crud';
import hooks from '@app/test/hooks';
import { Parse } from 'parse/react-native';

hooks();

describe('updateObjectInClass - INTEGRATION', () => {
  let testUser;
  let testSurveyData;

  beforeAll(async () => {
    // Create a test user directly (no need to query for seeded user)
    const username = `integrationTestUser-${Date.now()}`;
    const password = 'password';
    const user = new Parse.User();
    user.set('username', username);
    user.set('password', password);
    user.set('email', `test-${Date.now()}@example.com`);
    await user.save(null, { useMasterKey: true });
    // Log in the user to establish authenticated session
    testUser = await Parse.User.logIn(username, password);
  });

  beforeEach(async () => {
    // Create a test SurveyData record to update in each test
    const SurveyData = Parse.Object.extend('SurveyData');
    testSurveyData = new SurveyData();
    testSurveyData.set('fname', 'John');
    testSurveyData.set('lname', 'Doe');
    testSurveyData.set('dob', '1990-01-15');
    testSurveyData.set('sex', 'M');
    await testSurveyData.save(null, { useMasterKey: true });
  });

  describe('RED: Update via cloud function', () => {
    test('should update a single field on SurveyData record', async () => {
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        { fname: 'Jane' },
        testUser.id
      );

      const updated = await new Parse.Query('SurveyData').get(testSurveyData.id, { useMasterKey: true });
      expect(updated.get('fname')).toBe('Jane');
      expect(updated.get('lname')).toBe('Doe'); // unchanged
    });

    test('should update multiple fields in single call', async () => {
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        { fname: 'Jane', lname: 'Smith', sex: 'F' },
        testUser.id
      );

      const updated = await new Parse.Query('SurveyData').get(testSurveyData.id, { useMasterKey: true });
      expect(updated.get('fname')).toBe('Jane');
      expect(updated.get('lname')).toBe('Smith');
      expect(updated.get('sex')).toBe('F');
      expect(updated.get('dob')).toBe('1990-01-15'); // unchanged
    });

    test('should add audit trail fields', async () => {
      const beforeTime = new Date();
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        { fname: 'Jane' },
        'test-editor-id'
      );
      const afterTime = new Date();

      const updated = await new Parse.Query('SurveyData').get(testSurveyData.id, { useMasterKey: true });
      expect(updated.get('editedBy')).toBe('test-editor-id');
      const editedAt = updated.get('editedAt');
      expect(editedAt).toBeInstanceOf(Date);
      expect(editedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(editedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    test('should not allow user-supplied audit fields to override', async () => {
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

      const updated = await new Parse.Query('SurveyData').get(testSurveyData.id, { useMasterKey: true });
      expect(updated.get('editedBy')).toBe('test-editor-id');
      expect(updated.get('editedAt').getTime()).not.toBe(fakeDate.getTime());
      expect(updated.get('editedAt')).toBeInstanceOf(Date);
    });

    test('should not affect other records', async () => {
      // Create another record
      const SurveyData = Parse.Object.extend('SurveyData');
      const other = new SurveyData();
      other.set('fname', 'Other');
      other.set('lname', 'Person');
      await other.save(null, { useMasterKey: true });

      // Update testSurveyData
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        { fname: 'Jane' },
        testUser.id
      );

      // Verify testSurveyData was updated
      const updated = await new Parse.Query('SurveyData').get(testSurveyData.id, { useMasterKey: true });
      expect(updated.get('fname')).toBe('Jane');

      // Verify other record was not changed
      const otherRecord = await new Parse.Query('SurveyData').get(other.id, { useMasterKey: true });
      expect(otherRecord.get('fname')).toBe('Other');
    });

    test('should persist changes across queries', async () => {
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        { fname: 'Updated' },
        testUser.id
      );

      // Query 1: First check
      const check1 = await new Parse.Query('SurveyData').get(testSurveyData.id, { useMasterKey: true });
      expect(check1.get('fname')).toBe('Updated');

      // Query 2: Second check to ensure persistence
      const check2 = await new Parse.Query('SurveyData').get(testSurveyData.id, { useMasterKey: true });
      expect(check2.get('fname')).toBe('Updated');
    });

    test('should correctly handle boolean field updates', async () => {
      // Set a boolean field
      testSurveyData.set('isComplete', false);
      await testSurveyData.save(null, { useMasterKey: true });

      // Update it via cloud function
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        { isComplete: true },
        testUser.id
      );

      const updated = await new Parse.Query('SurveyData').get(testSurveyData.id, { useMasterKey: true });
      expect(updated.get('isComplete')).toBe(true);
    });

    test('should handle edge case of null values', async () => {
      await updateObjectInClass(
        'SurveyData',
        testSurveyData.id,
        { lname: null },
        testUser.id
      );

      const updated = await new Parse.Query('SurveyData').get(testSurveyData.id, { useMasterKey: true });
      expect(updated.get('lname')).toBeNull();
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

  describe('RED-GREEN: Real-world form edit with Pointer fields', () => {
    let testResident;
    let testVitals;

    beforeEach(async () => {
      // Create a resident (SurveyData)
      const SurveyData = Parse.Object.extend('SurveyData');
      testResident = new SurveyData();
      testResident.set('fname', 'John');
      testResident.set('lname', 'Smith');
      await testResident.save(null, { useMasterKey: true });

      // Create a Vitals record with a Pointer to the resident
      const Vitals = Parse.Object.extend('Vitals');
      testVitals = new Vitals();
      testVitals.set('height', 180);
      testVitals.set('weight', 75);
      testVitals.set('bloodPressure', '120/80');
      testVitals.set('client', testResident); // This is a Parse Pointer
      testVitals.set('surveyingUser', 'Dr. Johnson');
      await testVitals.save(null, { useMasterKey: true });
    });

    test('RED: should handle edit submission with Pointer fields in updateFields', async () => {
      // RED: Real app sends back the Pointer along with user data
      // This should fail until we filter Pointers correctly
      const recordWithPointer = await new Parse.Query('Vitals').include('client').get(testVitals.id, { useMasterKey: true });
      
      // Simulate what the form does: spreads all fields including the Pointer
      const formData = {
        height: 185, // Changed
        weight: 75,
        bloodPressure: '120/80',
        client: recordWithPointer.get('client'), // Parse Pointer object
      };

      // GREEN: Should handle Pointer gracefully (skip it, not throw)
      await updateObjectInClass(
        'Vitals',
        testVitals.id,
        formData,
        testUser.id
      );

      // Verify user fields were updated
      const updated = await new Parse.Query('Vitals').get(testVitals.id, { useMasterKey: true });
      expect(updated.get('height')).toBe(185);
      expect(updated.get('weight')).toBe(75);
      expect(updated.get('bloodPressure')).toBe('120/80');
      // Pointer relationship should be unchanged
      expect(updated.get('client').id).toBe(testResident.id);
    });

    test('GREEN: should filter out Pointer fields and only update user data', async () => {
      const recordWithPointer = await new Parse.Query('Vitals').include('client').get(testVitals.id, { useMasterKey: true });
      
      const formData = {
        height: 190,
        client: recordWithPointer.get('client'), // Should be filtered out
        surveyingUser: 'Dr. Johnson', // Keep user data
      };

      await updateObjectInClass(
        'Vitals',
        testVitals.id,
        formData,
        testUser.id
      );

      const updated = await new Parse.Query('Vitals').include('client').get(testVitals.id, { useMasterKey: true });
      expect(updated.get('height')).toBe(190);
      expect(updated.get('client').id).toBe(testResident.id); // Relationship preserved
    });

    test('GREEN: should handle Parse Object with toJSON() method', async () => {
      const recordWithPointer = await new Parse.Query('Vitals').include('client').get(testVitals.id, { useMasterKey: true });
      
      // Simulate form data where client is a Parse Object
      const clientObject = recordWithPointer.get('client'); // This is a Parse Object
      const formData = {
        height: 175,
        weight: 80,
        client: clientObject, // Has toJSON() method
      };

      // Should not throw, should handle gracefully
      await updateObjectInClass(
        'Vitals',
        testVitals.id,
        formData,
        testUser.id
      );

      const updated = await new Parse.Query('Vitals').get(testVitals.id, { useMasterKey: true });
      expect(updated.get('height')).toBe(175);
      expect(updated.get('weight')).toBe(80);
    });

    test('RED-GREEN: comprehensive form edit with mixed Pointer and user fields', async () => {
      const recordWithPointer = await new Parse.Query('Vitals').include('client').get(testVitals.id, { useMasterKey: true });
      
      // Simulate real form submission with all fields
      const formData = {
        height: 172,
        weight: 68,
        bloodPressure: '110/70',
        client: recordWithPointer.get('client'), // Pointer - should be filtered
        surveyingUser: 'Dr. Wilson', // User data
        surveyingOrganization: 'Clinic A', // User data
        appVersion: '15.1.0', // User data
      };

      await updateObjectInClass(
        'Vitals',
        testVitals.id,
        formData,
        testUser.id
      );

      const updated = await new Parse.Query('Vitals').include('client').get(testVitals.id, { useMasterKey: true });
      
      // User fields updated
      expect(updated.get('height')).toBe(172);
      expect(updated.get('weight')).toBe(68);
      expect(updated.get('bloodPressure')).toBe('110/70');
      expect(updated.get('surveyingUser')).toBe('Dr. Wilson');
      expect(updated.get('surveyingOrganization')).toBe('Clinic A');
      expect(updated.get('appVersion')).toBe('15.1.0');
      
      // Pointer unchanged
      expect(updated.get('client').id).toBe(testResident.id);
      
      // Audit trail added
      expect(updated.get('editedBy')).toBe(testUser.id);
      expect(updated.get('editedAt')).toBeInstanceOf(Date);
    });
  });
});
