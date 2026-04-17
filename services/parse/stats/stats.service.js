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
    if (!surveyingUser || !timeFilter) {
      throw new Error('Missing required parameters: surveyingUser, timeFilter');
    }
    // organization is optional - some card types (recentActivity) don't use it

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
      myEnvHealthCurrent,
      myEnvHealthPrev,
      orgEnvHealthCurrent,
      orgEnvHealthPrev,
      myMedEvalCurrent,
      myMedEvalPrev,
      orgMedEvalCurrent,
      orgMedEvalPrev,
      myCustomFormsCurrent,
      myCustomFormsPrev,
      orgCustomFormsCurrent,
      orgCustomFormsPrev,
      recentActivityCurrent,
      recentActivityVitalsCurrent,
      recentActivityEnvHealthCurrent,
      recentActivityMedEvalCurrent,
      recentActivityCustomFormsCurrent,
      orgSurveysVitalsCurrent,
      orgSurveysEnvHealthCurrent,
      orgSurveysMedEvalCurrent,
      orgSurveysCustomFormsCurrent,
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
      // Org Surveys (current period) - SurveyData only
      countWithRange(
        'SurveyData',
        { surveyingOrganization: organization },
        dateRange,
      ),
      // Org Surveys (previous period) - SurveyData only
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
      // My Environmental Health (current period)
      countWithRange(
        'HistoryEnvironmentalHealth',
        { surveyingUser, surveyingOrganization: organization },
        dateRange,
      ),
      // My Environmental Health (previous period)
      countWithRange(
        'HistoryEnvironmentalHealth',
        { surveyingUser, surveyingOrganization: organization },
        prevDateRange,
      ),
      // Org Environmental Health (current period)
      countWithRange(
        'HistoryEnvironmentalHealth',
        { surveyingOrganization: organization },
        dateRange,
      ),
      // Org Environmental Health (previous period)
      countWithRange(
        'HistoryEnvironmentalHealth',
        { surveyingOrganization: organization },
        prevDateRange,
      ),
      // My Medical Evaluation (current period)
      countWithRange(
        'EvaluationMedical',
        { surveyingUser, surveyingOrganization: organization },
        dateRange,
      ),
      // My Medical Evaluation (previous period)
      countWithRange(
        'EvaluationMedical',
        { surveyingUser, surveyingOrganization: organization },
        prevDateRange,
      ),
      // Org Medical Evaluation (current period)
      countWithRange(
        'EvaluationMedical',
        { surveyingOrganization: organization },
        dateRange,
      ),
      // Org Medical Evaluation (previous period)
      countWithRange(
        'EvaluationMedical',
        { surveyingOrganization: organization },
        prevDateRange,
      ),
      // My Custom Forms (current period)
      countWithRange(
        'FormResults',
        { surveyingUser, surveyingOrganization: organization },
        dateRange,
      ),
      // My Custom Forms (previous period)
      countWithRange(
        'FormResults',
        { surveyingUser, surveyingOrganization: organization },
        prevDateRange,
      ),
      // Org Custom Forms (current period)
      countWithRange(
        'FormResults',
        { surveyingOrganization: organization },
        dateRange,
      ),
      // Org Custom Forms (previous period)
      countWithRange(
        'FormResults',
        { surveyingOrganization: organization },
        prevDateRange,
      ),
      // Recent Activity (all time, current user)
      countWithRange(
        'SurveyData',
        { surveyingUser },
        { start: new Date(0), end: new Date() },
      ),
      // Recent Activity - Vitals (all time, current user)
      countWithRange(
        'Vitals',
        { surveyingUser },
        { start: new Date(0), end: new Date() },
      ),
      // Recent Activity - Environmental Health (all time, current user)
      countWithRange(
        'HistoryEnvironmentalHealth',
        { surveyingUser },
        { start: new Date(0), end: new Date() },
      ),
      // Recent Activity - Medical Evaluation (all time, current user)
      countWithRange(
        'EvaluationMedical',
        { surveyingUser },
        { start: new Date(0), end: new Date() },
      ),
      // Recent Activity - Custom Forms (all time, current user)
      countWithRange(
        'FormResults',
        { surveyingUser },
        { start: new Date(0), end: new Date() },
      ),
      // Org Surveys - Vitals (current period)
      countWithRange(
        'Vitals',
        { surveyingOrganization: organization },
        dateRange,
      ),
      // Org Surveys - Environmental Health (current period)
      countWithRange(
        'HistoryEnvironmentalHealth',
        { surveyingOrganization: organization },
        dateRange,
      ),
      // Org Surveys - Medical Evaluation (current period)
      countWithRange(
        'EvaluationMedical',
        { surveyingOrganization: organization },
        dateRange,
      ),
      // Org Surveys - Custom Forms (current period)
      countWithRange(
        'FormResults',
        { surveyingOrganization: organization },
        dateRange,
      ),
    ]);

    const result = {
      mySurveys: {
        count: mySurveysCurrent + myVitalsCurrent + myEnvHealthCurrent + myMedEvalCurrent + myCustomFormsCurrent,
        previous: mySurveysPrev + myVitalsPrev + myEnvHealthPrev + myMedEvalPrev + myCustomFormsPrev,
      },
      orgSurveys: {
        count: orgSurveysCurrent + orgSurveysVitalsCurrent + orgSurveysEnvHealthCurrent + orgSurveysMedEvalCurrent + orgSurveysCustomFormsCurrent,
        previous: orgSurveysPrev + orgVitalsPrev + orgEnvHealthPrev + orgMedEvalPrev + orgCustomFormsPrev,
      },
      myVitals: { count: myVitalsCurrent, previous: myVitalsPrev },
      orgVitals: { count: orgVitalsCurrent, previous: orgVitalsPrev },
      myEnvironmentalHealth: { count: myEnvHealthCurrent, previous: myEnvHealthPrev },
      orgEnvironmentalHealth: { count: orgEnvHealthCurrent, previous: orgEnvHealthPrev },
      myMedicalEvaluation: { count: myMedEvalCurrent, previous: myMedEvalPrev },
      orgMedicalEvaluation: { count: orgMedEvalCurrent, previous: orgMedEvalPrev },
      myCustomForms: { count: myCustomFormsCurrent, previous: myCustomFormsPrev },
      orgCustomForms: { count: orgCustomFormsCurrent, previous: orgCustomFormsPrev },
      recentActivity: {
        count: recentActivityCurrent + recentActivityVitalsCurrent + recentActivityEnvHealthCurrent + recentActivityMedEvalCurrent + recentActivityCustomFormsCurrent,
      },
    };

    if (TEST_MODE) {
      console.log('statsService: aggregateStats result', result); // eslint-disable-line
    }
    return result;
  } catch (error) {
    console.error('statsService: Error in aggregateStats:', error); // eslint-disable-line
    throw error;
  }
}

