/* eslint-disable-file */
import "react-native-gesture-handler";

import { AlertContextProvider } from "@context/alert.context";
import { UserContextProvider } from "@context/auth.context";
import { OfflineContextProvider } from "@context/offline.context";
import MainNavigation from "@impacto-design-system/MainNavigation";
import useCachedResources from "@modules/cached-resources/useCachedResources";
import { theme } from "@modules/theme";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { Provider as PaperProvider } from "react-native-paper";

import { initialize } from "./services/parse/auth";
import getAWSLogger from "@modules/aws-logging/hook";

initialize();

export default function App() {
  const isLoadingComplete = useCachedResources();

  if (!isLoadingComplete) {
    return null;
  }
  return (
    <NavigationContainer independent>
      <PaperProvider theme={theme}>
        <AlertContextProvider>
          <UserContextProvider>
            <OfflineContextProvider>
              <MainNavigation />
            </OfflineContextProvider>
          </UserContextProvider>
        </AlertContextProvider>
      </PaperProvider>
    </NavigationContainer>
  );
}
