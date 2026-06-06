import { OfflineContext } from "@context/offline.context";
import { getData, storeData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import {
  cleanupPostedOfflineForms,
  postOfflineForms,
} from "@modules/offline/post";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useContext, useEffect, useState } from "react";
import { View } from "react-native";
import Emoji from "react-native-emoji";
import { Button, IconButton, Text, useTheme } from "react-native-paper";
import Animated, { Keyframe } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FormCounts from "./FormCounts";
import { createHeaderStyles } from "./index.styles";
import { handleUpload } from "./upload";

// Spec §5.5 STANDARD: drawer content slides in from top when opened
const DrawerEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -10 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
});

function Header({ setSettings, onOpenSettings, onBack }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createHeaderStyles(theme);
  const { header } = styles;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [volunteerDate, setVolunteerDate] = useState("");
  const [volunteerGreeting, setVolunteerGreeting] = useState("");
  const [offlineForms, setOfflineForms] = useState(false);
  const [offlineFormCount, setOfflineFormCount] = useState(0);
  const [submission, setSubmission] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCounts, setShowCounts] = useState(false);
  const [isOnline, setIsOnline] = useState(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);
  const { populateResidentDataCache, isLoading: isOfflineLoading } =
    useContext(OfflineContext);

  useEffect(() => {
    let cancelled = false;
    const loadStatusBar = async () => {
      const [online, ts, idForms, supForms, assetIdForms, assetSupForms] =
        await Promise.all([
          checkOnlineStatus().catch(() => false),
          getData("lastSyncTimestamp"),
          getData("offlineIDForms"),
          getData("offlineSupForms"),
          getData("offlineAssetIDForms"),
          getData("offlineAssetSupForms"),
        ]);
      if (cancelled) return;
      setIsOnline(online);
      setLastSyncTimestamp(ts);
      const total =
        (idForms?.length ?? 0) +
        (supForms?.length ?? 0) +
        (assetIdForms?.length ?? 0) +
        (assetSupForms?.length ?? 0);
      setOfflineFormCount(total);
      setOfflineForms(total > 0);
    };
    loadStatusBar();
    return () => { cancelled = true; };
  }, []);

  const volunteerLength = (object) => {
    const date = new Date(object.createdAt);
    const convertedDate = date.toDateString();
    return convertedDate;
  };

  const calculateTime = (name) => {
    const today = new Date();
    const curHr = today.getHours();

    if (curHr < 12) {
      setVolunteerGreeting(
        `${I18n.t("header.goodMorning")} ${name}!` ||
          I18n.t("header.goodMorning!")
      );
    } else if (curHr < 18) {
      setVolunteerGreeting(
        `${I18n.t("header.goodAfternoon")} ${name}!` ||
          I18n.t("header.goodAfternoon!")
      );
    } else {
      setVolunteerGreeting(
        `${I18n.t("header.goodEvening")} ${name}!` ||
          I18n.t("header.goodEvening!")
      );
    }
  };

  const upload = () =>
    handleUpload({
      postOfflineForms,
      cleanupPostedOfflineForms,
      setIsSubmitting,
      setSubmission,
      getQueuedFormCount: async () => offlineFormCount,
      storeLastSyncTimestamp: async () => {
        const ts = Date.now();
        await storeData(ts, "lastSyncTimestamp");
        setLastSyncTimestamp(ts);
      },
    });

  const cacheOfflineData = async () =>
    checkOnlineStatus().then(async (connected) => {
      if (connected) await populateResidentDataCache();
    });

  const navToSettings = () => {
    setDrawerOpen(false);
    if (onOpenSettings) {
      onOpenSettings();
      return;
    }
    if (setSettings) {
      setSettings(true);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const navToCounts = () => {
    setShowCounts(true);
  };

  return (
    <View style={styles.container}>
      <View style={[header, { paddingTop: insets.top }]}>
        {onBack ? (
          <IconButton
            icon="arrow-left"
            iconColor={styles.iconButton.color}
            size={24}
            onPress={onBack}
          />
        ) : (
          <View style={{ width: 48 }} />
        )}
        <Text style={styles.title}>{I18n.t("header.puente")}</Text>
        {offlineFormCount > 0 && (
          <Text>{String(offlineFormCount)}</Text>
        )}
        <IconButton
          icon="tune"
          iconColor={styles.iconButton.color}
          size={24}
          onPress={navToSettings}
        />
      </View>

      {/* Persistent sync status bar — visible without opening drawer */}
      <View>
        {isOnline !== null && (
          <Text style={styles.syncStatusText}>
            {isOnline ? I18n.t("header.online") : I18n.t("header.offline")}
          </Text>
        )}
        {lastSyncTimestamp != null && (
          <Text style={styles.syncTimestampText}>{new Date(lastSyncTimestamp).toLocaleTimeString()}</Text>
        )}
        {offlineFormCount > 0 && (
          <Button onPress={upload}>{I18n.t("header.retry")}</Button>
        )}
      </View>

      {submission === "SessionExpired" && (
        <View>
          <Text style={styles.errorText}>
            {I18n.t("header.sessionExpired")}
          </Text>
          <Button onPress={() => setSubmission(null)}>
            {I18n.t("header.ok")}
          </Button>
        </View>
      )}

      {drawerOpen && (
        <Animated.View
          style={styles.drawerContent}
          entering={DrawerEntrance.duration(MOTION_TOKENS.duration.base)}
        >
          {!showCounts ? (
            <>
              <Text style={styles.greeting}>
                {volunteerGreeting}
                <Emoji name="coffee" />
              </Text>
              <Text style={styles.volunteerDate}>
                {`${I18n.t("header.volunteerSince")}\n${volunteerDate}`}
              </Text>

              <View style={styles.divider} />

              <View style={styles.buttonContainer}>
                {offlineForms ? (
                  <Button
                    mode="contained"
                    onPress={upload}
                    loading={isSubmitting}
                  >
                    {I18n.t("header.submitOffline")}
                  </Button>
                ) : (
                  <Button mode="contained" disabled>
                    {I18n.t("header.submitOffline")}
                  </Button>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={cacheOfflineData}
                  loading={isOfflineLoading}
                >
                  {I18n.t("header.populateOffline")}
                </Button>
              </View>

              {submission === false && (
                <View>
                  <Text style={styles.errorText}>
                    {I18n.t("header.failedAttempt")}
                  </Text>
                  <Text style={styles.successText}>
                    {I18n.t("header.tryAgain")}
                  </Text>
                  <Button onPress={upload}>
                    {I18n.t("header.retry")}
                  </Button>
                  <Button onPress={() => setSubmission(null)}>
                    {I18n.t("header.ok")}
                  </Button>
                </View>
              )}

              {submission === true && (
                <View>
                  <Text style={styles.successText}>
                    {I18n.t("header.success")}
                  </Text>
                  <Text style={styles.successText}>
                    {I18n.t("header.justSubmitted")} {offlineFormCount}{" "}
                    {offlineFormCount > 1
                      ? I18n.t("header.forms")
                      : I18n.t("header.form")}
                  </Text>
                  <Button onPress={() => setSubmission(null)}>
                    {I18n.t("header.ok")}
                  </Button>
                </View>
              )}
            </>
          ) : (
            <FormCounts />
          )}
        </Animated.View>
      )}
    </View>
  );
}

export default Header;
