/**
 * FindResidents - offline cache auto-population RED-GREEN TDD
 *
 * Bug: the offline resident cache ("residentData") is only ever written when
 * the user manually runs Settings → Offline Data. Surveyors who never did
 * that get an EMPTY list the moment they lose signal — the top complaint
 * behind "Find Records doesn't work offline."
 * Fix: a successful online full-list fetch (empty query) persists its results
 * to the cache automatically. Filtered search results must NOT overwrite the
 * cache — that would shrink it to the last query's subset.
 */
/* eslint-disable no-shadow, react/button-has-type */

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

const mockResidentOfflineData = jest.fn(() => Promise.resolve([]));
jest.mock('@context/offline.context', () => {
  const React = require('react'); // eslint-disable-line global-require
  return {
    OfflineContext: React.createContext({
      residentOfflineData: (...args) => mockResidentOfflineData(...args),
    }),
  };
});

const mockStoreData = jest.fn(() => Promise.resolve());
jest.mock('@modules/async-storage', () => ({
  getData: jest.fn(() => Promise.resolve(null)),
  storeData: (...args) => mockStoreData(...args),
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

const fullList = [
  { objectId: 'r-1', fname: 'Ana', lname: 'Gomez' },
  { objectId: 'r-2', fname: 'Ronaldo', lname: 'Vega' },
];

describe('FindResidents - successful online full fetch populates the offline cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('the initial full-list fetch persists its records as residentData', async () => {
    mockParseSearch.mockResolvedValue(fullList);

    render(<FindResidents {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('name-r-1')).toBeDefined();
    });

    expect(mockStoreData).toHaveBeenCalledWith(fullList, 'residentData');
  });

  test('a filtered search result does NOT overwrite the cache', async () => {
    mockParseSearch.mockResolvedValue(fullList);

    render(<FindResidents {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('name-r-1')).toBeDefined();
    });
    mockStoreData.mockClear();

    const subset = [{ objectId: 'r-2', fname: 'Ronaldo', lname: 'Vega' }];
    mockParseSearch.mockResolvedValue(subset);

    fireEvent.changeText(screen.getByTestId('searchbar'), 'ron');
    await waitFor(
      () => expect(mockParseSearch).toHaveBeenCalledWith('test-org', 'ron'),
      { timeout: 3000 }
    );
    await waitFor(() => {
      expect(screen.queryByTestId('name-r-1')).toBeNull();
    });

    expect(mockStoreData).not.toHaveBeenCalledWith(expect.anything(), 'residentData');
  });
});
