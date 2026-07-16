/**
 * FindResidents - stale search response RED-GREEN TDD
 *
 * Bug: debounced searches are not sequenced. When an older, slower search
 * response arrives after a newer one, it overwrites the list — the surveyor
 * sees results for a query they are no longer typing ("search shows the
 * wrong people sometimes").
 * Fix: responses from superseded searches are ignored.
 */
/* eslint-disable no-shadow, react/button-has-type */

import FindResidents from '@impacto-design-system/Extensions/FindResidents/index';
import checkOnlineStatus from '@modules/offline';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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

const flushMicrotasks = () => act(async () => {});

describe('FindResidents - a superseded search response never overwrites newer results', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('slow response for an older query is discarded when a newer query already rendered', async () => {
    let resolveSlowSearch;
    mockParseSearch.mockImplementation((org, qry) => {
      if (qry === 'R') {
        return new Promise((resolve) => {
          resolveSlowSearch = resolve;
        });
      }
      return Promise.resolve([
        { objectId: 'fresh-1', fname: 'Rosa', lname: 'Reyes' },
      ]);
    });

    render(<FindResidents {...defaultProps} />);

    // Initial mount fetch (empty query) resolves via the default branch.
    await waitFor(() => expect(mockParseSearch).toHaveBeenCalled(), { timeout: 3000 });

    // First keystroke: search 'R' hangs (slow network round-trip).
    fireEvent.changeText(screen.getByTestId('searchbar'), 'R');
    await waitFor(
      () => expect(mockParseSearch).toHaveBeenCalledWith('test-org', 'R'),
      { timeout: 3000 }
    );

    // Second keystroke: search 'Ro' resolves immediately and renders.
    fireEvent.changeText(screen.getByTestId('searchbar'), 'Ro');
    await waitFor(
      () => expect(mockParseSearch).toHaveBeenCalledWith('test-org', 'Ro'),
      { timeout: 3000 }
    );
    await waitFor(() => expect(screen.getByTestId('name-fresh-1')).toBeDefined());

    // Now the OLD 'R' response finally lands with stale data.
    await act(async () => {
      resolveSlowSearch([{ objectId: 'stale-1', fname: 'Stale', lname: 'Result' }]);
    });
    await flushMicrotasks();

    // The stale payload must be discarded — the newer results stay on screen.
    expect(screen.queryByTestId('name-stale-1')).toBeNull();
    expect(screen.getByTestId('name-fresh-1')).toBeDefined();
  });

  test("a superseded fetch's late connectivity result cannot flip the UI into offline mode", async () => {
    // The mount fetch's connectivity check hangs; every later check is online.
    let resolveSlowConnectivity;
    checkOnlineStatus
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSlowConnectivity = resolve;
          })
      )
      .mockResolvedValue(true);
    mockParseSearch.mockResolvedValue([
      { objectId: 'fresh-1', fname: 'Rosa', lname: 'Reyes' },
    ]);

    render(<FindResidents {...defaultProps} />);

    // A newer search runs to completion online.
    fireEvent.changeText(screen.getByTestId('searchbar'), 'Ro');
    await waitFor(
      () => expect(mockParseSearch).toHaveBeenCalledWith('test-org', 'Ro'),
      { timeout: 3000 }
    );
    await waitFor(() => expect(screen.getByTestId('name-fresh-1')).toBeDefined());
    expect(screen.UNSAFE_queryAllByType('button')).toHaveLength(0);

    // The OLD mount fetch finally learns it was "offline" — too late to matter.
    await act(async () => {
      resolveSlowConnectivity(false);
    });
    await flushMicrotasks();

    // The offline retry button must not appear; the UI stays online.
    expect(screen.UNSAFE_queryAllByType('button')).toHaveLength(0);
    expect(screen.getByTestId('name-fresh-1')).toBeDefined();
  });
});
