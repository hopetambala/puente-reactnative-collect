import { Parse } from "parse/react-native";

/**
 * Fetch a single resident by objectId from Parse.
 * Returns serialized plain JSON (same shape as parseSearch results), or null on error/offline resident.
 * @param {string} objectId
 * @returns {Promise<object|null>}
 */
const fetchResidentById = async (objectId) => {
  if (!objectId || objectId.startsWith("PatientID-")) return null;
  try {
    const query = new Parse.Query("SurveyData");
    const record = await query.get(objectId);
    return JSON.parse(JSON.stringify(record));
  } catch (e) {
    return null;
  }
};

const parseSearch = (surveyingOrganization, qry) => {
  function checkIfAlreadyExist(accumulator, currentVal) {
    return accumulator.some(
      (item) =>
        item.get("fname") === currentVal.get("fname") &&
        item.get("lname") === currentVal.get("lname") &&
        item.get("sex") === currentVal.get("sex") &&
        item.get("marriageStatus") === currentVal.get("marriageStatus") &&
        item.get("educationLevel") === currentVal.get("educationLevel")
    );
  }

  const fname = new Parse.Query("SurveyData");
  fname.limit(1000);
  fname.startsWith("fname", qry);

  const lname = new Parse.Query("SurveyData");
  lname.limit(1000);
  lname.startsWith("lname", qry);

  return new Promise((resolve, reject) => {
    const query = Parse.Query.or(fname, lname);

    query.descending("updatedAt");

    query.equalTo("surveyingOrganization", surveyingOrganization);

    query.find().then(
      (records) => {
        const deDuplicatedRecords = records.reduce((accumulator, current) => {
          if (checkIfAlreadyExist(accumulator, current)) {
            return accumulator;
          }
          return [...accumulator, current];
        }, []);
        resolve(JSON.parse(JSON.stringify(deDuplicatedRecords)));
      },
      (error) => {
        reject(error);
      }
    );
  });
};

export { fetchResidentById };
export default parseSearch;
