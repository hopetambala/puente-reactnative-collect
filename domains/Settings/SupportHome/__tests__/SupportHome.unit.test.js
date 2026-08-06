/**
 * SupportHome - Unit Tests
 *
 * AS-24 (RED): the account-deletion button passes `color={theme.colors.error}`,
 * but react-native-paper v5 (5.15.1) renamed that prop to `textColor`. The prop
 * is silently ignored, so the single most consequential button in the app --
 * account deletion -- renders with no destructive styling at all.
 *
 * AS-23 (RED): the chevron IconButtons pass `color`, which v5 renamed to
 * `iconColor`. They render grey instead of primary. Visible in
 * .claude/screenshots/08-settings.png.
 *
 * AS-06 (RED): deletion opens an external URL with no confirmation.
 */

import SupportHome from '@app/domains/Settings/SupportHome';
import { UserContext } from '@context/auth.context';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

jest.mock('@app/environment', () => ({ PUENTE_MANAGE_URL: 'https://example.test' }));

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

jest.mock('@modules/theme', () => ({
  spacing: { md: 12, lg: 16, xl: 24 },
  typography: { title3: { fontSize: 18 } },
}));

jest.mock('@app/domains/Settings/index.styles', () => ({
  createSettingsStyles: () => ({
    text: {},
    textContainer: {},
    horizontalLineGray: {},
    horizontalLinePrimary: {},
    svg: {},
  }),
}));

// confirmLogout reaches for connectivity and the offline queue.
jest.mock('@modules/offline', () => jest.fn().mockResolvedValue(true));
jest.mock('@modules/async-storage', () => ({
  getData: jest.fn().mockResolvedValue(null),
  storeData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-linking', () => ({ openURL: jest.fn().mockResolvedValue(undefined) }));
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  requestReview: jest.fn(),
}));

jest.mock('@app/domains/Settings/SupportHome/SupportSettings', () => () => null);

jest.mock('react-native-paper', () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require('react');
  // eslint-disable-next-line global-require
  const RN = require('react-native');
  return {
    // Forward the v5 prop names so tests can assert they are actually used.
    Button: ({ children, onPress, testID, mode, textColor }) =>
      ReactLocal.createElement(RN.Text, { onPress, testID, mode, textColor }, children),
    Text: ({ children }) => ReactLocal.createElement(RN.Text, null, children),
    IconButton: ({ onPress, testID, iconColor }) =>
      ReactLocal.createElement(RN.Text, { onPress, testID, iconColor }, ''),
    useTheme: () => ({
      dark: false,
      colors: { primary: '#0a46b6', error: '#d92d20', onSurface: '#161616' },
    }),
  };
});

const Linking = require('expo-linking');

const mockUser = { user: { id: 'u1', objectId: 'u1', organization: 'org' } };

const baseProps = {
  logOut: jest.fn(),
  settingsView: 'Support',
  setSettingsView: jest.fn(),
  onClose: jest.fn(),
};

const renderScreen = () =>
  render(
    <UserContext.Provider value={mockUser}>
      <SupportHome {...baseProps} />
    </UserContext.Provider>
  );

describe('SupportHome', () => {
  let alertSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  describe('AS-19 / AS-20 support rows', () => {
    it('exposes each row as a labelled button covering the whole row', () => {
      const { getByTestId } = renderScreen();

      const row = getByTestId('support-row-feedback');

      expect(row.props.accessibilityRole).toBe('button');
      expect(row.props.accessibilityLabel).toBe('supportHome.feedback');
    });

    it('opens the sub-view when the row itself is pressed', () => {
      const { getByTestId, queryByText } = renderScreen();

      fireEvent.press(getByTestId('support-row-feedback'));

      expect(queryByText('supportHome.feedback')).toBeNull();
    });
  });

  describe('AS-24 account deletion styling', () => {
    it('gives the delete-user button destructive colouring via the v5 textColor prop', () => {
      const { getByTestId } = renderScreen();

      expect(getByTestId('settings-delete-user-button').props.textColor).toBe('#d92d20');
    });
  });

  describe('AS-01b Log out from the Support tab', () => {
    // The Support view has its own Log out button. AS-01 fixed the one in
    // SettingsHome; this one still called the logOut prop directly, so the
    // offline-stranding path was still reachable from one tap away.
    it('asks for confirmation before logging out', async () => {
      const { getByTestId } = renderScreen();

      fireEvent.press(getByTestId('support-logout-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      expect(baseProps.logOut).not.toHaveBeenCalled();
    });
  });

  describe('AS-06 account deletion confirmation', () => {
    it('confirms before opening the account-management URL', async () => {
      const { getByTestId } = renderScreen();

      fireEvent.press(getByTestId('settings-delete-user-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('opens the URL only once the destructive option is confirmed', async () => {
      const { getByTestId } = renderScreen();

      fireEvent.press(getByTestId('settings-delete-user-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      const buttons = alertSpy.mock.calls[0][2];
      const destructive = buttons.find((b) => b.style === 'destructive');
      expect(destructive).toBeDefined();

      await destructive.onPress();

      expect(Linking.openURL).toHaveBeenCalled();
    });
  });
});
