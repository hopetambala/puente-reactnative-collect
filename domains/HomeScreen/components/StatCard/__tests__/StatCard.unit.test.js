/**
 * StatCard Component Tests - RED/GREEN TDD
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import StatCard from '../index';

jest.mock('@app/impacto-design-system/Cards/ModernCard', () => {
  return function MockModernCard({ children }) {
    return <>{children}</>;
  };
});

jest.mock('react-native-reanimated', () => ({
  createAnimatedComponent: (Component) => Component,
  useSharedValue: () => ({ value: 0 }),
  useAnimatedStyle: () => ({}),
  withSpring: (val) => val,
  Animated: { View: (props) => <>{props.children}</> },
}));

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  return function MockIcon() {
    return <text>Icon</text>;
  };
});

jest.mock('react-native-paper', () => ({
  useTheme: () => ({ colors: { primary: '#fff' } }),
}));

jest.mock('@app/impacto-design-system/Base/Text', () => {
  return function MockText(props) {
    return <text>{props.children}</text>;
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
      const { container } = render(
        <StatCard {...defaultProps} isLoading={true} />
      );
      expect(container.firstChild).toBeTruthy();
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
