import { ANIMATION_TIMINGS } from "@modules/utils/animations";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Custom animated tab bar with sliding indicator
 * Replaces default React Navigation bottom tab bar with spring-animated indicator
 */
function AnimatedTabBar({ state, descriptors, navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  // Calculate indicator position and animate when active tab changes
  useEffect(() => {
    // Each tab takes up an equal portion of the tab bar width
    const tabWidth = 80; // approximate based on paddingHorizontal
    const targetPosition = state.index * tabWidth;

    Animated.timing(indicatorPosition, {
      toValue: targetPosition,
      duration: ANIMATION_TIMINGS.DURATION_GLOBAL,
      useNativeDriver: true,
    }).start();
  }, [state.index, indicatorPosition]);

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.colors.background,
        borderTopWidth: 0,
        elevation: 8,
        paddingTop: 8,
        paddingHorizontal: 80,
        paddingBottom: insets.bottom || 8,
        position: "relative",
      }}
    >
      {/* Animated indicator under active tab */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          height: 3,
          width: 40,
          backgroundColor: theme.colors.primary,
          borderRadius: 1.5,
          transform: [{ translateX: indicatorPosition }],
        }}
      />

      {/* Tab buttons */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            preventDefault: false,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        };

        return (
          <View
            key={route.key}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 8,
              paddingHorizontal: 4,
            }}
            onTouchEnd={onPress}
          >
            {options.tabBarIcon && options.tabBarIcon({ focused: isFocused })}
          </View>
        );
      })}
    </View>
  );
}

export default AnimatedTabBar;
