/**
 * RESIDENT_QUERY_FIELDS — the allowlist every resident query is built from.
 *
 * Measured against staging 2026-09-11 over 300 rows:
 *
 *   everything      892 B/row   1.70 MB at the 2000-row cap
 *   this allowlist  452 B/row   0.86 MB   (-49%)
 *
 * An allowlist is the risky direction here, because these results BECOME the
 * offline resident cache: a field omitted simply does not exist offline, where
 * there is no refetch to repair it, and the resident object is what later
 * records are linked to. So each entry below names the consumer that would
 * break without it — the list is an enumeration, not a guess.
 */
import { RESIDENT_QUERY_FIELDS } from '@modules/resident-fields';

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
