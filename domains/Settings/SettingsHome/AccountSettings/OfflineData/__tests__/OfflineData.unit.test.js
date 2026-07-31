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

jest.mock('@modules/theme', () => ({
  createLayoutStyles: () => ({ formContainer: {} }),
}));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]),
  deleteData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@modules/cached-resources', () => ({
  cacheResidentDataMulti: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  '@app/domains/Settings/SettingsHome/AccountSettings/OfflineData/config/config',
  () => []
);

jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: { primary: '#000', error: '#f00', info: '#00f', success: '#0f0', errorContainer: '#fee' },
  }),
}));

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
