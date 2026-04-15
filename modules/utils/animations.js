import { useCallback, useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/**
 * Motion Token System - Centralized animation values
 * SINGLE SOURCE OF TRUTH for all animation configuration
 * Never hardcode animation values in components; always use MOTION_TOKENS
 */
export const MOTION_TOKENS = {
  // Duration tokens (playful, generous timings)
  duration: {
    instant: 0,         // Accessibility: no animation
    micro: 80,          // Icon wiggle, checkbox pulse
    quick: 150,         // Button micro-feedback
    snappy: 200,        // Quick response
    base: 300,          // Standard transitions, button press, form focus
    substantial: 400,   // Card entrance, tab switch
    slow: 500,          // Loading complete, success celebration, modal
    xslow: 700,         // Navigation transitions, screen entrance
    dismiss: 4000,      // Popup success/error auto-dismiss time
    toast: 3000,        // Toast notification hold time
    pulse: 1000,        // Loading spinner loop
  },
  // Spring physics presets (hierarchy-calibrated: tight → snappy → smooth → playful)
  spring: {
    // QUICK interactions (micro-feedback, fast settle, no visible overshoot)
    tight: {
      damping: 20,
      stiffness: 250,
      mass: 0.6,
    },
    // STANDARD interactions (default everywhere — balanced bounce)
    snappy: {
      damping: 14,
      stiffness: 180,
      mass: 0.8,
    },
    // NAVIGATION & MODALS (smooth movement through space)
    smooth: {
      damping: 18,
      stiffness: 120,
      mass: 1,
    },
    // CELEBRATION ONLY (success, empty states — maximum overshoot allowed)
    playful: {
      damping: 8,
      stiffness: 60,
      mass: 1,
    },
  },
  // Easing functions (when spring not used)
  easing: {
    standard: 'easeInOut',  // Default smooth transitions
    entrance: 'easeOut',    // Fast entry, slow settle
    exit: 'easeIn',         // Slow exit fade
    linear: 'linear',       // Spinners ONLY
  },
  // Scale values (transforms only)
  scale: {
    press: 0.95,            // Button/card press (medium energy)
    micro: 0.98,            // Icon/badge scale (quick)
    entrance: 0.98,         // List/modal item entrance scale
    celebrate: 1.2,         // Success state (overshoots before settling)
  },
  // Opacity values
  opacity: {
    interactive: 0.8,       // Pressed state
    disabled: 0.5,          // Disabled state
    backdrop: 0.5,          // Modal backdrop
    entrance: 0,            // Fade in from invisible
  },
};

/**
 * Motion Hierarchy - Defines animation aggression levels
 * Used for consistency and energy coordination across components
 */
export const MOTION_HIERARCHY = {
  // Screen-level, celebration moments (maximum energy)
  MEGA: {
    tier: 'MEGA',
    duration: MOTION_TOKENS.duration.xslow,
    spring: MOTION_TOKENS.spring.playful,
    scale: { from: 0.95, to: 1.0, celebrate: 1.2 },
    examples: ['navigation', 'success_celebration', 'empty_state'],
  },
  // Standard button, form, card interactions (consistent energy)
  STANDARD: {
    tier: 'STANDARD',
    duration: MOTION_TOKENS.duration.base,
    spring: MOTION_TOKENS.spring.snappy,
    scale: { from: 0.95, to: 1.0 },
    examples: ['button_press', 'form_focus', 'card_press', 'modal_entry'],
  },
  // Micro-feedback, icons, badges (quick energy, no visible overshoot)
  QUICK: {
    tier: 'QUICK',
    duration: MOTION_TOKENS.duration.quick,
    spring: MOTION_TOKENS.spring.tight,
    scale: { from: 0.98, to: 1.0 },
    examples: ['icon_feedback', 'checkbox', 'badge_pulse', 'spinner'],
  },
};

/**
 * Animation Rules - Constraints and validation rules
 * Ensures all animations follow motion design principles
 */
export const ANIMATION_RULES = {
  // Components that can use spring physics
  SPRING_ALLOWED: [
    'button',
    'cta_button',
    'card',
    'form_input',
    'modal',
    'navigation',
    'success_state',
    'icon_feedback',
    'list_item',
  ],
  // GPU-only properties allowed for animation
  GPU_ONLY_PROPERTIES: ['transform', 'opacity'],
  // Properties NEVER to animate
  NEVER_ANIMATE: ['width', 'height', 'top', 'left', 'padding', 'margin', 'backgroundColor'],
  // Max duration rules
  MAX_DURATION: 1000, // Default; exceptions for user-initiated (drag) or continuous (spinner)
  // Max overshoot for spring
  MAX_OVERSHOOT: 1.2, // Celebrate scale max: 1.2 (not cartoony)
  // Stagger limits
  MAX_STAGGER: 50, // ms between list items
  // Latency constraint
  GESTURE_LATENCY_MAX: 100, // ms perceived delay on gesture
};

/**
 * Legacy exports (backward compatible with existing components)
 * Gradually migrate to MOTION_TOKENS above
 */
export const ANIMATION_CONFIG = {
  DURATION_FAST: MOTION_TOKENS.duration.quick,
  DURATION_STANDARD: MOTION_TOKENS.duration.base,
  DURATION_WIGGLE: MOTION_TOKENS.duration.micro,
  DURATION_ENTRANCE: MOTION_TOKENS.duration.slow,
  SCALE_INTERACTIVE: MOTION_TOKENS.scale.press,
  SCALE_ACTIVE: MOTION_TOKENS.scale.celebrate,
  SCALE_ENTRANCE: 0.8,
  SCALE_SUBTLE_ENTRANCE: 1.009,
  OPACITY_INTERACTIVE: MOTION_TOKENS.opacity.interactive,
  SHAKE_DEGREES: 7,
  SHAKE_SMALL: 3,   // Spec §5.3: ±3px max shake amplitude
};

/**
 * Spring physics configuration (Reanimated format: damping/stiffness/mass)
 * DEPRECATED: Use MOTION_TOKENS.spring instead
 * Kept for backward compatibility
 */
export const SPRING_CONFIG = {
  TIGHT: MOTION_TOKENS.spring.tight,
  PLAYFUL: MOTION_TOKENS.spring.playful,
  SMOOTH: MOTION_TOKENS.spring.smooth,
  SNAPPY: MOTION_TOKENS.spring.snappy,
};

/**
 * Screen transition configurations (React Navigation compatible)
 * Standard configurations for navigation screens
 * 
 * ENHANCED IN PHASE 4:
 * - slideRight, slideUp: Now include metadata for scale + depth effects
 * - Can be extended with cardStyleInterpolator for custom Reanimated animations
 * - Maintains backward compatibility with existing navigation stacks
 */
export const SCREEN_TRANSITIONS = {
  // Standard horizontal navigation (forward)
  slideRight: {
    animation: 'slide_from_right',
    gestureDirection: 'horizontal',
    gestureEnabled: true,
    // Phase 4 Enhancement: Metadata for scale + depth effects
    // Previous screen scale: 0.9, Current screen: 1.0
    // To implement fully: Use cardStyleInterpolator with Reanimated
    transitionMetadata: {
      effectName: 'slideWithDepth',
      previousScale: 0.9,
      previousOpacity: 0.3,
      currentScale: 1.0,
      currentOpacity: 1.0,
      duration: MOTION_TOKENS.duration.xslow,
      spring: MOTION_TOKENS.spring.smooth,
    },
  },
  // Backward navigation (return to previous)
  slideLeft: {
    animation: 'slide_from_left',
    gestureDirection: 'horizontal',
    gestureEnabled: true,
    transitionMetadata: {
      effectName: 'slideWithDepth',
      previousScale: 1.0,
      previousOpacity: 1.0,
      currentScale: 0.9,
      currentOpacity: 0.3,
      duration: MOTION_TOKENS.duration.xslow,
      spring: MOTION_TOKENS.spring.smooth,
    },
  },
  // Modal (slide from bottom)
  slideUp: {
    animation: 'slide_from_bottom',
    presentation: 'modal',
    gestureDirection: 'vertical',
    gestureEnabled: true,
    transitionMetadata: {
      effectName: 'slideFromBottom',
      duration: MOTION_TOKENS.duration.base,
      spring: MOTION_TOKENS.spring.smooth,
    },
  },
  // Fade animation (for overlays)
  fadeIn: {
    animation: 'fade',
    gestureEnabled: false,
    transitionMetadata: {
      effectName: 'fade',
      duration: MOTION_TOKENS.duration.base,
    },
  },
  // Combined slide + fade (backward compatible)
  slideAndFade: {
    animation: 'slide_from_right',
    gestureDirection: 'horizontal',
    gestureEnabled: true,
    transitionMetadata: {
      effectName: 'slideWithDepth',
      duration: MOTION_TOKENS.duration.xslow,
    },
  },
};

/**
 * Global animation timings (backward compatible)
 * DEPRECATED: Use MOTION_TOKENS.duration directly instead
 */
export const ANIMATION_TIMINGS = {
  DURATION_GLOBAL: MOTION_TOKENS.duration.xslow,
  TAB_TRANSITION: MOTION_TOKENS.duration.base,
  STAGGER_DELAY: 50,  // Spec §5.4: 50ms between staggered list items
  // Delay before subsequent list sections animate in
  SECTION_DELAY: MOTION_TOKENS.duration.substantial,
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
    // Release spring — calibrated by hierarchy level per spec §3.2:
    //   CTA/contained buttons: MOTION_TOKENS.spring.snappy
    //   Secondary/outlined buttons: MOTION_TOKENS.spring.tight
    releaseSpring = MOTION_TOKENS.spring.snappy,
  } = options;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleTo, SPRING_CONFIG.SNAPPY);
    opacity.value = withTiming(opacityTo, { duration: ANIMATION_CONFIG.DURATION_FAST });
  }, [scaleTo, opacityTo, scale, opacity]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, releaseSpring);
    opacity.value = withTiming(1, { duration: ANIMATION_CONFIG.DURATION_FAST });
  }, [releaseSpring, scale, opacity]);

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
    duration = MOTION_TOKENS.duration.pulse,
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

