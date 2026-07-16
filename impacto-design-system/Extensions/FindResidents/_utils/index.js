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

// Prefix-anchored and case-insensitive — field users type lowercase; the
// data is capitalized. Note: the "i" modifier prevents MongoDB from using
// the field index, so this scans; acceptable at our collection size.
// Follow-up: a lowercased shadow field (fname_lc) would restore index use.
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  const anchoredQuery = `^${escapeRegex(qry)}`;

  const fname = new Parse.Query("SurveyData");
  fname.matches("fname", anchoredQuery, "i");

  const lname = new Parse.Query("SurveyData");
  lname.matches("lname", anchoredQuery, "i");

  return new Promise((resolve, reject) => {
    const query = Parse.Query.or(fname, lname);

    // The limit must live on the composite query — Parse ignores subquery
    // limits under Query.or and defaults the composite to 100, which would
    // silently cap the auto-populated offline cache.
    query.limit(1000);

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
