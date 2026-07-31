/**
 * SettingsHome - Unit Tests
 *
 * AS-05 (RED): Reset Onboarding clears data and navigates away with no confirmation.
 *
 * AS-01 (RED): Log out calls logOut directly with no confirmation. Because
 * context/auth.context.js:75-82 disables offline login outright, a promotor who
 * taps this while offline cannot log back in until they find a connection --
 * their queued records survive on disk but are unreachable and cannot sync.
 *
 * AS-02 (RED): the most destructive control on the screen carries the highest
 * visual emphasis (mode="contained") and sits in the thumb path of the tab bar,
 * while the harmless Back button is de-emphasised. The emphasis is inverted.
 */

import SettingsHome from '@app/domains/Settings/SettingsHome';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

jest.mock('@modules/settings', () => ({
  clearOnboardingData: jest.fn().mockResolvedValue(undefined),
}));

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

jest.mock('@modules/theme/useAccessibilityContext', () => ({
  useAccessibilityContext: () => ({ calmMode: false, setCalmMode: jest.fn() }),
}));

jest.mock('@modules/utils/animations', () => ({
  MOTION_TOKENS: { duration: { base: 200, instant: 0 }, STAGGER_DELAY: 50 },
  useMotion: jest.fn(() => ({
    shouldAnimate: true,
    duration: 200,
    spring: null,
    resolveSpring: () => null,
  })),
}));

jest.mock('@app/domains/Settings/SettingsHome/AccountSettings', () => () => null);
jest.mock('@app/domains/Settings/DevOfflineToggle', () => () => null);

jest.mock('@modules/offline', () => jest.fn().mockResolvedValue(true));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn().mockResolvedValue(null),
  storeData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-paper', () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require('react');
  // eslint-disable-next-line global-require
  const RN = require('react-native');
  return {
    // `mode` is forwarded onto the host element so tests can assert emphasis.
    Button: ({ children, onPress, testID, mode }) =>
      ReactLocal.createElement(RN.Text, { onPress, testID, mode }, children),
    Text: ({ children }) => ReactLocal.createElement(RN.Text, null, children),
    IconButton: ({ onPress, testID }) =>
      ReactLocal.createElement(RN.Text, { onPress, testID }, ''),
    SegmentedButtons: () => null,
    Switch: ({ onValueChange, testID }) =>
      ReactLocal.createElement(RN.Text, { onValueChange, testID }, ''),
    useTheme: () => ({
      dark: false,
      colors: { primary: '#000', onSurface: '#000', error: '#f00', background: '#fff' },
    }),
  };
});

const checkOnlineStatus = require('@modules/offline');
const { clearOnboardingData } = require('@modules/settings');
const { getData } = require('@modules/async-storage');
const { useMotion } = require('@modules/utils/animations');

const baseProps = {
  logOut: jest.fn(),
  settingsView: 'Settings',
  setSettingsView: jest.fn(),
  onClose: jest.fn(),
  navigation: { navigate: jest.fn() },
  surveyingOrganization: 'org',
  scrollViewScroll: false,
  setScrollViewScroll: jest.fn(),
};

describe('SettingsHome', () => {
  let alertSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    checkOnlineStatus.mockResolvedValue(true);
    getData.mockResolvedValue(null);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  describe('AS-05 Reset Onboarding', () => {
    it('asks for confirmation before clearing onboarding data', async () => {
      const { getByText } = render(<SettingsHome {...baseProps} />);

      fireEvent.press(getByText('accountSettings.resetOnboarding'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      expect(clearOnboardingData).not.toHaveBeenCalled();
    });
  });

  describe('AS-01 Log out', () => {
    it('asks for confirmation before logging out', async () => {
      const { getByText } = render(<SettingsHome {...baseProps} />);

      fireEvent.press(getByText('accountSettings.logout'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      expect(baseProps.logOut).not.toHaveBeenCalled();
    });

    it('warns that logging back in is impossible when offline', async () => {
      checkOnlineStatus.mockResolvedValue(false);
      const { getByText } = render(<SettingsHome {...baseProps} />);

      fireEvent.press(getByText('accountSettings.logout'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      const message = alertSpy.mock.calls[0][1];
      expect(message).toContain('accountSettings.logoutOfflineWarning');
    });

    it('names the unsynced record count when the queue is not empty', async () => {
      getData.mockImplementation((key) =>
        key === 'offlineIDForms' ? Promise.resolve([{ a: 1 }, { a: 2 }]) : Promise.resolve(null)
      );
      const { getByText } = render(<SettingsHome {...baseProps} />);

      fireEvent.press(getByText('accountSettings.logout'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      const message = alertSpy.mock.calls[0][1];
      expect(message).toContain('accountSettings.logoutUnsyncedWarning');
    });

    it('logs out only after the confirmation is accepted', async () => {
      const { getByText } = render(<SettingsHome {...baseProps} />);

      fireEvent.press(getByText('accountSettings.logout'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      const buttons = alertSpy.mock.calls[0][2];
      const confirm = buttons.find((b) => b.style === 'destructive');
      expect(confirm).toBeDefined();

      confirm.onPress();

      expect(baseProps.logOut).toHaveBeenCalled();
    });
  });

  describe('AS-28 Calm Mode', () => {
    // useMotion is the single control point for reduce-motion and Calm Mode
    // (modules/utils/animations.js:589). RowEntrance ran unconditionally, so the
    // one screen that hosts the Calm Mode toggle was the one screen ignoring it.
    it('consults useMotion so Calm Mode is honoured on this screen', () => {
      render(<SettingsHome {...baseProps} />);

      expect(useMotion).toHaveBeenCalled();
    });

    it('still renders every row when motion is suppressed', () => {
      useMotion.mockReturnValueOnce({
        shouldAnimate: false,
        duration: 0,
        spring: null,
        resolveSpring: () => null,
      });

      const { getByText } = render(<SettingsHome {...baseProps} />);

      expect(getByText('accountSettings.changePassword')).toBeTruthy();
      expect(getByText('accountSettings.logout')).toBeTruthy();
    });
  });

  describe('AS-02 button emphasis', () => {
    it('does not give Log out the highest-emphasis treatment', () => {
      const { getByTestId } = render(<SettingsHome {...baseProps} />);

      expect(getByTestId('settings-logout-button').props.mode).toBe('outlined');
    });

    it('gives Back the contained treatment instead', () => {
      const { getByTestId } = render(<SettingsHome {...baseProps} />);

      expect(getByTestId('settings-close-button').props.mode).toBe('contained');
    });
  });
});