/**
 * Hook for status icon animation (Reanimated)
 * Bounces on entrance and pulses to indicate state change
 * Used for status indicators, validation feedback
 *
 * @param {Object} options
 * @param {boolean} options.isActive - Whether status icon should be animated
 * @param {string} options.state - Status state ('success'|'error'|'warning'|'info')
 * @returns {{ animatedStyle: object, reset: () => void }}
 */
export function useStatusIconAnimation(options = {}) {
  const {
    isActive = true,
    state = "info",
  } = options;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!isActive) {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      return;
    }

    // Bounce entrance + pulse effect
    scale.value = withSequence(
      withSpring(1.2, SPRING_CONFIG.PLAYFUL),
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        3, // pulse 3 times
      ),
    );
  }, [isActive, state, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { animatedStyle };
}

/**
 * Hook for disclosure/expansion icon animation (Reanimated)
 * Rotates chevron/arrow icon on expand/collapse
 * Used for collapsible sections, accordions, disclosure triangles
 *
 * @param {Object} options
 * @param {boolean} options.isExpanded - Whether section is expanded
 * @param {number} options.duration - Rotation duration in ms (default: 300)
 * @returns {{ animatedStyle: object }}
 */
export function useDisclosureIconAnimation(options = {}) {
  const {
    isExpanded = false,
    duration = ANIMATION_CONFIG.DURATION_STANDARD,
  } = options;

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(
      isExpanded ? 180 : 0,
      { duration, easing: Easing.inOut(Easing.ease) },
    );
  }, [isExpanded, duration, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return { animatedStyle };
}

