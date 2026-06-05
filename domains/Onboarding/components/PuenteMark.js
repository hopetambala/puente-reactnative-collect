import { Ionicons } from "@expo/vector-icons";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

/**
 * PuenteMark — brand mark for the onboarding hero.
 * A circular badge with a globe icon that springs in with a playful overshoot.
 */
export function PuenteMark({ size = 72 }) {
  const theme = useTheme();
  const scale = useSharedValue(0);

  useEffect(() => {
    // Spring in: overshoot to 1.15 then settle to 1
    scale.value = withSpring(1, MOTION_TOKENS.spring.playful);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badgeSize = size;
  const iconSize = size * 0.55;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          backgroundColor: theme.colors.primaryContainer,
        },
        animatedStyle,
      ]}
    >
      <Ionicons name="globe-outline" size={iconSize} color={theme.colors.primary} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
});
