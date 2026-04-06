/**
 * useHomeStats Hook Tests - RED/GREEN TDD
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@app/services/parse/stats/stats.service');
jest.mock('@react-native-async-storage/async-storage');

import useHomeStats from '../useHomeStats';
import statsService from '@app/services/parse/stats/stats.service';
import React from 'react';
import { UserContext } from '@app/context/auth.context';

const mockStats = {
  mySurveys: { count: 42, previous: 40 },
  orgSurveys: { count: 120, previous: 100 },
  myVitals: { count: 15, previous: 14 },
  orgVitals: { count: 50, previous: 45 },
  recentActivity: { count: 227 },
};

describe('useHomeStats - RED/GREEN Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
    statsService.aggregateStats.mockResolvedValue(mockStats);
  });

  const Wrapper = ({ children }) => (
    <UserContext.Provider value={{ user: { id: 'user1', organization: 'test' } }}>
      {children}
    </UserContext.Provider>
  );

  describe('RED: Initial State', () => {
    test('RED: should start with isLoading true', () => {
      const { result } = renderHook(() => useHomeStats(), { wrapper: Wrapper });
      expect(result.current.isLoading).toBe(true);
    });

    test('RED: should start with stats null', () => {
      const { result } = renderHook(() => useHomeStats(), { wrapper: Wrapper });
      expect(result.current.stats).toBe(null);
    });

    test('RED: should have default timeFilter of all', () => {
      const { result } = renderHook(() => useHomeStats(), { wrapper: Wrapper });
      expect(result.current.timeFilter).toBe('all');
    });
  });

  describe('RED: Data Fetching', () => {
    test('RED: should call aggregateStats', async () => {
      const { result } = renderHook(() => useHomeStats(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(statsService.aggregateStats).toHaveBeenCalled();
      });
    });

    test('RED: should set stats after fetch', async () => {
      const { result } = renderHook(() => useHomeStats(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
      });
    });

    test('RED: should set isLoading to false after fetch', async () => {
      const { result } = renderHook(() => useHomeStats(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('RED: Error Handling', () => {
    test('RED: should handle fetch errors', async () => {
      statsService.aggregateStats.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useHomeStats(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    test('RED: should set isLoading false on error', async () => {
      statsService.aggregateStats.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useHomeStats(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('RED: Time Filter', () => {
    test('RED: should have setTimeFilter function', () => {
      const { result } = renderHook(() => useHomeStats(), { wrapper: Wrapper });
      expect(typeof result.current.setTimeFilter).toBe('function');
    });

    test('RED: should update timeFilter when set', async () => {
      const { result } = renderHook(() => useHomeStats(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
      });

      act(() => {
        result.current.setTimeFilter('today');
      });

      expect(result.current.timeFilter).toBe('today');
    });
  });

  describe('RED: Refresh', () => {
    test('RED: should have refresh function', () => {
      const { result } = renderHook(() => useHomeStats(), { wrapper: Wrapper });
      expect(typeof result.current.refresh).toBe('function');
    });
  });
});
