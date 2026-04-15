import { MOTION_TOKENS, SPRING_CONFIG, usePulseAnimation } from "@modules/utils/animations";
import React, { useEffect } from "react";
import { View } from "react-native";
import { ActivityIndicator, Icon, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/**
 * Reusable component for displaying field states
 * Shows loading spinner, success checkmark, or error icon with animations
 * 
 * @param {Object} props Component props
 * @param {string} props.state State: "loading" | "success" | "error" | null
 * @param {boolean} props.visible Whether to show the indicator (default: true if state exists)
 * @param {number} props.size Icon size (default: 24)
 * @param {Object} props.style Custom style for container
 * 
 * @returns JSX element or null
 */
function FieldStateIndicator({ state, visible, size = 24, style }) {
  const theme = useTheme();
  const pulseAnimation = usePulseAnimation({ duration: MOTION_TOKENS.duration.pulse, scaleRange: 1.1 });
  
  // Entrance animation values for success and error states
  const scaleAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(0);

  // Auto-start pulse animation for loading state
  useEffect(() => {
    if (state === "loading") {
      pulseAnimation.start();
    } else {
      pulseAnimation.stop();
    }

    return () => pulseAnimation.stop();
  }, [state]);

  // Trigger entrance animation when success or error state appears
  useEffect(() => {
    if (state === "success" || state === "error") {
      scaleAnim.value = withSpring(1, SPRING_CONFIG.PLAYFUL);
      opacityAnim.value = withTiming(1, { duration: MOTION_TOKENS.duration.base });
    } else {
      scaleAnim.value = 0;
      opacityAnim.value = 0;
    }
  }, [state, scaleAnim, opacityAnim]);

  const entranceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: opacityAnim.value,
  }));

  if (!state) return null;
  if (visible === false) return null;

  const containerStyle = [
    {
      justifyContent: "center",
      alignItems: "center",
      width: size + 8,
      height: size + 8,
    },
    style,
  ];

  if (state === "loading") {
    return (
      <View style={containerStyle}>
        <Animated.View style={pulseAnimation.animatedStyle}>
          <ActivityIndicator
            size={size}
            color={theme.colors.primary}
            animating
          />
        </Animated.View>
      </View>
    );
  }

  if (state === "success") {
    return (
      <Animated.View
        style={[
          containerStyle,
          {
            backgroundColor: theme.colors.success,
            borderRadius: size / 2,
          },
          entranceStyle,
        ]}
      >
        <Icon
          source="check"
          size={size * 0.6}
          color={theme.colors.onSurface}
        />
      </Animated.View>
    );
  }

  if (state === "error") {
    return (
      <Animated.View
        style={[
          containerStyle,
          {
            backgroundColor: theme.colors.error,
            borderRadius: size / 2,
          },
          entranceStyle,
        ]}
      >
        <Icon
          source="alert-circle"
          size={size * 0.6}
          color={theme.colors.onSurface}
        />
      </Animated.View>
    );
  }

  return null;
}

FieldStateIndicator.displayName = "FieldStateIndicator";

export default FieldStateIndicator;
