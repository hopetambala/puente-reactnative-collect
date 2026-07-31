/**
 * Change Password settings - Unit Tests
 *
 * AS-12 (RED): neither password field sets `secureTextEntry`, so both the
 * current and the new password render in plain text on screen. The app's own
 * SignIn (SignIn/index.js:261) and SignUp (SignUp/index.js:216,223) both mask
 * their password fields; this is the one screen that does not. On a shared
 * phone in a community setting that is a real exposure.
 */

import Password from '@app/domains/Settings/SettingsHome/AccountSettings/Password';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, TextInput } from 'react-native';

jest.mock('@modules/offline', () => jest.fn().mockResolvedValue(true));

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

jest.mock('@app/domains/Settings/index.styles', () => ({
  createSettingsStyles: () => ({
    text: {},
    lineContainer: {},
    horizontalLinePrimary: {},
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
        save: jest.fn().mockResolvedValue(undefined),
      }),
      current: jest.fn(),
    },
  },
}));

const checkOnlineStatus = require('@modules/offline');
const { Parse } = require('parse/react-native');

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
    ActivityIndicator: () => null,
    useTheme: () => ({ dark: false, colors: { primary: '#000', error: '#f00' } }),
  };
});

describe('Change Password settings', () => {
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
    // Parse.User.logIn is a full network round trip. Offline it rejected into a
    // generic modal that guessed at the cause. Detect first, and say so.
    it('does not attempt a network round trip while offline', async () => {
      checkOnlineStatus.mockResolvedValue(false);
      const { getByTestId } = render(<Password />);

      fireEvent.press(getByTestId('password-submit'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      expect(Parse.User.logIn).not.toHaveBeenCalled();
    });

    it('tells the user they are offline rather than guessing at the cause', async () => {
      checkOnlineStatus.mockResolvedValue(false);
      const { getByTestId } = render(<Password />);

      fireEvent.press(getByTestId('password-submit'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      expect(alertSpy.mock.calls[0][1]).toBe('passwordSettings.offlineMessage');
    });
  });

  describe('AS-13 validation', () => {
    it('rejects a new password shorter than the minimum', async () => {
      const { getByTestId } = render(<Password />);

      fireEvent.changeText(getByTestId('password-current'), 'test');
      fireEvent.changeText(getByTestId('password-new'), 'ab');
      fireEvent.changeText(getByTestId('password-confirm'), 'ab');
      fireEvent.press(getByTestId('password-submit'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      expect(alertSpy.mock.calls[0][1]).toBe('passwordSettings.tooShort');
      expect(Parse.User.logIn).not.toHaveBeenCalled();
    });

    it('rejects when the confirmation does not match', async () => {
      const { getByTestId } = render(<Password />);

      fireEvent.changeText(getByTestId('password-current'), 'test');
      fireEvent.changeText(getByTestId('password-new'), 'longenough1');
      fireEvent.changeText(getByTestId('password-confirm'), 'longenough2');
      fireEvent.press(getByTestId('password-submit'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      expect(alertSpy.mock.calls[0][1]).toBe('passwordSettings.mismatch');
      expect(Parse.User.logIn).not.toHaveBeenCalled();
    });
  });

  it('masks every password field', () => {
    // eslint-disable-next-line camelcase
    const { UNSAFE_getAllByType } = render(<Password />);

    const fields = UNSAFE_getAllByType(TextInput);

    expect(fields.length).toBeGreaterThan(0);
    fields.forEach((field) => {
      expect(field.props.secureTextEntry).toBe(true);
    });
  });
});
