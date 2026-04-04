import React from 'react';
import { render } from '@testing-library/react-native';
import StatCard from '../index';

// Mock dependencies
jest.mock('../../../../impacto-design-system/Base/ModernCard', () => ({
  __esModule: true,
  default: ({ children, ...props }) => <>{children}</>,
}));

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  Animated: {
    View: ({ children, ...props }) => <>{children}</>,
    Text: ({ children, ...props }) => <>{children}</>,
  },
  useAnimatedStyle: () => ({}),
  useSharedValue: () => ({ value: 0 }),
  withSpring: (val) => val,
  withTiming: (val) => val,
}));

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => ({
  __esModule: true,
  default: ({ name, size, color }) => (
    <text>{`Icon: ${name} (${size}, ${color})`}</text>
  ),
}));

jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#000000',
      subtitle: '#666666',
    },
    semanticTokens: {
      success: '#34C759',
      error: '#FF3B30',
      surface_neutral: '#F0F0F0',
      text_primary: '#000000',
    },
  }),
}));

describe('StatCard Component - Snapshots', () => {
  test('renders StatCard with count data', () => {
    const { toJSON } = render(
      <StatCard
        cardType="mySurveys"
        count={42}
        previous={40}
        isLoading={false}
        onPress={jest.fn()}
        timeFilter="today"
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatCard in loading state', () => {
    const { toJSON } = render(
      <StatCard
        cardType="mySurveys"
        count={0}
        previous={0}
        isLoading={true}
        onPress={jest.fn()}
        timeFilter="today"
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatCard with full width', () => {
    const { toJSON } = render(
      <StatCard
        cardType="recentActivity"
        count={227}
        previous={200}
        isLoading={false}
        onPress={jest.fn()}
        timeFilter="today"
        fullWidth={true}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatCard with positive trend', () => {
    const { toJSON } = render(
      <StatCard
        cardType="orgSurveys"
        count={150}
        previous={100}
        isLoading={false}
        onPress={jest.fn()}
        timeFilter="week"
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatCard with negative trend', () => {
    const { toJSON } = render(
      <StatCard
        cardType="myVitals"
        count={8}
        previous={15}
        isLoading={false}
        onPress={jest.fn()}
        timeFilter="week"
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatCard with zero trend (identical counts)', () => {
    const { toJSON } = render(
      <StatCard
        cardType="orgVitals"
        count={50}
        previous={50}
        isLoading={false}
        onPress={jest.fn()}
        timeFilter="week"
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatCard hidden with "all" timeFilter', () => {
    const { toJSON } = render(
      <StatCard
        cardType="mySurveys"
        count={42}
        previous={40}
        isLoading={false}
        onPress={jest.fn()}
        timeFilter="all"
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatCard with high count numbers', () => {
    const { toJSON } = render(
      <StatCard
        cardType="recentActivity"
        count={9999}
        previous={5000}
        isLoading={false}
        onPress={jest.fn()}
        timeFilter="today"
        fullWidth={true}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  test('renders StatCard with zero count', () => {
    const { toJSON } = render(
      <StatCard
        cardType="mySurveys"
        count={0}
        previous={0}
        isLoading={false}
        onPress={jest.fn()}
        timeFilter="today"
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
