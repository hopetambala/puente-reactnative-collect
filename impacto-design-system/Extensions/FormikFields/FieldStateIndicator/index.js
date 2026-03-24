import React, { useEffect } from "react";
import { Animated, View } from "react-native";
import { ActivityIndicator, Icon, useTheme } from "react-native-paper";
import { usePulseAnimation } from "@modules/utils/animations";

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

  // Auto-start pulse animation for loading state
  useEffect(() => {
    if (state === "loading") {
      pulseAnimation.start();
    } else {
      pulseAnimation.stop();
    }

    return () => pulseAnimation.stop();
  }, [state]);

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
            animating={true}
          />
        </Animated.View>
      </View>
    );
  }

  if (state === "success") {
    return (
      <View
        style={[
          containerStyle,
          {
            backgroundColor: theme.colors.success,
            borderRadius: size / 2,
          },
        ]}
      >
        <Icon
          source="check"
          size={size * 0.6}
          color={theme.colors.onSurface}
        />
      </View>
    );
  }

  if (state === "error") {
    return (
      <View
        style={[
          containerStyle,
          {
            backgroundColor: theme.colors.error,
            borderRadius: size / 2,
          },
        ]}
      >
        <Icon
          source="alert-circle"
          size={size * 0.6}
          color={theme.colors.onSurface}
        />
      </View>
    );
  }

  return null;
}

FieldStateIndicator.displayName = "FieldStateIndicator";

export default FieldStateIndicator;