/**
 * Fetch items from multiple Parse classes, combine, sort, and paginate
 * Used for cardTypes that should show all form types (e.g., recentActivity, orgSurveys)
 * @param {array} classes - Array of { className, fields, equalToParams }
 * @param {object} dateRange - { start, end }
 * @param {number} offset - pagination offset
 * @param {number} limit - pagination limit
 * @returns {Promise<object>} { items, total }
 */
async function fetchMultiClassItems(classes, dateRange, offset, limit) {
  try {
    // Fetch all items from all classes in parallel (with a large limit)
    const allItemsByClass = await Promise.all(
      classes.map(({ className, fields, equalToParams }) =>
        fetchItemsPage(className, fields, equalToParams, dateRange, 0, 10000),
      ),
    );

    // Flatten and combine all items with their class info
    const combinedItems = [];
    allItemsByClass.forEach((items, classIndex) => {
      const { className } = classes[classIndex];
      items.forEach((item) => {
        combinedItems.push({
          record: item,
          className,
          createdAt: item.createdAt,
        });
      });
    });

    // Sort by createdAt descending
    combinedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Get total count
    const totalCount = combinedItems.length;

    // Apply pagination
    const paginatedItems = combinedItems.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: totalCount,
    };
  } catch (error) {
    console.error('statsService: Error in fetchMultiClassItems:', error); // eslint-disable-line
    throw error;
  }
}

