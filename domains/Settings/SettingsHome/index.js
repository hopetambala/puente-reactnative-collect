import DevOfflineToggle from "@app/domains/Settings/DevOfflineToggle";
import { ThemeContext } from "@context/theme.context";
import I18n from "@modules/i18n";
import { clearOnboardingData } from "@modules/settings";
import {
  confirmLogout,
  countUnsyncedRecords,
} from "@modules/settings/confirmLogout";
import { spacing, typography } from "@modules/theme";
import { getTokens } from "@modules/theme/tokens";
import { useAccessibilityContext } from "@modules/theme/useAccessibilityContext";
import { MOTION_TOKENS, useMotion } from "@modules/utils/animations";
import * as Application from "expo-application";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
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

// Module scope is safe here: only spacing and type sizes are read, and those are
// identical in both themes. Colours below still come from the live Paper theme.
// TODO(dlite): the rest of this file still uses the legacy spacing/typography
// scales, which shadow dlite with different values (spacing.md=12 vs
// SpacingMd=16). Tracked as AS-26.
const t = getTokens("light");

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
    unsyncedRow: {
      paddingHorizontal: t.tkDliteSemanticSpacing400,
      paddingVertical: t.tkDliteSemanticSpacing300,
    },
    unsyncedText: {
      fontSize: t.tkDliteSemanticTypographySize300,
      color: theme.colors.onSurfaceVariant,
    },
    versionRow: {
      alignItems: "center",
      paddingTop: t.tkDliteSemanticSpacing400,
      paddingBottom: t.tkDliteSemanticSpacing600,
    },
    versionText: {
      fontSize: t.tkDliteSemanticTypographySize200,
      color: theme.colors.onSurfaceVariant,
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
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  // Settings is where people go before logging out or handing off a phone, so
  // it should say whether any work is still only on this device. Reads
  // AsyncStorage only -- no network call, so it works during an offline shift.
  useEffect(() => {
    let active = true;
    countUnsyncedRecords().then((count) => {
      if (active) setUnsyncedCount(count);
    });
    return () => {
      active = false;
    };
  }, [settingsView, accountSettingsView]);

  // useMotion is the single control point for reduce-motion and Calm Mode
  // (modules/utils/animations.js:589). This screen hosts the Calm Mode toggle,
  // so it is the last place that should ignore it.
  const motion = useMotion({ componentType: "navigation" });
  const rowEntering = (index) =>
    (motion.shouldAnimate
      ? RowEntrance.delay(index * MOTION_TOKENS.STAGGER_DELAY).duration(
          motion.duration
        )
      : undefined);

  const handleThemeChange = (newMode) => {
    if (themeContext) {
      themeContext.setMode(newMode);
    }
  };

  const handleCalmModeToggle = (newValue) => {
    accessibilityContext.setCalmMode(newValue);
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      I18n.t("accountSettings.resetOnboardingTitle"),
      I18n.t("accountSettings.resetOnboardingWarning"),
      [
        { text: I18n.t("global.cancel"), style: "cancel" },
        {
          text: I18n.t("accountSettings.resetOnboardingConfirm"),
          style: "destructive",
          onPress: async () => {
            await clearOnboardingData();
            if (navigation) {
              navigation.navigate("Onboarding");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleLogout = () => confirmLogout(logOut);

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
        <ScrollView>
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
            <DevOfflineToggle />
            {/* Offline-first copy rule: name where the records are. These are on
                the device and have NOT reached the server. */}
            {unsyncedCount > 0 && (
              <View
                testID="settings-unsynced-count"
                style={settingsStyles.unsyncedRow}
              >
                <Text style={settingsStyles.unsyncedText}>
                  {I18n.t("accountSettings.unsyncedOnDevice", {
                    count: unsyncedCount,
                  })}
                </Text>
              </View>
            )}
            <View style={styles.horizontalLineGray} />
            {inputs.length &&
              inputs.map((input, i) => (
                <Animated.View
                  key={input.key}
                  entering={rowEntering(i)}
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
                          iconColor={paperTheme.colors.primary}
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
              entering={rowEntering(inputs.length)}
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
              entering={rowEntering(inputs.length + 1)}
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
            testID="settings-close-button"
            mode="contained"
            onPress={() => {
              onClose();
            }}
          >
            {I18n.t("accountSettings.back")}
          </Button>
          {/* Log out is the most destructive control here and sits directly above
              the floating tab bar. Keep it de-emphasised and spaced away from the
              tab bar so it is not hit by a mis-reach. */}
          <Button
            testID="settings-logout-button"
            mode="outlined"
            onPress={handleLogout}
            style={{
              marginTop: spacing.lg,
              marginLeft: spacing.md,
              marginRight: spacing.md,
              marginBottom: spacing.xl,
            }}
          >
            {I18n.t("accountSettings.logout")}
          </Button>
          {/* Support diagnostics: the first question on a WhatsApp bug report is
              "which version?", and there was no way for a promotor to answer. */}
          <View testID="settings-app-version" style={settingsStyles.versionRow}>
            <Text style={settingsStyles.versionText}>
              {I18n.t("accountSettings.versionLabel", {
                version: Application.nativeApplicationVersion ?? "—",
                build: Application.nativeBuildVersion ?? "—",
              })}
            </Text>
          </View>
        </ScrollView>
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
