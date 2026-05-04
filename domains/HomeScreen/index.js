import { UserContext } from '@app/context/auth.context';
import Text from '@app/impacto-design-system/Base/Text';
import I18n from '@modules/i18n';
import { spacing, typography } from '@modules/theme';
import { MOTION_TOKENS } from '@modules/utils/animations';
import React, { useContext,useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { SegmentedButtons,useTheme } from 'react-native-paper';
import Animated, { Keyframe } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoachmarkOverlay } from './components/CoachmarkOverlay';
import StatCard from './components/StatCard';
import StatDetailModal from './components/StatDetailModal';
import useHomeStats from './hooks/useHomeStats';

// Spec §5.4 STANDARD: section header + welcome fade+lift entrance
const SectionEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 6 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
});

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
            {I18n.t('home.loading')}
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
        <Animated.View
          entering={SectionEntrance.delay(0).duration(MOTION_TOKENS.duration.base)}
          style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
        >
          <Text style={[typography.heading2, { fontWeight: 'bold', color: theme.colors.onSurface, marginTop: spacing.sm }]}>
            {I18n.t('home.title')}
          </Text>
        </Animated.View>

        {/* Welcome Section */}
        <Animated.View
          entering={SectionEntrance.delay(50).duration(MOTION_TOKENS.duration.base)}
          style={styles.welcomeSection}
        >
          <Text style={[styles.greeting, { color: theme.colors.onSurfaceVariant }]}>
            {I18n.t('home.welcomeBack', { name: user.firstname })}
          </Text>
          <Text
            style={[
              styles.organization,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {user.organization || ''}
          </Text>
        </Animated.View>

        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={[styles.offlineText, { color: '#f57c00' }]}>
              {I18n.t('home.offlineCached')}
            </Text>
          </View>
        )}

        {/* Time Filter */}
        <View style={styles.filterSection}>
          <SegmentedButtons
            value={timeFilter}
            onValueChange={setTimeFilter}
            buttons={[
              { value: 'today', label: I18n.t('home.today') },
              { value: 'week', label: I18n.t('home.thisWeek') },
              { value: 'all', label: I18n.t('home.allTime') },
            ]}
          />
        </View>

        {/* Recent Activity - Full Width */}
        {stats && (
          <>
            <View style={styles.recentActivityRow}>
              <StatCard
                title={I18n.t('home.recentActivity')}
                icon="history"
                count={stats.recentActivity?.count ?? 0}
                previous={undefined}
                timeFilter="all"
                onPress={() => setSelectedCard('recentActivity')}
                isLoading={isLoading}
                fullWidth
                index={0}
              />
            </View>

            {/* 2x2 Grid */}
            <View style={styles.grid}>
              <StatCard
                title={I18n.t('home.mySurveys')}
                icon="clipboard-check"
                count={stats.mySurveys?.count ?? 0}
                previous={stats.mySurveys?.previous}
                timeFilter={timeFilter}
                onPress={() => setSelectedCard('mySurveys')}
                isLoading={isLoading}
                fullWidth={false}
                index={1}
              />
              <StatCard
                title={I18n.t('home.orgSurveys')}
                icon="office-building"
                count={stats.orgSurveys?.count ?? 0}
                previous={stats.orgSurveys?.previous}
                timeFilter={timeFilter}
                onPress={() => setSelectedCard('orgSurveys')}
                isLoading={isLoading}
                fullWidth={false}
                index={2}
              />
              <StatCard
                title={I18n.t('home.myVitals')}
                icon="pulse"
                count={stats.myVitals?.count ?? 0}
                previous={stats.myVitals?.previous}
                timeFilter={timeFilter}
                onPress={() => setSelectedCard('myVitals')}
                isLoading={isLoading}
                fullWidth={false}
                index={3}
              />
              <StatCard
                title={I18n.t('home.orgVitals')}
                icon="hospital-box"
                count={stats.orgVitals?.count ?? 0}
                previous={stats.orgVitals?.previous}
                timeFilter={timeFilter}
                onPress={() => setSelectedCard('orgVitals')}
                isLoading={isLoading}
                fullWidth={false}
                index={4}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Detail Modal - always mounted, visible prop controls display */}
      <StatDetailModal
        visible={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        title={selectedCard ? selectedCard.replace(/([A-Z])/g, ' $1').trim() : ''}
        cardType={selectedCard}
        timeFilter={timeFilter}
      />

      {/* Home screen coachmark — shown once on first visit */}
      <CoachmarkOverlay
        seenKey="home"
        icon="bar-chart-outline"
        title={I18n.t("coachmarks.homeTitle")}
        description={I18n.t("coachmarks.homeDescription")}
      />
    </SafeAreaView>
  );
}

export default HomeScreen;
