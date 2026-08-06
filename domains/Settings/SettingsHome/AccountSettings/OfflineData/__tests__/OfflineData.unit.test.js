/**
 * Offline Data settings - Unit Tests
 *
 * AS-04 (RED): "Clear Cached ID Forms" calls deleteData("residentData")
 * directly from onPress. It fires instantly, is not awaited, and gives no
 * feedback. Rebuilding the cache requires populateResidentDataCache(), a
 * network call -- so a mis-tap in the field leaves offline resident search
 * empty for the rest of the day.
 */

import OfflineData from '@app/domains/Settings/SettingsHome/AccountSettings/OfflineData';
import { OfflineContext } from '@context/offline.context';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

// The global Base mock drops `mode`; forward it so emphasis is assertable.
jest.mock('@impacto-design-system/Base', () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require('react');
  // eslint-disable-next-line global-require
  const RN = require('react-native');
  return {
    // RN.Text (a host component) preserves the custom `mode` prop in the test
    // tree; TouchableOpacity drops props it does not recognise.
    Button: ({ onPress, buttonText, testID, mode }) =>
      ReactLocal.createElement(RN.Text, { onPress, testID, mode }, buttonText),
    PopupSuccess: () => null,
  };
});

jest.mock('@modules/theme', () => ({
  createLayoutStyles: () => ({ formContainer: {} }),
}));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]),
  deleteData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-paper', () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require('react');
  // eslint-disable-next-line global-require
  const RN = require('react-native');
  return {
    Text: ({ children }) => ReactLocal.createElement(RN.Text, null, children),
    useTheme: () => ({
      colors: {
        primary: '#0a46b6',
        error: '#f00',
        info: '#00f',
        success: '#0f0',
        errorContainer: '#fee',
        onSurface: '#161616',
        onSurfaceVariant: '#6e6e6e',
        outline: '#d4d4d4',
      },
    }),
  };
});

const { deleteData } = require('@modules/async-storage');

const offlineContextValue = {
  populateResidentDataCache: jest.fn().mockResolvedValue([]),
  isLoading: false,
};

const renderScreen = () =>
  render(
    <OfflineContext.Provider value={offlineContextValue}>
      <OfflineData
        surveyingOrganization="org"
        scrollViewScroll={false}
        setScrollViewScroll={jest.fn()}
      />
    </OfflineContext.Provider>
  );

describe('Offline Data settings', () => {
  let alertSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  /**
   * AS-39: the community-filtered query overwrote the whole offline resident
   * cache with only the matching subset -- the exact failure the auto-populate
   * path guards against (impacto-design-system/Extensions/FindResidents/index.js:100,
   * "Filtered results never overwrite the cache").
   *
   * Worse, cacheResidentDataMulti's write guard is
   * `records !== null && records !== undefined && records !== ""`, and an empty
   * array passes all three -- so a filter matching nothing wrote [] over the
   * cache. OfflineData then did `if (forms)`, truthy for [], and showed the
   * success popup. A promotor could empty their own offline search from Settings
   * and be told it worked.
   *
   * The cache has populated itself since the Find Records overhaul, so this
   * control had no remaining job worth that risk. Removed, not repaired.
   */
  describe('AS-39 community-filtered query is gone', () => {
    it('no longer renders the query form', () => {
      const { queryByText } = renderScreen();

      expect(queryByText('global.emptyForm')).toBeNull();
      expect(queryByText('global.submit')).toBeNull();
    });

    it('no longer ships the cache-overwriting helper at all', () => {
      // Stronger than "we stopped calling it": the function is gone, so it
      // cannot be wired back up by accident. jest.requireActual bypasses this
      // file's mock to inspect the real module.
      // eslint-disable-next-line global-require
      const actual = jest.requireActual('@modules/cached-resources');

      expect(actual.cacheResidentDataMulti).toBeUndefined();
    });

    it('still offers the two actions that remain', () => {
      const { getByText } = renderScreen();

      expect(getByText('accountSettings.populateIdForms')).toBeTruthy();
      expect(getByText('accountSettings.clearCachedIdForms')).toBeTruthy();
    });
  });

  describe('AS-41 the screen is not bare', () => {
    /**
     * Removing the query form took the only heading with it -- the Formik
     * config carried a `fieldType: "header"` entry. Every sibling screen under
     * AccountSettings renders its own title, so this one looked broken.
     *
     * The layout collapse that made it render EMPTY is not visible to Jest:
     * `layout.formContainer` is `flex: 1` inside a parent with no height, which
     * yields zero height on device but a perfectly normal tree in the test
     * renderer. That one is caught by looking at the screen, not by this test.
     */
    it('renders a heading so the screen identifies itself', () => {
      const { getByText } = renderScreen();

      expect(getByText('accountSettings.offlineData')).toBeTruthy();
    });

    it('explains what the actions are for', () => {
      const { getByText } = renderScreen();

      expect(getByText('accountSettings.offlineDataExplainer')).toBeTruthy();
    });

    // Third time this pattern has bitten: a destructive action rendered as the
    // loudest thing on screen (see AS-02 for Log out, and Back promoted to a
    // full-width slab). Download is the primary action here; Clear is not.
    it('does not render the destructive action as the loudest control', () => {
      const { getByTestId } = renderScreen();

      expect(getByTestId('offline-clear-button').props.mode).toBe('outlined');
      expect(getByTestId('offline-download-button').props.mode).toBe('contained');
    });
  });

  describe('Clear Cached ID Forms', () => {
    it('asks for confirmation instead of wiping the cache immediately', async () => {
      const { getByText } = renderScreen();

      fireEvent.press(getByText('accountSettings.clearCachedIdForms'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      expect(deleteData).not.toHaveBeenCalled();
    });

    it('wipes the cache only after the destructive option is confirmed', async () => {
      const { getByText } = renderScreen();

      fireEvent.press(getByText('accountSettings.clearCachedIdForms'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });

      // Third argument is the button array; find the destructive one and invoke it.
      const buttons = alertSpy.mock.calls[0][2];
      const destructive = buttons.find((b) => b.style === 'destructive');
      expect(destructive).toBeDefined();

      await destructive.onPress();

      expect(deleteData).toHaveBeenCalledWith('residentData');
    });
  });
});
