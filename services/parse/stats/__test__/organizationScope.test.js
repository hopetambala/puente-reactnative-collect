/**
 * Stats scoping - RED/GREEN TDD
 *
 * The home screen counts are org-scoped. Records carry the
 * surveyingOrganization string that was COLLECTED, and one organization's are
 * spread across several: in production Rayjon has 185 rows under "Rayjon" and
 * 1196 under "Rayjon Eye Clinic". Matching a single string undercounts a
 * surveyor's own organization by up to 89%.
 */
import statsService from '@app/services/parse/stats/stats.service';

const constraints = [];
const mockQuery = {
  select: jest.fn(function s() { return this; }),
  equalTo: jest.fn(function e(...a) { constraints.push(['equalTo', ...a]); return this; }),
  containedIn: jest.fn(function c(...a) { constraints.push(['containedIn', ...a]); return this; }),
  greaterThanOrEqualTo: jest.fn(function g() { return this; }),
  lessThan: jest.fn(function l() { return this; }),
  descending: jest.fn(function d() { return this; }),
  skip: jest.fn(function sk() { return this; }),
  limit: jest.fn(function li() { return this; }),
  count: jest.fn(() => Promise.resolve(0)),
  find: jest.fn(() => Promise.resolve([])),
};

jest.mock('@app/services/parse/client', () => jest.fn(() => ({
  Query: jest.fn(() => mockQuery),
  Object: { extend: jest.fn(() => class MockModel {}) },
})));

jest.mock('@app/environment', () => ({ default: { TEST_MODE: true } }));

describe('stats organization scoping', () => {
  beforeEach(() => { constraints.length = 0; jest.clearAllMocks(); });

  const range = { start: new Date('2026-01-01'), end: new Date('2026-12-31') };

  test('counts across every string the organization uses', async () => {
    await statsService.countWithRange(
      'SurveyData',
      { surveyingOrganization: ['Rayjon', 'Rayjon Eye Clinic'] },
      range,
    );

    expect(constraints).toContainEqual([
      'containedIn', 'surveyingOrganization', ['Rayjon', 'Rayjon Eye Clinic'],
    ]);
  });

  test('lists across every string the organization uses', async () => {
    await statsService.fetchItemsPage(
      'SurveyData',
      ['fname'],
      { surveyingOrganization: ['Rayjon', 'Rayjon Eye Clinic'] },
      range,
      0,
      10,
    );

    expect(constraints).toContainEqual([
      'containedIn', 'surveyingOrganization', ['Rayjon', 'Rayjon Eye Clinic'],
    ]);
  });

  test('a scalar filter still uses exact equality', async () => {
    // surveyingUser and every other filter must be unaffected.
    await statsService.countWithRange(
      'SurveyData',
      { surveyingUser: 'Ana Perez' },
      range,
    );

    expect(constraints).toContainEqual(['equalTo', 'surveyingUser', 'Ana Perez']);
  });
});
