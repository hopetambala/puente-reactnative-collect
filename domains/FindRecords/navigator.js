import { SCREEN_TRANSITIONS } from "@modules/utils/animations";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import EditForm from "./EditForm";
import FindRecordsFormsScreen from "./FindRecordsFormsScreen";
import FindRecordsHomeScreen from "./FindRecordsHomeScreen";
import ResidentRecordHistoryScreen from "./ResidentRecordHistoryScreen";

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
      <Stack.Screen
        name="ResidentRecordHistory"
        component={ResidentRecordHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditForm"
        component={EditForm}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default FindRecordsNavigator;
