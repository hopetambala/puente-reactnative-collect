import { SCREEN_TRANSITIONS } from "@modules/utils/animations";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import AssetsScreen from "./AssetsScreen";

const Stack = createNativeStackNavigator();

function AssetsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...SCREEN_TRANSITIONS.slideRight,
      }}
    >
      <Stack.Screen
        name="AssetsHome"
        component={AssetsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default AssetsNavigator;
