import { CoachmarkOverlay } from "@app/domains/HomeScreen/components/CoachmarkOverlay";
import { UserContext } from "@context/auth.context";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import { CommonActions } from "@react-navigation/native";
import React, { useContext, useState } from "react";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import SettingsHome from "./SettingsHome";
import SupportHome from "./SupportHome";

function SettingsView({
  logOut,
  setSettings,
  onClose,
  navigation,
  surveyingOrganization,
  scrollViewScroll,
  setScrollViewScroll,
}) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const { onLogout } = useContext(UserContext);
  const [settingsView, setSettingsView] = useState("Settings");

  const closeSettings = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (setSettings) {
      setSettings(false);
      return;
    }
    if (navigation) {
      navigation.goBack();
    }
  };

  const logoutAction =
    logOut ||
    (() =>
      onLogout().then(() =>
        navigation?.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Sign In" }],
          })
        )
      ));

  return (
    <SafeAreaView edges={["top"]} style={layout.screenContainer}>
      <View>
        {settingsView === "Settings" && (
          <SettingsHome
            logOut={logoutAction}
            settingsView={settingsView}
            setSettingsView={setSettingsView}
            onClose={closeSettings}
            navigation={navigation}
            surveyingOrganization={surveyingOrganization}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
          />
        )}
        {settingsView === "Support" && (
          <SupportHome
            settingsView={settingsView}
            setSettingsView={setSettingsView}
            logOut={logoutAction}
            onClose={closeSettings}
          />
        )}
      </View>
      <CoachmarkOverlay
        seenKey="settings"
        icon="settings-outline"
        title={I18n.t("coachmarks.settingsTitle")}
        description={I18n.t("coachmarks.settingsDescription")}
      />
    </SafeAreaView>
  );
}

export default SettingsView;
