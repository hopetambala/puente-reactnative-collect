/**
 * FindResidents _utils - RED-GREEN TDD
 * Tests for fetchResidentById — stale resident name fix
 */

// Mock parse/react-native before importing the module under test
const mockGet = jest.fn();
const mockFind = jest.fn();
const mockSubQueries = [];
const mockCompositeQuery = {
  descending: jest.fn(),
  equalTo: jest.fn(),
  limit: jest.fn(),
  find: mockFind,
};

jest.mock('parse/react-native', () => {
  const QueryMock = jest.fn(() => {
    const q = {
      get: mockGet,
      limit: jest.fn(),
      startsWith: jest.fn(),
      matches: jest.fn(),
      find: mockFind,
    };
    mockSubQueries.push(q);
    return q;
  });
  QueryMock.or = jest.fn(() => mockCompositeQuery);
  return { Parse: { Query: QueryMock } };
});

// Import AFTER mocks are registered
// eslint-disable-next-line import/first
import parseSearch, { fetchResidentById } from '@impacto-design-system/Extensions/FindResidents/_utils/index';

describe('parseSearch - case-insensitive resident search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubQueries.length = 0;
    mockFind.mockResolvedValue([]);
  });

  // Production data proved the old startsWith search is case-sensitive:
  // prefix 't' matched 0 testORG records while 'T' matched 58. Field users
  // type lowercase — the search must not care.
  test('searches fname and lname case-insensitively with an anchored regex', async () => {
    await parseSearch('testORG', 'maria');

    const matchedFields = mockSubQueries.flatMap((q) =>
      q.matches.mock.calls.map(([field, pattern, modifiers]) => ({ field, pattern, modifiers }))
    );
    const fields = matchedFields.map((c) => c.field);
    expect(fields).toEqual(expect.arrayContaining(['fname', 'lname']));
    matchedFields.forEach(({ pattern, modifiers }) => {
      expect(pattern.startsWith('^')).toBe(true); // prefix-anchored
      expect(modifiers).toBe('i');
    });
  });

  test('escapes regex metacharacters in the query so user input cannot break the search', async () => {
    await parseSearch('testORG', 'Mar(ia');

    const patterns = mockSubQueries.flatMap((q) =>
      q.matches.mock.calls.map(([, pattern]) => pattern)
    );
    expect(patterns.length).toBeGreaterThan(0);
    patterns.forEach((pattern) => {
      expect(pattern).toBe('^Mar\\(ia');
    });
  });

  // Parse ignores subquery limits under Query.or — the composite query takes
  // its own constraints and defaults to 100. Since the empty-query fetch now
  // feeds the offline cache, a missing composite limit silently caps the
  // cache at ~100 residents for larger orgs.
  test('sets the limit on the composite OR query, not just the subqueries', async () => {
    await parseSearch('testORG', '');

    expect(mockCompositeQuery.limit).toHaveBeenCalledWith(1000);
  });

  test('scopes to the organization and resolves serialized results', async () => {
    mockFind.mockResolvedValue([]);

    const result = await parseSearch('testORG', 'ana');

    expect(mockCompositeQuery.equalTo).toHaveBeenCalledWith('surveyingOrganization', 'testORG');
    expect(result).toEqual([]);
  });
});

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
