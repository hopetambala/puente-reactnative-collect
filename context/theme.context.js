/* global __DEV__ */
import { getData, storeData } from "@modules/async-storage";
import React, { createContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

export const ThemeContext = createContext();

export function ThemeContextProvider({ children }) {
  const systemColorScheme = useColorScheme(); // "light" | "dark" | null
  const [preference, setPreference] = useState("auto"); // "auto" | "light" | "dark"

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await getData("themePreference");
        if (savedPreference) {
          setPreference(savedPreference);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error loading theme preference:", e);
      }
    };
    loadThemePreference();
  }, []);

  // Determine effective mode based on preference and system scheme
  const mode = useMemo(() => {
    if (preference === "auto") {
      return systemColorScheme || "light";
    }
    return preference;
  }, [preference, systemColorScheme]);

  // Set theme preference and persist
  const setMode = async (newMode) => {
    if (newMode === "light" || newMode === "dark" || newMode === "auto") {
      setPreference(newMode);
      try {
        await storeData(newMode, "themePreference");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error saving theme preference:", e);
      }
    }
  };

  // Toggle between light and dark (keeps manual control, not auto)
  const toggleTheme = async () => {
    const newMode = mode === "light" ? "dark" : "light";
    await setMode(newMode);
  };

  const value = useMemo(
    () => ({
      mode, // Effective mode: "light" | "dark"
      preference, // User preference: "light" | "dark" | "auto"
      isDark: mode === "dark",
      isLight: mode === "light",
      setMode,
      toggleTheme,
    }),
    [mode, preference]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
