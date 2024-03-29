import GetPinCode from "@app/domains/Auth/PinCode/GetPinCode";
import StorePinCode from "@app/domains/Auth/PinCode/StorePinCode";
import SignIn from "@app/domains/Auth/SignIn";
import SignUp from "@app/domains/Auth/SignUp";
import { theme } from "@modules/theme";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { Platform, StatusBar, StyleSheet, View } from "react-native";

import BottomTabNavigator from "./BottomTabNavigator.";
import LinkingConfiguration from "./LinkingConfiguration";

const Stack = createStackNavigator();

const { background } = theme.colors;

const MainNavigation = () => {
  const { container } = styles;
  return (
    <View style={container}>
      {Platform.OS === "ios" && <StatusBar />}
      <NavigationContainer linking={LinkingConfiguration} independent>
        <Stack.Navigator>
          <Stack.Screen
            name="Sign In"
            component={SignIn}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Sign Up"
            component={SignUp}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GetPincode"
            component={GetPinCode}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="StorePincode"
            component={StorePinCode}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Root"
            component={BottomTabNavigator}
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: background,
  },
});

export default MainNavigation;
