/**
 * useModalItems Hook Tests
 * Tests the paginated modal items hook using its actual public API:
 *   useModalItems() → { items, isLoading, hasMore, error, loadMore, reset }
 * Loading is triggered by calling loadMore() or reset(), not on mount.
 * Uses statsService.fetchCardItems internally (not CrudService).
 */
import { UserContext } from '@app/context/auth.context';
import useModalItems from '@app/domains/HomeScreen/hooks/useModalItems';
import statsService from '@app/services/parse/stats/stats.service';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React, { useMemo } from 'react';

jest.mock('@app/services/parse/stats/stats.service');

const mockItems = [
  { objectId: '1', label: 'Item 1', _parseClass: 'SurveyData' },
  { objectId: '2', label: 'Item 2', _parseClass: 'SurveyData' },
  { objectId: '3', label: 'Item 3', _parseClass: 'SurveyData' },
  { objectId: '4', label: 'Item 4', _parseClass: 'SurveyData' },
  { objectId: '5', label: 'Item 5', _parseClass: 'SurveyData' },
  { objectId: '6', label: 'Item 6', _parseClass: 'SurveyData' },
  { objectId: '7', label: 'Item 7', _parseClass: 'SurveyData' },
  { objectId: '8', label: 'Item 8', _parseClass: 'SurveyData' },
  { objectId: '9', label: 'Item 9', _parseClass: 'SurveyData' },
  { objectId: '10', label: 'Item 10', _parseClass: 'SurveyData' },
];

const mockMoreItems = [
  { objectId: '11', label: 'Item 11', _parseClass: 'SurveyData' },
  { objectId: '12', label: 'Item 12', _parseClass: 'SurveyData' },
];

