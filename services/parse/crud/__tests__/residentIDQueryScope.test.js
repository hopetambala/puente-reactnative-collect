/**
 * Record scoping - RED/GREEN TDD
 *
 * Records carry the surveyingOrganization string that was COLLECTED, and one
 * organization's records are spread across several. Measured in production
 * 2026-08-29: Rayjon has 185 rows under "Rayjon" and 1196 under "Rayjon Eye
 * Clinic", so 15 accounts saw 11% of their own data; two DR Missions accounts
 * saw none at all.
 */
import { residentIDQuery } from '@app/services/parse/crud';

const constraints = [];
const mockQuery = {
  descending: jest.fn(function d() { return this; }),
  limit: jest.fn(function l() { return this; }),
  equalTo: jest.fn(function e(...a) { constraints.push(['equalTo', ...a]); return this; }),
  containedIn: jest.fn(function c(...a) { constraints.push(['containedIn', ...a]); return this; }),
  exclude: jest.fn(function x() { return this; }),
  find: jest.fn(() => Promise.resolve([])),
};

jest.mock('@app/services/parse/client', () => jest.fn(() => ({
  Query: jest.fn(() => mockQuery),
  Object: { extend: jest.fn(() => class MockModel {}) },
})));

jest.mock('@app/environment', () => ({ default: { TEST_MODE: true } }));

describe('residentIDQuery organization scoping', () => {
  beforeEach(() => { constraints.length = 0; jest.clearAllMocks(); });

  test('matches EVERY string the organization uses when given a set', async () => {
    await residentIDQuery({
      parseParam: ['DR Missions', 'DRMT'],
      limit: 100,
    });

    expect(constraints).toContainEqual([
      'containedIn', 'surveyingOrganization', ['DR Missions', 'DRMT'],
    ]);
    expect(mockQuery.equalTo).not.toHaveBeenCalled();
  });

  test('still accepts a single string, for an unrecognised organization', async () => {
    // 123 of 792 accounts do not resolve to an organization. They must still
    // see their own records rather than none.
    await residentIDQuery({ parseParam: 'Peace Corps', limit: 100 });

    expect(constraints).toContainEqual([
      'containedIn', 'surveyingOrganization', ['Peace Corps'],
    ]);
  });
});

/**
 * The other cache writer. residentIDQuery fills the same `residentData` key as
 * parseSearch, so if only one of them excludes the heavy fields the cache
 * contents depend on which path last wrote it — the exact drift that let the
 * two resident searches diverge in the first place.
 */
describe('residentIDQuery payload', () => {
  beforeEach(() => { constraints.length = 0; jest.clearAllMocks(); });

  test('excludes the heavy fields no resident screen reads', async () => {
    await residentIDQuery({ parseParam: ['testORG'], limit: 10 });

    expect(mockQuery.exclude).toHaveBeenCalled();
    const excluded = mockQuery.exclude.mock.calls[0];
    expect(excluded).toEqual(expect.arrayContaining(['searchIndex', 'signature', 'location']));
    // picture is DISPLAYED by ResidentPage; excluding it blanks the photo,
    // offline especially, where there is no refetch to repair it.
    expect(excluded).not.toContain('picture');
  });
});
