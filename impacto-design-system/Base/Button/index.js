import { layout, theme } from "@modules/theme";
import PropTypes from "prop-types";
import * as React from "react";
import { Button as PaperButton } from "react-native-paper";

const colorStyle = {
  primary: theme.colors.primary,
  accent: theme.colors.accent,
  empty: theme.colors.placeholder,
  black: theme.colors.black,
};

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
  return <PaperButton
    icon={icon || ""}
    mode={mode || "contained"}
    disabled={!!disabled}
    theme={theme}
    style={[layout.button, style]}
    onPress={onPress}
    compact={!!compact}
    loading={!!loading}
    color={colorStyle[color]}
  >
    {buttonText}
  </PaperButton>
}

Button.defaultProps = {
  color: "primary",
  icon: "",
  disabled: false,
  loading: false,
};

Button.propTypes = {
  color: PropTypes.oneOf(["primary", "accent", "empty", "black"]),
  icon: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
};

export default Button;
