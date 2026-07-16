/**
 * FindResidents - offline-queue results respect the query RED-GREEN TDD
 *
 * Bug: during an online search, every resident sitting in the offline queue
 * (offlineIDForms) is appended to the results regardless of the query — a
 * search for "Ron" also lists "Zelda" if she was created offline. The list
 * looks random ("search isn't working").
 * Fix: queued residents are appended only when they match the query, with the
 * same case-insensitive name-prefix semantics as the online search.
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

// Two residents created offline: one matches the query prefix, one does not.
const offlineQueue = [
  {
    localObject: { objectId: 'PatientID-match', fname: 'Ronaldo', lname: 'Vega' },
  },
  {
    localObject: { objectId: 'PatientID-nomatch', fname: 'Zelda', lname: 'Quinn' },
  },
];
jest.mock('@modules/async-storage', () => ({
  getData: jest.fn((key) =>
    Promise.resolve(key === 'offlineIDForms' ? offlineQueue : null)
  ),
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

describe('FindResidents - online search appends only queue records matching the query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParseSearch.mockResolvedValue([
      { objectId: 'server-1', fname: 'Ronald', lname: 'Perez' },
    ]);
  });

  test('searching "ron" shows the matching queued resident but not the unrelated one', async () => {
    render(<FindResidents {...defaultProps} />);
    await waitFor(() => expect(mockParseSearch).toHaveBeenCalled(), { timeout: 3000 });

    fireEvent.changeText(screen.getByTestId('searchbar'), 'ron');

    await waitFor(
      () => expect(mockParseSearch).toHaveBeenCalledWith('test-org', 'ron'),
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(screen.getByTestId('name-server-1')).toBeDefined();
    });
    // Queued "Ronaldo" matches the prefix — included.
    expect(screen.getByTestId('name-PatientID-match')).toBeDefined();
    // Queued "Zelda" does not match — must NOT be shown for this search.
    expect(screen.queryByTestId('name-PatientID-nomatch')).toBeNull();
  });

  test('an empty query still shows every queued resident', async () => {
    render(<FindResidents {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('name-PatientID-match')).toBeDefined();
    });
    expect(screen.getByTestId('name-PatientID-nomatch')).toBeDefined();
  });
});
