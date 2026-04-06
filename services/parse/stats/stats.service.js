/**
 * Stats Service - Direct Parse Queries
 * Aggregates and fetches statistics from Parse Server
 */

import selectedENV from '@app/environment';
import client from '@app/services/parse/client';

const { TEST_MODE } = selectedENV;
const Parse = client(TEST_MODE);

/**
 * Build date range for filtering by timeFilter
 * @param {string} timeFilter - 'today', 'week', or 'all'
 * @returns {object} { start, end, prevStart, prevEnd } as Date objects
 */
function buildDateRange(timeFilter) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  let start; let end; let prevStart; let prevEnd;

  if (timeFilter === 'today') {
    start = today;
    end = new Date();
    prevStart = new Date(yesterday);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd = yesterday;
    prevEnd.setHours(23, 59, 59, 999);
  } else if (timeFilter === 'week') {
    start = startOfThisWeek;
    end = new Date();
    prevStart = startOfLastWeek;
    prevEnd = new Date(startOfThisWeek);
    prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
  } else {
    // 'all'
    start = new Date(0);
    end = new Date();
    prevStart = new Date(0);
    prevEnd = new Date(0);
  }

  return { start, end, prevStart, prevEnd };
}

/**
 * Count records in a date range with specific filters
 * @param {string} parseClass - Parse class name
 * @param {object} equalToParams - key/value pairs for exact matches
 * @param {object} dateRange - { start, end }
 * @returns {Promise<number>} count of records
 */
async function countWithRange(parseClass, equalToParams, dateRange) {
  try {
    const Model = Parse.Object.extend(parseClass);
    const query = new Parse.Query(Model);

    // Apply equality filters
    if (equalToParams) {
      Object.keys(equalToParams).forEach((key) => {
        query.equalTo(key, equalToParams[key]);
      });
    }

    // Apply date range
    query.greaterThanOrEqualTo('createdAt', dateRange.start);
    query.lessThan('createdAt', dateRange.end);

    const count = await query.count();
    return count;
  } catch (error) {
    console.error(`Error counting ${parseClass}:`, error); // eslint-disable-line
    throw error;
  }
}

/**
 * Fetch paginated items from a date range with specific filters
 * @param {string} parseClass - Parse class name
 * @param {array} selectFields - fields to select
 * @param {object} equalToParams - key/value pairs for exact matches
 * @param {object} dateRange - { start, end }
 * @param {number} offset - pagination offset
 * @param {number} limit - pagination limit
 * @returns {Promise<array>} paginated records
 */
async function fetchItemsPage(
  parseClass,
  selectFields,
  equalToParams,
  dateRange,
  offset,
  limit,
) {
  try {
    const Model = Parse.Object.extend(parseClass);
    const query = new Parse.Query(Model);

    // Select only needed fields for performance
    if (selectFields && selectFields.length > 0) {
      query.select(...selectFields);
    }

    // Apply equality filters
    if (equalToParams) {
      Object.keys(equalToParams).forEach((key) => {
        query.equalTo(key, equalToParams[key]);
      });
    }

    // Apply date range
    query.greaterThanOrEqualTo('createdAt', dateRange.start);
    query.lessThan('createdAt', dateRange.end);

    // Pagination
    query.skip(offset);
    query.limit(limit);

    // Sort newest first
    query.descending('createdAt');

    const records = await query.find();
    return records;
  } catch (error) {
    console.error(`Error fetching items from ${parseClass}:`, error); // eslint-disable-line
    throw error;
  }
}

/**
 * Aggregate stats for HomeScreen
 * @param {string} surveyingUser - Stored surveyingUser string ("Firstname Lastname" or username)
 * @param {string} organization - Organization name/ID matching surveyingOrganization field
 * @param {string} timeFilter - 'today', 'week', or 'all'
 * @returns {Promise<object>} stats object with mySurveys, orgSurveys, etc.
 */
