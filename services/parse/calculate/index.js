import { Parse } from 'parse/react-native';

/**
  * Performs a query based on the parameter defined in a column
  *
  * @example
  * countService(SurveyData,surveyingUser,Jeff)
  *
  * @param {string} parseModel Name of Backend Model
  * @param {string} parseColumn Name of Column in Backend Model
  * @param {string} parseParam Name of Parameter in Column
  * @returns Count of Query
  */
function countService(parseModel, parseColumn, parseParam) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const Model = Parse.Object.extend(parseModel);

      const query = new Parse.Query(Model);

      query.equalTo(parseColumn, parseParam);

      query.count().then((count) => {
        resolve(count);
      }, (error) => {
        reject(error);
      });
    }, 1500);
  });
}

export default countService;
