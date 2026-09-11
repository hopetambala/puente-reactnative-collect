/**
 * FindRecords settings - Unit Tests
 *
 * AS-08 (RED): `getData` returns null for a missing AsyncStorage key, so
 * `residentData.length` throws inside setUserInformation(). The .then() that
 * populates `inputs` never runs, and the screen renders a title and a Submit
 * button over empty space. This happens on every fresh install, and every time
 * "Clear Cached ID Forms" is used.
 */

import FindRecords from '@app/domains/Settings/SettingsHome/AccountSettings/FindRecords';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

jest.mock('@app/domains/Settings/index.styles', () => ({
  createSettingsStyles: () => ({
    text: {},
    textContainer: {},
    buttonContainer: {},
    svg: {},
    horizontalLinePrimary: {},
    horizontalLineGray: {},
    container: {},
    title: {},
  }),
}));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn(),
  storeData: jest.fn().mockResolvedValue(undefined),
}));

const mockGetFindRecordsLimit = jest.fn().mockResolvedValue(2000);
const mockSetFindRecordsLimit = jest.fn().mockResolvedValue(undefined);
jest.mock('@modules/settings', () => ({
  FIND_RECORDS_LIMIT_DEFAULT: 2000,
  getFindRecordsLimit: (...args) => mockGetFindRecordsLimit(...args),
  setFindRecordsLimit: (...args) => mockSetFindRecordsLimit(...args),
}));

jest.mock('react-native-paper', () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require('react');
  // eslint-disable-next-line global-require
  const RN = require('react-native');
  return {
    Button: ({ children, onPress, testID }) =>
      ReactLocal.createElement(RN.Text, { onPress, testID }, children),
    Text: ({ children }) => ReactLocal.createElement(RN.Text, null, children),
    TextInput: (props) => ReactLocal.createElement(RN.TextInput, props),
    IconButton: ({ onPress, testID }) =>
      ReactLocal.createElement(RN.Text, { onPress, testID }, ''),
    useTheme: () => ({ dark: false, colors: { primary: '#000', error: '#f00' } }),
  };
});

const { getData } = require('@modules/async-storage');

describe('FindRecords settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when the resident cache has never been populated', () => {
    it('still renders the stored-records row instead of a blank screen', async () => {
      // getData returns null for any key that was never written -- the real
      // behavior of modules/async-storage/index.js:9-12.
      getData.mockResolvedValue(null);

      const { getByText } = render(<FindRecords />);

      await waitFor(() => {
        expect(getByText('findRecordSettings.currentReccordsStored')).toBeTruthy();
      });
    });

    it('reports a count of zero rather than crashing', async () => {
      getData.mockResolvedValue(null);

      const { getByText } = render(<FindRecords />);

      await waitFor(() => {
        expect(getByText('0')).toBeTruthy();
      });
    });
  });

  describe('AS-15 / AS-16 / AS-18 record-limit editing', () => {
    beforeEach(() => {
      getData.mockResolvedValue(null);
    });

    it('shows the stored limit in the field being edited', async () => {
      const { getByText, getByTestId } = render(<FindRecords />);

      await waitFor(() => {
        expect(getByText('2000')).toBeTruthy();
      });

      fireEvent.press(getByTestId('edit-currentLimit'));

      expect(getByTestId('input-currentLimit').props.value).toBe('2000');
    });

    it('uses a numeric keyboard for a numeric setting', async () => {
      const { getByText, getByTestId } = render(<FindRecords />);

      await waitFor(() => {
        expect(getByText('2000')).toBeTruthy();
      });

      fireEvent.press(getByTestId('edit-currentLimit'));

      expect(getByTestId('input-currentLimit').props.keyboardType).toBe('number-pad');
    });

    it('discards the edit when cancelled', async () => {
      const { getByText, getByTestId, queryByText } = render(<FindRecords />);

      await waitFor(() => {
        expect(getByText('2000')).toBeTruthy();
      });

      fireEvent.press(getByTestId('edit-currentLimit'));
      fireEvent.changeText(getByTestId('input-currentLimit'), '500');
      fireEvent.press(getByTestId('cancel-currentLimit'));

      expect(getByText('2000')).toBeTruthy();
      expect(queryByText('500')).toBeNull();
    });

    it('keeps the edit as a number when confirmed', async () => {
      const { getByText, getByTestId } = render(<FindRecords />);

      await waitFor(() => {
        expect(getByText('2000')).toBeTruthy();
      });

      fireEvent.press(getByTestId('edit-currentLimit'));
      fireEvent.changeText(getByTestId('input-currentLimit'), '500');
      fireEvent.press(getByTestId('confirm-currentLimit'));

      expect(getByText('500')).toBeTruthy();
    });
  });
});

/**
 * The control wrote `findRecordsLimit` and nothing read it, so raising it did
 * nothing and the screen still said "You have updated your storage limit".
 * The value now flows through @modules/settings, which every cache and search
 * path reads — and which refuses a value that would empty the cache.
 */
describe('FindRecords settings - the limit is a real setting', () => {
  let alertSpy;

  // The screen confirms success from inside a 1000ms setTimeout. With real
  // timers that callback fires AFTER this suite tears down, and it reaches for
  // Alert in a dead environment -- which surfaces as a failure in whichever
  // unrelated suite happens to run next. Fake timers keep it inside the test.
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    const { getData: gd } = require('@modules/async-storage'); // eslint-disable-line global-require
    gd.mockResolvedValue(null);
    mockGetFindRecordsLimit.mockResolvedValue(2000);
    mockSetFindRecordsLimit.mockResolvedValue(undefined);
    // eslint-disable-next-line global-require
    alertSpy = jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    // Drain anything the screen scheduled while the environment is still alive.
    act(() => { jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
    alertSpy.mockRestore();
  });

  const mount = async () => {
    const utils = render(<FindRecords />);
    await act(async () => {}); // flush the mount effect that reads the setting
    return utils;
  };

  const setLimitTo = async (utils, value) => {
    await act(async () => { fireEvent.press(utils.getByTestId('edit-currentLimit')); });
    await act(async () => { fireEvent.changeText(utils.getByTestId('input-currentLimit'), value); });
    await act(async () => { fireEvent.press(utils.getByTestId('confirm-currentLimit')); });
    await act(async () => { fireEvent.press(utils.getByText('global.submit')); });
  };

  it('reads the current limit through the shared setting, not a local default', async () => {
    mockGetFindRecordsLimit.mockResolvedValue(5000);

    const utils = await mount();

    expect(mockGetFindRecordsLimit).toHaveBeenCalled();
    expect(utils.getByText('5000')).toBeTruthy();
  });

  it('persists through the shared setter so the cache paths see the change', async () => {
    const utils = await mount();

    await setLimitTo(utils, '5000');

    expect(mockSetFindRecordsLimit).toHaveBeenCalledWith(5000);
  });

  // A zero limit sends limit(0) to Parse, which returns nothing -- it would
  // empty the offline register of whoever mistyped it. The setter rejects, and
  // the screen must report that rather than claiming success.
  it('reports failure when the limit is refused, instead of claiming success', async () => {
    mockSetFindRecordsLimit.mockRejectedValue(new Error('refused'));

    const utils = await mount();
    await setLimitTo(utils, '0');

    const titles = alertSpy.mock.calls.map(([title]) => title);
    expect(titles).toContain('global.error');
    expect(titles).not.toContain('global.success');
  });
});
