import { createLayoutStyles, spacing, typography } from "@modules/theme";
import { MOTION_TOKENS, usePressAnimation } from "@modules/utils/animations";
import PropTypes from "prop-types";
import * as React from "react";
import { Pressable } from "react-native";
import { Button as PaperButton, useTheme } from "react-native-paper";
import Animated from "react-native-reanimated";

function Button({
  onPress,
  buttonText,
  mode,
  compact,
  icon,
  disabled,
  loading,
  color,
  style,
}) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);

  // Spring intensity is hierarchy-calibrated (spec §3.2):
  // CTA (contained) → snappy spring (balanced bounce)
  // Secondary (outlined/text) → tight spring (minimal overshoot)
  const isCTA = mode === 'contained';
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation({
    scaleTo: 0.95,
    opacityTo: 0.9,
    releaseSpring: isCTA ? MOTION_TOKENS.spring.snappy : MOTION_TOKENS.spring.tight,
  });

  const getColor = () => {
    if (disabled) return theme.colors.placeholder;
    switch (color) {
      case "primary":
        return theme.colors.primary;
      case "accent":
        return theme.colors.accent;
      case "success":
        return theme.colors.success;
      case "error":
        return theme.colors.error;
      case "black":
        return theme.colors.black;
      case "empty":
        return theme.colors.placeholder;
      default:
        return theme.colors.primary;
    }
  };

  const buttonStyle = [
    layout.button,
    {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: spacing.radiusMedium,
    },
    style,
  ];

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View
        style={[
          {
            transform: [{ scale: 1 }],
          },
          animatedStyle,
        ]}
      >
        <PaperButton
          icon={icon || ""}
          mode={mode || "contained"}
          disabled={!!disabled}
          theme={theme}
          style={buttonStyle}
          onPress={onPress}
          compact={!!compact}
          loading={!!loading}
          labelStyle={{
            fontSize: typography.label1.fontSize,
            fontWeight: typography.label1.fontWeight,
          }}
          color={getColor()}
        >
          {buttonText}
        </PaperButton>
      </Animated.View>
    </Pressable>
  );
}

Button.defaultProps = {
  color: "primary",
  icon: "",
  disabled: false,
  loading: false,
  style: {},
  mode: "contained",
  compact: false,
};

Button.propTypes = {
  color: PropTypes.oneOf([
    "primary",
    "accent",
    "success",
    "error",
    "black",
    "empty",
  ]),
  icon: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  buttonText: PropTypes.string.isRequired,
  mode: PropTypes.oneOf(["text", "outlined", "contained"]),
  compact: PropTypes.bool,
};

export default Button;
