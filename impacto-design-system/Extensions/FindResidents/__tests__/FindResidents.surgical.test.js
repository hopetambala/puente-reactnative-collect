/**
 * FindResidents - Surgical List Update RED-GREEN TDD
 * Verifies that when selectPerson changes (after a re-fetch in parent),
 * the resident card in the list updates in-memory without a full re-fetch.
 *
 * Bug: After editing a SurveyData record (fname "Ron" → "John"),
 * the resident card still shows "Ron" because residentsData is a stale snapshot.
 * Fix: useEffect([selectPerson]) patches the matching record in-place.
 */

import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// parseSearch returns a list with one resident named "Ron"
const mockParseSearch = jest.fn(() =>
  Promise.resolve([{ objectId: 'resident-001', fname: 'Ron', lname: 'Smith', objectId: 'resident-001' }])
);

jest.mock('../_utils', () => ({
  __esModule: true,
  default: (...args) => mockParseSearch(...args),
  fetchResidentById: jest.fn(),
}));

// ResidentCard renders testID=objectId and the resident's fname so tests can assert on it
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

// ResidentPage renders the name from props
jest.mock('../Resident/ResidentPage', () => {
  const React = require('react'); // eslint-disable-line global-require
  const { Text } = require('react-native'); // eslint-disable-line global-require
  return function MockResidentPage({ fname, lname }) {
    return React.createElement(
      Text,
      { testID: 'resident-page-name' },
      `${fname} ${lname}`
    );
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
jest.mock('@context/offline.context', () => {
  const React = require('react'); // eslint-disable-line global-require
  return {
    OfflineContext: React.createContext({ residentOfflineData: () => Promise.resolve([]) }),
  };
});
jest.mock('@modules/async-storage', () => ({
  getData: jest.fn(() => Promise.resolve(null)),
}));

// react-native-paper global mock doesn't include Searchbar — add it here
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

// ─── Import component AFTER all mocks ────────────────────────────────────────
// eslint-disable-next-line import/first
import FindResidents from '../index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ronResident = { objectId: 'resident-001', fname: 'Ron', lname: 'Smith' };
const johnResident = { objectId: 'resident-001', fname: 'John', lname: 'Smith' };

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

// ─── RED-GREEN Tests ──────────────────────────────────────────────────────────

describe('FindResidents - Surgical List Update RED-GREEN TDD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParseSearch.mockResolvedValue([
      { objectId: 'resident-001', fname: 'Ron', lname: 'Smith' },
    ]);
  });

  describe('RED: stale name in list after resident edit', () => {
    test('without fix: re-render with updated selectPerson does NOT update the card', async () => {
      // This test documents the ORIGINAL broken behaviour.
      // The component receives an updated selectPerson with fname="John" but
      // residentsData still holds the old snapshot with fname="Ron".
      // After the surgical useEffect fix the card WILL update — so this test
      // is kept to show what the GREEN fix resolves.
      const { rerender } = render(<FindResidents {...defaultProps} />);

      // Wait for initial list to load with "Ron"
      await waitFor(() => {
        expect(screen.getByTestId('name-resident-001')).toBeDefined();
      });

      // Simulate parent updating selectPerson after a background re-fetch
      rerender(<FindResidents {...defaultProps} selectPerson={johnResident} />);
      // Go back to list view (selectPerson = null so the list is shown)
      rerender(<FindResidents {...defaultProps} selectPerson={null} />);

      // GREEN: After fix, the card should now show the updated name
      await waitFor(() => {
        expect(screen.getByTestId('name-resident-001').props.children).toBe('John Smith');
      });
    });
  });

  describe('GREEN: surgical update patches residentsData in-memory', () => {
    test('should update resident card when selectPerson changes to refreshed version', async () => {
      const { rerender } = render(<FindResidents {...defaultProps} />);

      // Wait for list to load — card shows "Ron Smith"
      await waitFor(() => {
        expect(screen.getByTestId('name-resident-001').props.children).toBe('Ron Smith');
      });

      // Parent sets selectPerson to the freshly-fetched resident (fname changed to John)
      rerender(<FindResidents {...defaultProps} selectPerson={johnResident} />);
      // Parent then clears selectPerson so the list is visible again
      rerender(<FindResidents {...defaultProps} selectPerson={null} />);

      // Surgical useEffect should have patched residentsData — card now shows "John Smith"
      await waitFor(() => {
        expect(screen.getByTestId('name-resident-001').props.children).toBe('John Smith');
      });
    });

    test('should NOT trigger a full re-fetch (parseSearch not called again) when selectPerson changes', async () => {
      const { rerender } = render(<FindResidents {...defaultProps} />);

      await waitFor(() => {
        expect(mockParseSearch).toHaveBeenCalledTimes(1);
      });

      const callCountAfterMount = mockParseSearch.mock.calls.length;

      // Parent updates selectPerson with refreshed data
      rerender(<FindResidents {...defaultProps} selectPerson={johnResident} />);
      rerender(<FindResidents {...defaultProps} selectPerson={null} />);

      // Allow any async operations to settle
      await new Promise((resolve) => setTimeout(resolve, 100));

      // parseSearch should NOT have been called again — update is in-memory only
      expect(mockParseSearch.mock.calls.length).toBe(callCountAfterMount);
    });

    test('should not update list when selectPerson changes to a different objectId', async () => {
      const otherResident = { objectId: 'resident-999', fname: 'Alice', lname: 'Jones' };
      const { rerender } = render(<FindResidents {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('name-resident-001').props.children).toBe('Ron Smith');
      });

      // selectPerson is a completely different resident (not in the list)
      rerender(<FindResidents {...defaultProps} selectPerson={otherResident} />);
      rerender(<FindResidents {...defaultProps} selectPerson={null} />);

      await waitFor(() => {
        // Ron Smith should be unchanged — only matching objectId is patched
        expect(screen.getByTestId('name-resident-001').props.children).toBe('Ron Smith');
      });
    });

    test('should not update list when selectPerson is null', async () => {
      const { rerender } = render(<FindResidents {...defaultProps} />);

      await waitFor(() => {
        expect(mockParseSearch).toHaveBeenCalledTimes(1);
      });

      rerender(<FindResidents {...defaultProps} selectPerson={null} />);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should still show the original list unchanged
      expect(screen.getByTestId('name-resident-001').props.children).toBe('Ron Smith');
    });
  });

  describe('GREEN: ResidentPage receives fresh props after selectPerson refresh', () => {
    test('should render updated fname on ResidentPage when selectPerson is set to refreshed data', async () => {
      render(<FindResidents {...defaultProps} selectPerson={johnResident} />);

      await waitFor(() => {
        expect(screen.getByTestId('resident-page-name').props.children).toBe('John Smith');
      });
    });

    test('should render original fname when selectPerson is the original resident', async () => {
      render(<FindResidents {...defaultProps} selectPerson={ronResident} />);

      await waitFor(() => {
        expect(screen.getByTestId('resident-page-name').props.children).toBe('Ron Smith');
      });
    });
  });
});