/**
 * Hook for button icon animation (Reanimated)
 * Combines press feedback with rotation or scale
 * Used for action buttons, navigation controls
 *
 * @param {Object} options
 * @param {'scale'|'rotate'|'both'} options.type - Animation type (default: 'scale')
 * @returns {{ animatedStyle: object, onPressIn: () => void, onPressOut: () => void }}
 */
export function useButtonIconAnimation(options = {}) {
  const {
    type = "scale",
  } = options;

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const onPressIn = useCallback(() => {
    if (type === "scale" || type === "both") {
      scale.value = withSpring(ANIMATION_CONFIG.SCALE_INTERACTIVE, SPRING_CONFIG.SNAPPY);
    }
    if (type === "rotate" || type === "both") {
      rotation.value = withTiming(15, { duration: ANIMATION_CONFIG.DURATION_FAST });
    }
  }, [scale, rotation, type]);

  const onPressOut = useCallback(() => {
    if (type === "scale" || type === "both") {
      // Icon buttons are QUICK hierarchy → spring.snappy (spec §3.2)
      scale.value = withSpring(1, SPRING_CONFIG.SNAPPY);
    }
    if (type === "rotate" || type === "both") {
      rotation.value = withTiming(0, { duration: ANIMATION_CONFIG.DURATION_FAST });
    }
  }, [scale, rotation, type]);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms = [];
    if (type === "scale" || type === "both") {
      transforms.push({ scale: scale.value });
    }
    if (type === "rotate" || type === "both") {
      transforms.push({ rotate: `${rotation.value}deg` });
    }
    return { transform: transforms };
  });

  return { animatedStyle, onPressIn, onPressOut };
}

// ─── Layout Animations ───────────────────────────────────────────────────────

/**
 * useSuccessMorphAnimation — Phase 6 premium: spinner → checkmark morph (spec §5.7)
 *
 * Drives a two-layer transition:
 *   - spinnerStyle: scale 1→0 + opacity 1→0 (spinner fades out)
 *   - checkmarkStyle: scale 0→1 spring.playful (checkmark springs in)
 *
 * Usage:
 *   const { spinnerStyle, checkmarkStyle, triggerSuccess } = useSuccessMorphAnimation();
 *   // call triggerSuccess() when async operation completes
 *
 * @returns {{ spinnerStyle, checkmarkStyle, triggerSuccess, reset }}
 */
