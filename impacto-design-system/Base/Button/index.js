import { createLayoutStyles, spacing, typography } from "@modules/theme";
import PropTypes from "prop-types";
import * as React from "react";
import {
  Animated,
  Pressable,
} from "react-native";
import { Button as PaperButton,useTheme  } from "react-native-paper";

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
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

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
      transform: [{ scale: scaleAnim }],
    },
    style,
  ];

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
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
