/**
 * RESIDENT_PAYLOAD_EXCLUDED_FIELDS — RED-GREEN TDD
 *
 * Resident search transfers every one of SurveyData's 65 fields and the screen
 * uses a dozen. Measured against staging 2026-09-11: 892 bytes/row, of which
 * `searchIndex` is 12.4%, `signature` 12.3% and `location` 11.5% — none of
 * which any resident screen reads. At the 2000-row cap that is 1.70 MB per
 * unfiltered search, on the connection this app exists to work on.
 *
 * WHY A DENYLIST AND NOT `select()`
 * These queries' results BECOME the offline resident cache, and the resident
 * object feeds record linking. An allowlist that omits a field linking needs
 * produces orphaned records — a failure this system has already had to repair
 * by hand. A denylist can only remove fields proven unused, so the worst case
 * is a smaller saving rather than silent data loss. `select()` would save 73%
 * instead of 26%; that belongs in its own change with the edit and offline
 * detail paths verified end to end.
 *
 * EVERY ENTRY BELOW IS PROVEN UNUSED ON THE RESIDENT READ PATH:
 *   searchIndex, fullTextSearchIndex — written by IdentificationForm only;
 *       nothing reads them back (parseSearch deliberately does not search them,
 *       because records predating the field have no value).
 *   signature, photoFile, identificationPhoto — written by the ID and asset
 *       forms; no resident list, detail or edit screen reads them.
 *   location — the GeoPoint. buildEditFormValues seeds the edit form from the
 *       `latitude` / `longitude` / `altitude` SCALARS, not from this, so
 *       dropping it cannot zero anyone's coordinates on save.
 *
 * `picture` is NOT excluded: ResidentPage displays it.
 */
import {
  RESIDENT_PAYLOAD_EXCLUDED_FIELDS,
} from '@modules/resident-fields';

describe('RESIDENT_PAYLOAD_EXCLUDED_FIELDS', () => {
  it('drops the fields that dominate the payload and nothing reads', () => {
    expect(RESIDENT_PAYLOAD_EXCLUDED_FIELDS).toEqual(
      expect.arrayContaining([
        'searchIndex',
        'fullTextSearchIndex',
        'signature',
        'location',
        'identificationPhoto',
        'photoFile',
      ])
    );
  });

  /**
   * The guard that matters. Anything a resident screen reads must never appear
   * here — `picture` is displayed by ResidentPage, the edit form seeds itself
   * from the lat/long/altitude scalars, and objectIdOffline is the second,
   * load-bearing identity records are linked by.
   */
  it.each([
    'objectId',
    'objectIdOffline',
    'householdObjectIdOffline',
    'householdId',
    'picture',
    'latitude',
    'longitude',
    'altitude',
    'fname',
    'lname',
    'nickname',
    'cedulaNumber',
    'sex',
    'dob',
    'marriageStatus',
    'educationLevel',
    'communityname',
    'city',
    'province',
    'region',
    'subcounty',
    'telephoneNumber',
    'surveyingOrganization',
  ])('never excludes %s, which a resident screen or link depends on', (field) => {
    expect(RESIDENT_PAYLOAD_EXCLUDED_FIELDS).not.toContain(field);
  });

  it('is a frozen list, so a caller cannot mutate what every path excludes', () => {
    expect(Object.isFrozen(RESIDENT_PAYLOAD_EXCLUDED_FIELDS)).toBe(true);
  });
});