export function useSuccessMorphAnimation() {
  const spinnerScale   = useSharedValue(1);
  const spinnerOpacity = useSharedValue(1);
  const checkScale     = useSharedValue(0);
  const checkOpacity   = useSharedValue(0);

  const triggerSuccess = useCallback(() => {
    // Step 1: spinner scales out (150ms)
    spinnerScale.value   = withTiming(0.1, { duration: MOTION_TOKENS.duration.quick });
    spinnerOpacity.value = withTiming(0,   { duration: MOTION_TOKENS.duration.quick });
    // Step 2: checkmark springs in after 150ms offset
    checkOpacity.value   = withTiming(1,   { duration: MOTION_TOKENS.duration.micro });
    checkScale.value     = withSequence(
      withTiming(0, { duration: 0 }), // start from 0
      withSpring(1, MOTION_TOKENS.spring.playful),
    );
  }, [spinnerScale, spinnerOpacity, checkScale, checkOpacity]);

  const reset = useCallback(() => {
    spinnerScale.value   = withTiming(1, { duration: MOTION_TOKENS.duration.quick });
    spinnerOpacity.value = withTiming(1, { duration: MOTION_TOKENS.duration.quick });
    checkScale.value     = 0;
    checkOpacity.value   = 0;
  }, [spinnerScale, spinnerOpacity, checkScale, checkOpacity]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: spinnerScale.value }],
    opacity: spinnerOpacity.value,
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  return { spinnerStyle, checkmarkStyle, triggerSuccess, reset };
}

/**
 * useMotion hook — global motion control gate (spec §6.1 + §6.2)
 * Single control point for reduced motion + calm mode.
 *
 * @param {Object} options
 * @param {string} options.componentType - Component type for spring selection (e.g., 'button', 'navigation')
 * @param {boolean} options.calmMode - Shift spring intensity down one level (spec §6.2 clinical context)
 * @returns {{ shouldAnimate, duration, spring, resolveSpring }}
 */
export function useMotion({ componentType = 'default', calmMode = false } = {}) {
  const reduceMotion = useReducedMotion();

  // Calm mode spring map: shift intensity down one level (spec §6.2)
  const calmSpringMap = {
    tight:   null,                       // instant (no spring)
    snappy:  MOTION_TOKENS.spring.tight,
    smooth:  MOTION_TOKENS.spring.snappy,
    playful: MOTION_TOKENS.spring.snappy, // disabled in calm mode
  };

  /**
   * Returns the spring preset adjusted for reduce-motion and calm mode.
   * @param {'tight'|'snappy'|'smooth'|'playful'} preset
   */
  const resolveSpring = (preset) => {
    if (reduceMotion) return null;
    if (calmMode) return calmSpringMap[preset] ?? MOTION_TOKENS.spring.tight;
    return MOTION_TOKENS.spring[preset] ?? MOTION_TOKENS.spring.snappy;
  };

  if (reduceMotion) {
    return {
      shouldAnimate: false,
      duration: MOTION_TOKENS.duration.instant,
      spring: null,
      resolveSpring,
    };
  }

  return {
    shouldAnimate: true,
    duration: calmMode ? MOTION_TOKENS.duration.snappy : MOTION_TOKENS.duration.base,
    spring: resolveSpring(
      { navigation: 'smooth', modal: 'smooth', success: 'playful', empty_state: 'playful' }[componentType] || 'snappy'
    ),
    resolveSpring,
  };
}

/**
 * Layout animation for the Root screen entrance (sign-in → tabs)
 * FadeIn with spring physics — screen materializes organically, no spatial zoom anchor needed
 * Uses spring.smooth tokens (no hardcoded damping/stiffness)
 * Guard against undefined FadeIn in test environments with incomplete mocks
 */
export const ROOT_ENTERING = FadeIn
  ? FadeIn.springify()
    .damping(MOTION_TOKENS.spring.smooth.damping)
    .stiffness(MOTION_TOKENS.spring.smooth.stiffness)
    .duration(MOTION_TOKENS.duration.xslow)
  : null;

export default {
  // New token system (primary)
  MOTION_TOKENS,
  MOTION_HIERARCHY,
  ANIMATION_RULES,
  // Legacy config (backward compatible)
  ANIMATION_CONFIG,
  SPRING_CONFIG,
  SCREEN_TRANSITIONS,
  ANIMATION_TIMINGS,
  // Animation hooks
  useButtonIconAnimation,
  useDisclosureIconAnimation,
  useMotion,
  usePressAnimation,
  usePulseAnimation,
  useShakeAnimation,
  useStatusIconAnimation,
  useSuccessMorphAnimation,
  ROOT_ENTERING,
};
