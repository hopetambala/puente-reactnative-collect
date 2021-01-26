import React from 'react';
import { enableScreens } from 'react-native-screens';
import { Platform } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as StoreProvider } from 'react-redux';

import MainNavigation from './components/MainNavigation';

import configureStore from './modules/state-management/configure-store';
import useCachedResources from './modules/cached-resources/useCachedResources';
import { theme } from './modules/theme';

const store = configureStore();

if (Platform.OS === 'android') {
  enableScreens(true);
}

export default function App() {
  const isLoadingComplete = useCachedResources();

  if (!isLoadingComplete) {
    return null;
  }
  return (
    <StoreProvider store={store}>
      <PaperProvider theme={theme}>
        <MainNavigation />
      </PaperProvider>
    </StoreProvider>
  );
}
