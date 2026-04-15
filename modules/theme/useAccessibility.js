import { useReducedMotion } from "react-native-reanimated";

/**
 * useAccessibility — system accessibility settings hook
 *
 * Provides:
 * - reduceMotion: whether the user has enabled "Reduce Motion" in system settings
 *
 * Used by useMotion() as its single source of truth for animation gating.
 * Spec: §6.1 Reduced Motion
 *
 * @returns {{ reduceMotion: boolean }}
 */
export function useAccessibility() {
  const reduceMotion = useReducedMotion();
  return { reduceMotion: !!reduceMotion };
}

export default useAccessibility;
