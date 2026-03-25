import { ANIMATION_TIMINGS, SPRING_CONFIG, usePulseAnimation } from "@modules/utils/animations";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { ActivityIndicator, Icon, useTheme } from "react-native-paper";

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
  const pulseAnimation = usePulseAnimation({ duration: 1000, scaleRange: 1.1 });
  
  // Entrance animation refs for success and error states
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: SPRING_CONFIG.PLAYFUL.tension,
          friction: SPRING_CONFIG.PLAYFUL.friction,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: ANIMATION_TIMINGS.DURATION_GLOBAL,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [state, scaleAnim, opacityAnim]);

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
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
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
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
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
