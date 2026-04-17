import { Ionicons } from "@expo/vector-icons";
import { MOTION_TOKENS } from "@modules/utils/animations";
import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";
import { useTheme } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

function TabBarIcon({ name, focused }) {
  const theme = useTheme();
  const prevFocused = useRef(focused);

  // Scale animation: playful pop sequence
  const scale = useSharedValue(1);
  // Rotation: subtle tilt for personality
  const rotation = useSharedValue(0);
  // Vertical bounce: pop bounces up for extra playfulness
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Only animate when transitioning to focused (tab press), not on unfocus
    if (focused && !prevFocused.current) {
      // Subtle multi-phase pop with gentle tilt (Option D refined):
      // Toned down compress & spring phases for elegance, adds rotation for personality
      // Uses spring.smooth for slower, more generous settle
      
      // Scale: gentle compress → subtle overshoot → micro-settle → rest
      scale.value = withSequence(
        withTiming(0.87, { duration: MOTION_TOKENS.duration.quick, easing: Easing.linear }),
        withSpring(1.08, MOTION_TOKENS.spring.smooth),    // First pop to modest peak (slower settle)
        withSpring(1.02, MOTION_TOKENS.spring.smooth),    // Settle to subtle mid-point
        withSpring(1.0, MOTION_TOKENS.spring.smooth)      // Final rest
      );
      
      // Rotation: gentle tilt -3° then back for personality
      rotation.value = withSequence(
        withTiming(-3, { duration: MOTION_TOKENS.duration.quick, easing: Easing.linear }),
        withSpring(0, MOTION_TOKENS.spring.smooth)        // Slower, more graceful return
      );
      
      // Bounce: subtle drop → gentle pop → settle
      translateY.value = withSequence(
        withTiming(-5, { duration: MOTION_TOKENS.duration.quick, easing: Easing.linear }),
        withSpring(1.5, MOTION_TOKENS.spring.smooth),     // Subtle pop up (slower bounce)
        withSpring(-0.5, MOTION_TOKENS.spring.smooth),    // Micro-settle
        withSpring(0, MOTION_TOKENS.spring.smooth)        // Final rest
      );
    } else if (!focused && prevFocused.current) {
      // Reset when unfocusing
      scale.value = 1;
      rotation.value = 0;
      translateY.value = 0;
    }
    prevFocused.current = focused;
  }, [focused, scale, rotation, translateY]);

  // Animated style with subtle multi-phase pop + gentle tilt
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={focused ? name.replace("-outline", "") : name}
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
