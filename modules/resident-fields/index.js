/**
 * Fields stripped from every resident query.
 *
 * SurveyData has 65 fields and the resident screens read about a dozen, but
 * Parse transfers all of them unless told otherwise. Measured against staging
 * 2026-09-11 over 300 rows: 892 bytes/row, so 1.70 MB for one unfiltered
 * search at the 2000-row cap — on the connection this app exists to work on.
 * `searchIndex` alone is 12.4% of that, `signature` 12.3%, `location` 11.5%.
 * Excluding these brings it to 662 bytes/row, a 26% reduction.
 *
 * WHY A DENYLIST RATHER THAN `select()`
 * These queries' results BECOME the offline resident cache, and the resident
 * object is what later records are linked to. An allowlist that forgets a
 * field linking needs produces orphaned records — a failure mode this system
 * has already had to repair by hand — and it fails silently, offline, where
 * there is no refetch to repair it. A denylist can only remove fields proven
 * unused, so the worst case is a smaller saving instead of lost data.
 *
 * `select()` would reach 238 bytes/row (73%). That is worth doing, and it
 * needs its own change with the edit form and the offline detail view verified
 * end to end — not a line added next to a release build.
 *
 * BEFORE ADDING A FIELD HERE, prove nothing reads it off a resident. The list
 * below is proven:
 *
 *   searchIndex, fullTextSearchIndex  written by IdentificationForm and never
 *       read back. parseSearch deliberately does not search them either, since
 *       records collected before the field existed have no value.
 *   signature, photoFile,
 *   identificationPhoto               written by the ID and asset forms; no
 *       resident list, detail or edit screen reads them.
 *   location                          the GeoPoint. buildEditFormValues seeds
 *       the edit form from the `latitude` / `longitude` / `altitude` SCALARS,
 *       not from this — so dropping it cannot zero a resident's coordinates
 *       when their record is edited and saved.
 *
 * `picture` is deliberately NOT here: ResidentPage displays it.
 */
export const RESIDENT_PAYLOAD_EXCLUDED_FIELDS = Object.freeze([
  "searchIndex",
  "fullTextSearchIndex",
  "signature",
  "photoFile",
  "identificationPhoto",
  "location",
]);

/**
 * The fields a resident query asks for. An ALLOWLIST, replacing the denylist
 * above — which is kept only as the record of what was proven unused.
 *
 * Measured against staging 2026-09-11 over 300 rows:
 *
 *   full                 892 B/row   1.70 MB at the 2000-row cap
 *   excludeKeys denylist 662 B/row   1.26 MB   (-26%)
 *   this allowlist       452 B/row   0.86 MB   (-49%)
 *
 * WHY THIS IS THE RISKY DIRECTION, AND WHAT MAKES IT SAFE
 * These results BECOME the offline resident cache. A field left out is a field
 * that does not exist offline, where there is no refetch to repair it, and the
 * resident object is what later records are linked to — that is how orphaned
 * records get made, and this system has repaired those by hand before.
 *
 * So this list is not a judgement about what the screens "probably" need. It is
 * the union of every property read off a resident-shaped object anywhere in the
 * app, enumerated by grep across domains/, impacto-design-system/, context/,
 * modules/ and services/. Each entry names its consumer in the tests.
 *
 * BEFORE REMOVING A FIELD, prove nothing reads it — including the edit form,
 * which seeds itself from the cached record and writes back what it was seeded
 * with. A field missing there is saved as empty over real data.
 *
 * objectId, createdAt and updatedAt are returned by Parse whether requested or
 * not (verified against staging), so they are deliberately absent.
 */
export const RESIDENT_QUERY_FIELDS = Object.freeze([
  // identity and linking
  "objectIdOffline",
  "householdId",
  "surveyingOrganization",
  // shown in the result list
  "fname",
  "lname",
  "nickname",
  "sex",
  "educationLevel",
  "city",
  "communityname",
  // resident detail
  "picture",
  "cedulaNumber",
  "dob",
  "province",
  // seeds the edit form; omitting any of these saves empty over real data
  "marriageStatus",
  // BOTH phone fields. buildEditFormValues reads `record.phone ||
  // record.telephoneNumber`, so omitting `phone` blanks the number of every
  // resident whose is stored there -- on save, silently. `phone` was missing
  // from the first version of this list; editFormSeedFields.unit.test.js now
  // derives the required set from the editor's own source so it cannot happen
  // again.
  "phone",
  "telephoneNumber",
  "subcounty",
  "region",
  "latitude",
  "longitude",
  "altitude",
]);

export default RESIDENT_PAYLOAD_EXCLUDED_FIELDS;
