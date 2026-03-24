import { ThemeContext } from "@context/theme.context";
import I18n from "@modules/i18n";
import { spacing, typography } from "@modules/theme";
import React, { useContext, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  SegmentedButtons,
  Text,
  useTheme,
} from "react-native-paper";

import { createSettingsStyles } from "../index.styles";
import AccountSettings from "./AccountSettings";

// Safe defaults in case spacing is undefined
const safeSpacing = {
  md: spacing?.md ?? 12,
  lg: spacing?.lg ?? 16,
  xl: spacing?.xl ?? 24,
};

const createStyles = (theme) => {
  if (!theme) return {};

  return StyleSheet.create({
    settingsContainer: {
      paddingHorizontal: safeSpacing.lg,
      paddingVertical: safeSpacing.md,
    },
    themeContainer: {
      paddingHorizontal: safeSpacing.md,
      paddingTop: safeSpacing.lg,
      marginBottom: safeSpacing.xl,
    },
    themeLabel: {
      ...typography.title3,
      fontWeight: "600",
      marginBottom: safeSpacing.md,
      color: theme.colors.onSurface,
    },
  });
};

function SettingsHome({
  logOut,
  settingsView,
  setSettingsView,
  onClose,
  surveyingOrganization,
  scrollViewScroll,
  setScrollViewScroll,
}) {
  const paperTheme = useTheme();
  const themeContext = useContext(ThemeContext);
  const settingsStyles = useMemo(() => createStyles(paperTheme), [paperTheme]);
  const styles = useMemo(() => createSettingsStyles(paperTheme), [paperTheme]);
  const [accountSettingsView, setAccountSettingsView] = useState("");

  const inputs = [
    {
      key: "NamePhoneEmail",
      label: I18n.t("accountSettings.namePhoneEmail"),
    },
    {
      key: "ChangePassword",
      label: I18n.t("accountSettings.changePassword"),
    },
    {
      key: "FindRecords",
      label: I18n.t("accountSettings.findRecords"),
    },
    {
      key: "Language",
      label: I18n.t("accountSettings.language"),
    },
    {
      key: "OfflineData",
      label: I18n.t("accountSettings.offlineData"),
    },
    {
      key: "Theme",
      label: "Theme",
    },
  ];

  const handleThemeChange = (newMode) => {
    if (themeContext) {
      themeContext.setMode(newMode);
    }
  };

  return (
    <View>
      {settingsView === "Settings" && accountSettingsView === "" && (
        <View>
          <View style={settingsStyles.settingsContainer}>
            <Text style={{ ...typography.heading2, fontWeight: "bold", color: paperTheme.colors.onSurface, marginTop: spacing.sm }}>
              {I18n.t("accountSettings.accountSettings")}
            </Text>
                      <View
            style={{
              flexDirection: "row",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <View style={{ paddingRight: spacing.md }}>
              <Button mode="contained">
                {I18n.t("accountSettings.settings")}
              </Button>
            </View> 
            <View style={{ paddingLeft: spacing.md }}>
              <Button onPress={() => setSettingsView("Support")}>
                {I18n.t("accountSettings.support")}
              </Button>
            </View>
          </View>
            <View style={styles.horizontalLineGray} />
            {inputs.length &&
              inputs.map((input) => (
                <View key={input.key}>
                  {input.key === "Theme" ? (
                    <View style={settingsStyles.themeContainer}>
                      <Text style={settingsStyles.themeLabel}>
                        {input.label}
                      </Text>
                      <SegmentedButtons
                        value={themeContext?.mode || "light"}
                        onValueChange={handleThemeChange}
                        buttons={[
                          {
                            value: "light",
                            label: "Light",
                            icon: "white-balance-sunny",
                          },
                          {
                            value: "dark",
                            label: "Dark",
                            icon: "moon-waning-crescent",
                          },
                          {
                            value: "auto",
                            label: "Auto",
                            icon: "auto-fix",
                          },
                        ]}
                      />
                    </View>
                  ) : (
                    <>
                      <View style={{ flexDirection: "row" }}>
                        <Text style={styles.text}>{input.label}</Text>
                        <IconButton
                          icon="chevron-right"
                          size={30}
                          color={paperTheme.colors.primary}
                          style={{
                            marginLeft: "auto",
                            marginTop: -5,
                            marginBottom: -10,
                          }}
                          onPress={() => {
                            setAccountSettingsView(input.key);
                          }}
                        />
                      </View>
                      <View style={styles.horizontalLineGray} />
                    </>
                  )}
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
          <Button
            mode="contained"
            onPress={logOut}
            style={{
              marginTop: spacing.lg,
              marginLeft: spacing.md,
              marginRight: spacing.md,
            }}
          >
            {I18n.t("accountSettings.logout")}
          </Button>
        </View>
      )}
      {accountSettingsView !== "" && (
        <View>
          <AccountSettings
            accountSettingsView={accountSettingsView}
            setAccountSettingsView={setAccountSettingsView}
            surveyingOrganization={surveyingOrganization}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
          />
        </View>
      )}
    </View>
  );
}

export default SettingsHome;