async function aggregateStats(surveyingUser, organization, timeFilter) {
  try {
    if (!surveyingUser || !organization || !timeFilter) {
      throw new Error('Missing required parameters: surveyingUser, organization, timeFilter');
    }

    const dateRange = buildDateRange(timeFilter);
    const prevDateRange = {
      start: dateRange.prevStart,
      end: dateRange.prevEnd,
    };

    // Run all counts in parallel
    const [
      mySurveysCurrent,
      mySurveysPrev,
      orgSurveysCurrent,
      orgSurveysPrev,
      myVitalsCurrent,
      myVitalsPrev,
      orgVitalsCurrent,
      orgVitalsPrev,
      recentActivityCurrent,
    ] = await Promise.all([
      // My Surveys (current period)
      countWithRange(
        'SurveyData',
        { surveyingUser, surveyingOrganization: organization },
        dateRange,
      ),
      // My Surveys (previous period)
      countWithRange(
        'SurveyData',
        { surveyingUser, surveyingOrganization: organization },
        prevDateRange,
      ),
      // Org Surveys (current period)
      countWithRange(
        'SurveyData',
        { surveyingOrganization: organization },
        dateRange,
      ),
      // Org Surveys (previous period)
      countWithRange(
        'SurveyData',
        { surveyingOrganization: organization },
        prevDateRange,
      ),
      // My Vitals (current period)
      countWithRange(
        'Vitals',
        { surveyingUser, surveyingOrganization: organization },
        dateRange,
      ),
      // My Vitals (previous period)
      countWithRange(
        'Vitals',
        { surveyingUser, surveyingOrganization: organization },
        prevDateRange,
      ),
      // Org Vitals (current period)
      countWithRange(
        'Vitals',
        { surveyingOrganization: organization },
        dateRange,
      ),
      // Org Vitals (previous period)
      countWithRange(
        'Vitals',
        { surveyingOrganization: organization },
        prevDateRange,
      ),
      // Recent Activity (all time, current user)
      countWithRange(
        'SurveyData',
        { surveyingUser },
        { start: new Date(0), end: new Date() },
      ),
    ]);

    const result = {
      mySurveys: { count: mySurveysCurrent, previous: mySurveysPrev },
      orgSurveys: { count: orgSurveysCurrent, previous: orgSurveysPrev },
      myVitals: { count: myVitalsCurrent, previous: myVitalsPrev },
      orgVitals: { count: orgVitalsCurrent, previous: orgVitalsPrev },
      recentActivity: { count: recentActivityCurrent },
    };

    console.log('statsService: aggregateStats result', result); // eslint-disable-line
    return result;
  } catch (error) {
    console.error('statsService: Error in aggregateStats:', error); // eslint-disable-line
    throw error;
  }
}

/**
 * Fetch detail items for a card
 * @param {string} cardType - 'mySurveys', 'orgSurveys', 'myVitals', 'orgVitals', 'recentActivity'
 * @param {string} userId - Current user ID
 * @param {string} organization - Organization ID or name
 * @param {string} timeFilter - 'today', 'week', or 'all'
 * @param {number} offset - pagination offset
 * @param {number} limit - pagination limit
 * @returns {Promise<object>} { items[], total, hasMore }
 */
async function fetchCardItems(
  cardType,
  surveyingUser,
  organization,
  timeFilter,
  offset,
  limit,
) {
  try {
    if (!cardType || !surveyingUser || !organization || !timeFilter || offset === undefined || !limit) {
      throw new Error('Missing required parameters');
    }

    const dateRange = buildDateRange(timeFilter);

    let itemsResult;
    let totalCount;

    if (cardType === 'mySurveys') {
      itemsResult = await fetchItemsPage(
        'SurveyData',
        ['fname', 'lname', 'createdAt'],
        { surveyingUser, surveyingOrganization: organization },
        dateRange,
        offset,
        limit,
      );
      totalCount = await countWithRange(
        'SurveyData',
        { surveyingUser, surveyingOrganization: organization },
        dateRange,
      );
    } else if (cardType === 'orgSurveys') {
      itemsResult = await fetchItemsPage(
        'SurveyData',
        ['fname', 'lname', 'createdAt'],
        { surveyingOrganization: organization },
        dateRange,
        offset,
        limit,
      );
      totalCount = await countWithRange(
        'SurveyData',
        { surveyingOrganization: organization },
        dateRange,
      );
    } else if (cardType === 'myVitals') {
      itemsResult = await fetchItemsPage(
        'Vitals',
        ['surveyingUser', 'createdAt'],
        { surveyingUser, surveyingOrganization: organization },
        dateRange,
        offset,
        limit,
      );
      totalCount = await countWithRange(
        'Vitals',
        { surveyingUser, surveyingOrganization: organization },
        dateRange,
      );
    } else if (cardType === 'orgVitals') {
      itemsResult = await fetchItemsPage(
        'Vitals',
        ['surveyingUser', 'createdAt'],
        { surveyingOrganization: organization },
        dateRange,
        offset,
        limit,
      );
      totalCount = await countWithRange(
        'Vitals',
        { surveyingOrganization: organization },
        dateRange,
      );
    } else if (cardType === 'recentActivity') {
      const allTimeRange = { start: new Date(0), end: new Date() };
      itemsResult = await fetchItemsPage(
        'SurveyData',
        ['fname', 'lname', 'createdAt'],
        { surveyingUser },
        allTimeRange,
        offset,
        limit,
      );
      totalCount = await countWithRange(
        'SurveyData',
        { surveyingUser },
        allTimeRange,
      );
    }

    // Format items
    const formattedItems = itemsResult.map((record) => {
      if (cardType === 'mySurveys' || cardType === 'orgSurveys' || cardType === 'recentActivity') {
        return {
          objectId: record.id,
          label: `${record.get('fname')} ${record.get('lname')}`,
          createdAt: record.createdAt,
          _parseClass: 'SurveyData',
        };
      }
      // Vitals
      return {
        objectId: record.id,
        label: record.get('surveyingUser') || 'Unknown User',
        createdAt: record.createdAt,
        _parseClass: 'Vitals',
      };
    });

    const hasMore = offset + limit < totalCount;

    return {
      items: formattedItems,
      total: totalCount,
      hasMore,
    };
  } catch (error) {
    console.error('statsService: Error in fetchCardItems:', error); // eslint-disable-line
    throw error;
  }
}

export default {
  buildDateRange,
  countWithRange,
  fetchItemsPage,
  aggregateStats,
  fetchCardItems,
};
