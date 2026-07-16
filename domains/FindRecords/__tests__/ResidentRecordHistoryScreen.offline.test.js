/**
 * ResidentRecordHistoryScreen - offline honesty RED-GREEN TDD
 *
 * Bug: offline, every per-type Parse query fails silently, so the screen
 * claims "%{name} has no form submissions yet." — a lie that makes surveyors
 * think their data is gone.
 * Fix: when the device is offline the screen says so instead.
 */
/* eslint-disable global-require */

import ResidentRecordHistoryScreen from '@app/domains/FindRecords/ResidentRecordHistoryScreen';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

const mockFind = jest.fn(() => Promise.reject(new Error('Network request failed')));
const mockQuery = {
  equalTo: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  descending: jest.fn().mockReturnThis(),
  find: mockFind,
};

jest.mock('@app/services/parse/client', () => {
  function MockParseObject(className) {
    this.className = className;
    this.id = null;
  }
  MockParseObject.extend = jest.fn(() => function MockModel() {});
  MockParseObject.fromJSON = jest.fn(() => ({}));

  return jest.fn(() => ({
    Object: MockParseObject,
    Query: jest.fn(() => mockQuery),
  }));
});

const mockFetchResidentById = jest.fn(() => Promise.resolve(null));
jest.mock('@impacto-design-system/Extensions/FindResidents/_utils', () => ({
  __esModule: true,
  fetchResidentById: (...args) => mockFetchResidentById(...args),
}));

jest.mock('@modules/i18n', () => ({
  t: (key) => key,
}));

const mockCheckOnlineStatus = jest.fn(() => Promise.resolve(false));
jest.mock('@modules/offline', () => (...args) => mockCheckOnlineStatus(...args));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
}));

describe('ResidentRecordHistoryScreen - offline state is reported honestly', () => {
  const mockResident = {
    objectId: 'resident-123',
    fname: 'John',
    lname: 'Doe',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockRejectedValue(new Error('Network request failed'));
    mockFetchResidentById.mockResolvedValue(null);
    mockCheckOnlineStatus.mockResolvedValue(false);
  });

  test('offline with failing queries shows an offline notice, not "no submissions yet"', async () => {
    const mockNavigation = { goBack: jest.fn() };
    const mockRoute = { params: { resident: mockResident } };

    render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loadingIndicator')).toBeNull();
    });

    expect(screen.getByText('residentHistory.offlineNotice')).toBeDefined();
    expect(screen.queryByText('residentHistory.noSubmissionsYet')).toBeNull();
  });

  test('offline skips the doomed Parse queries entirely instead of waiting on their timeouts', async () => {
    const mockNavigation = { goBack: jest.fn() };
    const mockRoute = { params: { resident: mockResident } };

    render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loadingIndicator')).toBeNull();
    });

    // The identification record still shows (it comes from route params)…
    expect(screen.getByText('residentHistory.identification')).toBeDefined();
    // …but no network query was ever fired.
    expect(mockFind).not.toHaveBeenCalled();
  });

  test('online with genuinely no records still shows "no submissions yet"', async () => {
    mockCheckOnlineStatus.mockResolvedValue(true);
    mockFind.mockResolvedValue([]);

    const mockNavigation = { goBack: jest.fn() };
    const mockRoute = { params: { resident: mockResident } };

    render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(screen.queryByTestId('loadingIndicator')).toBeNull();
    });

    expect(screen.getByText('residentHistory.noSubmissionsYet')).toBeDefined();
    expect(screen.queryByText('residentHistory.offlineNotice')).toBeNull();
  });
});