/**
 * Fetch detail items for a card
 * @param {string} cardType - 'mySurveys', 'orgSurveys', 'myVitals', 'orgVitals', 'recentActivity'
 * @param {string} surveyingUser - Current user name/username string
 * @param {string} organization - Organization ID or name (optional, required only for org-scoped card types)
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
    if (!cardType || !surveyingUser || !timeFilter || offset === undefined || !limit) {
      throw new Error('Missing required parameters');
    }
    // organization is required only for org-scoped card types
    const organizationRequiredCardTypes = ['mySurveys', 'orgSurveys', 'myVitals', 'orgVitals'];
    if (organizationRequiredCardTypes.includes(cardType) && !organization) {
      throw new Error(`Missing required parameters: organization required for ${cardType}`);
    }

    const dateRange = buildDateRange(timeFilter);

    let formattedItems;
    let totalCount;

    if (cardType === 'mySurveys') {
      // Fetch from all form types for current user within the org
      const multiClassResult = await fetchMultiClassItems(
        [
          { className: 'SurveyData', fields: ['fname', 'lname', 'createdAt'], equalToParams: { surveyingUser, surveyingOrganization: organization } },
          { className: 'Vitals', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingUser, surveyingOrganization: organization } },
          { className: 'HistoryEnvironmentalHealth', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingUser, surveyingOrganization: organization } },
          { className: 'EvaluationMedical', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingUser, surveyingOrganization: organization } },
          { className: 'FormResults', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingUser, surveyingOrganization: organization } },
        ],
        dateRange,
        offset,
        limit,
      );
      totalCount = multiClassResult.total;
      formattedItems = multiClassResult.items.map(({ record, className }) => {
        if (className === 'SurveyData') {
          return {
            objectId: record.id,
            label: `${record.get('fname')} ${record.get('lname')}`,
            createdAt: record.createdAt,
            _parseClass: className,
          };
        }
        return {
          objectId: record.id,
          label: record.get('surveyingUser') || 'Unknown User',
          createdAt: record.createdAt,
          _parseClass: className,
        };
      });
    } else if (cardType === 'orgSurveys') {
      // Fetch from all form types for organization
      const allTimeRange = dateRange;
      const multiClassResult = await fetchMultiClassItems(
        [
          { className: 'SurveyData', fields: ['fname', 'lname', 'createdAt'], equalToParams: { surveyingOrganization: organization } },
          { className: 'Vitals', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingOrganization: organization } },
          { className: 'HistoryEnvironmentalHealth', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingOrganization: organization } },
          { className: 'EvaluationMedical', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingOrganization: organization } },
          { className: 'FormResults', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingOrganization: organization } },
        ],
        allTimeRange,
        offset,
        limit,
      );
      totalCount = multiClassResult.total;
      formattedItems = multiClassResult.items.map(({ record, className }) => {
        if (className === 'SurveyData') {
          return {
            objectId: record.id,
            label: `${record.get('fname')} ${record.get('lname')}`,
            createdAt: record.createdAt,
            _parseClass: className,
          };
        }
        // Supplementary forms
        return {
          objectId: record.id,
          label: record.get('surveyingUser') || 'Unknown User',
          createdAt: record.createdAt,
          _parseClass: className,
        };
      });
    } else if (cardType === 'myVitals') {
      const itemsResult = await fetchItemsPage(
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
      formattedItems = itemsResult.map((record) => ({
        objectId: record.id,
        label: record.get('surveyingUser') || 'Unknown User',
        createdAt: record.createdAt,
        _parseClass: 'Vitals',
      }));
    } else if (cardType === 'orgVitals') {
      const itemsResult = await fetchItemsPage(
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
      formattedItems = itemsResult.map((record) => ({
        objectId: record.id,
        label: record.get('surveyingUser') || 'Unknown User',
        createdAt: record.createdAt,
        _parseClass: 'Vitals',
      }));
    } else if (cardType === 'recentActivity') {
      // Fetch from all form types for current user (all time)
      const allTimeRange = { start: new Date(0), end: new Date() };
      const multiClassResult = await fetchMultiClassItems(
        [
          { className: 'SurveyData', fields: ['fname', 'lname', 'createdAt'], equalToParams: { surveyingUser } },
          { className: 'Vitals', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingUser } },
          { className: 'HistoryEnvironmentalHealth', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingUser } },
          { className: 'EvaluationMedical', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingUser } },
          { className: 'FormResults', fields: ['surveyingUser', 'createdAt'], equalToParams: { surveyingUser } },
        ],
        allTimeRange,
        offset,
        limit,
      );
      totalCount = multiClassResult.total;
      formattedItems = multiClassResult.items.map(({ record, className }) => {
        if (className === 'SurveyData') {
          return {
            objectId: record.id,
            label: `${record.get('fname')} ${record.get('lname')}`,
            createdAt: record.createdAt,
            _parseClass: className,
          };
        }
        // Supplementary forms
        return {
          objectId: record.id,
          label: record.get('surveyingUser') || 'Unknown User',
          createdAt: record.createdAt,
          _parseClass: className,
        };
      });
    }

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
  fetchMultiClassItems,
  aggregateStats,
  fetchCardItems,
};