describe('useModalItems Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const Wrapper = ({ children }) => {
    const value = useMemo(
      () => ({
        user: {
          id: 'test-user',
          firstname: 'Test',
          lastname: 'User',
          username: 'test.user',
          organization: 'test-org',
        },
      }),
      []
    );
    return (
      <UserContext.Provider value={value}>
        {children}
      </UserContext.Provider>
    );
  };

  test('starts with empty state', () => {
    const { result } = renderHook(() => useModalItems(), { wrapper: Wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test('fetches items when loadMore is called', async () => {
    statsService.fetchCardItems.mockResolvedValue({ items: mockItems, hasMore: true });

    const { result } = renderHook(() => useModalItems(), { wrapper: Wrapper });

    await act(async () => {
      result.current.loadMore('mySurveys', 'today');
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(10);
      expect(result.current.isLoading).toBe(false);
    });

    expect(statsService.fetchCardItems).toHaveBeenCalledWith(
      'mySurveys',
      expect.any(String),
      expect.any(String),
      'today',
      0,
      10
    );
  });

  test('loadMore fetches next page', async () => {
    statsService.fetchCardItems
      .mockResolvedValueOnce({ items: mockItems, hasMore: true })
      .mockResolvedValueOnce({ items: mockMoreItems, hasMore: false });

    const { result } = renderHook(() => useModalItems(), { wrapper: Wrapper });

    await act(async () => {
      result.current.loadMore('mySurveys', 'today');
    });
    await waitFor(() => {
      expect(result.current.items).toHaveLength(10);
    });

    await act(async () => {
      result.current.loadMore('mySurveys', 'today');
    });
    await waitFor(() => {
      expect(result.current.items).toHaveLength(12);
    });

    expect(statsService.fetchCardItems).toHaveBeenCalledTimes(2);
    expect(statsService.fetchCardItems).toHaveBeenNthCalledWith(
      2,
      'mySurveys',
      expect.any(String),
      expect.any(String),
      'today',
      10,
      10
    );
  });

  test('sets hasMore to false when no more items', async () => {
    statsService.fetchCardItems.mockResolvedValue({ items: [mockItems[0]], hasMore: false });

    const { result } = renderHook(() => useModalItems(), { wrapper: Wrapper });

    await act(async () => {
      result.current.loadMore('mySurveys', 'today');
    });

    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });
  });

  test('reset clears items and resets offset', async () => {
    statsService.fetchCardItems
      .mockResolvedValueOnce({ items: mockItems, hasMore: true })
      .mockResolvedValueOnce({ items: mockMoreItems, hasMore: true })
      .mockResolvedValueOnce({ items: mockItems, hasMore: true });

    const { result } = renderHook(() => useModalItems(), { wrapper: Wrapper });

    await act(async () => {
      result.current.loadMore('mySurveys', 'today');
    });
    await waitFor(() => {
      expect(result.current.items).toHaveLength(10);
    });

    await act(async () => {
      result.current.loadMore('mySurveys', 'today');
    });
    await waitFor(() => {
      expect(result.current.items).toHaveLength(12);
    });

    await act(async () => {
      result.current.reset('mySurveys', 'today');
    });
    await waitFor(() => {
      expect(result.current.items).toHaveLength(10);
    });

    // Third call should be from offset 0 (reset)
    expect(statsService.fetchCardItems).toHaveBeenNthCalledWith(
      3,
      'mySurveys',
      expect.any(String),
      expect.any(String),
      'today',
      0,
      10
    );
  });

  test('handles fetch errors', async () => {
    statsService.fetchCardItems.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useModalItems(), { wrapper: Wrapper });

    await act(async () => {
      result.current.loadMore('mySurveys', 'today');
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });

  test('does not attempt loadMore when hasMore is false', async () => {
    statsService.fetchCardItems.mockResolvedValue({ items: [mockItems[0]], hasMore: false });

    const { result } = renderHook(() => useModalItems(), { wrapper: Wrapper });

    await act(async () => {
      result.current.loadMore('mySurveys', 'today');
    });
    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });

    // Attempt to load more - should be no-op
    await act(async () => {
      result.current.loadMore('mySurveys', 'today');
    });

    // Still only 1 call
    expect(statsService.fetchCardItems).toHaveBeenCalledTimes(1);
  });

  test('uses correct limit of 10 items per page', async () => {
    statsService.fetchCardItems.mockResolvedValue({ items: mockItems, hasMore: true });

    const { result } = renderHook(() => useModalItems(), { wrapper: Wrapper });

    await act(async () => {
      result.current.loadMore('orgVitals', 'week');
    });

    await waitFor(() => {
      expect(statsService.fetchCardItems).toHaveBeenCalled();
    });

    // Limit is the 6th argument (index 5)
    const [, , , , , limit] = statsService.fetchCardItems.mock.calls[0];
    expect(limit).toBe(10);
  });

  test('passes cardType and timeFilter through to service', async () => {
    statsService.fetchCardItems.mockResolvedValue({ items: [], hasMore: false });

    const { result } = renderHook(() => useModalItems(), { wrapper: Wrapper });

    await act(async () => {
      result.current.loadMore('recentActivity', 'all');
    });

    await waitFor(() => {
      expect(statsService.fetchCardItems).toHaveBeenCalledWith(
        'recentActivity',
        expect.any(String),
        expect.any(String),
        'all',
        0,
        10
      );
    });
  });

  test('handles mixed-class items from recentActivity', async () => {
    const mixedItems = [
      { objectId: '1', label: 'John Doe', _parseClass: 'SurveyData' },
      { objectId: '2', label: 'Dr. Smith', _parseClass: 'Vitals' },
      { objectId: '3', label: 'Medical Eval', _parseClass: 'EvaluationMedical' },
      { objectId: '4', label: 'Env Record', _parseClass: 'HistoryEnvironmentalHealth' },
    ];

    statsService.fetchCardItems.mockResolvedValue({ items: mixedItems, hasMore: false });

    const { result } = renderHook(() => useModalItems(), { wrapper: Wrapper });

    await act(async () => {
      result.current.loadMore('recentActivity', 'all');
    });

    await waitFor(() => {
      expect(result.current.items).toEqual(mixedItems);
    });

    // Verify items from multiple classes are preserved
    // eslint-disable-next-line no-underscore-dangle
    const classes = result.current.items.map((item) => item._parseClass);
    expect(new Set(classes).size).toBeGreaterThan(1);
  });
});
