/**
 * FindResidents - online fetch failure fallback RED-GREEN TDD
 *
 * Bug: fetchOnlineData awaits parseSearch with no try/catch. When the online
 * query fails (expired session, flaky network, server error) the rejection is
 * unhandled: the list stays empty and the surveyor sees nothing at all —
 * "Find Records isn't working."
 * Fix: a failed online fetch falls back to the offline resident cache and
 * clears the loading state.
 */
/* eslint-disable no-shadow, react/button-has-type */

import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

// ─── Mocks (mirrors FindResidents.surgical.test.js harness) ─────────────────

const mockParseSearch = jest.fn();

jest.mock('../_utils', () => ({
  __esModule: true,
  default: (...args) => mockParseSearch(...args),
  fetchResidentById: jest.fn(),
}));

jest.mock('../Resident/ResidentCard', () => {
  const React = require('react'); // eslint-disable-line global-require
  const { TouchableOpacity, Text } = require('react-native'); // eslint-disable-line global-require
  return function MockResidentCard({ resident, onSelectPerson }) {
    return React.createElement(
      TouchableOpacity,
      { testID: resident.objectId, onPress: () => onSelectPerson(resident) },
      React.createElement(
        Text,
        { testID: `name-${resident.objectId}` },
        `${resident.fname} ${resident.lname}`
      )
    );
  };
});

jest.mock('../Resident/ResidentPage', () => {
  const React = require('react'); // eslint-disable-line global-require
  const { Text } = require('react-native'); // eslint-disable-line global-require
  return function MockResidentPage({ fname, lname }) {
    return React.createElement(Text, { testID: 'resident-page-name' }, `${fname} ${lname}`);
  };
});

jest.mock('@modules/offline', () => jest.fn(() => Promise.resolve(true)));
jest.mock('@modules/i18n', () => ({ t: (key) => key }));
jest.mock('@modules/theme', () => ({
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  typography: {
    heading2: { fontSize: 20, fontWeight: '700' },
    body1: { fontSize: 16 },
  },
  createLayoutStyles: () => ({}),
}));

const mockResidentOfflineData = jest.fn(() =>
  Promise.resolve([{ objectId: 'cached-001', fname: 'Cached', lname: 'Carla' }])
);
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
}));

jest.mock('react-native-paper', () => {
  const React = require('react'); // eslint-disable-line global-require
  const { TextInput, View } = require('react-native'); // eslint-disable-line global-require
  return {
    Button: ({ children, onPress }) => React.createElement('button', { onPress }, children),
    Text: ({ children }) => React.createElement('text', null, children),
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

describe('FindResidents - online fetch failure falls back to offline cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResidentOfflineData.mockResolvedValue([
      { objectId: 'cached-001', fname: 'Cached', lname: 'Carla' },
    ]);
  });

  test('shows cached residents instead of an empty list when the online search fails', async () => {
    mockParseSearch.mockRejectedValue(new Error('Invalid session token'));

    render(<FindResidents {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('name-cached-001')).toBeDefined();
    });
    expect(mockResidentOfflineData).toHaveBeenCalled();
  });

  test('clears the loading indicator when the online search fails', async () => {
    mockParseSearch.mockRejectedValue(new Error('Network request failed'));

    render(<FindResidents {...defaultProps} />);

    await waitFor(() => {
      expect(mockResidentOfflineData).toHaveBeenCalled();
    });
    expect(screen.queryByTestId('loading-indicator')).toBeNull();
  });

  test('online success path is unchanged: renders fetched residents', async () => {
    mockParseSearch.mockResolvedValue([
      { objectId: 'resident-001', fname: 'Ron', lname: 'Smith' },
    ]);

    render(<FindResidents {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('name-resident-001')).toBeDefined();
    });
    expect(mockResidentOfflineData).not.toHaveBeenCalled();
  });
});
