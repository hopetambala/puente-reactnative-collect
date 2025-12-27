import ENV from "@app/environment";
import { UserContext } from "@context/auth.context";
import I18n from "@modules/i18n";
import { theme } from "@modules/theme";
import * as Linking from "expo-linking";
import * as StoreReview from "expo-store-review";
import React, { useContext, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Button, Headline, IconButton, Text } from "react-native-paper";

import styles from "../index.styles";
import SupportSettings from "./SupportSettings";

function SupportHome({
  logOut,
  settingsView,
  setSettingsView,
  setSettings,
}) {
  const { PUENTE_MANAGE_URL } = ENV;
  const { user } = useContext(UserContext);
  const [supportView, setSupportView] = useState("");

  const rateApp = async () => {
    if (await StoreReview.isAvailableAsync()) {
      StoreReview.requestReview();
    }
  };

  const deleteUser = async () => {
    const { id } = user;
    return Linking.openURL(
      `${PUENTE_MANAGE_URL}/account/management?objectId=${id}`
    );
  };
  const inputs = [
    {
      key: "feedback",
      label: I18n.t("supportHome.feedback"),
      button: true,
      touchable: false,
      action: null,
    },
    {
      key: "rateApp",
      label: I18n.t("supportHome.rateApp"),
      button: false,
      touchable: true,
      action: rateApp,
    },
  ];
  return (
    <View>
      {settingsView === "Support" && supportView === "" && (
        <View>
          <View
            style={{
              flexDirection: "row",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <View style={{ paddingRight: "5%" }}>
              <Button onPress={() => setSettingsView("Settings")}>
                {I18n.t("accountSettings.settings")}
              </Button>
            </View>
            <View style={{ paddingLeft: "5%" }}>
              <Button mode="contained">
                {I18n.t("accountSettings.support")}
              </Button>
            </View>
          </View>
          <View
            style={{ paddingLeft: "5%", paddingRight: "5%", paddingTop: 20 }}
          >
            <Headline style={{ fontWeight: "bold" }}>
              {I18n.t("supportHome.helpCenter")}
            </Headline>
            <View style={styles.horizontalLineGray} />
            {inputs.length > 0 &&
              inputs.map((input) => (
                <View key={input.key}>
                  {input.touchable ? (
                    <TouchableOpacity
                      style={{ flexDirection: "row" }}
                      onPress={() => input.action()}
                    >
                      <Text style={styles.text}>{input.label}</Text>
                      {input.button && (
                        <IconButton
                          icon="chevron-right"
                          size={30}
                          color={theme.colors.primary}
                          style={{
                            marginLeft: "auto",
                            marginTop: -5,
                            marginBottom: -10,
                          }}
                          onPress={() => {
                            setSupportView(input.key);
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flexDirection: "row" }}>
                      <Text style={styles.text}>{input.label}</Text>
                      {input.button && (
                        <IconButton
                          icon="chevron-right"
                          size={30}
                          color={theme.colors.primary}
                          style={{
                            marginLeft: "auto",
                            marginTop: -5,
                            marginBottom: -10,
                          }}
                          onPress={() => {
                            setSupportView(input.key);
                          }}
                        />
                      )}
                    </View>
                  )}
                  <View style={styles.horizontalLineGray} />
                </View>
              ))}
          </View>
          <Button
            onPress={() => {
              setSettings(false);
            }}
          >
            {I18n.t("accountSettings.back")}
          </Button>
          <Button
            mode="contained"
            onPress={logOut}
            style={{ marginTop: 20, marginLeft: "5%", marginRight: "5%" }}
          >
            {I18n.t("accountSettings.logout")}
          </Button>
          <Button
            color="red"
            onPress={deleteUser}
            style={{ marginTop: 20, marginLeft: "5%", marginRight: "5%" }}
          >
            {I18n.t("accountSettings.deleteUser")}
          </Button>
        </View>
      )}
      {supportView !== "" && (
        <View>
          <SupportSettings
            supportView={supportView}
            setSupportView={setSupportView}
          />
        </View>
      )}
    </View>
  );
}

export default SupportHome;
