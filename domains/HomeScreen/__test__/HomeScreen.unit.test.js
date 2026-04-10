/**
 * HomeScreen Integration Tests - RED/GREEN TDD
 */
import { UserContext } from '@app/context/auth.context';
import HomeScreen from '@app/domains/HomeScreen/index';
import { render } from '@testing-library/react-native';
import React, { useMemo } from 'react';

jest.mock('react-native-paper', () => {
  const mockColors = {
    primary: '#007AFF', onPrimary: '#FFFFFF', secondary: '#5AC8FA',
    onSecondary: '#000000', error: '#FF3B30', background: '#FFFFFF',
    surface: '#F5F5F5', onSurface: '#000000', onSurfaceVariant: '#666666',
    outline: '#CCCCCC', outlineVariant: '#DDDDDD', surfaceVariant: '#F5F5F5',
  };
  return {
    DefaultTheme: { colors: mockColors },
    MD3DarkTheme: { colors: { ...mockColors, background: '#121212', surface: '#1E1E1E', onSurface: '#FFFFFF' } },
    useTheme: () => ({ colors: mockColors }),
    SegmentedButtons: () => (
      // eslint-disable-next-line global-require
      require('react').createElement('text', {}, 'Filter')
    ),
  };
});

jest.mock('@app/impacto-design-system/Base/Text', () => function MockText({ children, style }) {
  // eslint-disable-next-line global-require
  const { Text } = require('react-native');
  // eslint-disable-next-line global-require
  return require('react').createElement(Text, { style }, children);
});

jest.mock('@app/impacto-design-system/Base/GlassContainer', () => function MockGlassContainer({ children }) {
  // eslint-disable-next-line global-require, no-shadow
  const ReactModule = require('react');
  return ReactModule.createElement(ReactModule.Fragment, null, children);
});

jest.mock('../components/StatCard', () => function MockStatCard({ title, count }) {
  // eslint-disable-next-line global-require
  const { Text } = require('react-native');
  // eslint-disable-next-line global-require
  return require('react').createElement(Text, {}, `${title}: ${count}`);
});

jest.mock('../components/StatDetailModal', () => function MockStatDetailModal() {
  // eslint-disable-next-line global-require
  const { Text } = require('react-native');
  // eslint-disable-next-line global-require
  return require('react').createElement(Text, {}, 'Modal');
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
