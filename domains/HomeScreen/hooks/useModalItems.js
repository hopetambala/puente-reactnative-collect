import { UserContext } from '@app/context/auth.context';
import statsService from '@app/services/parse/stats/stats.service';
import { useContext,useState } from 'react';

const ITEMS_PER_PAGE = 10;

/**
 * useModalItems
 * Manages paginated modal items for detail view
 * Returns: { items, isLoading, hasMore, loadMore, reset }
 */
export default function useModalItems() {
  const { user } = useContext(UserContext);

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load a specific page of items
   * @param {string} cardType - 'mySurveys'|'orgSurveys'|'myVitals'|'orgVitals'|'recentActivity'
   * @param {string} timeFilter - 'today'|'week'|'all'
   * @param {boolean} reset - if true, clears items and starts from offset 0
   */
  const loadPage = async (cardType, timeFilter, reset = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const newOffset = reset ? 0 : offset;

      // surveyingUser in Parse is stored as "Firstname Lastname" by surveyingUserFailsafe
      const surveyingUser = `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || user?.username || '';
      const organization = user?.organization?.id || user?.organization?.objectId || user?.organization || '';

      const response = await statsService.fetchCardItems(
        cardType,
        surveyingUser,
        organization,
        timeFilter,
        newOffset,
        ITEMS_PER_PAGE,
      );

      if (reset) {
        setItems(response.items);
      } else {
        setItems((prev) => [...prev, ...response.items]);
      }

      setOffset(newOffset + ITEMS_PER_PAGE);
      setHasMore(response.hasMore);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading modal items:', err); // eslint-disable-line
      setError(err);
      setIsLoading(false);
    }
  };

  /**
   * Load more items (next page)
   * @param {string} cardType
   * @param {string} timeFilter
   */
  const loadMore = async (cardType, timeFilter) => {
    if (!hasMore || isLoading) return;
    loadPage(cardType, timeFilter, false);
  };

  /**
   * Reset and load first page
   * @param {string} cardType
   * @param {string} timeFilter
   */
  const reset = async (cardType, timeFilter) => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    loadPage(cardType, timeFilter, true);
  };

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
  };
}
