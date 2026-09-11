/**
 * findRecordsLimit — RED-GREEN TDD
 *
 * Bug: Settings → Find Records offers a "Record storage limit" control that
 * writes the key `findRecordsLimit`, and NOTHING in the app ever read it.
 * Verified by exhaustive grep: the only two references were the screen's own
 * read-back and its write. A surveyor could raise the limit to 5000 before a
 * trip into the field, be told "You have updated your storage limit", and get
 * exactly the same cache as before.
 *
 * The real caps were hardcoded in two different places and disagreed:
 * parseSearch used limit(1000), residentQuery used limit: 2000.
 *
 * This module is the single reader both cache paths go through.
 */
import { getData, storeData } from '@modules/async-storage';
import {
  FIND_RECORDS_LIMIT_DEFAULT,
  getFindRecordsLimit,
  setFindRecordsLimit,
} from '@modules/settings';

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn(),
  storeData: jest.fn(),
  deleteData: jest.fn(),
}));

describe('getFindRecordsLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeData.mockResolvedValue(undefined);
  });

  it('defaults to 2000 when nothing was ever stored', async () => {
    getData.mockResolvedValue(null);

    await expect(getFindRecordsLimit()).resolves.toBe(2000);
    expect(FIND_RECORDS_LIMIT_DEFAULT).toBe(2000);
  });

  it('returns the surveyor’s stored limit', async () => {
    getData.mockResolvedValue(5000);

    await expect(getFindRecordsLimit()).resolves.toBe(5000);
  });

  // Historical values predate the screen's Number() coercion, so AsyncStorage
  // can legitimately hold "5000" from an older build.
  it('coerces a numeric string stored by an older build', async () => {
    getData.mockResolvedValue('5000');

    await expect(getFindRecordsLimit()).resolves.toBe(5000);
  });

  // A zero or negative limit would send limit(0) to Parse and return NOTHING,
  // emptying the offline cache of a surveyor who fat-fingered the field.
  it.each([0, -1, Number.NaN, 'abc', '', {}, []])(
    'falls back to the default rather than trusting %p',
    async (stored) => {
      getData.mockResolvedValue(stored);

      await expect(getFindRecordsLimit()).resolves.toBe(2000);
    }
  );

  it('reads the same key the settings screen writes', async () => {
    getData.mockResolvedValue(null);

    await getFindRecordsLimit();

    expect(getData).toHaveBeenCalledWith('findRecordsLimit');
  });
});

describe('setFindRecordsLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeData.mockResolvedValue(undefined);
  });

  it('stores a number under the key the cache paths read', async () => {
    await setFindRecordsLimit(3500);

    expect(storeData).toHaveBeenCalledWith(3500, 'findRecordsLimit');
  });

  it('refuses a value that would empty the cache', async () => {
    await expect(setFindRecordsLimit(0)).rejects.toThrow();
    expect(storeData).not.toHaveBeenCalled();
  });
});
