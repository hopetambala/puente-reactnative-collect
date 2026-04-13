/**
 * Update Object In Class - RED/GREEN TDD
 * Tests the updateObjectInClass function for editing existing Parse records.
 * updateObjectInClass delegates to the 'updateObject' cloud function so it runs
 * server-side with master key, bypassing client ACL restrictions.
 */
import { updateObjectInClass } from '@app/services/parse/crud';

const mockCloudRun = jest.fn(() => Promise.resolve({ id: 'test-id-123' }));

jest.mock('@app/services/parse/client', () => jest.fn(() => ({
  // Wrap in a function so mockCloudRun is resolved at call time (not at object creation time),
  // since the Parse client is initialized as a module-level constant before mockCloudRun is set.
  Cloud: { run: (...args) => mockCloudRun(...args) },
  Query: jest.fn(),
  Object: { extend: jest.fn(() => class MockModel {}) },
})));

jest.mock('@app/environment', () => ({ default: { TEST_MODE: true } }));

describe('updateObjectInClass - RED/GREEN TDD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RED: Calls cloud function with correct params', () => {
    test('should call Parse.Cloud.run with updateObject', async () => {
      await updateObjectInClass('SurveyData', 'test-id-123', { fname: 'Jane' }, 'user123');
      expect(mockCloudRun).toHaveBeenCalledWith('updateObject', expect.any(Object));
    });

    test('should pass parseClass to cloud function', async () => {
      await updateObjectInClass('SurveyData', 'test-id-123', { fname: 'Jane' }, 'user123');
      const [, params] = mockCloudRun.mock.calls[0];
      expect(params.parseClass).toBe('SurveyData');
    });

    test('should pass parseClassID (objectId) to cloud function', async () => {
      await updateObjectInClass('SurveyData', 'test-id-123', { fname: 'Jane' }, 'user123');
      const [, params] = mockCloudRun.mock.calls[0];
      expect(params.parseClassID).toBe('test-id-123');
    });

    test('should pass user fields in localObject', async () => {
      await updateObjectInClass('SurveyData', 'test-id-123', { fname: 'Jane', lname: 'Smith' }, 'user123');
      const [, params] = mockCloudRun.mock.calls[0];
      expect(params.localObject.fname).toBe('Jane');
      expect(params.localObject.lname).toBe('Smith');
    });
  });

  describe('RED: Audit trail added to localObject', () => {
    test('should include editedBy in localObject sent to cloud function', async () => {
      await updateObjectInClass('SurveyData', 'test-id-123', { fname: 'Jane' }, 'editor-user');
      const [, params] = mockCloudRun.mock.calls[0];
      expect(params.localObject.editedBy).toBe('editor-user');
    });

    test('should include editedAt as a Date in localObject', async () => {
      await updateObjectInClass('SurveyData', 'test-id-123', { fname: 'Jane' }, 'user123');
      const [, params] = mockCloudRun.mock.calls[0];
      expect(params.localObject.editedAt).toBeInstanceOf(Date);
    });

    test('should not allow user-supplied editedBy to override audit trail', async () => {
      await updateObjectInClass('SurveyData', 'test-id-123', { fname: 'Jane', editedBy: 'hacker' }, 'user123');
      const [, params] = mockCloudRun.mock.calls[0];
      expect(params.localObject.editedBy).toBe('user123');
    });

    test('should not allow user-supplied editedAt to override audit trail', async () => {
      const fakeDate = new Date('2000-01-01');
      await updateObjectInClass('SurveyData', 'test-id-123', { fname: 'Jane', editedAt: fakeDate }, 'user123');
      const [, params] = mockCloudRun.mock.calls[0];
      expect(params.localObject.editedAt).not.toEqual(fakeDate);
      expect(params.localObject.editedAt).toBeInstanceOf(Date);
    });
  });

  describe('RED: Error handling', () => {
    test('should reject if surveyingUser is missing', async () => {
      await expect(
        updateObjectInClass('SurveyData', 'test-id-123', { fname: 'Jane' }, null)
      ).rejects.toThrow('surveyingUser is required');
    });

    test('should reject if cloud function rejects (object not found)', async () => {
      mockCloudRun.mockRejectedValueOnce(new Error('Not found'));
      await expect(
        updateObjectInClass('SurveyData', 'nonexistent', { fname: 'Jane' }, 'user123')
      ).rejects.toThrow('Not found');
    });

    test('should reject if cloud function rejects (save failed)', async () => {
      mockCloudRun.mockRejectedValueOnce(new Error('Save failed'));
      await expect(
        updateObjectInClass('SurveyData', 'test-id-123', { fname: 'Jane' }, 'user123')
      ).rejects.toThrow('Save failed');
    });
  });

  describe('RED: Multiple fields and different classes', () => {
    test('should handle multiple field updates in single call', async () => {
      const updateFields = { fname: 'Jane', lname: 'Smith', phonenumber: '555-1234' };
      await updateObjectInClass('SurveyData', 'test-id-123', updateFields, 'user123');
      const [, params] = mockCloudRun.mock.calls[0];
      expect(params.localObject.fname).toBe('Jane');
      expect(params.localObject.lname).toBe('Smith');
      expect(params.localObject.phonenumber).toBe('555-1234');
    });

    test('should work with Vitals class', async () => {
      await updateObjectInClass('Vitals', 'vitals-id', { height: 180, weight: 75 }, 'user123');
      const [, params] = mockCloudRun.mock.calls[0];
      expect(params.parseClass).toBe('Vitals');
      expect(params.parseClassID).toBe('vitals-id');
    });

    test('should work with FormResults class', async () => {
      await updateObjectInClass('FormResults', 'form-id', { fields: [] }, 'user123');
      const [, params] = mockCloudRun.mock.calls[0];
      expect(params.parseClass).toBe('FormResults');
    });

    test('should work with Assets class', async () => {
      await updateObjectInClass('Assets', 'asset-id', { name: 'New Asset' }, 'user123');
      const [, params] = mockCloudRun.mock.calls[0];
      expect(params.parseClass).toBe('Assets');
    });

    test('should return the result from the cloud function', async () => {
      const fakeResult = { id: 'saved-obj', createdAt: new Date() };
      mockCloudRun.mockResolvedValueOnce(fakeResult);
      const result = await updateObjectInClass('SurveyData', 'test-id-123', { fname: 'Jane' }, 'user123');
      expect(result).toBe(fakeResult);
    });
  });
});

