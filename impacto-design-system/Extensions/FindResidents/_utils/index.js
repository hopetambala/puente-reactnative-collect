import { loadOrganizationScopeCached } from "@modules/organization";
import { RESIDENT_PAYLOAD_EXCLUDED_FIELDS } from "@modules/resident-fields";
import { getFindRecordsLimit } from "@modules/settings";
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

/**
 * Every field "Search by name or ID" actually searches.
 *
 * The placeholder promised an ID search that did not exist -- only fname and
 * lname were queried -- so a surveyor who typed a resident's cedula got an
 * empty list and could reasonably conclude the person was not in the system.
 *
 * `cedulaNumber` is the Dominican national identity card; its own label in
 * en.json is "License Number" and in es.json "Numero de cedula". `householdId`
 * is the other identifier field staff read off a paper form -- treat it as a
 * label, not a key: it is not unique by construction.
 *
 * Deliberately NOT `fullTextSearchIndex`: IdentificationForm writes that only
 * at collection time and it holds no ID field at all, so searching it would
 * hide every record collected before it existed.
 */
const SEARCHABLE_FIELDS = [
  "fname",
  "lname",
  "nickname",
  "cedulaNumber",
  "householdId",
];

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

  // EVERY string this organization's records may carry. Records hold what was
  // COLLECTED, and one organization's are spread across several — in
  // production (2026-08-28, app id vBdTHqQU31) Rayjon has 185 SurveyData rows
  // under "Rayjon" and 1196 under "Rayjon Eye Clinic". Scoping this search
  // with equalTo on the account's own string showed that surveyor 13% of their
  // own residents, and a DR Missions account 1.8% — with no error. Because
  // this is the search that answers "does this person already have a record?",
  // the missing 87% came back as a NEW resident.
  //
  // The CACHED resolver: search runs on every debounced keystroke, and hitting
  // the network for a table that changes monthly made every search two
  // round-trips instead of one. It reads the set the populate paths persist,
  // falls back to the network only when nothing is cached, and falls back to
  // [organization] on any failure — it narrows, never blanks.
  const organizationValues = await loadOrganizationScopeCached(surveyingOrganization);

  // The surveyor's own cap (Settings -> Find Records), not a hardcoded one.
  const limit = await getFindRecordsLimit();

  const anchoredQuery = `^${escapeRegex(qry)}`;

  const subQueries = SEARCHABLE_FIELDS.map((field) => {
    const q = new Parse.Query("SurveyData");
    q.matches(field, anchoredQuery, "i");
    return q;
  });

  return new Promise((resolve, reject) => {
    const query = Parse.Query.or(...subQueries);

    // The limit must live on the composite query — Parse ignores subquery
    // limits under Query.or and defaults the composite to 100, which would
    // silently cap the auto-populated offline cache.
    query.limit(limit);

    // 892 -> 662 bytes/row. These results become the offline resident cache,
    // so this is a denylist of proven-unused fields, never an allowlist: a
    // missing field would surface offline as an unlinkable resident.
    query.exclude(...RESIDENT_PAYLOAD_EXCLUDED_FIELDS);

    query.descending("updatedAt");

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

export { fetchResidentById };
export default parseSearch;
