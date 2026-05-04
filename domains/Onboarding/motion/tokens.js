import { MOTION_TOKENS } from "@modules/utils/animations";

export { MOTION_TOKENS };

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
