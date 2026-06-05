import { ThemeContext } from "@context/theme.context";
import I18n from "@modules/i18n";
import { clearOnboardingData } from "@modules/settings";
import { spacing, typography } from "@modules/theme";
import { useAccessibilityContext } from "@modules/theme/useAccessibilityContext";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useContext, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  SegmentedButtons,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import Animated, { Keyframe } from "react-native-reanimated";

import { createSettingsStyles } from "../index.styles";
import AccountSettings from "./AccountSettings";

// Spec §5.4: settings rows fade+lift in staggered
const RowEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 6 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
});

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
  navigation,
  surveyingOrganization,
  scrollViewScroll,
  setScrollViewScroll,
}) {
  const paperTheme = useTheme();
  const themeContext = useContext(ThemeContext);
  const accessibilityContext = useAccessibilityContext();
  const settingsStyles = useMemo(() => createStyles(paperTheme), [paperTheme]);
  const styles = useMemo(() => createSettingsStyles(paperTheme), [paperTheme]);
  const [accountSettingsView, setAccountSettingsView] = useState("");

  const handleThemeChange = (newMode) => {
    if (themeContext) {
      themeContext.setMode(newMode);
    }
  };

  const handleCalmModeToggle = (newValue) => {
    accessibilityContext.setCalmMode(newValue);
  };

  const handleResetOnboarding = async () => {
    await clearOnboardingData();
    if (navigation) {
      navigation.navigate("Onboarding");
    }
  };

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
      label: I18n.t("theme.title"),
    },
  ];

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
              inputs.map((input, i) => (
                <Animated.View
                  key={input.key}
                  entering={RowEntrance
                    .delay(i * 40)
                    .duration(MOTION_TOKENS.duration.base)}
                >
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
                            label: I18n.t("theme.light"),
                            icon: "white-balance-sunny",
                          },
                          {
                            value: "dark",
                            label: I18n.t("theme.dark"),
                            icon: "moon-waning-crescent",
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
                </Animated.View>
              ))}
            {/* Calm Mode Toggle */}
            <Animated.View
              entering={RowEntrance
                .delay(inputs.length * 40)
                .duration(MOTION_TOKENS.duration.base)}
            >
              <View style={settingsStyles.themeContainer}>
                <Text style={settingsStyles.themeLabel}>
                  {I18n.t("accessibility.calmMode")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: safeSpacing.md,
                  }}
                >
                  <Text
                    style={{
                      color: paperTheme.colors.onSurface,
                      fontSize: 14,
                    }}
                  >
                    {I18n.t("accessibility.calmModeDescription")}
                  </Text>
                  <Switch
                    value={accessibilityContext.calmMode}
                    onValueChange={handleCalmModeToggle}
                  />
                </View>
              </View>
            </Animated.View>
            {/* Reset Onboarding */}
            <Animated.View
              entering={RowEntrance
                .delay((inputs.length + 1) * 40)
                .duration(MOTION_TOKENS.duration.base)}
            >
              <View style={settingsStyles.themeContainer}>
                <Button
                  mode="outlined"
                  onPress={handleResetOnboarding}
                  style={{
                    marginHorizontal: safeSpacing.md,
                  }}
                >
                  {I18n.t("accountSettings.resetOnboarding")}
                </Button>
              </View>
            </Animated.View>
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
