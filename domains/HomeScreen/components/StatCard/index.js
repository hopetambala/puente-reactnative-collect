import Text from '@app/impacto-design-system/Base/Text';
import ModernCard from '@app/impacto-design-system/Cards/ModernCard';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo } from 'react';
import {
StyleSheet, useColorScheme,
  View, } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated from 'react-native-reanimated';

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
}) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      <View style={styles.container}>
        <ModernCard style={styles.cardContent}>
          <View style={styles.skeletonContainer}>
            <Animated.View
              style={[
                styles.skeletonBar,
                {
                  backgroundColor: isDark ? '#333' : '#e0e0e0',
                  width: '70%',
                },
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonBarLarge,
                {
                  backgroundColor: isDark ? '#333' : '#e0e0e0',
                  width: '100%',
                },
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonBar,
                {
                  backgroundColor: isDark ? '#333' : '#e0e0e0',
                  width: '50%',
                },
              ]}
            />
          </View>
        </ModernCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernCard style={styles.cardContent} shadow onPress={onPress}>
        <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text
                numberOfLines={0}
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
              numberOfLines={0}
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
    </View>
  );
}

export default StatCard;
