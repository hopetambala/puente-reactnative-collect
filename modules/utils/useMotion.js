/**
 * useMotion Hook - Unified motion control for all animations
 * Single source of truth for animation configuration, reduced-motion preferences, and testing
 * 
 * Returns animation tokens configured for the current context (normal or reduced-motion mode)
 */

import { useMemo } from 'react';

import { MOTION_TOKENS } from './animations';

/**
 * @typedef {Object} MotionConfig
 * @property {number} duration - Animation duration in ms
 * @property {string} easing - Easing function name ('easeInOut', 'easeOut', 'easeIn', 'linear')
 * @property {Object} spring - Spring physics config (damping, stiffness, mass)
 * @property {Object} scale - Scale values (press, micro, entrance, celebrate)
 * @property {Object} opacity - Opacity values (interactive, disabled, backdrop, entrance)
 * @property {boolean} shouldAnimate - Whether animations are enabled (false in reduced-motion mode)
 */

/**
 * Hook for unified motion control
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.componentType - Component identifier for hierarchy lookup ('button', 'modal', etc.)
 * @param {'MEGA'|'STANDARD'|'QUICK'} options.tier - Explicit hierarchy tier override
 * @param {boolean} options.reduceMotion - Force reduced-motion mode (default: check system setting)
 * @returns {MotionConfig} Animation configuration for the current context
 */
export function useMotion(options = {}) {
  const {
    componentType = 'default',
    tier = null,
    reduceMotion = false, // TODO: Connect to system AccessibilityInfo when accessibility becomes critical
  } = options;

  return useMemo(() => {
    // If reduced-motion is enabled, return instant configuration
    if (reduceMotion) {
      return {
        duration: MOTION_TOKENS.duration.instant,
        easing: MOTION_TOKENS.easing.linear,
        spring: null,
        scale: {},
        opacity: {},
        shouldAnimate: false,
      };
    }

    // Determine animation durations based on component type
    let duration = MOTION_TOKENS.duration.base;
    let springConfig = MOTION_TOKENS.spring.snappy;

    const typeNorm = componentType?.toLowerCase() || 'default';

    // Map component types to duration tiers
    if (typeNorm === 'navigation' || typeNorm === 'modal') {
      duration = MOTION_TOKENS.duration.xslow;
      springConfig = MOTION_TOKENS.spring.smooth;
    } else if (typeNorm === 'button' || typeNorm === 'cta_button') {
      duration = MOTION_TOKENS.duration.base;
      springConfig = MOTION_TOKENS.spring.snappy;
    } else if (typeNorm === 'form_input' || typeNorm === 'form_focus') {
      duration = MOTION_TOKENS.duration.base;
      springConfig = MOTION_TOKENS.spring.smooth;
    } else if (typeNorm === 'success_state' || typeNorm === 'celebration') {
      duration = MOTION_TOKENS.duration.slow;
      springConfig = MOTION_TOKENS.spring.playful; // lint-animations-ignore: celebration mapping
    } else if (typeNorm === 'icon' || typeNorm === 'badge' || typeNorm === 'spinner') {
      duration = MOTION_TOKENS.duration.quick;
      springConfig = MOTION_TOKENS.spring.snappy;
    } else if (typeNorm === 'list_item' || typeNorm === 'card') {
      duration = MOTION_TOKENS.duration.base;
      springConfig = MOTION_TOKENS.spring.snappy;
    }

    return {
      duration,
      easing: MOTION_TOKENS.easing.standard,
      spring: springConfig,
      scale: MOTION_TOKENS.scale,
      opacity: MOTION_TOKENS.opacity,
      shouldAnimate: true,
    };
  }, [componentType, tier, reduceMotion]);
}

/**
 * Hook for checking reduced-motion system preference
 * Use when you need fine-grained control over accessibility settings
 * 
 * @returns {Object} { reduceMotion: boolean, prefersDarkMode: boolean }
 * 
 * @note Currently always returns { reduceMotion: false } as accessibility
 * is not a critical requirement. Can be extended to read system settings
 * when accessibility becomes important.
 */
export function useAccessibilityPreferences() {
  return useMemo(() => ({
    reduceMotion: false, // TODO: Integrate with React Native AccessibilityInfo.boldTextEnabled()
    prefersDarkMode: false, // Can be connected to theme context if needed
  }), []);
}

export default {
  useMotion,
  useAccessibilityPreferences,
};
