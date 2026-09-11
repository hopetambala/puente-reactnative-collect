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
  RESIDENT_QUERY_FIELDS,
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

/**
 * RESIDENT_QUERY_FIELDS — the allowlist that replaced the denylist.
 *
 * Measured against staging 2026-09-11 over 300 rows:
 *
 *   full                892 B/row   1.70 MB at the 2000-row cap
 *   excludeKeys denylist 662 B/row  1.26 MB   (-26%)
 *   this allowlist       452 B/row  0.86 MB   (-49%)
 *
 * An allowlist is riskier than a denylist here because these results BECOME the
 * offline resident cache: a field omitted is a field that simply does not exist
 * offline, where there is no refetch to repair it, and the resident object is
 * what later records are linked to. So the list below is not a guess about what
 * the screens need — it is the union of every property read off a
 * resident-shaped object anywhere in the app, enumerated by grep across
 * domains/, impacto-design-system/, context/, modules/ and services/.
 *
 * Parse returns objectId, createdAt and updatedAt whether or not they are
 * requested (verified against staging), so they need no entry.
 */
describe('RESIDENT_QUERY_FIELDS', () => {
  it.each([
    // shown on the search result card
    ['fname', 'the resident list'],
    ['lname', 'the resident list'],
    ['nickname', 'the resident list and offline filtering'],
    ['city', 'the resident card'],
    ['communityname', 'the resident card and the edit form'],
    ['sex', 'the resident card and search de-duplication'],
    ['educationLevel', 'the resident card and search de-duplication'],
    // resident detail
    ['picture', 'the resident photo, which has no refetch offline'],
    ['cedulaNumber', 'the national ID shown on the resident page and searched'],
    ['dob', 'the resident page and the edit form'],
    ['province', 'the resident page and the edit form'],
    // edit form seeding -- a field missing here is written back as empty
    ['marriageStatus', 'the edit form and search de-duplication'],
    ['phone', 'the edit form, which PREFERS it over telephoneNumber'],
    ['telephoneNumber', 'the edit form'],
    ['subcounty', 'the edit form'],
    ['region', 'the edit form'],
    ['latitude', 'the edit form, which would otherwise save 0,0 over real coordinates'],
    ['longitude', 'the edit form, which would otherwise save 0,0 over real coordinates'],
    ['altitude', 'the edit form'],
    // identity and linking -- omitting these is how orphan records are made
    ['objectIdOffline', 'the phone-side identity records are linked by'],
    ['householdId', 'household linking, and it is searchable'],
    ['surveyingOrganization', 'organization scoping'],
  ])('requests %s, needed by %s', (field) => {
    expect(RESIDENT_QUERY_FIELDS).toContain(field);
  });

  it('does not request the heavy fields nothing reads', () => {
    // The denylist's whole point, preserved: these are 36% of the payload.
    ['searchIndex', 'fullTextSearchIndex', 'signature', 'location', 'photoFile', 'identificationPhoto']
      .forEach((field) => expect(RESIDENT_QUERY_FIELDS).not.toContain(field));
  });

  it('does not bother requesting what Parse returns anyway', () => {
    // Verified against staging: objectId/createdAt/updatedAt come back
    // regardless of the keys parameter.
    ['createdAt', 'updatedAt'].forEach((f) => expect(RESIDENT_QUERY_FIELDS).not.toContain(f));
  });

  it('is frozen, so no caller can narrow what every path fetches', () => {
    expect(Object.isFrozen(RESIDENT_QUERY_FIELDS)).toBe(true);
  });
});
