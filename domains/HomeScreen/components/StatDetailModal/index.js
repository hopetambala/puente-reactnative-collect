import useModalItems from '@app/domains/HomeScreen/hooks/useModalItems';
import Text from '@app/impacto-design-system/Base/Text';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import I18n from '@modules/i18n';
import { MOTION_TOKENS } from '@modules/utils/animations';
import React, { useEffect } from 'react';
import {
FlatList,   Modal, Pressable,
StyleSheet, useColorScheme, View, } from 'react-native';
import { Button,useTheme } from 'react-native-paper';
import Animated, { Keyframe } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Spec §5.4: Bottom-up staggered row entrance
const RowEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 8 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
});

/**
 * StatDetailModal Component
 * Shows paginated list of items for a selected stat card
 */
function StatDetailModal({
  visible,
  onClose,
  title,
  cardType,
  timeFilter,
}) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const {
    items, isLoading, hasMore, loadMore, reset,
  } = useModalItems();

  // Load first page when modal becomes visible
  useEffect(() => {
    if (visible && cardType && timeFilter) {
      reset(cardType, timeFilter);
    }
  }, [visible, cardType, timeFilter]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#f0f0f0',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
    },
    closeButton: {
      padding: 8,
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    itemRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#f0f0f0',
    },
    itemLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    itemMeta: {
      fontSize: 12,
      marginTop: 4,
    },
    loadMoreContainer: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
    },
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item, index }) => {
    let metaText = '';
    if (cardType === 'recentActivity') {
      // eslint-disable-next-line no-underscore-dangle
      metaText = `${item._parseClass} • ${item.label} • ${formatDate(item.createdAt)}`;
    } else {
      metaText = `${formatDate(item.createdAt)}`;
    }

    return (
      <Animated.View
        style={styles.itemRow}
        entering={RowEntrance
          .delay(Math.min(index * 50, 300))
          .duration(MOTION_TOKENS.duration.base)}
      >
        <Text
          style={[
            styles.itemLabel,
            { color: isDark ? theme.colors.onSurface : theme.colors.onSurface },
          ]}
        >
          {item.label}
        </Text>
        <Text
          style={[
            styles.itemMeta,
            { color: isDark ? theme.colors.onSurfaceVariant : theme.colors.onSurfaceVariant },
          ]}
        >
          {metaText}
        </Text>
      </Animated.View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
            {title}
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={16}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={isDark ? '#fff' : '#000'}
            />
          </Pressable>
        </View>

        {/* List or Empty State */}
        {items && items.length > 0 ? (
          <FlatList
            style={styles.listContainer}
            data={items}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.objectId}-${index}`}
            onEndReached={() => {
              if (hasMore && !isLoading) {
                loadMore(cardType, timeFilter);
              }
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              hasMore ? (
                <View style={styles.loadMoreContainer}>
                  <Button
                    mode="outlined"
                    onPress={() => loadMore(cardType, timeFilter)}
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    {I18n.t('global.loadMore')}
                  </Button>
                </View>
              ) : null
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyText,
                { color: isDark ? theme.colors.onSurfaceVariant : theme.colors.onSurfaceVariant },
              ]}
            >
              {isLoading ? 'Loading...' : 'No items found'}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

export default StatDetailModal;
