import { Ionicons } from "@expo/vector-icons";
import { ANIMATION_CONFIG, useShakeAnimation } from "@modules/utils/animations";
import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";
import { useTheme } from "react-native-paper";
import Animated from "react-native-reanimated";

function TabBarIcon({ name, focused }) {
  const theme = useTheme();
  const prevFocused = useRef(focused);

  const { shakeStyle, triggerShake } = useShakeAnimation({
    amplitude: ANIMATION_CONFIG.SHAKE_DEGREES,
    axis: "rotate",
    duration: ANIMATION_CONFIG.DURATION_WIGGLE,
  });

  useEffect(() => {
    // Only animate when transitioning to focused (tab press), not on unfocus
    if (focused && !prevFocused.current) {
      triggerShake();
    }
    prevFocused.current = focused;
  }, [focused, triggerShake]);

  return (
    <Animated.View style={shakeStyle}>
      <Ionicons
        name={name}
        size={30}
        style={{ marginBottom: -3 }}
        color={focused ? theme.colors.primary : theme.colors.textSecondary}
      />
    </Animated.View>
  );
}

TabBarIcon.propTypes = {
  name: PropTypes.string.isRequired,
  focused: PropTypes.bool.isRequired,
};

export default TabBarIcon;
