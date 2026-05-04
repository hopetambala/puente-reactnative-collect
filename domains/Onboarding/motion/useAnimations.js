import { useSharedValue, withSequence, withSpring } from "react-native-reanimated";

import { MOTION_TOKENS } from "./tokens";

// Re-export shared animation hooks — use these instead of duplicating
export { usePressAnimation, usePulseAnimation } from "@modules/utils/animations";

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
