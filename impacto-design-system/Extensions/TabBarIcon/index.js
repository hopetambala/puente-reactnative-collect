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

const ICON_SIZE = 22;

function TabBarIcon({ name, focused }) {
  const theme = useTheme();

  // Smooth crossfade between inactive and active state
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.value = withSpring(focused ? 1 : 0, MOTION_TOKENS.spring.smooth);
  }, [focused, focus]);

  // Crossfade: inactive icon fades out, active icon fades in
  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focus.value, [0, 1], [0.5, 0]),
    transform: [{ scale: interpolate(focus.value, [0, 1], [1.0, 1.08]) }],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    transform: [{ scale: interpolate(focus.value, [0, 1], [1.0, 1.08]) }],
  }));

  const activeIconName = name.replace("-outline", "");
  const activeColor = theme.colors.primary;
  const inactiveColor = theme.colors.onSurfaceVariant ?? theme.colors.textSecondary;

  return (
    <View style={{ width: ICON_SIZE, height: ICON_SIZE }}>
      <Animated.View style={[StyleSheet.absoluteFillObject, inactiveIconStyle]}>
        <Ionicons name={name} size={ICON_SIZE} color={inactiveColor} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFillObject, activeIconStyle]}>
        <Ionicons name={activeIconName} size={ICON_SIZE} color={activeColor} />
      </Animated.View>
    </View>
  );
}

TabBarIcon.propTypes = {
  name: PropTypes.string.isRequired,
  focused: PropTypes.bool.isRequired,
};

export default TabBarIcon;
