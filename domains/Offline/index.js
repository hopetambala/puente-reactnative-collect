import { handleUpload } from "@impacto-design-system/Extensions/Header/upload";
import { getData, storeData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import {
  cleanupPostedOfflineForms,
  postOfflineForms,
} from "@modules/offline/post";
import { describeQueuedForms, removeQueuedForm } from "@modules/offline/queue";
import { getTokens } from "@modules/theme/tokens";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

function OfflineSyncScreen() {
  const { dark } = useTheme();
  const t = getTokens(dark ? "dark" : "light");
  const [offlineFormCount, setOfflineFormCount] = useState(0);
  const [queuedForms, setQueuedForms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);
  const [isOnline, setIsOnline] = useState(null);

  const loadStatusBar = useCallback(async () => {
    const [ts, idForms, supForms, assetIdForms, assetSupForms] =
      await Promise.all([
        getData("lastSyncTimestamp"),
        getData("offlineIDForms"),
        getData("offlineSupForms"),
        getData("offlineAssetIDForms"),
        getData("offlineAssetSupForms"),
      ]);
    setLastSyncTimestamp(ts);
    const queues = {
      offlineIDForms: idForms,
      offlineSupForms: supForms,
      offlineAssetIDForms: assetIdForms,
      offlineAssetSupForms: assetSupForms,
    };
    const entries = describeQueuedForms(queues);
    setQueuedForms(entries);
    setOfflineFormCount(entries.length);
  }, []);

  // Refresh count every time the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStatusBar();
    }, [loadStatusBar])
  );

  useEffect(() => {
    let cancelled = false;
    NetInfo.fetch()
      .then((state) => {
        if (!cancelled) setIsOnline(state.isConnected && state.details !== null);
      })
      .catch(() => {
        if (!cancelled) setIsOnline(false);
      });
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!cancelled) setIsOnline(state.isConnected && state.details !== null);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const upload = () =>
    handleUpload({
      postOfflineForms,
      cleanupPostedOfflineForms,
      setIsSubmitting,
      setSubmission,
      getQueuedFormCount: async () => offlineFormCount,
      resetFormCount: setOfflineFormCount,
      storeLastSyncTimestamp: async () => {
        const ts = Date.now();
        await storeData(ts, "lastSyncTimestamp");
        setLastSyncTimestamp(ts);
      },
    }).catch((error) => {
      console.error(error);
      setIsSubmitting(false);
      setSubmission(false);
    });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.tkDliteSemanticColorBackground,
    },
    content: {
      padding: t.tkDliteSemanticSpacing400,
    },
    heading: {
      color: t.tkDliteSemanticColorTextPrimary,
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: t.tkDliteSemanticSpacing200,
    },
    statusChip: {
      color: t.tkDliteSemanticColorTextSecondary,
      fontSize: 14,
      marginBottom: t.tkDliteSemanticSpacing400,
    },
    card: {
      backgroundColor: t.tkDliteSemanticColorSurfaceBase,
      borderRadius: t.tkDliteSemanticBorderRadiusMd,
      padding: t.tkDliteSemanticSpacing400,
      marginBottom: t.tkDliteSemanticSpacing400,
    },
    countText: {
      color: t.tkDliteSemanticColorTextPrimary,
      fontSize: 16,
      marginBottom: t.tkDliteSemanticSpacing300,
    },
    emptyText: {
      color: t.tkDliteSemanticColorTextSecondary,
      fontSize: 16,
      textAlign: "center",
      marginVertical: t.tkDliteSemanticSpacing600,
    },
    syncTimestamp: {
      color: t.tkDliteSemanticColorTextSecondary,
      fontSize: 13,
      marginTop: t.tkDliteSemanticSpacing200,
    },
    successText: {
      color: t.tkDliteSemanticColorSuccess,
      fontSize: 14,
      marginTop: t.tkDliteSemanticSpacing200,
    },
    errorText: {
      color: t.tkDliteSemanticColorError,
      fontSize: 14,
      marginTop: t.tkDliteSemanticSpacing200,
    },
    queuedHeading: {
      color: t.tkDliteSemanticColorTextSecondary,
      fontSize: t.tkDliteSemanticTypographySize200,
      marginTop: t.tkDliteSemanticSpacing400,
      marginBottom: t.tkDliteSemanticSpacing200,
    },
    queuedRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: t.tkDliteSemanticColorBorder,
      paddingVertical: t.tkDliteSemanticSpacing200,
    },
    queuedLabel: {
      flex: 1,
      color: t.tkDliteSemanticColorTextPrimary,
      fontSize: t.tkDliteSemanticTypographySize300,
      marginRight: t.tkDliteSemanticSpacing300,
    },
    helpText: {
      color: t.tkDliteSemanticColorTextSecondary,
      fontSize: 14,
      marginTop: t.tkDliteSemanticSpacing200,
    },
  });

  // A queued record is named the way the surveyor first met it in the gallery.
  // A custom form carries its own title, because every custom form shares the
  // FormResults class and the class therefore identifies nothing.
  const labelFor = (entry) => {
    const formName =
      entry.customTitle ||
      (entry.formNameKey
        ? I18n.t(entry.formNameKey)
        : I18n.t("offlineSync.unknownForm"));
    return entry.personName ? `${formName} — ${entry.personName}` : formName;
  };

  // The upload is all-or-nothing, so one record the server keeps refusing stops
  // every other queued form from syncing — and nothing in the app could clear
  // it (offline-clear-button empties the resident CACHE, not this queue). This
  // is the escape hatch. It destroys a record that exists nowhere else, so it
  // names the form and the permanence and takes a second, deliberate press.
  const confirmDiscard = (entry) => {
    Alert.alert(
      I18n.t("offlineSync.discardTitle"),
      I18n.t("offlineSync.discardWarning", { form: labelFor(entry) }),
      [
        { text: I18n.t("global.cancel"), style: "cancel" },
        {
          // Deliberately NOT the same word as the row control: on screen the
          // row's Discard sits behind the alert, so an identical label makes the
          // confirm ambiguous — and it should name its consequence anyway.
          text: I18n.t("offlineSync.discardConfirm"),
          style: "destructive",
          onPress: async () => {
            await removeQueuedForm(entry.storageKey, entry.index);
            await loadStatusBar();
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Take the count from the number being described, not from the queue.
  // The success line reports `submission`, but handleUpload resets the queue
  // count to 0 before it renders — so a queue-derived word was always the
  // plural and syncing one form announced "You have just submitted 1 forms!".
  const formWordFor = (count) =>
    count === 1 ? I18n.t("header.form") : I18n.t("header.forms");

  // A QUEUED form has not reached the server. Reusing header.justSubmitted
  // here told a surveyor "You have just submitted 1 form!" about work that was
  // sitting unsent on the device — an invitation to close the app on data that
  // has not been saved anywhere but this phone. header.justSubmitted still
  // describes the success line below, where a submit really did happen.
  const queuedText =
    offlineFormCount === 1
      ? I18n.t("offlineSync.queuedOne")
      : I18n.t("offlineSync.queuedMany", { count: offlineFormCount });

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>{I18n.t("offlineSync.title")}</Text>

        {isOnline !== null && (
          <Text style={styles.statusChip}>
            {isOnline ? I18n.t("header.online") : I18n.t("header.offline")}
          </Text>
        )}

        <View style={styles.card}>
          {offlineFormCount > 0 ? (
            <>
              <Text style={styles.countText}>{queuedText}</Text>
              <Text style={styles.queuedHeading}>
                {I18n.t("offlineSync.queuedTitle")}
              </Text>
              {/*
                Numbered by position in the COMBINED list, not by entry.index —
                that is a position within one queue, so a resident form and a
                supplementary form are both index 0 and the controls collided.
              */}
              {queuedForms.map((entry, position) => (
                <View
                  key={`${entry.storageKey}-${entry.index}`}
                  style={styles.queuedRow}
                >
                  <Text
                    testID={`queued-form-${position}`}
                    style={styles.queuedLabel}
                  >
                    {labelFor(entry)}
                  </Text>
                  {/*
                    Error-coloured TEXT button, not a red slab: Retry is the
                    contained control and must stay the loudest thing here —
                    the same hierarchy the cache-clear screen settled on. Red
                    is not the only signal either; the label says "Discard" and
                    the confirmation names the consequence.
                  */}
                  <Button
                    testID={`queued-discard-${position}`}
                    mode="text"
                    textColor={t.tkDliteSemanticColorError}
                    onPress={() => confirmDiscard(entry)}
                    accessibilityLabel={`${I18n.t(
                      "offlineSync.discard"
                    )} ${labelFor(entry)}`}
                  >
                    {I18n.t("offlineSync.discard")}
                  </Button>
                </View>
              ))}
              <Button
                testID="offline-retry-button"
                mode="contained"
                onPress={upload}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {I18n.t("header.retry")}
              </Button>
            </>
          ) : (
            <Text style={styles.emptyText}>{I18n.t("offlineSync.noForms")}</Text>
          )}

          {lastSyncTimestamp != null && (
            <Text style={styles.syncTimestamp}>
              {I18n.t("offlineSync.lastSync")}{" "}
              {new Date(lastSyncTimestamp).toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/*
          A failed sync used to render one red line and nothing else. The queue
          deliberately SURVIVES the failure (modules/offline/post keeps it for
          retry), but the screen never said so — so the only feedback a surveyor
          got read like their work had just been destroyed.
        */}
        {submission === false && (
          <>
            <Text style={styles.errorText}>
              {I18n.t("header.failedAttempt")}
            </Text>
            <Text style={styles.helpText}>
              {I18n.t("offlineSync.stillOnDevice")}
            </Text>
            {/*
              header.tryAgain blames the internet connection. When the app is
              online and the server refused the records, that sends a surveyor
              looking for better signal for a problem signal cannot fix.
            */}
            <Text style={styles.helpText}>
              {isOnline
                ? I18n.t("offlineSync.failedOnline")
                : I18n.t("offlineSync.failedOffline")}
            </Text>
          </>
        )}
        {/*
          handleUpload reports an expired session as the STRING "SessionExpired",
          which matched neither the `=== false` branch nor the numeric success
          branch — so this failure rendered nothing whatsoever. The spinner
          stopped and Retry appeared to do nothing, indefinitely.
        */}
        {submission === "SessionExpired" && (
          <>
            <Text style={styles.errorText}>
              {I18n.t("header.sessionExpired")}
            </Text>
            <Text style={styles.helpText}>
              {I18n.t("offlineSync.stillOnDevice")}
            </Text>
          </>
        )}
        {typeof submission === "number" && submission > 0 && (
          <Text style={styles.successText}>
            {I18n.t("header.success")} {I18n.t("header.justSubmitted")}{" "}
            {submission} {formWordFor(submission)}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default OfflineSyncScreen;
