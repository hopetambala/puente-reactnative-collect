import BottomTabNavigator from '@impacto-design-system/MainNavigation/BottomTabNavigator/index';
import { render } from '@testing-library/react-native';
import React from 'react';

// Capture screen options so we can inspect tabBarIcon per route
const mockCapturedScreens = {};

jest.mock('@react-navigation/bottom-tabs', () => {
  // eslint-disable-next-line global-require
  const MockReact = require('react');
  // eslint-disable-next-line global-require
  const { View, Text } = require('react-native');

  const Screen = ({ name, options }) => {
    // Store options keyed by screen name for later inspection
    mockCapturedScreens[name] = options;
    return MockReact.createElement(Text, null, name);
  };

  const Navigator = ({ children }) =>
    MockReact.createElement(View, { testID: 'bottom-tab-navigator' }, children);

  return {
    createBottomTabNavigator: () => ({
      Navigator,
      Screen,
    }),
  };
});

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));

jest.mock('@modules/i18n', () => ({
  t: (key) => key,
}));

jest.mock('@modules/utils/animations', () => ({
  ANIMATION_CONFIG: { SCALE_SUBTLE_ENTRANCE: 0.97 },
  SPRING_CONFIG: { SMOOTH: {} },
  MOTION_TOKENS: { spring: { smooth: {} } },
}));

// Stub out all the screen components referenced by BottomTabNavigator
jest.mock('@app/domains/DataCollection/navigator', () => () => null);
jest.mock('@app/domains/FindRecords/navigator', () => () => null);
jest.mock('@app/domains/HomeScreen', () => () => null);
jest.mock('@app/domains/Offline', () => () => null);
jest.mock('@app/domains/Settings', () => () => null);

// Stub AnimatedTabBar
jest.mock('../AnimatedTabBar', () => () => null);

// Capture what name the TabBarIcon is rendered with.
// Override the barrel mock from jest.setup.js so our spy TabBarIcon is used.
let mockCapturedIconName = null;
jest.mock('@impacto-design-system/Extensions', () => {
  const noop = () => null;
  return {
    ErrorPicker: noop,
    PaperInputPicker: noop,
    YupValidationPicker: noop,
    FormInput: noop,
    FormikFields: noop,
    AssetSearchbar: noop,
    FindResidents: noop,
    Header: noop,
    LanguagePicker: noop,
    ResidentIdSearchbar: noop,
    TermsModal: noop,
    // Spy version — records the icon name passed in
    TabBarIcon: ({ name }) => {
      mockCapturedIconName = name;
      return null;
    },
  };
});

describe('BottomTabNavigator', () => {
  beforeEach(() => {
    mockCapturedIconName = null;
    Object.keys(mockCapturedScreens).forEach((k) => delete mockCapturedScreens[k]);
  });

  it('renders the Offline tab with icon name "cloud-upload-outline"', () => {
    render(<BottomTabNavigator />);

    // The Offline screen's options must have been captured during render
    const offlineOptions = mockCapturedScreens.Offline;
    expect(offlineOptions).toBeDefined();

    // tabBarIcon is a function: ({ focused }) => <TabBarIcon name={iconName} />
    // Invoke it so our TabBarIcon mock runs and sets mockCapturedIconName
    const tabBarIconFn = offlineOptions.tabBarIcon;
    expect(tabBarIconFn).toBeDefined();

    render(tabBarIconFn({ focused: false }));

    expect(mockCapturedIconName).toBe('cloud-upload-outline');
  });
});
