import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Animated tab bar with sliding tinted pill indicator.
 * Solid elevated surface with proportional tab sizing and smooth
 * spring-animated pill that slides behind the active tab.
 *
 * All colors are derived from the theme so that light and dark mode
 * work automatically.
 */

const BAR_HEIGHT = 56;
const BAR_SIDE_MARGIN = 16;
const BAR_BOTTOM_MARGIN = 10;
const PILL_INSET = 4;

const ACTIVE_WEIGHT = 1.5;
const INACTIVE_WEIGHT = 1;

/**
 * Convert a hex color to rgba with a given alpha.
 */
function withAlpha(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function AnimatedTabBar({ state, descriptors, navigation, onTabPress }) {
  const theme = useTheme();
  const isDark = theme.dark;
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const tabCount = state.routes.length;
  const barWidth = screenWidth - BAR_SIDE_MARGIN * 2;

  const totalWeight = ACTIVE_WEIGHT + (tabCount - 1) * INACTIVE_WEIGHT;
  const activeWidth = (barWidth * ACTIVE_WEIGHT) / totalWeight;
  const inactiveWidth = (barWidth * INACTIVE_WEIGHT) / totalWeight;

  const pillWidth = activeWidth - PILL_INSET * 2;
  const pillHeight = BAR_HEIGHT - PILL_INSET * 2;

  const pillTargetX = useMemo(
    () => state.index * inactiveWidth + PILL_INSET,
    [state.index, inactiveWidth]
  );
  const pillX = useSharedValue(pillTargetX);

  useEffect(() => {
    pillX.value = withSpring(pillTargetX, MOTION_TOKENS.spring.smooth);
  }, [pillTargetX, pillX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  // Derive colors from theme tokens
  const pillColor = withAlpha(theme.colors.primary, isDark ? 0.18 : 0.12);

  return (
    <View
      style={[
        styles.outerContainer,
        {
          paddingBottom: (insets.bottom || 8) + BAR_BOTTOM_MARGIN,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.barContainer,
          {
            width: barWidth,
            backgroundColor: theme.colors.surface,
            shadowOpacity: isDark ? 0.2 : 0.08,
          },
        ]}
      >
        {/* Sliding pill indicator */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pill,
            {
              width: pillWidth,
              height: pillHeight,
              borderRadius: pillHeight / 2,
              backgroundColor: pillColor,
            },
            pillStyle,
          ]}
        />

        {/* Tab buttons */}
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const isCenter = route.name === "Home";

            const onPress = () => {
              if (onTabPress) {
                onTabPress(index);
              } else {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  triggerTabHaptic(isCenter);
                  navigation.navigate({ name: route.name, merge: true });
                }
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <TabButton
                key={route.key}
                isFocused={isFocused}
                activeWidth={activeWidth}
                inactiveWidth={inactiveWidth}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
                renderIcon={options.tabBarIcon}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

/**
 * Single tab button with proportional width animation and press feedback.
 */
function TabButton({ isFocused, activeWidth, inactiveWidth, onPress, onLongPress, accessibilityLabel, renderIcon }) {
  const targetWidth = isFocused ? activeWidth : inactiveWidth;
  const width = useSharedValue(targetWidth);
  const press = useSharedValue(1);

  useEffect(() => {
    width.value = withSpring(targetWidth, MOTION_TOKENS.spring.smooth);
  }, [targetWidth, width]);

  const containerStyle = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ scale: press.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        press.value = withSpring(0.92, MOTION_TOKENS.spring.tight);
      }}
      onPressOut={() => {
        press.value = withSpring(1, MOTION_TOKENS.spring.snappy);
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={[styles.tabButtonInner, containerStyle]}
      >
        {renderIcon && renderIcon({ focused: isFocused })}
      </Animated.View>
    </Pressable>
  );
}

/**
 * Haptic feedback for tab presses — medium for center tab, light for others.
 */
function triggerTabHaptic(isCenter) {
  try {
    // eslint-disable-next-line global-require
    const Haptics = require("expo-haptics");
    Haptics.impactAsync(
      isCenter ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
  } catch (e) {
    // Haptics unavailable — skip silently
  }
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: BAR_SIDE_MARGIN,
    paddingTop: 8,
  },
  barContainer: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  pill: {
    position: "absolute",
    top: PILL_INSET,
    left: 0,
  },
  tabRow: {
    flexDirection: "row",
    flex: 1,
  },
  tabButtonInner: {
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AnimatedTabBar;
