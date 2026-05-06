import { MOTION_TOKENS } from "@modules/utils/animations";
import { BlurView } from "expo-blur";
import React, { useEffect, useMemo } from "react";
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Glassmorphic animated tab bar with sliding pill indicator.
 * Floating bar with frosted-glass backdrop, proportional tab sizing,
 * and smooth spring-animated pill that slides behind the active tab.
 *
 * All colors are derived from the theme so that light and dark mode
 * work automatically — no hardcoded rgba values.
 *
 * Falls back to a solid semi-transparent background on Android if
 * BlurView is unavailable.
 */

const BAR_HEIGHT = 58;
const BAR_SIDE_MARGIN = 14;
const BAR_BOTTOM_MARGIN = 10;
const PILL_INSET = 4;

const ACTIVE_WEIGHT = 2.3;
const INACTIVE_WEIGHT = 1;

/**
 * Append an alpha hex pair to a 6-digit hex color.
 * e.g. withAlpha("#ff0000", 0.5) → "rgba(255,0,0,0.5)"
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

  // Derive all colors from theme tokens
  const blurTint = isDark ? "dark" : "light";
  const glassBackground = withAlpha(
    isDark ? theme.colors.surfaceVariant : theme.colors.surface,
    isDark ? 0.7 : 0.55
  );
  const rimBorderColor = withAlpha(theme.colors.outline, isDark ? 0.15 : 0.25);
  const barShadowColor = theme.colors.surfaceOverlay;
  const barShadowOpacity = isDark ? 0.3 : 0.12;

  return (
    <View
      style={{
        paddingHorizontal: BAR_SIDE_MARGIN,
        paddingTop: 8,
        paddingBottom: (insets.bottom || 8) + BAR_BOTTOM_MARGIN,
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          width: barWidth,
          height: BAR_HEIGHT,
          borderRadius: BAR_HEIGHT / 2,
          overflow: "hidden",
          shadowColor: barShadowColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: barShadowOpacity,
          shadowRadius: 24,
          elevation: 10,
          backgroundColor: glassBackground,
        }}
      >
        {/* Frosted glass backdrop */}
        <BlurView
          intensity={Platform.OS === "ios" ? 90 : 110}
          tint={blurTint}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Hairline rim */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: BAR_HEIGHT / 2,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: rimBorderColor,
            },
          ]}
        />

        {/* Sliding pill indicator */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: PILL_INSET,
              left: 0,
              width: pillWidth,
              height: pillHeight,
              borderRadius: pillHeight / 2,
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 4,
            },
            pillStyle,
          ]}
        />

        {/* Tab buttons */}
        <View style={{ flexDirection: "row", flex: 1 }}>
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

            const label = options.tabBarLabel ?? options.title ?? route.name;

            return (
              <TabButton
                key={route.key}
                isFocused={isFocused}
                activeWidth={activeWidth}
                inactiveWidth={inactiveWidth}
                onPress={onPress}
                onLongPress={onLongPress}
                label={typeof label === "string" ? label : route.name}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? (typeof label === "string" ? label : route.name)}
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
function TabButton({ isFocused, activeWidth, inactiveWidth, onPress, onLongPress, label, accessibilityLabel, renderIcon }) {
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
        style={[
          {
            height: BAR_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            paddingHorizontal: 6,
          },
          containerStyle,
        ]}
      >
        {renderIcon && renderIcon({ focused: isFocused, label })}
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

export default AnimatedTabBar;
