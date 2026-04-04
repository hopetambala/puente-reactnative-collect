import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { useModalItems } from '../useModalItems';
import * as CrudService from '../../../services/parse/crud';

jest.mock('../../../services/parse/crud');

jest.mock('../../../context/auth.context', () => ({
  UserContext: React.createContext({
    user: { id: 'test-user', organization: 'test-org' },
  }),
  useUserContext: () => ({
    user: { id: 'test-user', organization: { id: 'test-org' } },
  }),
}));

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

  test('returns initial loading state', () => {
    CrudService.aggregateStatsItems.mockResolvedValue({
      items: mockItems,
      hasMore: true,
    });

    const TestComponent = () => {
      const { items, isLoading } = useModalItems('mySurveys', 'today');
      return (
        <>
          {isLoading && <text>Loading</text>}
          {items && items.length > 0 && <text>{items.length}</text>}
        </>
      );
    };

    const { getByText } = render(<TestComponent />);
    expect(getByText('Loading')).toBeDefined();
  });

  test('fetches initial page on mount', async () => {
    CrudService.aggregateStatsItems.mockResolvedValue({
      items: mockItems,
      hasMore: true,
    });

    const TestComponent = () => {
      const { items, isLoading } = useModalItems('mySurveys', 'today');
      return (
        <>
          {isLoading && <text>Loading</text>}
          {items && items.length > 0 && <text>{items.length}</text>}
        </>
      );
    };

    const { getByText, queryByText } = render(<TestComponent />);

    await waitFor(() => {
      expect(queryByText('Loading')).toBeNull();
    });

    expect(getByText('10')).toBeDefined();
    expect(CrudService.aggregateStatsItems).toHaveBeenCalledWith(
      'mySurveys',
      'today',
      0,
      10
    );
  });

  test('loadMore fetches next page', async () => {
    CrudService.aggregateStatsItems
      .mockResolvedValueOnce({ items: mockItems, hasMore: true })
      .mockResolvedValueOnce({ items: mockMoreItems, hasMore: false });

    let loadMoreFn;
    const TestComponent = () => {
      const { items, isLoading, loadMore } = useModalItems('mySurveys', 'today');
      loadMoreFn = loadMore;
      return (
        <>
          {isLoading && <text>Loading</text>}
          {items && items.length > 0 && <text>{items.length}</text>}
        </>
      );
    };

    const { getByText } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByText('10')).toBeDefined();
    });

    await act(async () => {
      await loadMoreFn();
    });

    await waitFor(() => {
      expect(getByText('12')).toBeDefined();
    });

    expect(CrudService.aggregateStatsItems).toHaveBeenCalledTimes(2);
    expect(CrudService.aggregateStatsItems).toHaveBeenNthCalledWith(
      2,
      'mySurveys',
      'today',
      10,
      10
    );
  });

  test('sets hasMore to false when no more items', async () => {
    CrudService.aggregateStatsItems.mockResolvedValue({
      items: [mockItems[0]],
      hasMore: false,
    });

    let hasMore;
    const TestComponent = () => {
      const state = useModalItems('mySurveys', 'today');
      hasMore = state.hasMore;
      return <text>Test</text>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(hasMore).toBe(false);
    });
  });

  test('reset clears items and resets offset', async () => {
    CrudService.aggregateStatsItems
      .mockResolvedValueOnce({ items: mockItems, hasMore: true })
      .mockResolvedValueOnce({ items: mockItems, hasMore: true });

    let loadMoreFn, resetFn;
    const TestComponent = () => {
      const { items, loadMore, reset } = useModalItems('mySurveys', 'today');
      loadMoreFn = loadMore;
      resetFn = reset;
      return <text>{items.length}</text>;
    };

    const { getByText } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByText('10')).toBeDefined();
    });

    // Load more items
    await act(async () => {
      await loadMoreFn();
    });

    // Reset
    await act(async () => {
      await resetFn();
    });

    await waitFor(() => {
      // Should re-fetch first page
      expect(CrudService.aggregateStatsItems).toHaveBeenLastCalledWith(
        'mySurveys',
        'today',
        0,
        10
      );
    });
  });

  test('handles fetch errors', async () => {
    const errorMessage = 'Network error';
    CrudService.aggregateStatsItems.mockRejectedValue(new Error(errorMessage));

    let error;
    const TestComponent = () => {
      const state = useModalItems('mySurveys', 'today');
      error = state.error;
      return <text>{error || 'No error'}</text>;
    };

    const { getByText } = render(<TestComponent />);

    await waitFor(() => {
      expect(error).toBeTruthy();
    });
  });

  test('does not attempt loadMore when hasMore is false', async () => {
    CrudService.aggregateStatsItems.mockResolvedValue({
      items: [mockItems[0]],
      hasMore: false,
    });

    let loadMoreFn;
    const TestComponent = () => {
      const { items, loadMore } = useModalItems('mySurveys', 'today');
      loadMoreFn = loadMore;
      return <text>{items.length}</text>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(CrudService.aggregateStatsItems).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await loadMoreFn();
    });

    // Should still be 1 call since hasMore is false
    expect(CrudService.aggregateStatsItems).toHaveBeenCalledTimes(1);
  });

  test('uses correct limit of 10 items per page', async () => {
    CrudService.aggregateStatsItems.mockResolvedValue({
      items: mockItems,
      hasMore: true,
    });

    const TestComponent = () => {
      useModalItems('orgVitals', 'week');
      return <text>Test</text>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      const lastCall = CrudService.aggregateStatsItems.mock.calls[0];
      expect(lastCall[3]).toBe(10); // limit parameter
    });
  });

  test('passes cardType and timeFilter through to service', async () => {
    CrudService.aggregateStatsItems.mockResolvedValue({
      items: [],
      hasMore: false,
    });

    const TestComponent = () => {
      useModalItems('recentActivity', 'all');
      return <text>Test</text>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(CrudService.aggregateStatsItems).toHaveBeenCalledWith(
        'recentActivity',
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

    CrudService.aggregateStatsItems.mockResolvedValue({
      items: mixedItems,
      hasMore: false,
    });

    let items;
    const TestComponent = () => {
      const state = useModalItems('recentActivity', 'all');
      items = state.items;
      return <text>Test</text>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(items).toEqual(mixedItems);
    });

    // Verify we have items from multiple classes
    const classes = items.map((item) => item._parseClass);
    expect(new Set(classes).size).toBeGreaterThan(1);
  });
});
