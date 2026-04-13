/**
 * Stats Service Unit Tests - RED/GREEN TDD
 * All tests focus on direct Parse query behavior
 */
import statsService from '../stats.service';

// Mock minimal Parse client
const mockQuery = {
  constraints: {},
  equalTo: jest.fn(function equalTo(key, val) { this.constraints[key] = val; return this; }),
  greaterThanOrEqualTo: jest.fn(function greaterThanOrEqualTo(key, val) { this.constraints[`${key}__gte`] = val; return this; }),
  lessThan: jest.fn(function lessThan(key, val) { this.constraints[`${key}__lt`] = val; return this; }),
  select: jest.fn(function select() { return this; }),
  skip: jest.fn(function skip() { return this; }),
  limit: jest.fn(function limit() { return this; }),
  descending: jest.fn(function descending() { return this; }),
  count: jest.fn(() => Promise.resolve(10)),
  find: jest.fn(() => Promise.resolve([])),
};

jest.mock('@app/services/parse/client', () => jest.fn(() => ({
    Object: { extend: jest.fn(() => class MockModel {}) },
    Query: jest.fn(() => mockQuery),
  })));

jest.mock('@app/environment', () => ({ default: { TEST_MODE: true } }));

describe('Stats Service - TDD RED/GREEN', () => {
  describe('RED: buildDateRange', () => {
    test('should return valid date range object', () => {
      const result = statsService.buildDateRange('week');
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
      expect(result.start instanceof Date).toBe(true);
      expect(result.end instanceof Date).toBe(true);
    });
  });

  describe('RED: aggregateStats', () => {
    test('should reject with missing userId', async () => {
      await expect(
        statsService.aggregateStats(null, 'org', 'week')
      ).rejects.toThrow();
    });

    test('should return stats object with all form types', async () => {
      const result = await statsService.aggregateStats('user1', 'Test', 'week');
      expect(result).toHaveProperty('mySurveys');
      expect(result).toHaveProperty('orgSurveys');
      expect(result).toHaveProperty('myVitals');
      expect(result).toHaveProperty('orgVitals');
      expect(result).toHaveProperty('myEnvironmentalHealth');
      expect(result).toHaveProperty('orgEnvironmentalHealth');
      expect(result).toHaveProperty('myMedicalEvaluation');
      expect(result).toHaveProperty('orgMedicalEvaluation');
      expect(result).toHaveProperty('myCustomForms');
      expect(result).toHaveProperty('orgCustomForms');
      expect(result).toHaveProperty('recentActivity');
    });
  });

  describe('RED: countWithRange', () => {
    test('should return a number', async () => {
      const count = await statsService.countWithRange('SurveyData', {}, { start: new Date(0), end: new Date() });
      expect(typeof count).toBe('number');
    });
  });

  describe('RED: fetchCardItems', () => {
    test('should return paginated results with hasMore flag', async () => {
      const result = await statsService.fetchCardItems('mySurveys', 'user1', 'Test', 'week', 0, 10);
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.items)).toBe(true);
    });
  });
});
