/* eslint-disable-file */
import { AlertContextProvider } from "@context/alert.context";
import { UserContextProvider } from "@context/auth.context";
import { OfflineContextProvider } from "@context/offline.context";
import MainNavigation from "@impacto-design-system/MainNavigation";
import useCachedResources from "@modules/cached-resources/useCachedResources";
import { theme } from "@modules/theme";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";

import { initialize } from "./services/parse/auth";

initialize();

export default function App() {
  const isLoadingComplete = useCachedResources();

  if (!isLoadingComplete) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <AlertContextProvider>
          <UserContextProvider>
            <OfflineContextProvider>
              <MainNavigation />
            </OfflineContextProvider>
          </UserContextProvider>
        </AlertContextProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
