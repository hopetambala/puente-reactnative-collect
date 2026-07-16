/**
 * FindResidents - connectivity re-check RED-GREEN TDD
 *
 * Bug: connectivity is checked once when the screen receives an organization
 * and the resulting `online` flag is trusted for every later search. A
 * surveyor who opens Find Records offline and later regains signal stays in
 * offline mode forever — typing never triggers an online search, and the
 * Refresh button re-runs the offline path unconditionally.
 * Fix: each triggered search re-checks the device's CURRENT connectivity.
 */
/* eslint-disable no-shadow, react/button-has-type */

import FindResidents from '@impacto-design-system/Extensions/FindResidents/index';
import checkOnlineStatus from '@modules/offline';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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

jest.mock('@modules/offline', () => jest.fn());
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
  storeData: jest.fn(() => Promise.resolve()),
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

describe('FindResidents - search uses current connectivity, not the mount-time snapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResidentOfflineData.mockResolvedValue([
      { objectId: 'cached-001', fname: 'Cached', lname: 'Carla' },
    ]);
  });

  test('a search typed after connectivity is restored performs the online search', async () => {
    // Mount offline: initial fetch takes the offline path.
    checkOnlineStatus.mockResolvedValue(false);
    mockParseSearch.mockResolvedValue([
      { objectId: 'resident-online-1', fname: 'Ronaldo', lname: 'Vega' },
    ]);

    render(<FindResidents {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('name-cached-001')).toBeDefined();
    });
    expect(mockParseSearch).not.toHaveBeenCalled();

    // Signal returns before the surveyor types.
    checkOnlineStatus.mockResolvedValue(true);

    fireEvent.changeText(screen.getByTestId('searchbar'), 'Ron');

    // The debounced search must re-check connectivity and go online.
    await waitFor(
      () => {
        expect(mockParseSearch).toHaveBeenCalledWith('test-org', 'Ron');
      },
      { timeout: 3000 }
    );
    await waitFor(() => {
      expect(screen.getByTestId('name-resident-online-1')).toBeDefined();
    });
  });
});
