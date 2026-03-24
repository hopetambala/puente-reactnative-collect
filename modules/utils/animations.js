import { useRef, useEffect } from "react";
import { Animated } from "react-native";

/**
 * Animation configuration presets for consistent timing across the app
 */
export const ANIMATION_CONFIG = {
  DURATION_FAST: 150, // ms - quick feedback animations
  DURATION_STANDARD: 300, // ms - normal transitions
  SCALE_INTERACTIVE: 0.95, // 5% shrink on press/interaction
  SCALE_ACTIVE: 1.05, // 5% grow for active/focus states
  OPACITY_INTERACTIVE: 0.8, // 80% opacity on press
};

/**
 * Hook for press/tap animation feedback
 * Returns animated values for scale and opacity on press
 * 
 * @param {Object} options Configuration options
 * @param {number} options.scaleTo Scale value on press (default: 0.95)
 * @param {number} options.opacityTo Opacity value on press (default: 0.8)
 * @param {number} options.duration Animation duration in ms (default: 150)
 * 
 * @returns {Object} { scale, opacity, onPressIn, onPressOut }
 */
export function usePressAnimation(options = {}) {
  const {
    scaleTo = ANIMATION_CONFIG.SCALE_INTERACTIVE,
    opacityTo = ANIMATION_CONFIG.OPACITY_INTERACTIVE,
    duration = ANIMATION_CONFIG.DURATION_FAST,
  } = options;

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: scaleTo,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: opacityTo,
        duration,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return {
    scale,
    opacity,
    onPressIn,
    onPressOut,
    animatedStyle: {
      transform: [{ scale }],
      opacity,
    },
  };
}

/**
 * Hook for focus/blur animation feedback
 * Used for input labels and focus states
 * 
 * @param {Object} options Configuration options
 * @param {number} options.duration Animation duration in ms (default: 300)
 * @param {number} options.scaleTo Scale value on focus (default: 1.05)
 * 
 * @returns {Object} { scale, opacity, focus, blur }
 */
export function useFocusAnimation(options = {}) {
  const {
    duration = ANIMATION_CONFIG.DURATION_STANDARD,
    scaleTo = ANIMATION_CONFIG.SCALE_ACTIVE,
  } = options;

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  const focus = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: scaleTo,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const blur = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0.7,
        duration,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return {
    scale,
    opacity,
    focus,
    blur,
    animatedStyle: {
      transform: [{ scale }],
      opacity,
    },
  };
}

/**
 * Hook for pulse/loading animation
 * Gentle continuous scale animation for loading states
 * 
 * @param {Object} options Configuration options
 * @param {number} options.duration Full cycle duration in ms (default: 1000)
 * @param {number} options.scaleRange Scale variation (default: 1.1 = 10% variation)
 * 
 * @returns {Object} { scale, animatedStyle, start, stop }
 */
export function usePulseAnimation(options = {}) {
  const {
    duration = 1000,
    scaleRange = 1.1,
  } = options;

  const scale = useRef(new Animated.Value(1)).current;
  const animationRef = useRef(null);

  const start = () => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: scaleRange,
          duration: duration / 2,
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: false,
        }),
      ])
    );
    animationRef.current.start();
  };

  const stop = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      scale.setValue(1);
    }
  };

  // Auto-start on mount, stop on unmount
  useEffect(() => {
    return () => stop();
  }, []);

  return {
    scale,
    animatedStyle: {
      transform: [{ scale }],
    },
    start,
    stop,
  };
}

export default {
  ANIMATION_CONFIG,
  usePressAnimation,
  useFocusAnimation,
  usePulseAnimation,
};
