import { spacing } from "@modules/theme";
import { usePressAnimation } from "@modules/utils/animations";
import PropTypes from "prop-types";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import Animated from "react-native-reanimated";

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
 * @param {boolean} props.shadow Apply a very faint drop shadow (default: false)
 * 
 * @returns JSX element
 */
const FAINT_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.025,
  shadowRadius: 10.84,
  elevation: 5,
};

function ModernCard({
  children,
  onPress,
  onLongPress,
  style,
  variant = "default",
  disabled = false,
  testID,
  shadow = true,
}) {
  const theme = useTheme();
  const pressAnimation = usePressAnimation({
    scaleTo: 0.95,
    opacityTo: 0.85,
    duration: 150,
  });

  // Extract backgroundColor from style if provided (takes precedence)
  let customBackgroundColor = null;
  let styleWithoutBg = style;
  if (style && !Array.isArray(style) && style.backgroundColor) {
    customBackgroundColor = style.backgroundColor;
    const { backgroundColor, ...rest } = style;
    styleWithoutBg = Object.keys(rest).length > 0 ? rest : undefined;
  } else if (Array.isArray(style)) {
    const bgColor = style.reduce((acc, s) => s?.backgroundColor || acc, null);
    if (bgColor) {
      customBackgroundColor = bgColor;
      styleWithoutBg = style.filter(s => !s?.backgroundColor);
    }
  }

  const baseStyles = StyleSheet.create({
    card: {
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceRaised,
    },
    cardElevated: {
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceRaised,
    },
    // Inner wrapper handles border-radius clipping separately from shadow
    clipWrapper: {
      borderRadius: 12,
      overflow: "hidden",
    },
    content: {
      padding: spacing.lg,
    },
  });

  const cardStyle = variant === "elevated" ? baseStyles.cardElevated : baseStyles.card;
  const shadowStyle = shadow ? FAINT_SHADOW : undefined;
  const isInteractive = onPress || onLongPress;

  if (!isInteractive || disabled) {
    return (
      <View style={[cardStyle, shadowStyle, styleWithoutBg, customBackgroundColor ? { backgroundColor: customBackgroundColor } : undefined]} testID={testID}>
        <View style={baseStyles.clipWrapper}>
          <View style={baseStyles.content}>
            {children}
          </View>
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
          shadowStyle,
          styleWithoutBg,
          customBackgroundColor ? { backgroundColor: customBackgroundColor } : undefined,
          pressAnimation.animatedStyle,
        ]}
      >
        <View style={baseStyles.clipWrapper}>
          <View style={baseStyles.content}>
            {children}
          </View>
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
  shadow: PropTypes.bool,
};

ModernCard.defaultProps = {
  onPress: undefined,
  onLongPress: undefined,
  style: undefined,
  variant: "default",
  disabled: false,
  testID: undefined,
  shadow: false,
};

export default ModernCard;
