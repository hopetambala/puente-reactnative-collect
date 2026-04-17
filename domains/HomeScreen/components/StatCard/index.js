import Text from '@app/impacto-design-system/Base/Text';
import ModernCard from '@app/impacto-design-system/Cards/ModernCard';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MOTION_TOKENS } from '@modules/utils/animations';
import React, { useEffect, useMemo } from 'react';
import {
StyleSheet, useColorScheme,
  View, } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * Hook for skeleton shimmer effect — opacity cycles 0.4 → 1.0 (spec §5.7 loading states)
 */
function useSkeletonShimmer() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: MOTION_TOKENS.duration.slow }),
        withTiming(0.4, { duration: MOTION_TOKENS.duration.slow }),
      ),
      -1,
    );
  }, [opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

// Spec §5.4: Bottom-up staggered card entrance — scale + translateY + opacity
// Consistent pattern with SmallCardsCarousel and FormsHorizontalView
const CardEntrance = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: 10 }, { scale: 0.98 }],
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
  },
});

/**
 * StatCard Component
 * Displays a statistic with count, trend, and icon
 */
function StatCard({
  title,
  icon,
  count,
  previous,
  timeFilter,
  onPress,
  isLoading,
  fullWidth,
  index = 0, // Stagger delay index (spec §5.4: 50ms per item)
}) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const shimmerStyle = useSkeletonShimmer();

  // Calculate trend percentage
  const trend = useMemo(() => {
    if (timeFilter === 'all' || previous === 0 || previous === undefined) {
      return null;
    }
    const trendValue = ((count - previous) / previous) * 100;
    return {
      value: trendValue,
      isPositive: trendValue >= 0,
      label: `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(0)}%`,
    };
  }, [count, previous, timeFilter]);

  const styles = StyleSheet.create({
    container: {
      width: fullWidth ? '100%' : '50%',
      paddingHorizontal: fullWidth ? 0 : 6,
      marginVertical: 8,
    },
    cardContent: {
      padding: 0,
      minWidth: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    titleSection: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 4,
      flexWrap: 'wrap',
    },
    icon: {
      marginLeft: 8,
    },
    countContainer: {
      marginBottom: 8,
    },
    count: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 20,
    },
    trendText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    skeletonContainer: {
      gap: 8,
    },
    skeletonBar: {
      height: 12,
      borderRadius: 4,
      marginBottom: 8,
    },
    skeletonBarLarge: {
      height: 24,
      borderRadius: 4,
      marginBottom: 8,
    },
  });

  if (isLoading) {
    return (
      <Animated.View
        style={styles.container}
        entering={CardEntrance
          .delay(index * 50)
          .duration(MOTION_TOKENS.duration.base)}
      >
        <ModernCard style={styles.cardContent}>
          <View style={styles.skeletonContainer}>
            <Animated.View
              style={[
                styles.skeletonBar,
                { backgroundColor: isDark ? '#333' : '#e0e0e0', width: '70%' },
                shimmerStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonBarLarge,
                { backgroundColor: isDark ? '#333' : '#e0e0e0', width: '100%' },
                shimmerStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonBar,
                { backgroundColor: isDark ? '#333' : '#e0e0e0', width: '50%' },
                shimmerStyle,
              ]}
            />
          </View>
        </ModernCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={styles.container}
      entering={CardEntrance
        .delay(index * 50)
        .duration(MOTION_TOKENS.duration.base)}
    >
      <ModernCard style={styles.cardContent} shadow onPress={onPress}>
        <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text
                style={[
                  styles.title,
                  {
                    color: isDark ? theme.colors.onSurfaceVariant : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {title}
              </Text>
            </View>
            <View style={styles.icon}>
              <MaterialCommunityIcons
                name={icon}
                size={24}
                color={theme.colors.primary}
              />
            </View>
          </View>

          <View style={styles.countContainer}>
            <Text
              style={[
                styles.count,
                {
                  color: isDark ? theme.colors.onSurface : theme.colors.onSurface,
                },
              ]}
            >
              {count ?? 0}
            </Text>
          </View>

          {trend && (
            <View style={styles.trendContainer}>
              <MaterialCommunityIcons
                name={trend.isPositive ? 'trending-up' : 'trending-down'}
                size={16}
                color={trend.isPositive ? '#4caf50' : '#f44336'}
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color: trend.isPositive ? '#4caf50' : '#f44336',
                  },
                ]}
              >
                {trend.label}
              </Text>
            </View>
          )}
        </ModernCard>
    </Animated.View>
  );
}

export default StatCard;
