import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import DataCollectionFormsScreen from "./screens/DataCollectionFormsScreen";
import DataCollectionGalleryScreen from "./screens/DataCollectionGalleryScreen";

const Stack = createNativeStackNavigator();

function DataCollectionNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DataCollectionGallery"
        component={DataCollectionGalleryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DataCollectionForms"
        component={DataCollectionFormsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default DataCollectionNavigator;
