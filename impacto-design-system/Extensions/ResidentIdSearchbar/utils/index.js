import { loadOrganizationScope } from "@modules/organization";
import { getFindRecordsLimit } from "@modules/settings";
import { Parse } from "parse/react-native";

// Prefix-anchored and case-insensitive — field users type lowercase; the data
// is capitalized. `startsWith` is case-SENSITIVE, which made prefix "t" match
// nothing while "T" matched 58 rows. Note: the "i" modifier prevents MongoDB
// from using the field index, so this scans; acceptable at our collection size.
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Kept identical to FindResidents/_utils -- see the note there. */
const SEARCHABLE_FIELDS = [
  "fname",
  "lname",
  "nickname",
  "cedulaNumber",
  "householdId",
];

/**
 * The resident lookup used DURING collection — the searchbar in
 * domains/DataCollection/Forms and in HouseholdManager. It answers "does this
 * person already have a record?", so anything that makes it return less than
 * the truth causes the surveyor to create the person a second time.
 */
const parseSearch = async (surveyingOrganization, qry) => {
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

  // containedIn, never equalTo (Collect's CLAUDE.md). Records carry the
  // organization string that was COLLECTED and one organization's are spread
  // across several: production 2026-08-28 (app id vBdTHqQU31) has 611
  // SurveyData rows under "DRMT" against 11 under "DR Missions", so an account
  // holding the latter searched 1.8% of its own residents and was told nothing
  // was wrong.
  const organizationValues = await loadOrganizationScope(surveyingOrganization);
  const limit = await getFindRecordsLimit();

  const anchoredQuery = `^${escapeRegex(qry)}`;

  const subQueries = SEARCHABLE_FIELDS.map((field) => {
    const q = new Parse.Query("SurveyData");
    q.matches(field, anchoredQuery, "i");
    return q;
  });

  return new Promise((resolve, reject) => {
    const query = Parse.Query.or(...subQueries);

    // The limit MUST live on the composite query. Verified in the SDK source:
    // ParseQuery._orQuery copies only `q.toJSON().where` from each subquery, so
    // a limit set on fname/lname is discarded, and Parse.Query.or returns a
    // fresh query whose _limit is -1 — no limit param is sent at all. The
    // server then applies its own default (parse-server RestQuery.js:218,
    // `restOptions.limit = restOptions.limit || 100`). This searchbar asked for
    // 3000 on the subqueries and was silently capped at 100.
    query.limit(limit);

    query.descending("createdAt");

    query.containedIn("surveyingOrganization", organizationValues);

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

export default parseSearch;
