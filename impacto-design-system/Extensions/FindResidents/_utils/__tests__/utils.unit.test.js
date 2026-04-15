/**
 * FindResidents _utils - RED-GREEN TDD
 * Tests for fetchResidentById — stale resident name fix
 */

// Mock parse/react-native before importing the module under test
const mockGet = jest.fn();

jest.mock('parse/react-native', () => ({
  Parse: {
    Query: jest.fn(() => ({ get: mockGet })),
  },
}));

// Import AFTER mocks are registered
// eslint-disable-next-line import/first
import { fetchResidentById } from '@impacto-design-system/Extensions/FindResidents/_utils/index';

describe('fetchResidentById - RED-GREEN TDD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── RED: function existence ────────────────────────────────────────────────

  describe('RED: fetchResidentById is exported and callable', () => {
    test('should be a function (not undefined)', () => {
      expect(typeof fetchResidentById).toBe('function');
    });
  });

  // ─── GREEN: offline resident guard ─────────────────────────────────────────

  describe('GREEN: offline residents are skipped', () => {
    test('should return null for PatientID- prefixed objectId without calling Parse', async () => {
      const result = await fetchResidentById('PatientID-abc123');

      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    test('should return null for null objectId without calling Parse', async () => {
      const result = await fetchResidentById(null);

      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });

    test('should return null for undefined objectId without calling Parse', async () => {
      const result = await fetchResidentById(undefined);

      expect(result).toBeNull();
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  // ─── GREEN: successful fetch ────────────────────────────────────────────────

  describe('GREEN: fetches and serializes resident from Parse', () => {
    test('should return serialized plain JSON object for a valid objectId', async () => {
      const mockRecord = { fname: 'John', lname: 'Doe', objectId: 'real-id-123' };
      mockGet.mockResolvedValueOnce(mockRecord);

      const result = await fetchResidentById('real-id-123');

      expect(mockGet).toHaveBeenCalledWith('real-id-123');
      expect(result).toEqual({ fname: 'John', lname: 'Doe', objectId: 'real-id-123' });
    });

    test('should return updated fname when resident was renamed', async () => {
      const updatedRecord = { fname: 'John', lname: 'Smith', objectId: 'resident-456' };
      mockGet.mockResolvedValueOnce(updatedRecord);

      const result = await fetchResidentById('resident-456');

      expect(result.fname).toBe('John');
      expect(result.lname).toBe('Smith');
    });

    test('should return plain JSON (no Parse methods on result)', async () => {
      const mockRecord = {
        fname: 'Maria',
        objectId: 'resident-789',
        get: (field) => mockRecord[field],
      };
      mockGet.mockResolvedValueOnce(mockRecord);

      const result = await fetchResidentById('resident-789');

      // Result should be plain JSON — get() method should not survive serialization
      expect(typeof result.get).toBe('undefined');
      expect(result.fname).toBe('Maria');
    });
  });

  // ─── GREEN: error resilience ────────────────────────────────────────────────

  describe('GREEN: returns null gracefully on Parse error', () => {
    test('should return null when Parse.Query.get throws (e.g. offline, 404)', async () => {
      mockGet.mockRejectedValueOnce(new Error('Object not found'));

      const result = await fetchResidentById('nonexistent-id');

      expect(result).toBeNull();
    });

    test('should return null on network error without throwing', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(fetchResidentById('real-id-123')).resolves.toBeNull();
    });
  });
});
