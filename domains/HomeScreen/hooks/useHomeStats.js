import { UserContext } from '@app/context/auth.context';
import selectedENV from '@app/environment';
import client from '@app/services/parse/client';
import statsService from '@app/services/parse/stats/stats.service';
import { loadOrganizationScope } from '@modules/organization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext,useEffect, useState } from 'react';

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
  const [timeFilter, setTimeFilter] = useState('last7');
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
      // EVERY string this organization's records may carry. Records hold what
      // was COLLECTED and one organization's are spread across several: in
      // production Rayjon has 185 rows under "Rayjon" and 1196 under "Rayjon
      // Eye Clinic", so a single string undercounts by up to 89%. Cached, so it
      // still resolves offline; falls back to the account's own string.
      const organization = await loadOrganizationScope(
        user?.organization || '',
        client(selectedENV.TEST_MODE),
      );

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
  const refresh = () => fetchStats(timeFilter, true);

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
