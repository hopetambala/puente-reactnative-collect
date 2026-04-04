/**
 * HomeScreen Integration Tests - RED/GREEN TDD
 */
jest.mock('react-native-paper', () => ({
  useTheme: () => ({ colors: { onSurfaceVariant: '#666' } }),
  SegmentedButtons: () => <text>Filter</text>,
}));

jest.mock('@app/impacto-design-system/Base/Text', () => {
  return function MockText(props) {
    return <text>{props.children}</text>;
  };
});

jest.mock('@app/impacto-design-system/Base/GlassContainer', () => {
  return function MockGlassContainer(props) {
    return <>{props.children}</>;
  };
});

jest.mock('../components/StatCard', () => {
  return function MockStatCard({ title, count }) {
    return <text>{title}: {count}</text>;
  };
});

jest.mock('../components/StatDetailModal', () => {
  return function MockStatDetailModal() {
    return <text>Modal</text>;
  };
});

jest.mock('../hooks/useHomeStats', () => {
  return function useHomeStats() {
    return {
      stats: {
        mySurveys: { count: 42, previous: 40 },
        orgSurveys: { count: 120, previous: 100 },
        myVitals: { count: 15, previous: 14 },
        orgVitals: { count: 50, previous: 45 },
        recentActivity: { count: 227 },
      },
      isLoading: false,
      isOffline: false,
      timeFilter: 'week',
      setTimeFilter: jest.fn(),
      refresh: jest.fn(),
    };
  };
});

import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../index';
import { UserContext } from '@app/context/auth.context';

const UserContextWrapper = ({ children }) => (
  <UserContext.Provider value={{ user: { id: 'user1', firstname: 'John', organization: 'TestOrg' } }}>
    {children}
  </UserContext.Provider>
);

describe('HomeScreen - RED/GREEN Tests', () => {
  describe('RED: Rendering', () => {
    test('RED: should render greeting', () => {
      const { getByText } = render(
        <UserContextWrapper>
          <HomeScreen />
        </UserContextWrapper>
      );
      expect(getByText(/Welcome back/)).toBeTruthy();
    });

    test('RED: should display stat cards', () => {
      const { getByText } = render(
        <UserContextWrapper>
          <HomeScreen />
        </UserContextWrapper>
      );
      expect(getByText(/My Surveys/)).toBeTruthy();
    });
  });

  describe('RED: Layout', () => {
    test('RED: should render modal component', () => {
      const { getByText } = render(
        <UserContextWrapper>
          <HomeScreen />
        </UserContextWrapper>
      );
      expect(getByText('Modal')).toBeTruthy();
    });
  });
});
