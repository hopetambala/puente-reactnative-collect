import { ANIMATION_TIMINGS } from "@modules/utils/animations";
import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Custom animated tab bar with sliding indicator (Reanimated)
 * Replaces default React Navigation bottom tab bar with timing-animated indicator
 */
const TAB_BAR_PADDING_HORIZONTAL = 80;
const INDICATOR_WIDTH = 40;

function AnimatedTabBar({ state, descriptors, navigation, onTabPress }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const indicatorPosition = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate indicator position and animate when active tab changes or container is measured
  useEffect(() => {
    if (containerWidth === 0) return;

    const tabWidth = (containerWidth - TAB_BAR_PADDING_HORIZONTAL * 2) / state.routes.length;
    const targetPosition = TAB_BAR_PADDING_HORIZONTAL + state.index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;

    indicatorPosition.value = withTiming(targetPosition, {
      duration: ANIMATION_TIMINGS.TAB_TRANSITION,
    });
  }, [state.index, state.routes.length, containerWidth, indicatorPosition]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={{
        flexDirection: "row",
        backgroundColor: theme.colors.background,
        borderTopWidth: 0,
        elevation: 8,
        paddingTop: 8,
        paddingHorizontal: TAB_BAR_PADDING_HORIZONTAL,
        paddingBottom: insets.bottom || 8,
        position: "relative",
      }}
    >
      {/* Animated indicator under active tab */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            height: 3,
            width: INDICATOR_WIDTH,
            backgroundColor: theme.colors.primary,
            borderRadius: 1.5,
          },
          indicatorStyle,
        ]}
      />

      {/* Tab buttons */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          if (onTabPress) {
            // Custom navigator mode (PagerView-based)
            onTabPress(index);
          } else {
            // Standard React Navigation mode
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
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
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? (typeof label === "string" ? label : route.name)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 8,
              paddingHorizontal: 4,
            }}
          >
            {options.tabBarIcon && options.tabBarIcon({ focused: isFocused })}
          </Pressable>
        );
      })}
    </View>
  );
}

export default AnimatedTabBar;
