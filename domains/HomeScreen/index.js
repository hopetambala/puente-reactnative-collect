import React, { useState, useContext } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, SegmentedButtons } from 'react-native-paper';
import Text from '@app/impacto-design-system/Base/Text';
import { spacing, typography } from '@modules/theme';
import StatCard from './components/StatCard';
import StatDetailModal from './components/StatDetailModal';
import useHomeStats from './hooks/useHomeStats';
import { UserContext } from '@app/context/auth.context';

function HomeScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useContext(UserContext);

  const {
    stats, isLoading, isOffline, timeFilter, setTimeFilter, refresh,
  } = useHomeStats();

  const [selectedCard, setSelectedCard] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 32,
    },
    welcomeSection: {
      paddingHorizontal: spacing.lg,
    },
    greeting: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    organization: {
      fontSize: 14,
      fontWeight: '400',
      marginBottom: 16,
    },
    offlineBanner: {
      marginBottom: 16,
      marginHorizontal: spacing.lg,
      padding: 12,
      borderRadius: 8,
      backgroundColor: isDark ? '#ff9800' : '#fff3e0',
    },
    offlineText: {
      fontSize: 12,
      fontWeight: '500',
    },
    filterSection: {
      marginBottom: 20,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
    },
    recentActivityRow: {
      marginBottom: 12,
      paddingHorizontal: spacing.lg,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.lg,
    },
  });

  if (!user) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.scrollContent}>
          <Text style={[styles.greeting, { color: theme.colors.onBackground }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={(
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        )}
      >
        {/* Title Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
          <Text style={[typography.heading2, { fontWeight: 'bold', color: theme.colors.onSurface, marginTop: spacing.sm }]}>
            Home
          </Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.greeting, { color: theme.colors.onSurfaceVariant }]}>
            Welcome back, {user.firstname}
          </Text>
          <Text
            style={[
              styles.organization,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {user.organization}
          </Text>
        </View>

        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={[styles.offlineText, { color: '#f57c00' }]}>
              📱 Showing cached data
            </Text>
          </View>
        )}

        {/* Time Filter */}
        <View style={styles.filterSection}>
          <SegmentedButtons
            value={timeFilter}
            onValueChange={setTimeFilter}
            buttons={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'all', label: 'All Time' },
            ]}
          />
        </View>

        {/* Recent Activity - Full Width */}
        {stats && (
          <>
            <View style={styles.recentActivityRow}>
              <StatCard
                title="Recent Activity"
                icon="history"
                count={stats.recentActivity?.count ?? 0}
                previous={undefined}
                timeFilter="all"
                onPress={() => setSelectedCard('recentActivity')}
                isLoading={isLoading}
                fullWidth
              />
            </View>

            {/* 2x2 Grid */}
            <View style={styles.grid}>
              <StatCard
                title="My Surveys"
                icon="clipboard-check"
                count={stats.mySurveys?.count ?? 0}
                previous={stats.mySurveys?.previous}
                timeFilter={timeFilter}
                onPress={() => setSelectedCard('mySurveys')}
                isLoading={isLoading}
                fullWidth={false}
              />
              <StatCard
                title="Org Surveys"
                icon="office-building"
                count={stats.orgSurveys?.count ?? 0}
                previous={stats.orgSurveys?.previous}
                timeFilter={timeFilter}
                onPress={() => setSelectedCard('orgSurveys')}
                isLoading={isLoading}
                fullWidth={false}
              />
              <StatCard
                title="My Vitals"
                icon="pulse"
                count={stats.myVitals?.count ?? 0}
                previous={stats.myVitals?.previous}
                timeFilter={timeFilter}
                onPress={() => setSelectedCard('myVitals')}
                isLoading={isLoading}
                fullWidth={false}
              />
              <StatCard
                title="Org Vitals"
                icon="hospital-box"
                count={stats.orgVitals?.count ?? 0}
                previous={stats.orgVitals?.previous}
                timeFilter={timeFilter}
                onPress={() => setSelectedCard('orgVitals')}
                isLoading={isLoading}
                fullWidth={false}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Detail Modal */}
      {selectedCard && (
        <StatDetailModal
          visible={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          title={selectedCard ? selectedCard.replace(/([A-Z])/g, ' $1').trim() : ''}
          cardType={selectedCard}
          timeFilter={timeFilter}
        />
      )}
    </SafeAreaView>
  );
}

export default HomeScreen;
