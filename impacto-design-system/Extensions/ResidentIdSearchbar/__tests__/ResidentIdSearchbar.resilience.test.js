/**
 * ResidentIdSearchbar resilience — RED-GREEN TDD
 *
 * This searchbar runs during data collection (domains/DataCollection/Forms and
 * PaperInputPicker/HouseholdManager). It answers "does this person already
 * have a record?", so every way it can come up empty is a way a duplicate
 * person gets created.
 *
 * FindResidents already fixed all three of these; this component never got
 * them:
 *
 *  1. No try/catch around parseSearch. An expired session, flaky signal or
 *     server error left the surveyor staring at an empty list rather than
 *     falling back to the cached residents.
 *  2. `fetchData(online, input)` read the `online` STATE captured in a
 *     previous render, so a surveyor who lost signal mid-session kept being
 *     routed down the online path until something else re-rendered.
 *  3. No stale-response guard. A slow superseded search could land after a
 *     newer one and overwrite the list with results for a query the surveyor
 *     had already changed.
 */
/* eslint-disable global-require */
import { OfflineContext } from '@context/offline.context';
import ResidentIdSearchbar from '@impacto-design-system/Extensions/ResidentIdSearchbar';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

const mockParseSearch = jest.fn();
jest.mock('../utils', () => ({
  __esModule: true,
  default: (...args) => mockParseSearch(...args),
}));

const mockCheckOnlineStatus = jest.fn();
jest.mock('@modules/offline', () => (...args) => mockCheckOnlineStatus(...args));

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

jest.mock('@modules/i18n', () => ({ t: (key) => key }));
jest.mock('@modules/utils/animations', () => ({
  MOTION_TOKENS: { duration: { base: 200, pulse: 300 } },
}));

jest.mock('react-native-paper', () => {
  const mockReact = require('react');
  const { TextInput, TouchableOpacity, Text: RNText } = require('react-native');
  return {
    useTheme: () => ({ colors: { primary: '#000', secondary: '#ccc', background: '#fff' } }),
    Searchbar: ({ value, onChangeText, placeholder }) =>
      mockReact.createElement(TextInput, {
        testID: 'searchbar-input', value, onChangeText, placeholder,
      }),
    Button: ({ children, onPress }) =>
      mockReact.createElement(TouchableOpacity, { onPress },
        mockReact.createElement(RNText, null, children)),
    Text: ({ children }) => mockReact.createElement(RNText, null, children),
  };
});

jest.mock('@impacto-design-system/Extensions/FindResidents/Resident/ResidentCard', () => () => null);

const CACHED = [{ objectId: 'PatientID-001', fname: 'Ana', lname: 'Cached' }];
const ONLINE = [{ objectId: 'SRV-1', fname: 'Ana', lname: 'Online' }];

const mount = () => {
  const utils = render(
    <OfflineContext.Provider value={{ residentOfflineData: mockResidentOfflineData }}>
      <ResidentIdSearchbar surveyee={{}} setSurveyee={jest.fn()} surveyingOrganization="testORG" />
    </OfflineContext.Provider>
  );
  return utils;
};

/** Type, then run the 1000ms debounce out and flush the fetch it starts. */
const search = async (text) => {
  fireEvent.changeText(screen.getByTestId('searchbar-input'), text);
  await act(async () => { jest.advanceTimersByTime(1000); });
  await act(async () => {});
};

describe('ResidentIdSearchbar resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockResidentOfflineData.mockResolvedValue(CACHED);
    mockCheckOnlineStatus.mockResolvedValue(true);
    mockParseSearch.mockResolvedValue(ONLINE);
  });

  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
  });

  // ─── 1. a failed online search must fall back, not blank the list ──────────
  it('falls back to the cached residents when the online search fails', async () => {
    mount();
    await act(async () => {});

    mockParseSearch.mockRejectedValue(new Error('session token expired'));
    await search('ana');

    // The cached resident is the evidence the fallback ran. Without it the
    // surveyor sees nothing and enters the person a second time.
    expect(screen.getByText(/Cached/)).toBeTruthy();
  });

  it('does not reject out of the component when the online search fails', async () => {
    mount();
    await act(async () => {});

    mockParseSearch.mockRejectedValue(new Error('boom'));

    await expect(search('ana')).resolves.toBeUndefined();
  });

  // ─── 2. connectivity resolved at fetch time, not from a stale render ───────
  it('re-checks connectivity on each search instead of trusting stale state', async () => {
    mount();
    await act(async () => {});
    const afterMount = mockCheckOnlineStatus.mock.calls.length;

    await search('ana');

    expect(mockCheckOnlineStatus.mock.calls.length).toBeGreaterThan(afterMount);
  });

  it('uses the offline cache when signal was lost after the last render', async () => {
    mount();
    await act(async () => {});

    // The mount fetch ran while online; only what happens after the drop matters.
    mockParseSearch.mockClear();
    mockResidentOfflineData.mockClear();

    // Signal drops. The component still holds online===true from mount.
    mockCheckOnlineStatus.mockResolvedValue(false);
    await search('ana');

    expect(mockParseSearch).not.toHaveBeenCalled();
    expect(mockResidentOfflineData).toHaveBeenCalled();
  });

  // ─── 3. a superseded response must not overwrite a newer one ──────────────
  it('ignores a slow superseded search that lands after a newer one', async () => {
    mount();
    await act(async () => {});

    let resolveSlow;
    mockParseSearch.mockImplementationOnce(
      () => new Promise((resolve) => { resolveSlow = resolve; })
    );
    // First search: starts, does not settle.
    fireEvent.changeText(screen.getByTestId('searchbar-input'), 'a');
    await act(async () => { jest.advanceTimersByTime(1000); });

    // Second search supersedes it and settles first.
    mockParseSearch.mockResolvedValue([
      { objectId: 'SRV-2', fname: 'Ana', lname: 'Newer' },
    ]);
    await search('ana');

    // Now the stale first response arrives.
    await act(async () => {
      resolveSlow([{ objectId: 'SRV-STALE', fname: 'Ana', lname: 'Stale' }]);
    });
    await act(async () => {});

    expect(screen.queryByText(/Stale/)).toBeNull();
    expect(screen.getByText(/Newer/)).toBeTruthy();
  });
});
