/**
 * The resident EDIT form must be able to seed itself from a cached resident.
 *
 * WHY THIS TEST EXISTS, AND WHY IT SCANS SOURCE
 *
 * `RESIDENT_QUERY_FIELDS` narrowed resident queries from a denylist to an
 * allowlist (892 -> 452 bytes/row). The dangerous consequence is not a blank
 * screen — it is a SILENT WRITE-BACK. ResidentRecordHistoryScreen seeds the
 * identification editor with the resident object it already has, which is a
 * SEARCH RESULT, and `fetchResidentById` (which does fetch every field) is only
 * used to refresh the displayed name. So a field the query omits arrives
 * `undefined`, `buildEditFormValues` turns it into "", and saving writes that
 * empty string over real data. Nothing errors. Nothing looks wrong.
 *
 * Nothing else catches this:
 *   - no E2E flow opens the edit form (checked: no .maestro flow taps Edit)
 *   - the component's own tests pass a complete fixture, so they cannot notice
 *     a field the QUERY failed to fetch
 *   - and the first version of the allowlist, written from a careful grep,
 *     really did omit `phone` — which `buildEditFormValues` prefers over
 *     `telephoneNumber`. Every resident whose number is stored in `phone`
 *     would have had it blanked by one edit-and-save.
 *
 * So the required set is derived from the form's own source rather than
 * restated here. A field added to the editor without being added to the query
 * fails this test on the line that names it.
 */
const fs = require('fs');
const path = require('path');

const { RESIDENT_QUERY_FIELDS } = require('@modules/resident-fields');

const FORM = path.join(
  __dirname, '..', '..', '..',
  'domains/DataCollection/Forms/IdentificationForm/index.js',
);

/** Every `record.<field>` inside buildEditFormValues, read off the source. */
function fieldsSeededByTheEditor() {
  const src = fs.readFileSync(FORM, 'utf8');
  const start = src.indexOf('const buildEditFormValues');
  expect(start).toBeGreaterThan(-1); // the function was renamed; update this test
  const body = src.slice(start, src.indexOf('const editFormValues', start));
  return [...new Set([...body.matchAll(/record\.([a-zA-Z][a-zA-Z0-9_]*)/g)].map((m) => m[1]))];
}

describe('the resident edit form can seed itself from a cached resident', () => {
  it('finds fields to check, so a rename cannot make this test vacuous', () => {
    expect(fieldsSeededByTheEditor().length).toBeGreaterThanOrEqual(15);
  });

  it.each(fieldsSeededByTheEditor())(
    'requests %s, which the editor reads and would otherwise save back empty',
    (field) => {
      // objectId is returned by Parse whether requested or not.
      if (field === 'objectId') return;
      expect(RESIDENT_QUERY_FIELDS).toContain(field);
    },
  );
});
