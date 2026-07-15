/* eslint-disable global-require */
import { OfflineContext } from '@context/offline.context';
import ResidentIdSearchbar from '@impacto-design-system/Extensions/ResidentIdSearchbar';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

// --- Module mocks ---

jest.mock('parse/react-native', () => ({
  Query: jest.fn().mockImplementation(() => ({
    equalTo: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    find: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn().mockResolvedValue(null),
}));

const mockResidentOfflineData = jest.fn();

jest.mock('@context/offline.context', () => {
  const mockReact = require('react');
  return {
    OfflineContext: mockReact.createContext({
      residentOfflineData: mockResidentOfflineData,
    }),
  };
});

jest.mock('@modules/i18n', () => ({
  t: (key) => key,
}));

jest.mock('@modules/utils/animations', () => ({
  MOTION_TOKENS: { duration: { base: 200 } },
}));

// checkOnlineStatus returns false — offline path; fetchOfflineData populates residentsData
// immediately without needing to advance the 1000ms debounce timer.
jest.mock('@modules/offline', () => jest.fn().mockResolvedValue(false));

// parseSearch is unused in the offline path
jest.mock('../utils', () => jest.fn().mockResolvedValue([]));

jest.mock('react-native-paper', () => {
  const mockReact = require('react');
  const { TextInput, TouchableOpacity, Text: RNText } = require('react-native');
  const mockColors = { primary: '#000', secondary: '#ccc', background: '#fff' };
  return {
    useTheme: () => ({ colors: mockColors }),
    Searchbar: ({ value, onChangeText, placeholder }) =>
      mockReact.createElement(TextInput, {
        testID: 'searchbar-input',
        value,
        onChangeText,
        placeholder,
      }),
    Button: ({ children, onPress }) =>
      mockReact.createElement(TouchableOpacity, { onPress },
        mockReact.createElement(RNText, null, children)),
    Text: ({ children }) => mockReact.createElement(RNText, null, children),
  };
});

jest.mock('@impacto-design-system/Extensions/FindResidents/Resident/ResidentCard', () => () => null);

// A resident whose fname matches the query "Link" so filterOfflineList includes it
const mockResident = { objectId: 'PatientID-001', fname: 'Link', lname: 'Test' };

describe('ResidentIdSearchbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResidentOfflineData.mockResolvedValue([mockResident]);
  });

  it('pressing a result row calls setSurveyee with the item and clears the search input', async () => {
    const mockSetSurveyee = jest.fn();

    render(
      <OfflineContext.Provider value={{ residentOfflineData: mockResidentOfflineData }}>
        <ResidentIdSearchbar
          surveyee={{}}
          setSurveyee={mockSetSurveyee}
          surveyingOrganization="test-org"
        />
      </OfflineContext.Provider>
    );

    // Let the initial checkOnlineStatus (.then) and fetchOfflineData resolve so
    // residentsData is populated with [mockResident] and online is set to false.
    await act(async () => {});

    // Typing sets query to "Link"; filterOfflineList(residentsData) returns [mockResident]
    // because fname matches. The FlatList renders because query !== "".
    const input = screen.getByTestId('searchbar-input');
    fireEvent.changeText(input, 'Link');

    // The result row must be findable by the testID added to the Pressable in the fix.
    // (Old code used a Paper Button with no testID on the pressable element — this line
    // would throw "Unable to find an element with testID: resident-result-0" there.)
    await waitFor(() => {
      expect(screen.getByTestId('resident-result-0')).toBeDefined();
    });

    // Press the result row — fires onSelectSurveyee(mockResident)
    fireEvent.press(screen.getByTestId('resident-result-0'));

    // onSelectSurveyee calls setSurveyee(listItem) …
    expect(mockSetSurveyee).toHaveBeenCalledTimes(1);
    expect(mockSetSurveyee).toHaveBeenCalledWith(mockResident);

    // … and then calls setQuery(""), which clears the input value
    await waitFor(() => {
      expect(screen.getByTestId('searchbar-input').props.value).toBe('');
    });

    // With query === "" the FlatList is unmounted; the row must be gone
    expect(screen.queryByTestId('resident-result-0')).toBeNull();
  });
});
