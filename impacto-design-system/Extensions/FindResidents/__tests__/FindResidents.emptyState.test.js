/**
 * FindResidents - empty state & offline reassurance RED-GREEN TDD
 *
 * Gaps (ux-review P0/P1):
 * 1. A search with zero matches renders literally nothing below the searchbar
 *    — a blank screen the surveyor reads as "search is broken".
 * 2. Offline, the only signal is a bare button; nothing says "you're offline,
 *    these are your saved records".
 */
/* eslint-disable no-shadow, react/button-has-type */

import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

// ─── Mocks (mirrors FindResidents.failure.test.js harness) ──────────────────

const mockParseSearch = jest.fn();

jest.mock('../_utils', () => ({
  __esModule: true,
  default: (...args) => mockParseSearch(...args),
  fetchResidentById: jest.fn(),
}));

jest.mock('../Resident/ResidentCard', () => {
  const React = require('react'); // eslint-disable-line global-require
  const { Text } = require('react-native'); // eslint-disable-line global-require
  return function MockResidentCard({ resident }) {
    return React.createElement(Text, { testID: resident.objectId }, resident.fname);
  };
});

jest.mock('../Resident/ResidentPage', () => {
  const React = require('react'); // eslint-disable-line global-require
  const { Text } = require('react-native'); // eslint-disable-line global-require
  return function MockResidentPage() {
    return React.createElement(Text, null, 'resident-page');
  };
});

const mockCheckOnlineStatus = jest.fn(() => Promise.resolve(true));
jest.mock('@modules/offline', () => (...args) => mockCheckOnlineStatus(...args));
jest.mock('@modules/i18n', () => ({ t: (key) => key }));
jest.mock('@modules/theme', () => ({
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  typography: {
    heading2: { fontSize: 20, fontWeight: '700' },
    body1: { fontSize: 16 },
    body2: { fontSize: 14 },
  },
  createLayoutStyles: () => ({}),
}));

const mockResidentOfflineData = jest.fn(() => Promise.resolve([]));
jest.mock('@context/offline.context', () => {
  const React = require('react'); // eslint-disable-line global-require
  return {
    OfflineContext: React.createContext({
      residentOfflineData: (...args) => mockResidentOfflineData(...args),
    }),
  };
});
jest.mock('@modules/async-storage', () => ({
  getData: jest.fn(() => Promise.resolve(null)),
  storeData: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-paper', () => {
  const React = require('react'); // eslint-disable-line global-require
  // Real RN Text so getByText can match rendered copy.
  const { Text: RNText, TextInput, TouchableOpacity, View } = require('react-native'); // eslint-disable-line global-require
  return {
    Button: ({ children, onPress }) =>
      React.createElement(TouchableOpacity, { onPress }, React.createElement(RNText, null, children)),
    Text: ({ children, style }) => React.createElement(RNText, { style }, children),
    Searchbar: ({ value, onChangeText, placeholder }) =>
      React.createElement(TextInput, { value, onChangeText, placeholder, testID: 'searchbar' }),
    ActivityIndicator: () => React.createElement(View, { testID: 'loading-indicator' }),
    useTheme: () => ({
      colors: {
        primary: '#007AFF',
        background: '#FFFFFF',
        onSurface: '#000000',
        surface: '#F5F5F5',
        textPrimary: '#000000',
        textSecondary: '#555555',
        textTertiary: '#888888',
        outline: '#CCC',
        surfaceRaised: '#F0F0F0',
        error: '#FF0000',
      },
    }),
  };
});

// eslint-disable-next-line import/first
import FindResidents from '@impacto-design-system/Extensions/FindResidents/index';

const defaultProps = {
  selectPerson: null,
  setSelectPerson: jest.fn(),
  organization: 'test-org',
  puenteForms: [],
  navigateToNewRecord: jest.fn(),
  navigateToRecordHistory: jest.fn(),
  surveyee: {},
  setSurveyee: jest.fn(),
  setView: jest.fn(),
};

describe('FindResidents - empty state and offline reassurance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResidentOfflineData.mockResolvedValue([]);
  });

  test('zero results (online, not loading) shows the empty state instead of a blank screen', async () => {
    mockCheckOnlineStatus.mockResolvedValue(true);
    mockParseSearch.mockResolvedValue([]);

    render(<FindResidents {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('findResident.emptyState.title')).toBeDefined();
    });
    expect(screen.getByText('findResident.emptyState.body')).toBeDefined();
  });

  test('offline mode shows a reassurance notice, and the retry button says Try Again', async () => {
    mockCheckOnlineStatus.mockResolvedValue(false);
    mockResidentOfflineData.mockResolvedValue([
      { objectId: 'cached-1', fname: 'Cached', lname: 'Carla' },
    ]);

    render(<FindResidents {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('cached-1')).toBeDefined();
    });
    expect(screen.getByText('findResident.offlineNotice')).toBeDefined();
    expect(screen.getByText('global.tryAgain')).toBeDefined();
  });
});
