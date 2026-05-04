export const MOTION_TOKENS = {
  duration: {
    instant: 0,
    micro: 80,
    quick: 150,
    snappy: 200,
    base: 300,
    substantial: 400,
    slow: 500,
    xslow: 700,
    pulse: 1000,
  },
  spring: {
    tight: {
      damping: 20,
      stiffness: 250,
      mass: 0.6,
    },
    snappy: {
      damping: 14,
      stiffness: 180,
      mass: 0.8,
    },
    smooth: {
      damping: 18,
      stiffness: 120,
      mass: 1,
    },
    playful: {
      damping: 8,
      stiffness: 60,
      mass: 1,
    },
  },
  scale: {
    press: 0.95,
    micro: 0.98,
    celebrate: 1.2,
  },
  opacity: {
    interactive: 0.8,
    disabled: 0.5,
  },
};

/**
 * Stagger delay based on item count (for cascade animations)
 */
export const getStaggerDelay = (itemCount) => {
  if (itemCount <= 3) return 60;
  if (itemCount <= 6) return 50;
  return 40;
};

/**
 * Get spring preset for component type
 */
export const getSpringForComponent = (componentType = "button") => {
  switch (componentType) {
    case "button":
      return MOTION_TOKENS.spring.snappy;
    case "card":
      return MOTION_TOKENS.spring.snappy;
    case "icon":
      return MOTION_TOKENS.spring.tight;
    case "modal":
      return MOTION_TOKENS.spring.smooth;
    default:
      return MOTION_TOKENS.spring.snappy;
  }
};
