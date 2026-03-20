import { UserContext } from "@context/auth.context";
import React, { useContext, useState } from "react";
import { View } from "react-native";

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
    logOut || (() => onLogout().then(() => navigation?.navigate("Sign In")));

  return (
    <View>
      <View style={{ paddingTop: "7%" }}>
        {settingsView === "Settings" && (
          <SettingsHome
            logOut={logoutAction}
            settingsView={settingsView}
            setSettingsView={setSettingsView}
            onClose={closeSettings}
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
    </View>
  );
}

export default SettingsView;
