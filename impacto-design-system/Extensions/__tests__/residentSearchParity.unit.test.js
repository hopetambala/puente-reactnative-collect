/**
 * The two resident searches must not drift apart again.
 *
 * Collect has two resident lookups, and they are near-copies:
 *
 *   FindResidents/_utils        — the Find Records tab
 *   ResidentIdSearchbar/utils   — the searchbar used DURING collection
 *
 * Being copies is how they diverged. Before 2026-09-10 the Find Records one
 * had case-insensitive anchored matching, a limit on the composite OR query,
 * and (briefly) nothing else did: the collection-path one still used
 * case-sensitive `startsWith`, put its limit on subqueries where Parse
 * discards it, and scoped with `equalTo` on a single organization string.
 *
 * Both feed the same decision — "does this person already have a record?" —
 * so a field one searches and the other does not means the same query returns
 * different people depending on which screen you are standing in, and the
 * screen that returns less is the one that causes a duplicate person.
 *
 * This asserts they agree on the things that made them drift. It is not a
 * substitute for extracting a shared module; it is the cheap guard that makes
 * the divergence fail loudly if anyone edits one and forgets the other.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const SOURCES = {
  'FindResidents/_utils': read('FindResidents/_utils/index.js'),
  'ResidentIdSearchbar/utils': read('ResidentIdSearchbar/utils/index.js'),
};

/** The field list each file declares, parsed out of its SEARCHABLE_FIELDS. */
const declaredFields = (src) => {
  const block = src.match(/const SEARCHABLE_FIELDS = \[([\s\S]*?)\];/);
  if (!block) return null;
  return block[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)
    .sort();
};

describe('the two resident searches agree', () => {
  it('search the same set of fields', () => {
    const [a, b] = Object.values(SOURCES).map(declaredFields);

    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a).toEqual(b);
  });

  it('include the identifier fields the placeholder promises', () => {
    // "Search by name or ID" — cedulaNumber is the national identity card,
    // householdId the label staff read off a paper form.
    Object.entries(SOURCES).forEach(([name, src]) => {
      const fields = declaredFields(src) || [];
      expect(fields).toEqual(
        expect.arrayContaining(['cedulaNumber', 'fname', 'householdId', 'lname', 'nickname'])
      );
      expect(name).toBeTruthy();
    });
  });

  it.each(Object.entries(SOURCES))(
    '%s scopes with containedIn over the alias set, never equalTo one string',
    (name, src) => {
      expect(src).toContain('containedIn("surveyingOrganization"');
      expect(src).toContain('loadOrganizationScope');
      expect(src).not.toMatch(/equalTo\(\s*"surveyingOrganization"/);
    }
  );

  it.each(Object.entries(SOURCES))(
    '%s matches case-insensitively rather than with startsWith',
    (name, src) => {
      // startsWith is case-SENSITIVE: prefix "t" matched 0 testORG records
      // while "T" matched 58. Field users type lowercase.
      //
      // Scoped to startsWith used as a PARSE CONSTRAINT on a searchable field.
      // A bare `.startsWith(` check would also flag
      // `objectId.startsWith("PatientID-")`, which is plain JS on a string.
      (declaredFields(src) || []).forEach((field) => {
        expect(src).not.toContain(`startsWith("${field}"`);
      });
      expect(src).toContain('"i"');
    }
  );

  it.each(Object.entries(SOURCES))(
    '%s takes its cap from the surveyor’s setting, not a hardcoded number',
    (name, src) => {
      expect(src).toContain('getFindRecordsLimit');
      // Parse discards subquery limits under Query.or, so the cap has to be
      // applied to the composite query.
      expect(src).toContain('query.limit(limit)');
    }
  );
});
