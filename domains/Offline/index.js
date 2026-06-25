import { handleUpload } from "@impacto-design-system/Extensions/Header/upload";
import { getData, storeData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import {
  cleanupPostedOfflineForms,
  postOfflineForms,
} from "@modules/offline/post";
import { getTokens } from "@modules/theme/tokens";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

function OfflineSyncScreen() {
  const { dark } = useTheme();
  const t = getTokens(dark ? "dark" : "light");
  const [offlineFormCount, setOfflineFormCount] = useState(0);
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
    const total =
      (idForms?.length ?? 0) +
      (supForms?.length ?? 0) +
      (assetIdForms?.length ?? 0) +
      (assetSupForms?.length ?? 0);
    setOfflineFormCount(total);
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
      backgroundColor: t.tkDliteSemanticColorSurface,
      borderRadius: t.tkDliteSemanticBorderRadiusMedium,
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
  });

  const formWord =
    offlineFormCount === 1
      ? I18n.t("header.form")
      : I18n.t("header.forms");

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
              <Text style={styles.countText}>
                {I18n.t("header.justSubmitted")} {offlineFormCount} {formWord}
              </Text>
              <Button
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

        {submission === false && (
          <Text style={styles.errorText}>{I18n.t("header.failedAttempt")}</Text>
        )}
        {typeof submission === "number" && submission > 0 && (
          <Text style={styles.successText}>
            {I18n.t("header.success")} {I18n.t("header.justSubmitted")}{" "}
            {submission} {formWord}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default OfflineSyncScreen;
