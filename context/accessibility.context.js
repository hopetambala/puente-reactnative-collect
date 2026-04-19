import { getData, storeData } from "@modules/async-storage";
import React, { createContext, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";

export const AccessibilityContext = createContext();

export function AccessibilityContextProvider({ children }) {
  const systemReduceMotion = useReducedMotion();
  const [calmModePreference, setCalmModePreference] = useState(false);

  // Load calm mode preference on mount
  useEffect(() => {
    const loadCalmModePreference = async () => {
      try {
        const savedPreference = await getData("calmModePreference");
        if (savedPreference !== null && savedPreference !== undefined) {
          setCalmModePreference(savedPreference === true || savedPreference === "true");
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error loading calm mode preference:", e);
      }
    };
    loadCalmModePreference();
  }, []);

  // Set calm mode preference and persist
  const setCalmMode = async (newCalmMode) => {
    const booleanValue = !!newCalmMode;
    setCalmModePreference(booleanValue);
    try {
      await storeData(booleanValue, "calmModePreference");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error saving calm mode preference:", e);
    }
  };

  // Toggle calm mode
  const toggleCalmMode = async () => {
    await setCalmMode(!calmModePreference);
  };

  // Determine if animations should be reduced
  // Reduce motion if either system setting is enabled OR calm mode is enabled
  const shouldReduceMotion = !!systemReduceMotion || calmModePreference;

  const value = useMemo(
    () => ({
      calmMode: calmModePreference,
      systemReduceMotion: !!systemReduceMotion,
      shouldReduceMotion, // Used by components to decide whether to animate
      setCalmMode,
      toggleCalmMode,
    }),
    [calmModePreference, systemReduceMotion, shouldReduceMotion]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}
