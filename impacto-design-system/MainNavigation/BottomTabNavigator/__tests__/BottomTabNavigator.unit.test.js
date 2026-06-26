import React from 'react';
import { render } from '@testing-library/react-native';
import BottomTabNavigator from '../index';

// Capture screen options so we can inspect tabBarIcon per route
const capturedScreens = {};

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  const Screen = ({ name, options, children }) => {
    // Store options keyed by screen name for later inspection
    capturedScreens[name] = options;
    return React.createElement(Text, null, name);
  };

  const Navigator = ({ children }) =>
    React.createElement(View, { testID: 'bottom-tab-navigator' }, children);

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
let capturedIconName = null;
jest.mock('@impacto-design-system/Extensions', () => {
  const React = require('react');
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
      capturedIconName = name;
      return null;
    },
  };
});

describe('BottomTabNavigator', () => {
  beforeEach(() => {
    capturedIconName = null;
    Object.keys(capturedScreens).forEach((k) => delete capturedScreens[k]);
  });

  it('renders the Offline tab with icon name "cloud-upload-outline"', () => {
    render(<BottomTabNavigator />);

    // The Offline screen's options must have been captured during render
    const offlineOptions = capturedScreens['Offline'];
    expect(offlineOptions).toBeDefined();

    // tabBarIcon is a function: ({ focused }) => <TabBarIcon name={iconName} />
    // Invoke it so our TabBarIcon mock runs and sets capturedIconName
    const tabBarIconFn = offlineOptions.tabBarIcon;
    expect(tabBarIconFn).toBeDefined();

    render(tabBarIconFn({ focused: false }));

    expect(capturedIconName).toBe('cloud-upload-outline');
  });
});
