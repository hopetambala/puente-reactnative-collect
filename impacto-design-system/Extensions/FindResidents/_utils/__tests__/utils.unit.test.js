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
  containedIn: jest.fn(),
  limit: jest.fn(),
  find: mockFind,
};

// Resolving the organization's full alias set is what makes the search find a
// resident collected under a sibling string. Mocked so the test asserts the
// CALL, not the network.
const mockLoadOrganizationScope = jest.fn();
jest.mock('@modules/organization', () => ({
  loadOrganizationScope: (...args) => mockLoadOrganizationScope(...args),
}));

const mockGetFindRecordsLimit = jest.fn();
jest.mock('@modules/settings', () => ({
  getFindRecordsLimit: (...args) => mockGetFindRecordsLimit(...args),
}));

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
    mockLoadOrganizationScope.mockResolvedValue(['testORG']);
    mockGetFindRecordsLimit.mockResolvedValue(2000);
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

    expect(mockCompositeQuery.limit).toHaveBeenCalledWith(2000);
  });

  // The cap is the surveyor's own setting. It was hardcoded at 1000 here and
  // 2000 in residentQuery, so whichever path wrote residentData last decided
  // how many residents were searchable offline.
  test('takes its cap from the findRecordsLimit setting', async () => {
    mockGetFindRecordsLimit.mockResolvedValue(5000);

    await parseSearch('testORG', '');

    expect(mockCompositeQuery.limit).toHaveBeenCalledWith(5000);
  });

/**
   * "Search by name or ID" promised an ID search that did not exist: the query
   * only ever matched fname and lname. A surveyor who typed a resident's
   * cedula got nothing back and could reasonably conclude the person was not
   * in the system -- then entered them again.
   *
   * cedulaNumber is the Dominican national identity card. Its own label in
   * en.json is "License Number" and in es.json "Numero de cedula", so it IS
   * the "ID" the placeholder means. householdId is the other identifier field
   * staff actually read off a form.
   *
   * NOT using fullTextSearchIndex: IdentificationForm writes it only at
   * collection time (index.js:199-208, holding fname/lname/nickname/
   * communityname -- no ID at all), so historical records predating it have no
   * value and would vanish from search.
   */
  test('matches the resident ID fields a surveyor would actually type', async () => {
    await parseSearch('testORG', '402');

    const fields = mockSubQueries.flatMap((q) => q.matches.mock.calls.map(([field]) => field));
    expect(fields).toEqual(
      expect.arrayContaining(['fname', 'lname', 'nickname', 'cedulaNumber', 'householdId'])
    );
  });

  // The offline list filter already matched nickname while the online query did
  // not, so the same query returned different people with and without signal.
  test('matches nickname online, as the offline filter already did', async () => {
    await parseSearch('testORG', 'chichi');

    const fields = mockSubQueries.flatMap((q) => q.matches.mock.calls.map(([field]) => field));
    expect(fields).toContain('nickname');
  });

  test('scopes to the organization and resolves serialized results', async () => {
    mockFind.mockResolvedValue([]);

    const result = await parseSearch('testORG', 'ana');

    expect(mockCompositeQuery.containedIn).toHaveBeenCalledWith(
      'surveyingOrganization',
      ['testORG']
    );
    expect(result).toEqual([]);
  });

  /**
   * The bug this replaces. Records carry the organization string that was
   * COLLECTED, and one organization's records are spread across every string
   * it has ever been called. Measured in production 2026-08-28 (app id
   * vBdTHqQU31), SurveyData rows:
   *
   *   Rayjon Eye Clinic  1196     Rayjon        185   -> an account saying
   *                                                      "Rayjon" saw 13%
   *   DRMT                611     DR Missions    11   -> saw 1.8%
   *
   * Collect's own CLAUDE.md already mandates `containedIn, never equalTo` for
   * this column. This call site was missed, and it is the one a surveyor uses
   * to check whether a resident already exists — so the narrow scope hid the
   * existing person and the surveyor created them a second time.
   */
  test('matches EVERY organization string, never just the account’s own', async () => {
    mockLoadOrganizationScope.mockResolvedValue(['Rayjon', 'Rayjon Eye Clinic']);

    await parseSearch('Rayjon', 'ana');

    expect(mockLoadOrganizationScope).toHaveBeenCalledWith('Rayjon');
    expect(mockCompositeQuery.containedIn).toHaveBeenCalledWith(
      'surveyingOrganization',
      ['Rayjon', 'Rayjon Eye Clinic']
    );
    expect(mockCompositeQuery.equalTo).not.toHaveBeenCalledWith(
      'surveyingOrganization',
      'Rayjon'
    );
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
