import { useReducedMotion } from "react-native-reanimated";

/**
 * useAccessibility — system accessibility settings hook
 *
 * Provides:
 * - reduceMotion: whether the user has enabled "Reduce Motion" in system settings
 *
 * Note: Not yet wired into useMotion(). Motion gating currently defaults to
 * reduceMotion=false via a TODO in modules/utils/useMotion.js. Connect this
 * hook into useMotion() when accessibility is a priority requirement.
 * Spec: §6.1 Reduced Motion
 *
 * @returns {{ reduceMotion: boolean }}
 */
export function useAccessibility() {
  const reduceMotion = useReducedMotion();
  return { reduceMotion: !!reduceMotion };
}

export default useAccessibility;
