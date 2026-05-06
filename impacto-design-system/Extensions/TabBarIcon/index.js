import { Ionicons } from "@expo/vector-icons";
import { MOTION_TOKENS } from "@modules/utils/animations";
import PropTypes from "prop-types";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const ICON_SIZE = 20;

function TabBarIcon({ name, focused, label }) {
  const theme = useTheme();

  // Smooth crossfade between inactive and active state
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.value = withSpring(focused ? 1 : 0, MOTION_TOKENS.spring.smooth);
  }, [focused, focus]);

  // Crossfade: inactive icon fades out, active icon fades in
  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focus.value, [0, 1], [0.45, 0]),
    transform: [{ scale: interpolate(focus.value, [0, 1], [1.0, 1.06]) }],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    transform: [{ scale: interpolate(focus.value, [0, 1], [1.0, 1.06]) }],
  }));

  // Label reveal: slides in + fades in on focus
  const labelStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    maxWidth: interpolate(focus.value, [0, 1], [0, 140]),
    marginLeft: interpolate(focus.value, [0, 1], [0, 6]),
  }));

  const activeIconName = name.replace("-outline", "");
  const activeColor = theme.colors.onPrimary ?? "#FFFFFF";
  const inactiveColor = theme.colors.onSurfaceVariant ?? theme.colors.textSecondary;

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: ICON_SIZE, height: ICON_SIZE }}>
        <Animated.View style={[StyleSheet.absoluteFillObject, inactiveIconStyle]}>
          <Ionicons name={name} size={ICON_SIZE} color={inactiveColor} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFillObject, activeIconStyle]}>
          <Ionicons name={activeIconName} size={ICON_SIZE} color={activeColor} />
        </Animated.View>
      </View>
      {label ? (
        <Animated.Text
          numberOfLines={1}
          style={[
            {
              fontSize: 11,
              fontWeight: "600",
              color: activeColor,
              letterSpacing: 0.2,
            },
            labelStyle,
          ]}
        >
          {label}
        </Animated.Text>
      ) : null}
    </View>
  );
}

TabBarIcon.propTypes = {
  name: PropTypes.string.isRequired,
  focused: PropTypes.bool.isRequired,
  label: PropTypes.string,
};

TabBarIcon.defaultProps = {
  label: null,
};

export default TabBarIcon;
