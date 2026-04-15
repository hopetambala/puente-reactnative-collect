/**
 * Animation Validation Rules & Helpers
 * Ensures all animations comply with motion design system principles
 * Use these helpers in components to validate animation choices
 */

import {
  ANIMATION_RULES,
  MOTION_HIERARCHY,
  MOTION_TOKENS,
} from './animations';

/**
 * Returns the correct spring preset for a given component type.
 * Spring is used everywhere; intensity is calibrated to hierarchy level.
 * @param {string} componentType - Component identifier (uppercase, e.g., 'BUTTON', 'NAVIGATION')
 * @returns {object} MOTION_TOKENS.spring preset object
 */
export const getSpringForComponent = (componentType) => {
  const mapping = {
    // QUICK: micro-feedback, no visible overshoot
    ICON:        'tight',
    BADGE:       'tight',
    CHECKBOX:    'tight',
    // STANDARD: default for all primary interactions
    BUTTON:      'snappy',
    CTA_BUTTON:  'snappy',
    CARD:        'snappy',
    FORM:        'snappy',
    FORM_INPUT:  'snappy',
    LIST_ITEM:   'snappy',
    // MEGA spatial: navigation and modals move through space
    NAVIGATION:  'smooth',
    MODAL:       'smooth',
    // MEGA celebration: maximum energy, reserved for delight moments
    SUCCESS:     'playful',
    EMPTY_STATE: 'playful',
  };
  const preset = mapping[componentType?.toUpperCase()] || 'snappy';
  return MOTION_TOKENS.spring[preset];
};

/**
 * @deprecated Spring is now universal. Use getSpringForComponent() to select the correct intensity.
 * Kept for backward compatibility — always returns true.
 * @returns {boolean} Always true
 */
export const canUseSpring = () => true;

/**
 * Gets the motion hierarchy for a component type
 * Returns appropriate duration, spring config, scale values
 * @param {string} componentType - Component identifier
 * @returns {object} Hierarchy tier with animation config
 */
export const getMotionHierarchy = (componentType) => {
  const normalized = componentType?.toLowerCase() || 'button';

  const hierarchyMap = {
    // MEGA tier (celebration, navigation)
    'navigation': MOTION_HIERARCHY.MEGA,
    'modal_entry': MOTION_HIERARCHY.MEGA,
    'success_celebration': MOTION_HIERARCHY.MEGA,
    'empty_state': MOTION_HIERARCHY.MEGA,

    // STANDARD tier (most interactions)
    'button': MOTION_HIERARCHY.STANDARD,
    'cta_button': MOTION_HIERARCHY.STANDARD,
    'card': MOTION_HIERARCHY.STANDARD,
    'form_focus': MOTION_HIERARCHY.STANDARD,
    'form_input': MOTION_HIERARCHY.STANDARD,
    'modal': MOTION_HIERARCHY.STANDARD,
    'card_press': MOTION_HIERARCHY.STANDARD,

    // QUICK tier (micro-interactions)
    'icon': MOTION_HIERARCHY.QUICK,
    'icon_feedback': MOTION_HIERARCHY.QUICK,
    'checkbox': MOTION_HIERARCHY.QUICK,
    'badge': MOTION_HIERARCHY.QUICK,
    'spinner': MOTION_HIERARCHY.QUICK,
  };

  return hierarchyMap[normalized] || MOTION_HIERARCHY.STANDARD;
};

/**
 * Validates animation property is GPU-compatible
 * @param {string} property - CSS/transform property name
 * @returns {boolean} True if property is allowed to animate
 */
export const isGPUProperty = (property) => ANIMATION_RULES.GPU_ONLY_PROPERTIES.includes(property);

/**
 * Checks if property should NEVER be animated
 * @param {string} property - CSS property name
 * @returns {boolean} True if property is forbidden
 */
export const isRestrictedProperty = (property) => ANIMATION_RULES.NEVER_ANIMATE.includes(property);

/**
 * Validates duration is within acceptable range
 * @param {number} duration - Duration in milliseconds
 * @param {boolean} isUserInitiated - Whether animation is user-triggered (drag, hold)
 * @returns {boolean} True if duration is valid
 */
