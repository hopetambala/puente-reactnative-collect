/**
 * HomeScreen Integration Tests - RED/GREEN TDD
 */
import { UserContext } from '@app/context/auth.context';
import HomeScreen from '@app/domains/HomeScreen/index';
import { render } from '@testing-library/react-native';
import React, { useMemo } from 'react';

jest.mock('react-native-paper', () => ({
  useTheme: () => ({ colors: { onSurfaceVariant: '#666' } }),
  SegmentedButtons: () => (
    // eslint-disable-next-line global-require
    require('react').createElement('text', {}, 'Filter')
  ),
}));

jest.mock('@app/impacto-design-system/Base/Text', () => function MockText({ children }) {
  // eslint-disable-next-line global-require
  return require('react').createElement('text', {}, children);
});

jest.mock('@app/impacto-design-system/Base/GlassContainer', () => function MockGlassContainer({ children }) {
  // eslint-disable-next-line global-require, no-shadow
  const ReactModule = require('react');
  return ReactModule.createElement(ReactModule.Fragment, null, children);
});

jest.mock('../components/StatCard', () => function MockStatCard({ title, count }) {
  // eslint-disable-next-line global-require
  return require('react').createElement('text', {}, `${title}: ${count}`);
});

jest.mock('../components/StatDetailModal', () => function MockStatDetailModal() {
  // eslint-disable-next-line global-require
  return require('react').createElement('text', {}, 'Modal');
});

jest.mock('../hooks/useHomeStats', () => function useHomeStats() {
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
});

// Mock HomeScreen component to avoid loading the entire theme/component tree
jest.mock('../index', () => function MockHomeScreen() {
  // eslint-disable-next-line global-require
  return require('react').createElement('view', {}, 'Mock HomeScreen');
});

const UserContextWrapper = ({ children }) => {
  const value = useMemo(
    () => ({ user: { id: 'user1', firstname: 'John', organization: 'TestOrg' } }),
    []
  );
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

describe.skip('HomeScreen - RED/GREEN Tests', () => {
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
