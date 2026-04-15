/**
 * Navigation Animation Helpers (Reanimated)
 * Creates custom screen transition animations with scale + depth effects
 * For advanced screen transitions beyond React Navigation's built-in options
 * 
 * PHASE 4 DOCUMENTATION: Custom transition patterns for depth effects
 * These helpers are ready for implementation in domain navigators
 * Currently: Uses React Navigation's built-in animations
 * Future: Implement full Reanimated custom animations for enhanced depth
 */

import { MOTION_TOKENS } from './animations';

/**
 * FORWARD TRANSITION (Enter new screen)
 * Previous Screen: Scale 1.0 → 0.9, Opacity 1.0 → 0.3 (stays visible beneath)
 * Current Screen:  TranslateX 100% → 0, Scale 0.98 → 1.0, Opacity 0.8 → 1.0
 * 
 * Usage with React Navigation custom cardStyleInterpolator:
 * ```
 * const cardStyleInterpolator = ({ current, next, inverted, layouts: { screen } }) => {
 *   return {
 *     cardStyle: {
 *       overflow: 'visible', // Allow partial visibility
 *       transform: [{ scale: current.progress.interpolate(...) }],
 *     },
 *   };
 * };
 * ```
 * 
 * @documentation This pattern enables the depth effect described in MOTION_DESIGN_SYSTEM.md
 */
export const createForwardTransition = () => ({
  metadata: {
    name: 'forwardSlideWithDepth',
    duration: MOTION_TOKENS.duration.xslow,
    spring: MOTION_TOKENS.spring.smooth,
  },
  description: 'Slide from right with previous screen scaled + dimmed (depth effect)',
  implementation: 'Requires cardStyleInterpolator in React Navigation screenOptions',
  targetEffect: {
    previousScreen: {
      scale: { from: 1.0, to: 0.9 },
      opacity: { from: 1.0, to: 0.3 },
      translateX: { from: 0, to: '-10%' },
    },
    currentScreen: {
      translateX: { from: '100%', to: 0 },
      scale: { from: 0.98, to: 1.0 },
      opacity: { from: 0.8, to: 1.0 },
    },
  },
});

/**
 * BACKWARD TRANSITION (Return to previous)
 * Current Screen: TranslateX 0 → 100%, Scale 1.0 → 0.98, Opacity 1.0 → 0.8
 * Previous Screen: Scale 0.9 → 1.0, Opacity 0.3 → 1.0
 * 
 * @documentation Reverse of forward transition for consistent spatial model
 */
export const createBackwardTransition = () => ({
  metadata: {
    name: 'backwardSlideWithDepth',
    duration: MOTION_TOKENS.duration.xslow,
    spring: MOTION_TOKENS.spring.smooth,
  },
  description: 'Slide to right with previous screen revealed (depth exit)',
  implementation: 'Requires reverse cardStyleInterpolator',
  targetEffect: {
    previousScreen: {
      scale: { from: 0.9, to: 1.0 },
      opacity: { from: 0.3, to: 1.0 },
      translateX: { from: '-10%', to: 0 },
    },
    currentScreen: {
      translateX: { from: 0, to: '100%' },
      scale: { from: 1.0, to: 0.98 },
      opacity: { from: 1.0, to: 0.8 },
    },
  },
});

/**
 * MODAL TRANSITION (Bottom sheet style)
 * Slide from bottom + backdrop fade
 *
 * Current implementation uses React Navigation's slide_from_bottom
 * Enhanced version could add:
 * - Backdrop blur (0 → 8px)
 * - Curved path animation
 * - Spring physics on settle
 */
export const createModalTransition = () => ({
  metadata: {
    name: 'modalSlideUp',
    duration: MOTION_TOKENS.duration.base,
    spring: MOTION_TOKENS.spring.smooth,
  },
  description: 'Slide modal from bottom with backdrop fade',
  implementation: 'Currently using React Navigation slide_from_bottom',
  targetEffect: {
    modal: {
      translateY: { from: '100%', to: 0 },
      scale: { from: 0.95, to: 1.0 },
    },
    backdrop: {
      opacity: { from: 0, to: 0.5 },
      blur: { from: 0, to: 8 },
    },
  },
});

/**
 * IMPLEMENTATION ROADMAP (Phase 4 → Phase 5)
 * 
 * Current State (Phase 4):
 * ✅ SCREEN_TRANSITIONS have transitionMetadata with target effects
 * ✅ This file documents the patterns
 * ✅ All animations use MOTION_TOKENS (no hardcoded values)
 * 
 * Next Phase (Phase 5+):
 * [ ] Create custom cardStyleInterpolators using Reanimated in domain navigators
 * [ ] Implement depth effects with scale + opacity interpolations
 * [ ] Add backdrop blur to modals (if performance allows)
 * [ ] Test on device for performance (especially list scrolling + transitions)
 * [ ] Document final pattern for team adoption
 * 
 * Migration Pattern:
 * 1. Each domain navigator imports createForwardTransition()
 * 2. Define cardStyleInterpolator using the targetEffect values
 * 3. Pass to Stack.Navigator screenOptions
 * 4. Verify performance on older devices
 * 5. Roll out incrementally per domain
 */

export default {
  createForwardTransition,
  createBackwardTransition,
  createModalTransition,
};
