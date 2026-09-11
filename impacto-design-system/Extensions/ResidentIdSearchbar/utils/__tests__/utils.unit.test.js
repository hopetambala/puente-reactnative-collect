/**
 * ResidentIdSearchbar parseSearch — RED-GREEN TDD
 *
 * This is the searchbar a surveyor uses DURING data collection
 * (domains/DataCollection/Forms/index.js) and when linking a person to a
 * household (PaperInputPicker/HouseholdManager). It answers the question
 * "does this person already have a record?" — so when it comes up empty the
 * surveyor creates the person again. Two defects made it come up empty:
 *
 * 1. It scoped with `equalTo` on the account's single organization string.
 *    Collect's CLAUDE.md mandates `containedIn, never equalTo` for
 *    surveyingOrganization; this call site was missed. Production, 2026-08-28
 *    (app id vBdTHqQU31), SurveyData rows: Rayjon Eye Clinic 1196 vs Rayjon
 *    185, DRMT 611 vs DR Missions 11 — so those accounts searched 13% and
 *    1.8% of their own residents.
 *
 * 2. `limit(3000)` was set on the SUBQUERIES. Verified in the SDK source:
 *    ParseQuery._orQuery copies only `q.toJSON().where` from each subquery, and
 *    Parse.Query.or returns a fresh query whose _limit is -1, so no limit
 *    param is sent. parse-server then applies RestQuery.js:218,
 *    `restOptions.limit = restOptions.limit || 100`. The real cap was 100.
 */

const mockFind = jest.fn();
const mockSubQueries = [];
const mockCompositeQuery = {
  descending: jest.fn(),
  equalTo: jest.fn(),
  containedIn: jest.fn(),
  limit: jest.fn(),
  find: mockFind,
};

jest.mock('parse/react-native', () => {
  const QueryMock = jest.fn(() => {
    const q = {
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

const mockLoadOrganizationScope = jest.fn();
jest.mock('@modules/organization', () => ({
  loadOrganizationScope: (...args) => mockLoadOrganizationScope(...args),
}));

const mockGetFindRecordsLimit = jest.fn();
jest.mock('@modules/settings', () => ({
  getFindRecordsLimit: (...args) => mockGetFindRecordsLimit(...args),
}));

// eslint-disable-next-line import/first
import parseSearch from '@impacto-design-system/Extensions/ResidentIdSearchbar/utils/index';

describe('ResidentIdSearchbar parseSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubQueries.length = 0;
    mockFind.mockResolvedValue([]);
    mockLoadOrganizationScope.mockResolvedValue(['testORG']);
    mockGetFindRecordsLimit.mockResolvedValue(2000);
  });

  it('matches every organization string, not just the account’s own', async () => {
    mockLoadOrganizationScope.mockResolvedValue(['DR Missions', 'DRMT']);

    await parseSearch('DR Missions', 'ana');

    expect(mockLoadOrganizationScope).toHaveBeenCalledWith('DR Missions');
    expect(mockCompositeQuery.containedIn).toHaveBeenCalledWith(
      'surveyingOrganization',
      ['DR Missions', 'DRMT']
    );
    expect(mockCompositeQuery.equalTo).not.toHaveBeenCalledWith(
      'surveyingOrganization',
      'DR Missions'
    );
  });

  // Without this the server applies its own default of 100 and the surveyor
  // silently searches a fraction of the register.
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
  it('matches the resident ID fields a surveyor would actually type', async () => {
    await parseSearch('testORG', '402');

    const fields = mockSubQueries.flatMap((q) => q.matches.mock.calls.map(([field]) => field));
    expect(fields).toEqual(
      expect.arrayContaining(['fname', 'lname', 'nickname', 'cedulaNumber', 'householdId'])
    );
  });

  // The offline list filter already matched nickname while the online query did
  // not, so the same query returned different people with and without signal.
  it('matches nickname online, as the offline filter already did', async () => {
    await parseSearch('testORG', 'chichi');

    const fields = mockSubQueries.flatMap((q) => q.matches.mock.calls.map(([field]) => field));
    expect(fields).toContain('nickname');
  });

  it('sets the limit on the composite OR query, where Parse can see it', async () => {
    await parseSearch('testORG', 'ana');

    expect(mockCompositeQuery.limit).toHaveBeenCalledWith(2000);
  });

  it('takes its cap from the findRecordsLimit setting', async () => {
    mockGetFindRecordsLimit.mockResolvedValue(5000);

    await parseSearch('testORG', 'ana');

    expect(mockCompositeQuery.limit).toHaveBeenCalledWith(5000);
  });

  // Field users type lowercase; the data is capitalized. startsWith is
  // case-SENSITIVE, which is the same defect already fixed in FindResidents.
  it('searches fname and lname case-insensitively with an anchored regex', async () => {
    await parseSearch('testORG', 'maria');

    const matched = mockSubQueries.flatMap((q) =>
      q.matches.mock.calls.map(([field, pattern, modifiers]) => ({ field, pattern, modifiers }))
    );
    expect(matched.map((m) => m.field)).toEqual(expect.arrayContaining(['fname', 'lname']));
    matched.forEach(({ pattern, modifiers }) => {
      expect(pattern.startsWith('^')).toBe(true);
      expect(modifiers).toBe('i');
    });
  });

  it('escapes regex metacharacters so user input cannot break the search', async () => {
    await parseSearch('testORG', 'Mar(ia');

    const patterns = mockSubQueries.flatMap((q) => q.matches.mock.calls.map(([, p]) => p));
    expect(patterns.length).toBeGreaterThan(0);
    patterns.forEach((pattern) => expect(pattern).toBe('^Mar\\(ia'));
  });

  it('de-duplicates people who appear under more than one record', async () => {
    const person = (overrides) => ({
      get: (k) => ({
        fname: 'Ana', lname: 'Ramirez', sex: 'Female',
        marriageStatus: 'Single', educationLevel: 'Highschool', ...overrides,
      })[k],
      toJSON: () => ({ objectId: 'x' }),
    });
    mockFind.mockResolvedValue([person({}), person({})]);

    const result = await parseSearch('testORG', 'ana');

    expect(result).toHaveLength(1);
  });
});
