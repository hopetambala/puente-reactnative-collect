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
import { fireEvent, render, waitFor } from '@testing-library/react-native';
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
