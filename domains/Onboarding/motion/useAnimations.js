import { useEffect } from "react";
import { useSharedValue, withRepeat,withSequence, withSpring, withTiming } from "react-native-reanimated";

import { MOTION_TOKENS } from "./tokens";

/**
 * Scale and opacity animation on press
 */
export const usePressAnimation = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animateIn = () => {
    scale.value = withSpring(
      MOTION_TOKENS.scale.press,
      MOTION_TOKENS.spring.snappy
    );
  };

  const animateOut = () => {
    scale.value = withSpring(1, MOTION_TOKENS.spring.snappy);
    opacity.value = withTiming(1, {
      duration: MOTION_TOKENS.duration.quick,
    });
  };

  return { scale, opacity, animateIn, animateOut };
};

/**
 * Pulsing scale animation (repeating)
 */
export const usePulseAnimation = (
  minScale = 1,
  maxScale = 1.15,
  duration = MOTION_TOKENS.duration.pulse
) => {
  const scale = useSharedValue(minScale);

  useEffect(() => {
    // Start pulse on mount
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: duration / 2 }),
        withTiming(minScale, { duration: duration / 2 })
      ),
      -1,
      true
    );
  }, []);

  return scale;
};

/**
 * Bounce animation (for finale)
 */
export const useBounceAnimation = () => {
  const scale = useSharedValue(1);

  const bounce = () => {
    scale.value = withSequence(
      withSpring(1.15, MOTION_TOKENS.spring.playful),
      withSpring(1, MOTION_TOKENS.spring.playful)
    );
  };

  return { scale, bounce };
};
