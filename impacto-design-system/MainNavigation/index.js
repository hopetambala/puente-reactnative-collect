import GetPinCode from "@app/domains/Auth/PinCode/GetPinCode";
import StorePinCode from "@app/domains/Auth/PinCode/StorePinCode";
import SignIn from "@app/domains/Auth/SignIn";
import SignUp from "@app/domains/Auth/SignUp";
import SettingsView from "@app/domains/Settings";
import { AlertContext } from "@context/alert.context";
import Toast from "@impacto-design-system/Base/Toast";
import I18n from "@modules/i18n";
import { ROOT_ENTERING } from "@modules/utils/animations";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useContext } from "react";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import Animated from "react-native-reanimated";

import BottomTabNavigator from "./BottomTabNavigator";
import LinkingConfiguration from "./LinkingConfiguration";

const Stack = createNativeStackNavigator();

/**
 * Wrapper component that animates Root (tabs) entrance with Reanimated layout animation
 * Applies when transitioning from sign-in screen
 */
function RootScreenWrapper(props) {
  return (
    <Animated.View style={{ flex: 1 }} entering={ROOT_ENTERING}>
      <BottomTabNavigator {...props} />
    </Animated.View>
  );
}

function MainNavigation() {
  const theme = useTheme();
  const { visible, message, dismiss } = useContext(AlertContext);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });
  return (
    <View style={styles.container}>
      {Platform.OS === "ios" && <StatusBar />}
      <NavigationContainer
        linking={LinkingConfiguration}
      >
        <Stack.Navigator
        >
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
            component={RootScreenWrapper}
            options={{ headerShown: false, gestureEnabled: false, animation: "none" }}
          />
          <Stack.Screen
            name="SettingsModal"
            component={SettingsView}
            options={{
              headerShown: false,
              presentation: "modal",
              animation: "slide_from_bottom",
              gestureDirection: "vertical",
              gestureEnabled: true,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast
        text={message}
        visible={visible}
        onClick={dismiss}
        onClickLabel={I18n.t("global.ok")}
      />
    </View>
  );
}

export default MainNavigation;
