/**
 * The fields every resident query asks for.
 *
 * SurveyData has 65 fields and the resident screens read about two dozen, but
 * Parse transfers all of them unless told otherwise. Measured against staging
 * 2026-09-11 over 300 rows:
 *
 *   everything            892 B/row   1.70 MB at the 2000-row cap
 *   this allowlist        452 B/row   0.86 MB   (-49%)
 *
 * — on the connection this app exists to work on. The bulk of what is dropped
 * is three fields: `searchIndex` is 12.4% of the payload, `signature` 12.3%,
 * `location` 11.5%.
 *
 * WHY AN ALLOWLIST IS THE DANGEROUS DIRECTION, AND WHAT MAKES IT SAFE
 * These results BECOME the offline resident cache. A field left out does not
 * exist offline, where there is no refetch to repair it, and the resident
 * object is what later records are linked to — that is how orphaned records
 * get made, and this system has repaired those by hand before.
 *
 * So this list is not a judgement about what the screens "probably" need. It is
 * the union of every property read off a resident-shaped object anywhere in the
 * app, enumerated across domains/, impacto-design-system/, context/, modules/
 * and services/. Each entry names its consumer in residentFields.unit.test.js,
 * and editFormSeedFields.unit.test.js derives the edit form's requirements from
 * that form's own source rather than restating them.
 *
 * BEFORE REMOVING A FIELD, prove nothing reads it — including the edit form,
 * which seeds itself from the cached record and writes back what it was seeded
 * with. A field missing there is saved as EMPTY over real data, silently. That
 * is not hypothetical: `phone` was missing from the first version of this list.
 *
 * WHAT IS DELIBERATELY ABSENT
 *
 *   objectId, createdAt, updatedAt    returned by Parse whether requested or
 *       not (verified against staging), so an entry would be noise.
 *   searchIndex, fullTextSearchIndex  written by IdentificationForm and never
 *       read back. parseSearch deliberately does not search them either, since
 *       records collected before the field existed have no value.
 *   signature, photoFile,
 *   identificationPhoto               written by the ID and asset forms; no
 *       resident list, detail or edit screen reads them.
 *   location                          the GeoPoint. buildEditFormValues seeds
 *       the edit form from the `latitude` / `longitude` / `altitude` SCALARS,
 *       not from this — so its absence cannot zero a resident's coordinates
 *       when their record is edited and saved.
 *
 * `picture` IS requested: ResidentPage displays it, and offline there is no
 * second chance to fetch it.
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
