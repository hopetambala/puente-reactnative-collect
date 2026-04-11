/**
 * Jest mock for parse/crud service
 */

module.exports = {
  aggregateStatsItems: jest.fn().mockResolvedValue({
    items: [],
    hasMore: false,
  }),
  createObject: jest.fn().mockResolvedValue({ id: 'test-id' }),
  updateObject: jest.fn().mockResolvedValue({ id: 'test-id' }),
  deleteObject: jest.fn().mockResolvedValue(undefined),
  queryObjects: jest.fn().mockResolvedValue([]),
};
