import { spacing } from "@modules/theme";
import { usePressAnimation } from "@modules/utils/animations";
import PropTypes from "prop-types";
import React from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";

/**
 * Modern flat card component with borders, animations, and dark mode support
 * Replaces Paper Card for consistent modern aesthetic
 * 
 * Features:
 * - 1px border instead of shadows (flat design)
 * - Smooth press animation (scale 0.95)
 * - Dark mode aware colors (uses semantic tokens)
 * - Responsive to theme changes
 * 
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Card content
 * @param {Function} props.onPress Press handler
 * @param {Function} props.onLongPress Long press handler
 * @param {Object} props.style Additional style overrides
 * @param {string} props.variant Card style variant: 'default' | 'elevated' (default: 'default')
 * @param {boolean} props.disabled Disable press feedback (default: false)
 * @param {string} props.testID Test ID for testing
 * 
 * @returns JSX element
 */
function ModernCard({
  children,
  onPress,
  onLongPress,
  style,
  variant = "default",
  disabled = false,
  testID,
}) {
  const theme = useTheme();
  const pressAnimation = usePressAnimation({
    scaleTo: 0.95,
    opacityTo: 0.85,
    duration: 150,
  });

  const baseStyles = StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12, // dlite semantic border radius lg
      backgroundColor: theme.colors.surfaceRaised,
      overflow: "hidden",
    },
    cardElevated: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceRaised,
      overflow: "hidden",
    },
    content: {
      padding: spacing.lg,
    },
  });

  const cardStyle = variant === "elevated" ? baseStyles.cardElevated : baseStyles.card;
  const isInteractive = onPress || onLongPress;

  if (!isInteractive || disabled) {
    return (
      <View style={[cardStyle, style]} testID={testID}>
        <View style={baseStyles.content}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      onPressIn={pressAnimation.onPressIn}
      onPressOut={pressAnimation.onPressOut}
      testID={testID}
    >
      <Animated.View
        style={[
          cardStyle,
          style,
          pressAnimation.animatedStyle,
        ]}
      >
        <View style={baseStyles.content}>
          {children}
        </View>
      </Animated.View>
    </Pressable>
  );
}

ModernCard.propTypes = {
  children: PropTypes.node.isRequired,
  onPress: PropTypes.func,
  onLongPress: PropTypes.func,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  variant: PropTypes.oneOf(["default", "elevated"]),
  disabled: PropTypes.bool,
  testID: PropTypes.string,
};

ModernCard.defaultProps = {
  onPress: undefined,
  onLongPress: undefined,
  style: undefined,
  variant: "default",
  disabled: false,
  testID: undefined,
};

export default ModernCard;
