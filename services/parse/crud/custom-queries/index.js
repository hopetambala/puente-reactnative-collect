import { Parse } from "parse/react-native";

/**
 * Performs a query based on the parameter defined in a column
 *
 * @example
 * customQueryService(0,1000,SurveyData,organization,Puente)
 *
 * @param {number} offset First number
 * @param {number} limit Max limit of results
 * @param {string} parseModel Name of Backend Model
 * @param {string} parseColumn Name of Column in Backend Model
 * @param {string} parseParam Name of Parameter in Column
 * @returns Results of Query
 */
function customQueryService(
  offset,
  limit,
  parseModel,
  parseColumn,
  parseParam
) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const Model = Parse.Object.extend(parseModel);

      const query = new Parse.Query(Model);

      query.skip(offset);

      query.limit(limit || 5000);

      query.descending("createdAt");

      // An array means "any of these". Used for organization scoping: records
      // and form definitions carry the string that was COLLECTED or tagged, and
      // one organization's are spread across several. Measured in production
      // 2026-08-29, 17 Puente accounts saw 3 of 33 custom forms and every
      // Rayjon account saw half of 12 — a surveyor cannot fill in a form they
      // cannot see. Every scalar filter stays an exact match.
      if (Array.isArray(parseParam)) {
        query.containedIn(parseColumn, parseParam);
      } else {
        query.equalTo(parseColumn, parseParam);
      }

      query.find().then(
        (records) => {
          resolve(records);
        },
        (error) => {
          reject(error);
        }
      );
    }, 1500);
  });
}

/**
 * Performs a query based on the parameter defined in a column
 *
 * @example
 * customMultiParamQueryService(0,1000,SurveyData,organization,Puente)
 *
 * @param {number} offset First number
 * @param {number} limit Max limit of results
 * @param {string} parseModel Name of Backend Model
 * @param {object} parseParams object of key-value pairs of params
 * @returns Results of Query
 */
function customMultiParamQueryService(parseModel, parseParams, limit = 5000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const Model = Parse.Object.extend(parseModel);

      const query = new Parse.Query(Model);

      query.limit(limit);

      query.descending("createdAt");

      // for (const property in parseParams) {
      //   query.equalTo(property, parseParams[property]);
      // }

      // An array means "any of these". Used for organization scoping: records
      // and form definitions carry the string that was COLLECTED or tagged, and
      // one organization's are spread across several. Measured in production
      // 2026-08-29, 17 Puente accounts saw 3 of 33 custom forms and every
      // Rayjon account saw half of 12 — a surveyor cannot fill in a form they
      // cannot see. Every scalar filter stays an exact match.
      Object.entries(parseParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query.containedIn(key, value);
        } else {
          query.equalTo(key, value);
        }
      });

      query.find().then(
        (records) => {
          resolve(records);
        },
        (error) => {
          reject(error);
        }
      );
    }, 1500);
  });
}

/**
 * Performs a query based on the parameter defined in a column
 *
 * @example
 * customMultiParamQueryService(0,1000,SurveyData,organization,Puente)
 *
 * @param {number} offset First number
 * @param {number} limit Max limit of results
 * @param {string} parseModel Name of Backend Model
 * @param {object} parseParams object of key-value pairs of params
 * @returns Results of Query
 */
function customMultiValueArrayService(
  parseModel,
  parseColumn,
  parseParamsArray,
  limit = 5000
) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const Model = Parse.Object.extend(parseModel);

      const query = new Parse.Query(Model);

      query.limit(limit);

      query.descending("createdAt");

      // Finds scores from any of Jonathan, Dario, or Shawn
      query.containedIn(parseColumn, parseParamsArray);

      query.find().then(
        (records) => {
          resolve(records);
        },
        (error) => {
          reject(error);
        }
      );
    }, 1500);
  });
}

export {
  customMultiParamQueryService,
  customMultiValueArrayService,
  customQueryService,
};
