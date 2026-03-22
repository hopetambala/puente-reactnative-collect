/* eslint-disable-file */
import { AlertContextProvider } from "@context/alert.context";
import { UserContextProvider } from "@context/auth.context";
import { OfflineContextProvider } from "@context/offline.context";
import {
  ThemeContext,
  ThemeContextProvider,
} from "@context/theme.context";
import MainNavigation from "@impacto-design-system/MainNavigation";
import useCachedResources from "@modules/cached-resources/useCachedResources";
import { createTheme } from "@modules/theme";
import React, { useContext } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initialize } from "./services/parse/auth";

initialize();

function AppContent() {
  try {
    const themeContext = useContext(ThemeContext);
    const mode = themeContext?.mode || "light";
    
    if (!mode) {
      return null;
    }

    const theme = createTheme(mode);

    if (!theme) {
      return null;
    }

    return (
      <PaperProvider theme={theme}>
        <AlertContextProvider>
          <UserContextProvider>
            <OfflineContextProvider>
              <MainNavigation />
            </OfflineContextProvider>
          </UserContextProvider>
        </AlertContextProvider>
      </PaperProvider>
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("AppContent error:", error);
    return null;
  }
}

export default function App() {
  const isLoadingComplete = useCachedResources();

  if (!isLoadingComplete) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeContextProvider>
          <AppContent />
        </ThemeContextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

