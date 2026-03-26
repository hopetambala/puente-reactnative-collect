import { useCallback, useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

/**
 * Animation configuration presets for consistent timing across the app
 * All animations use Reanimated (react-native-reanimated)
 */
export const ANIMATION_CONFIG = {
  DURATION_FAST: 150, // ms - quick feedback animations
  DURATION_STANDARD: 300, // ms - normal transitions
  DURATION_WIGGLE: 80, // ms - per-step wiggle duration
  DURATION_ENTRANCE: 500, // ms - screen entrance fade
  SCALE_INTERACTIVE: 0.95, // 5% shrink on press/interaction
  SCALE_ACTIVE: 1.05, // 5% grow for active/focus states
  SCALE_ENTRANCE: 0.8, // start scale for screen entrances
  SCALE_SUBTLE_ENTRANCE: 1.009, // very subtle scale for tab transitions
  OPACITY_INTERACTIVE: 0.8, // 80% opacity on press
  SHAKE_DEGREES: 7, // rotation amplitude for icon wiggle (degrees)
  SHAKE_SMALL: 5, // translation amplitude for input shake (px)
};

/**
 * Spring physics configuration (Reanimated format: damping/stiffness/mass)
 * Used for screen transitions, button presses, modal entrances
 */
export const SPRING_CONFIG = {
  // Bouncy spring (playful feel with overshoot)
  PLAYFUL: {
    damping: 7,
    stiffness: 40,
    mass: 1,
  },
  // Smooth spring (elegant transitions)
  SMOOTH: {
    damping: 15,
    stiffness: 90,
    mass: 0.8,
  },
  // Snappy spring (quick responsive feedback)
  SNAPPY: {
    damping: 12,
    stiffness: 200,
    mass: 0.8,
  },
};

/**
 * Screen transition configurations (native-stack compatible)
 * These are React Navigation options, not Reanimated animations
 */
export const SCREEN_TRANSITIONS = {
  slideRight: {
    animation: "slide_from_right",
    gestureDirection: "horizontal",
    gestureEnabled: true,
  },
  slideUp: {
    animation: "slide_from_bottom",
    presentation: "modal",
    gestureDirection: "vertical",
    gestureEnabled: true,
  },
  fadeIn: {
    animation: "fade",
    gestureEnabled: false,
  },
  slideAndFade: {
    animation: "slide_from_right",
    gestureDirection: "horizontal",
    gestureEnabled: true,
  },
};

/**
 * Global animation timings
 */
export const ANIMATION_TIMINGS = {
  DURATION_GLOBAL: 700,
  TAB_TRANSITION: 300,
  STAGGER_DELAY: 50,
  // Delay before subsequent list sections animate in
  SECTION_DELAY: 400,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Hook for shake/wiggle animation feedback (Reanimated)
 * Configurable for translateX (form input shake) or rotate (icon wiggle)
 *
 * @param {Object} options
 * @param {number} options.amplitude - Shake amplitude (px for translateX, degrees for rotate)
 * @param {'translateX'|'rotate'} options.axis - Animation axis (default: 'translateX')
 * @param {number} options.duration - Per-step duration in ms (default: DURATION_FAST)
 * @returns {{ shakeStyle: object, triggerShake: () => void }}
 */
export function useShakeAnimation(options = {}) {
  const {
    amplitude = ANIMATION_CONFIG.SHAKE_SMALL,
    axis = "translateX",
    duration = ANIMATION_CONFIG.DURATION_FAST,
  } = options;

  const shakeValue = useSharedValue(0);

  const triggerShake = useCallback(() => {
    shakeValue.value = withSequence(
      withTiming(-amplitude, { duration, easing: Easing.linear }),
      withTiming(amplitude, { duration, easing: Easing.linear }),
      withTiming(-amplitude / 2, { duration, easing: Easing.linear }),
      withTiming(0, { duration, easing: Easing.linear }),
    );
  }, [amplitude, duration, shakeValue]);

  const shakeStyle = useAnimatedStyle(() => {
    if (axis === "rotate") {
      return { transform: [{ rotate: `${shakeValue.value}deg` }] };
    }
    return { transform: [{ translateX: shakeValue.value }] };
  });

  return { shakeStyle, triggerShake };
}

/**
 * Hook for press/tap animation feedback (Reanimated)
 * Uses spring physics for natural feel
 *
 * @param {Object} options
 * @param {number} options.scaleTo - Scale value on press (default: 0.95)
 * @param {number} options.opacityTo - Opacity value on press (default: 0.8)
 * @returns {{ animatedStyle: object, onPressIn: () => void, onPressOut: () => void }}
 */
export function usePressAnimation(options = {}) {
  const {
    scaleTo = ANIMATION_CONFIG.SCALE_INTERACTIVE,
    opacityTo = ANIMATION_CONFIG.OPACITY_INTERACTIVE,
  } = options;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleTo, SPRING_CONFIG.SNAPPY);
    opacity.value = withTiming(opacityTo, { duration: ANIMATION_CONFIG.DURATION_FAST });
  }, [scaleTo, opacityTo, scale, opacity]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG.PLAYFUL);
    opacity.value = withTiming(1, { duration: ANIMATION_CONFIG.DURATION_FAST });
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { animatedStyle, onPressIn, onPressOut };
}

/**
 * Hook for pulse/loading animation (Reanimated)
 * Gentle continuous scale animation for loading states
 *
 * @param {Object} options
 * @param {number} options.duration - Full cycle duration in ms (default: 1000)
 * @param {number} options.scaleRange - Max scale (default: 1.1)
 * @returns {{ animatedStyle: object, start: () => void, stop: () => void }}
 */
export function usePulseAnimation(options = {}) {
  const {
    duration = 1000,
    scaleRange = 1.1,
  } = options;

  const scale = useSharedValue(1);

  const start = useCallback(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(scaleRange, { duration: duration / 2 }),
        withTiming(1, { duration: duration / 2 }),
      ),
      -1, // infinite
    );
  }, [duration, scaleRange, scale]);

  const stop = useCallback(() => {
    cancelAnimation(scale);
    scale.value = withTiming(1, { duration: 100 });
  }, [scale]);

  useEffect(() => () => cancelAnimation(scale), [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, start, stop };
}

// ─── Layout Animations ───────────────────────────────────────────────────────

/**
 * Layout animation for the Root screen entrance (sign-in → tabs)
 * ZoomIn with spring physics for a bouncy entrance
 */
export const ROOT_ENTERING = ZoomIn.springify()
  .damping(12)
  .stiffness(90)
  .duration(ANIMATION_CONFIG.DURATION_ENTRANCE);

export default {
  ANIMATION_CONFIG,
  SPRING_CONFIG,
  SCREEN_TRANSITIONS,
  ANIMATION_TIMINGS,
  usePressAnimation,
  useShakeAnimation,
  usePulseAnimation,
  ROOT_ENTERING,
};
