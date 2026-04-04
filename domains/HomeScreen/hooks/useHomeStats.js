import { useEffect, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import statsService from '@app/services/parse/stats/stats.service';
import { UserContext } from '@app/context/auth.context';

const CACHE_KEY = 'homeStats_cache';

/**
 * useHomeStats
 * Manages stats data for HomeScreen with caching and offline support
 * Returns: { stats, isLoading, isOffline, timeFilter, setTimeFilter, refresh }
 */
export default function useHomeStats() {
  const { user } = useContext(UserContext);

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [isOffline, setIsOffline] = useState(false);

  /**
   * Fetch stats from cloud or cache
   */
  const fetchStats = async (filter, forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load from cache first
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        const cachedFilter = await AsyncStorage.getItem(`${CACHE_KEY}_filter`);

        if (cached && cachedFilter === filter) {
          const parsedCache = JSON.parse(cached);
          setStats(parsedCache);
          setIsLoading(false);
          return;
        }
      }

      // Fetch fresh data from cloud (we're assuming we're online)
      // surveyingUser in Parse is stored as "Firstname Lastname" by surveyingUserFailsafe
      const surveyingUser = `${user?.firstname || ''} ${user?.lastname || ''}`.trim() || user?.username || '';
      const organization = user?.organization?.id || user?.organization?.objectId || user?.organization || '';

      const response = await statsService.aggregateStats(surveyingUser, organization, filter);
      
      setStats(response);
      setIsOffline(false);

      // Cache the response
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(response));
      await AsyncStorage.setItem(`${CACHE_KEY}_filter`, filter);

      setIsLoading(false);
    } catch (err) {
      setError(err);
      setIsLoading(false);

      // Fall back to cache on error
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          setStats(JSON.parse(cached));
          setIsOffline(true);
        }
      } catch (cacheErr) {
        // Cache read failed silently
      }
    }
  };

  /**
   * On mount: load cache immediately, then fetch fresh if online
   */
  useEffect(() => {
    if (user?.id || user?.objectId) {
      fetchStats(timeFilter).catch(() => {
        // Error handling via state
      });
    }
  }, [user, timeFilter]);

  /**
   * Set time filter and re-fetch
   */
  const handleSetTimeFilter = (filter) => {
    setTimeFilter(filter);
  };

  /**
   * Manual refresh
   */
  const refresh = () => {
    fetchStats(timeFilter, true);
  };

  return {
    stats,
    isLoading,
    error,
    timeFilter,
    setTimeFilter: handleSetTimeFilter,
    refresh,
    isOffline,
  };
}
