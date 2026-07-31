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
import { render } from '@testing-library/react-native';
import React from 'react';
import { TextInput } from 'react-native';

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
  User: { logIn: jest.fn().mockResolvedValue({ save: jest.fn() }), current: jest.fn() },
  Query: jest.fn().mockImplementation(() => ({
    equalTo: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    find: jest.fn().mockResolvedValue([]),
  })),
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
    ActivityIndicator: () => null,
    useTheme: () => ({ dark: false, colors: { primary: '#000', error: '#f00' } }),
  };
});

describe('Change Password settings', () => {
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
