/**
 * dedupeResidents — the de-duplication every resident query runs on its
 * results before they are shown or cached.
 *
 * It replaced an O(n²) reduce that froze Find Records in 15.7.3: at the
 * 2000-row cap it blocked the JS thread for 4.8 s on a laptop in V8, and far
 * longer on a phone. The cost test counts `get` calls rather than timing, so
 * it fails for the real reason and never for a slow CI machine.
 */
import { dedupeResidents } from '@modules/resident-fields';
import { readFileSync } from 'fs';
import { join } from 'path';

/** A stand-in with the one ParseObject method dedupe uses, counting calls. */
const makeRecord = (attributes, onGet = () => {}) => ({
  attributes,
  get: (field) => {
    onGet();
    return attributes[field];
  },
});

const person = (overrides = {}) => ({
  fname: 'Maria',
  lname: 'Perez',
  sex: 'female',
  marriageStatus: 'single',
  educationLevel: 'primary',
  ...overrides,
});

const idsOf = (records) => records.map((r) => r.attributes.objectId);

describe('dedupeResidents', () => {
  it('drops a row that repeats all five identity fields of an earlier row', () => {
    const records = [
      makeRecord(person({ objectId: 'a' })),
      makeRecord(person({ objectId: 'b' })),
    ];

    expect(idsOf(dedupeResidents(records))).toEqual(['a']);
  });

  it('keeps the FIRST copy, so the query sort decides which survives', () => {
    // Callers sort newest first; the newest copy is the one to show and cache.
    const records = [
      makeRecord(person({ objectId: 'newest' })),
      makeRecord(person({ objectId: 'older' })),
      makeRecord(person({ objectId: 'oldest' })),
    ];

    expect(idsOf(dedupeResidents(records))).toEqual(['newest']);
  });

  it.each(['fname', 'lname', 'sex', 'marriageStatus', 'educationLevel'])(
    'keeps both rows when only %s differs',
    (field) => {
      const records = [
        makeRecord(person({ objectId: 'a' })),
        makeRecord(person({ objectId: 'b', [field]: 'something else' })),
      ];

      expect(idsOf(dedupeResidents(records))).toEqual(['a', 'b']);
    }
  );

  it('ignores fields outside the five, such as a different nickname or city', () => {
    const records = [
      makeRecord(person({ objectId: 'a', nickname: 'Mari', city: 'Constanza' })),
      makeRecord(person({ objectId: 'b', nickname: 'Mary', city: 'Jarabacoa' })),
    ];

    expect(idsOf(dedupeResidents(records))).toEqual(['a']);
  });

  it('treats a missing field and a null field as different, as === did', () => {
    // `select()` sets a field the row lacks to undefined; a stored null is
    // null. JSON.stringify would merge the two.
    const records = [
      makeRecord(person({ objectId: 'a', sex: undefined })),
      makeRecord(person({ objectId: 'b', sex: null })),
    ];

    expect(idsOf(dedupeResidents(records))).toEqual(['a', 'b']);
  });

  it('does not confuse a number with the same digits as a string', () => {
    const records = [
      makeRecord(person({ objectId: 'a', educationLevel: 1 })),
      makeRecord(person({ objectId: 'b', educationLevel: '1' })),
    ];

    expect(idsOf(dedupeResidents(records))).toEqual(['a', 'b']);
  });

  it('keeps residents whose identity fields are all missing distinct from named ones', () => {
    const records = [
      makeRecord({ objectId: 'blank' }),
      makeRecord(person({ objectId: 'named' })),
      makeRecord({ objectId: 'blank-again' }),
    ];

    expect(idsOf(dedupeResidents(records))).toEqual(['blank', 'named']);
  });

  it('returns an empty list for no records', () => {
    expect(dedupeResidents([])).toEqual([]);
  });

  it('reads each row a constant number of times, however many rows there are', () => {
    // The freeze: the old reduce compared every row with every row kept so
    // far. At 2000 unique rows that was ~4 million `get` calls, and each
    // copies the object's attributes. Linear is 5 per row.
    let gets = 0;
    const records = Array.from({ length: 2000 }, (_, i) =>
      makeRecord(person({ objectId: `id${i}`, fname: `Resident${i}` }), () => {
        gets += 1;
      })
    );

    const kept = dedupeResidents(records);

    expect(kept).toHaveLength(2000);
    expect(gets).toBe(2000 * 5);
  });
});

describe('every resident query uses it', () => {
  const ROOT = join(__dirname, '..', '..', '..');

  it.each([
    'impacto-design-system/Extensions/FindResidents/_utils/index.js',
    'impacto-design-system/Extensions/ResidentIdSearchbar/utils/index.js',
    'services/parse/crud/index.js',
  ])('%s de-duplicates with dedupeResidents, not its own pairwise scan', (file) => {
    const src = readFileSync(join(ROOT, file), 'utf8');

    expect(src).toContain('dedupeResidents(records)');
    expect(src).not.toContain('checkIfAlreadyExist');
    expect(src).not.toMatch(/accumulator\.some\(/);
  });
});
