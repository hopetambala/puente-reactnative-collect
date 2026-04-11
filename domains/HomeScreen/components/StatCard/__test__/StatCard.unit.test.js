/**
 * StatCard Component Tests - RED/GREEN TDD
 */
import StatCard from '@app/domains/HomeScreen/components/StatCard/index';
import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@app/impacto-design-system/Cards/ModernCard', () => function MockModernCard({ children }) {
  return children || null;
});

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: ({ children }) => children || null,
    Text: ({ children }) => children || null,
  },
  createAnimatedComponent: (Component) => Component,
  useSharedValue: () => ({ value: 0 }),
  useAnimatedStyle: () => ({}),
  withSpring: (val) => val,
  Animated: {
    View: ({ children }) => children || null,
    Text: ({ children }) => children || null,
  },
}));

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => function MockIcon() {
    return <text>Icon</text>;
  });

jest.mock('react-native-paper', () => ({
  useTheme: () => ({ colors: { primary: '#fff' } }),
}));

jest.mock('@app/impacto-design-system/Base/Text', () => {
  // eslint-disable-next-line global-require
  const { Text } = require('react-native');
  return function MockText({ children, ...props }) {
    // eslint-disable-next-line global-require
    return require('react').createElement(Text, props, children);
  };
});

describe('StatCard - RED/GREEN Tests', () => {
  const defaultProps = {
    title: 'My Surveys',
    icon: 'clipboard-check',
    count: 42,
    previous: 40,
    timeFilter: 'week',
    onPress: jest.fn(),
    isLoading: false,
    fullWidth: false,
  };

  describe('RED: Rendering', () => {
    test('RED: should render without crashing', () => {
      const { getByText } = render(<StatCard {...defaultProps} />);
      expect(getByText('My Surveys')).toBeTruthy();
    });

    test('RED: should display title', () => {
      const { getByText } = render(<StatCard {...defaultProps} />);
      expect(getByText('My Surveys')).toBeTruthy();
    });

    test('RED: should display count', () => {
      const { getByText } = render(<StatCard {...defaultProps} />);
      expect(getByText('42')).toBeTruthy();
    });

    test('RED: should handle loading state', () => {
      const { root } = render(
        <StatCard {...defaultProps} isLoading />
      );
      expect(root).toBeTruthy();
    });
  });

  describe('RED: Props', () => {
    test('RED: should handle zero count', () => {
      const { getByText } = render(
        <StatCard {...defaultProps} count={0} />
      );
      expect(getByText('0')).toBeTruthy();
    });

    test('RED: should handle large numbers', () => {
      const { getByText } = render(
        <StatCard {...defaultProps} count={9999} />
      );
      expect(getByText('9999')).toBeTruthy();
    });
  });
});
