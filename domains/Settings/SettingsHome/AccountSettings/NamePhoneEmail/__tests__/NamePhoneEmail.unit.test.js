/**
 * Name/Phone/Email settings - Unit Tests
 *
 * AS-09 (RED): updateUser calls Parse.User.logIn -- a full network round trip --
 * before saving, and the screen never reads connectivity. Offline that rejects
 * into a generic modal that guesses at the cause instead of naming it.
 */

import NamePhoneEmail from '@app/domains/Settings/SettingsHome/AccountSettings/NamePhoneEmail';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

jest.mock('@modules/offline', () => jest.fn().mockResolvedValue(true));

jest.mock('@app/domains/Settings/index.styles', () => ({
  createSettingsStyles: () => ({
    text: {},
    textContainer: {},
    buttonContainer: {},
    svg: {},
    lineContainer: {},
    horizontalLinePrimary: {},
    horizontalLineGray: {},
  }),
}));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn().mockResolvedValue({ username: 'Test', password: 'test' }),
  storeData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('parse/react-native', () => ({
  Parse: {
    User: {
      logIn: jest.fn().mockResolvedValue({
        set: jest.fn(),
        save: jest.fn().mockResolvedValue({}),
      }),
      current: jest.fn(),
    },
  },
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
    ActivityIndicator: () => null,
    useTheme: () => ({ dark: false, colors: { primary: '#0a46b6', error: '#d92d20' } }),
  };
});

const checkOnlineStatus = require('@modules/offline');
const { Parse } = require('parse/react-native');

describe('Name/Phone/Email settings', () => {
  let alertSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    checkOnlineStatus.mockResolvedValue(true);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  describe('AS-09 offline honesty', () => {
    it('does not attempt a network round trip while offline', async () => {
      checkOnlineStatus.mockResolvedValue(false);
      const { getByTestId } = render(<NamePhoneEmail objectId="u1" />);

      fireEvent.press(getByTestId('profile-submit'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      expect(Parse.User.logIn).not.toHaveBeenCalled();
    });

    it('tells the user they are offline rather than guessing at the cause', async () => {
      checkOnlineStatus.mockResolvedValue(false);
      const { getByTestId } = render(<NamePhoneEmail objectId="u1" />);

      fireEvent.press(getByTestId('profile-submit'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      expect(alertSpy.mock.calls[0][1]).toBe('namePhoneEmailSettings.offlineMessage');
    });
  });
});
