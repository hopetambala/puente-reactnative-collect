import AnimatedTabBar from '@impacto-design-system/MainNavigation/BottomTabNavigator/AnimatedTabBar';
import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@modules/utils/animations', () => ({
  MOTION_TOKENS: {
    spring: { smooth: {}, tight: {}, snappy: {} },
  },
}));

const buildProps = (options = {}) => {
  const routes = [
    { key: 'home-key', name: 'Home' },
    { key: 'settings-key', name: 'Settings' },
  ];
  return {
    state: { index: 0, routes },
    descriptors: {
      'home-key': { options: { title: 'Home', tabBarTestID: 'tab-home', ...options } },
      'settings-key': { options: { title: 'Settings', tabBarTestID: 'tab-settings' } },
    },
    navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() },
  };
};

describe('AnimatedTabBar', () => {
  // Without this passthrough the tab buttons carry no stable handle, and the
  // Maestro flows have to tap the tab bar by screen percentage instead.
  it('renders each tab button with the tabBarTestID from its route options', () => {
    const { getByTestId } = render(<AnimatedTabBar {...buildProps()} />);

    expect(getByTestId('tab-home')).toBeTruthy();
    expect(getByTestId('tab-settings')).toBeTruthy();
  });

  it('keeps the human-readable accessibilityLabel independent of the testID', () => {
    const { getByLabelText } = render(<AnimatedTabBar {...buildProps()} />);

    expect(getByLabelText('Home')).toBeTruthy();
    expect(getByLabelText('Settings')).toBeTruthy();
  });
});
