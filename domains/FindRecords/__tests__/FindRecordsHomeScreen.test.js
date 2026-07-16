/**
 * FindRecordsHomeScreen - organization fallback RED-GREEN TDD
 *
 * Bug: the screen reads organization only from AsyncStorage's "currentUser".
 * Stored sessions from older app versions may lack that field, and
 * FindResidents refuses to fetch when organization is empty — the screen is
 * silently dead: empty list, no spinner, no error, online and offline.
 * Fix: fall back to the auth-context user's organization.
 */

import FindRecordsHomeScreen from '@app/domains/FindRecords/FindRecordsHomeScreen';
import { UserContext } from '@context/auth.context';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

const mockFindResidents = jest.fn(() => null);

jest.mock('@impacto-design-system/Extensions', () => ({
  FindResidents: (props) => mockFindResidents(props),
}));
jest.mock('@impacto-design-system/Extensions/FindResidents/_utils', () => ({
  fetchResidentById: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('@app/domains/HomeScreen/components/CoachmarkOverlay', () => ({
  CoachmarkOverlay: () => null,
}));
jest.mock('@app/domains/DataCollection/formsConfig', () => ({ puenteForms: [] }));
jest.mock('@modules/i18n', () => ({ t: (key) => key }));
jest.mock('@modules/offline', () => jest.fn(() => Promise.resolve(false)));
jest.mock('@modules/theme', () => ({
  createLayoutStyles: () => ({ screenContainer: {} }),
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb) => {
    const ReactLib = require('react'); // eslint-disable-line global-require
    ReactLib.useEffect(cb, [cb]);
  },
}));

const mockGetData = jest.fn();
jest.mock('@modules/async-storage', () => ({
  getData: (...args) => mockGetData(...args),
}));

const renderScreen = (contextUser) =>
  render(
    <UserContext.Provider value={{ user: contextUser }}>
      <FindRecordsHomeScreen navigation={{ navigate: jest.fn() }} />
    </UserContext.Provider>
  );

describe('FindRecordsHomeScreen - organization resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('passes the stored currentUser organization to FindResidents', async () => {
    mockGetData.mockResolvedValue({ organization: 'storedORG' });

    renderScreen({ organization: 'ctxORG' });

    await waitFor(() => {
      expect(mockFindResidents).toHaveBeenLastCalledWith(
        expect.objectContaining({ organization: 'storedORG' })
      );
    });
  });

  test('falls back to the auth-context organization when the stored session lacks one', async () => {
    // Stored sessions written by older app versions have no organization field.
    mockGetData.mockResolvedValue({ username: 'Test' });

    renderScreen({ organization: 'ctxORG' });

    await waitFor(() => {
      expect(mockFindResidents).toHaveBeenLastCalledWith(
        expect.objectContaining({ organization: 'ctxORG' })
      );
    });
  });
});