export const isValidDuration = (duration, isUserInitiated = false) => {
  if (duration === 0) return true; // Accessibility: instant
  if (isUserInitiated) return duration <= 2000; // User-initiated can be longer
  return duration <= ANIMATION_RULES.MAX_DURATION;
};

/**
 * Validates spring overshoot doesn't exceed design system limits
 * @param {number} scale - Target scale value
 * @returns {boolean} True if scale is within acceptable overshoot
 */
export const isValidOvershoot = (scale) => scale <= ANIMATION_RULES.MAX_OVERSHOOT;

/**
 * Gets recommended stagger delay (for list items, etc.)
 * @param {number} itemCount - Number of items being staggered
 * @returns {number} Recommended stagger delay in ms
 */
export const getStaggerDelay = (itemCount = 1) => {
  // Max stagger is 50ms per item; total cascade shouldn't exceed 500ms
  const recommendedStagger = Math.min(ANIMATION_RULES.MAX_STAGGER, 500 / itemCount);
  return Math.max(20, recommendedStagger); // Min 20ms
};

/**
 * Validates animation gesture latency
 * @param {number} latency - Perceived latency in ms
 * @returns {boolean} True if latency is acceptable (< 100ms)
 */
export const isAcceptableLatency = (latency) => latency <= ANIMATION_RULES.GESTURE_LATENCY_MAX;

/**
 * Comprehensive animation validation
 * Run this in development to catch motion design violations
 * @param {object} config - Animation configuration object
 * @returns {object} { valid: boolean, violations: array }
 */
export const validateAnimationConfig = (config) => {
  const violations = [];

  const {
    componentType = 'default',
    duration = MOTION_TOKENS.duration.base,
    spring,
    scale,
    properties = [],
    isUserInitiated = false,
  } = config;

    // Check spring intensity mapping
    // lint-animations-ignore: spring.playful reference is intentional — validation logic, not usage
    if (spring) {
      const recommended = getSpringForComponent(componentType);
      const isUsingPlayful = spring === MOTION_TOKENS.spring.playful; // lint-animations-ignore
      const isHighIntensityComponent = ['SUCCESS', 'EMPTY_STATE'].includes(componentType?.toUpperCase());
      if (isUsingPlayful && !isHighIntensityComponent) {
      violations.push( // lint-animations-ignore: message text references spring.playful intentionally
        `spring.playful is reserved for SUCCESS/EMPTY_STATE. Use getSpringForComponent('${componentType}') — recommended: ${JSON.stringify(recommended)}`
      );
    }
  }

  // Check duration validity
  if (!isValidDuration(duration, isUserInitiated)) {
    violations.push(
      `Duration ${duration}ms exceeds max (${ANIMATION_RULES.MAX_DURATION}ms for system animations)`
    );
  }

  // Check scale/overshoot
  if (scale && scale.to && !isValidOvershoot(scale.to)) {
    violations.push(
      `Scale ${scale.to} exceeds max overshoot (${ANIMATION_RULES.MAX_OVERSHOOT})`
    );
  }

  // Check GPU properties
  properties.forEach((prop) => {
    if (isRestrictedProperty(prop)) {
      violations.push(
        `Forbidden property to animate: ${prop}. Use transform instead.`
      );
    }
    if (!isGPUProperty(prop) && !isRestrictedProperty(prop)) {
      violations.push(
        `Non-GPU property: ${prop}. May cause jank. Use transform/opacity only.`
      );
    }
  });

  return {
    valid: violations.length === 0,
    violations,
    hierarchy: getMotionHierarchy(componentType),
  };
};

/**
 * Development helper: Log animation validation results
 * @param {string} componentName - Component being validated
 * @param {object} config - Animation configuration
 */
export const logAnimationValidation = (componentName, config) => {
  if (process.env.NODE_ENV !== 'development') return;

  const result = validateAnimationConfig(config);
  if (!result.valid) {
    // eslint-disable-next-line no-console
    console.warn(
      `[Motion Design] Animation validation failed for ${componentName}:`,
      result.violations
    );
  }
};

export default {
  getSpringForComponent,
  canUseSpring,
  getMotionHierarchy,
  isGPUProperty,
  isRestrictedProperty,
  isValidDuration,
  isValidOvershoot,
  getStaggerDelay,
  isAcceptableLatency,
  validateAnimationConfig,
  logAnimationValidation,
};
