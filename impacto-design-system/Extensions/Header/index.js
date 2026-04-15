import { OfflineContext } from "@context/offline.context";
import { getData } from "@modules/async-storage";
import handleParseError from "@modules/cached-resources/error-handling";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import {
  cleanupPostedOfflineForms,
  postOfflineForms,
} from "@modules/offline/post";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useContext, useState } from "react";
import { View } from "react-native";
import Emoji from "react-native-emoji";
import { Button, IconButton, Text, useTheme } from "react-native-paper";
import Animated, { Keyframe } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FormCounts from "./FormCounts";
import { createHeaderStyles } from "./index.styles";

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
  const { populateResidentDataCache, isLoading: isOfflineLoading } =
    useContext(OfflineContext);

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

  // eslint-disable-next-line no-unused-vars
  const count = async () => {
    getData("currentUser").then((user) => {
      calculateTime(user.firstname);
      setVolunteerDate(volunteerLength(user));
    });

    const idFormCount = await getData("offlineIDForms").then((idForms) => {
      if (idForms) {
        setOfflineForms(true);
        return idForms.length;
      }
      return 0;
    });

    const supplementaryCount = await getData("offlineSupForms").then(
      (supForms) => {
        if (supForms) {
          setOfflineForms(true);
          return supForms.length;
        }
        return 0;
      }
    );

    const assetIdFormCount = await getData("offlineAssetIDForms").then(
      (assetIdForms) => {
        if (assetIdForms) {
          setOfflineForms(true);
          return assetIdForms.length;
        }
        return 0;
      }
    );

    const assetSupForms = await getData("offlineAssetSupForms").then(
      (assetSuppForms) => {
        if (assetSuppForms) {
          setOfflineForms(true);
          return assetSuppForms.length;
        }
        return 0;
      }
    );

    const allFormOfflineCount =
      idFormCount + supplementaryCount + assetIdFormCount + assetSupForms;

    setOfflineFormCount(allFormOfflineCount);

    setOfflineForms(allFormOfflineCount > 0);

    setDrawerOpen(!drawerOpen);
  };

  const upload = async () => {
    setIsSubmitting(true);
    const offlineRecords = await postOfflineForms().catch((error) =>
      handleParseError(error, postOfflineForms).then(async (records) => {
        const { status } = records;

        if (status === "Error") {
          setIsSubmitting(false);
          setSubmission(false);
          return;
        }
        setSubmission(true);
        setIsSubmitting(false);
        await cleanupPostedOfflineForms();
      })
    );

    const { status } = offlineRecords;
    if (status === "Error") {
      setIsSubmitting(false);
      setSubmission(false);
      return;
    }

    setSubmission(true);
    setIsSubmitting(false);
    await cleanupPostedOfflineForms();
  };

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
        <IconButton
          icon="tune"
          iconColor={styles.iconButton.color}
          size={24}
          onPress={navToSettings}
        />
      </View>

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
