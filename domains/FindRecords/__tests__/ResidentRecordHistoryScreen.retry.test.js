/**
 * ResidentRecordHistoryScreen - error recovery RED-GREEN TDD
 *
 * Gaps (ux-review P1):
 * 1. The error state offers no retry — the only path forward is abandoning
 *    the screen.
 * 2. The raw error message (e.g. "Network request failed") is shown to the
 *    surveyor instead of a human, translated message.
 */
/* eslint-disable global-require */

import ResidentRecordHistoryScreen from '@app/domains/FindRecords/ResidentRecordHistoryScreen';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

// Toggleable failure: when true, building the resident pointer throws, which
// trips the screen's outer catch and lands it in the error state.
let mockParseObjectShouldThrow = true;

const mockFind = jest.fn(() => Promise.resolve([]));
const mockQuery = {
  equalTo: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  descending: jest.fn().mockReturnThis(),
  find: mockFind,
};

jest.mock('@app/services/parse/client', () => {
  function MockParseObject(className) {
    if (mockParseObjectShouldThrow) {
      throw new Error('Network request failed');
    }
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

jest.mock('@modules/offline', () => jest.fn(() => Promise.resolve(true)));

// The global react-native-paper mock renders Button labels outside RN Text,
// so getByText can't reach them — use a local mock with real Text.
jest.mock('react-native-paper', () => {
  const ReactLib = require('react');
  const { Text: RNText, TouchableOpacity } = require('react-native');
  const mockColors = {
    primary: '#007AFF',
    onPrimary: '#FFFFFF',
    background: '#FFFFFF',
    onBackground: '#000000',
    surface: '#F5F5F5',
    onSurface: '#000000',
    onSurfaceVariant: '#666666',
    outline: '#CCCCCC',
    outlineVariant: '#DDDDDD',
    surfaceVariant: '#F5F5F5',
    error: '#FF3B30',
    onError: '#FFFFFF',
    secondary: '#5AC8FA',
    onSecondary: '#000000',
  };
  return {
    DefaultTheme: { colors: mockColors },
    MD3DarkTheme: { colors: mockColors },
    Button: ({ children, onPress, testID }) =>
      ReactLib.createElement(
        TouchableOpacity,
        { onPress, testID },
        ReactLib.createElement(RNText, null, children)
      ),
    Text: ({ children, style }) => ReactLib.createElement(RNText, { style }, children),
    useTheme: () => ({
      dark: false,
      colors: {
        primary: '#007AFF',
        background: '#FFFFFF',
        onBackground: '#000000',
        surface: '#F5F5F5',
        onSurface: '#000000',
        onSurfaceVariant: '#666666',
        outline: '#CCCCCC',
      },
    }),
  };
});

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
}));

describe('ResidentRecordHistoryScreen - error state recovery', () => {
  const mockResident = {
    objectId: 'resident-123',
    fname: 'John',
    lname: 'Doe',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockParseObjectShouldThrow = true;
    mockFind.mockResolvedValue([]);
  });

  test('error state shows a human message (not the raw error) and a Try Again that refetches', async () => {
    const mockNavigation = { goBack: jest.fn() };
    const mockRoute = { params: { resident: mockResident } };

    render(<ResidentRecordHistoryScreen navigation={mockNavigation} route={mockRoute} />);

    await waitFor(() => {
      expect(screen.getByTestId('error-view')).toBeDefined();
    });

    // Human, translated copy — never the raw exception text.
    expect(screen.getByText('residentHistory.errorBody')).toBeDefined();
    expect(screen.queryByText('Network request failed')).toBeNull();

    // Recovery path: Try Again re-runs the fetch and exits the error state.
    mockParseObjectShouldThrow = false;
    fireEvent.press(screen.getByText('global.tryAgain'));

    await waitFor(() => {
      expect(screen.queryByTestId('error-view')).toBeNull();
    });
    expect(screen.getByText(/residentHistory.recordHistory/)).toBeDefined();
  });
});
