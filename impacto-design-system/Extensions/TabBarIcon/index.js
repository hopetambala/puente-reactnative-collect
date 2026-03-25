import { Ionicons } from "@expo/vector-icons";
import { ANIMATION_TIMINGS, SPRING_CONFIG } from "@modules/utils/animations";
import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useTheme } from "react-native-paper";

function TabBarIcon({ name, focused }) {
  const theme = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const prevFocused = useRef(false);

  useEffect(() => {
    // Only animate when transitioning to focused (tab press), not on unfocus
    if (focused && !prevFocused.current) {
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: -7, duration: 80, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 7, duration: 80, useNativeDriver: true }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          tension: SPRING_CONFIG.PLAYFUL.tension,
          friction: SPRING_CONFIG.PLAYFUL.friction,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevFocused.current = focused;
  }, [focused, rotateAnim]);

  const rotateDeg = rotateAnim.interpolate({
    inputRange: [-15, 0, 15],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotateDeg }] }}>
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
