import React, { useState } from "react";
import { View } from "react-native";

import SettingsHome from "./SettingsHome";
import SupportHome from "./SupportHome";

function SettingsView({
  logOut,
  setSettings,
  surveyingOrganization,
  scrollViewScroll,
  setScrollViewScroll,
}) {
  const [settingsView, setSettingsView] = useState("Settings");
  return (
    <View>
      <View style={{ paddingTop: "7%" }}>
        {settingsView === "Settings" && (
          <SettingsHome
            logOut={logOut}
            settingsView={settingsView}
            setSettingsView={setSettingsView}
            setSettings={setSettings}
            surveyingOrganization={surveyingOrganization}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
          />
        )}
        {settingsView === "Support" && (
          <SupportHome
            settingsView={settingsView}
            setSettingsView={setSettingsView}
            logOut={logOut}
            setSettings={setSettings}
          />
        )}
      </View>
    </View>
  );
}

export default SettingsView;
