import { SCREEN_TRANSITIONS } from "@modules/utils/animations";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import FindRecordsFormsScreen from "./FindRecordsFormsScreen";
import FindRecordsHomeScreen from "./FindRecordsHomeScreen";

const Stack = createNativeStackNavigator();

function FindRecordsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...SCREEN_TRANSITIONS.slideRight,
      }}
    >
      <Stack.Screen
        name="FindRecordsHome"
        component={FindRecordsHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FindRecordsForms"
        component={FindRecordsFormsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default FindRecordsNavigator;
