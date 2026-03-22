import { typography } from "@modules/theme";
import PropTypes from "prop-types";
import * as React from "react";
import { Text as RNText } from "react-native";
import { useTheme } from "react-native-paper";

function Text(props) {
  const { style, variant = "body1", ...rest } = props;
  const theme = useTheme();

  // Get semantic typography style
  const typographyStyle = typography[variant] || typography.body1;

  // Get text color based on variant and theme
  const getTextColor = () => {
    if (style?.color) return style.color;
    switch (variant) {
      case "heading1":
      case "heading2":
      case "heading3":
      case "title1":
      case "title2":
      case "title3":
        return theme.colors.onSurface;
      case "caption":
      case "captionSmall":
        return theme.colors.textTertiary;
      default:
        return theme.colors.onSurface;
    }
  };

  return (
    <RNText
      {...rest}
      style={[
        typographyStyle,
        {
          color: getTextColor(),
        },
        style,
      ]}
    />
  );
}

Text.propTypes = {
  variant: PropTypes.oneOf([
    "heading1",
    "heading2",
    "heading3",
    "title1",
    "title2",
    "title3",
    "body1",
    "body2",
    "label1",
    "label2",
    "caption",
    "captionSmall",
    "button",
  ]),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  children: PropTypes.node,
};

Text.defaultProps = {
  variant: "body1",
  style: {},
  children: null,
};

export default Text;
