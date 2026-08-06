import ENV from "@app/environment";
import { UserContext } from "@context/auth.context";
import I18n from "@modules/i18n";
import { confirmLogout } from "@modules/settings/confirmLogout";
import { spacing, typography } from "@modules/theme";
import { getTokens } from "@modules/theme/tokens";
import * as Linking from "expo-linking";
import * as StoreReview from "expo-store-review";
import React, { useContext, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, IconButton, Text, useTheme } from "react-native-paper";

import { createSettingsStyles } from "../index.styles";
import SupportSettings from "./SupportSettings";

const t = getTokens("light");

const supportStyles = StyleSheet.create({
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    // No 44 step exists; compose it: Spacing1000 (40) + Spacing100 (4).
    minHeight: t.tkDliteSemanticSpacing1000 + t.tkDliteSemanticSpacing100,
    paddingVertical: t.tkDliteSemanticSpacing200,
  },
  navChevron: {
    marginLeft: "auto",
  },
});

function SupportHome({
  logOut,
  settingsView,
  setSettingsView,
  onClose,
}) {
  const theme = useTheme();
  const styles = createSettingsStyles(theme);
  const { PUENTE_MANAGE_URL } = ENV;
  const { user } = useContext(UserContext);
  const [supportView, setSupportView] = useState("");

  const rateApp = async () => {
    if (await StoreReview.isAvailableAsync()) {
      StoreReview.requestReview();
    }
  };

  const openAccountManagement = async () => {
    const { id } = user;
    return Linking.openURL(
      `${PUENTE_MANAGE_URL}/account/management?objectId=${id}`
    );
  };

  // Account deletion for a dataset about vulnerable people is not a one-tap
  // action. The external page is the real gate, but say what is about to happen
  // before leaving the app.
  const deleteUser = () => {
    Alert.alert(
      I18n.t("accountSettings.deleteUserTitle"),
      I18n.t("accountSettings.deleteUserWarning"),
      [
        { text: I18n.t("global.cancel"), style: "cancel" },
        {
          text: I18n.t("accountSettings.deleteUserConfirm"),
          style: "destructive",
          onPress: openAccountManagement,
        },
      ],
      { cancelable: true }
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
       
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
            <Text style={{ ...typography.heading2, fontWeight: "bold", color: theme.colors.onSurface, marginTop: spacing.sm }}>
              {I18n.t("supportHome.helpCenter")}
            </Text>
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
            <View style={styles.horizontalLineGray} />
            {inputs.length > 0 &&
              inputs.map((input) => (
                <View key={input.key}>
                  {/* One shape for every row: the whole row is the target and
                      carries the label. Previously the non-touchable variant put
                      onPress on the chevron alone, so the row looked tappable
                      and was not. */}
                  <TouchableOpacity
                    testID={`support-row-${input.key}`}
                    accessibilityRole="button"
                    accessibilityLabel={input.label}
                    style={supportStyles.navRow}
                    onPress={() =>
                      (input.action ? input.action() : setSupportView(input.key))}
                  >
                    <Text style={styles.text}>{input.label}</Text>
                    {input.button && (
                      <IconButton
                        icon="chevron-right"
                        size={30}
                        iconColor={theme.colors.primary}
                        style={supportStyles.navChevron}
                        // Decorative: the row carries the action and the label.
                        importantForAccessibility="no"
                        accessibilityElementsHidden
                        pointerEvents="none"
                      />
                    )}
                  </TouchableOpacity>
                  <View style={styles.horizontalLineGray} />
                </View>
              ))}
          </View>
          <Button
            onPress={() => {
              onClose();
            }}
          >
            {I18n.t("accountSettings.back")}
          </Button>
          {/* Same stranding risk as SettingsHome -- route through the shared
              confirmation, and keep the destructive control de-emphasised. */}
          <Button
            testID="support-logout-button"
            mode="outlined"
            onPress={() => confirmLogout(logOut)}
            style={{ marginTop: 20, marginLeft: "5%", marginRight: "5%" }}
          >
            {I18n.t("accountSettings.logout")}
          </Button>
          <Button
            testID="settings-delete-user-button"
            textColor={theme.colors.error}
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
