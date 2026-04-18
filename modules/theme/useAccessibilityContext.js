import { AccessibilityContext } from "@context/accessibility.context";
import { useContext } from "react";

/**
 * useAccessibilityContext — Access calm mode and motion reduction settings
 *
 * Provides:
 * - calmMode: User's calm mode preference
 * - systemReduceMotion: System "Reduce Motion" setting
 * - shouldReduceMotion: Whether to reduce motion (calm mode OR system setting)
 * - setCalmMode: Function to set calm mode
 * - toggleCalmMode: Function to toggle calm mode
 *
 * @returns {{
 *   calmMode: boolean,
 *   systemReduceMotion: boolean,
 *   shouldReduceMotion: boolean,
 *   setCalmMode: (calmMode: boolean) => Promise<void>,
 *   toggleCalmMode: () => Promise<void>
 * }}
 */
export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);

  if (!context) {
    console.warn(
      "useAccessibilityContext must be called within AccessibilityContextProvider"
    );
    return {
      calmMode: false,
      systemReduceMotion: false,
      shouldReduceMotion: false,
      setCalmMode: async () => {},
      toggleCalmMode: async () => {},
    };
  }

  return context;
}

export default useAccessibilityContext;
