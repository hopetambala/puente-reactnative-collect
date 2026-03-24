import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import AssetsScreen from "./AssetsScreen";

const Stack = createNativeStackNavigator();

function AssetsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AssetsHome"
        component={AssetsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default AssetsNavigator;
