import { OfflineContext } from "@context/offline.context";
import {
  Button as PaperButton,
  PopupSuccess,
} from "@impacto-design-system/Base";
import { deleteData, getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { getTokens } from "@modules/theme/tokens";
import React, { useContext, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { createSettingsStyles } from "../../../index.styles";

const t = getTokens("light");

const styles = StyleSheet.create({
  // NOT layout.formContainer: that is `flex: 1` with centred content, meant for
  // a Formik form. Its parent (AccountSettings mainContainer) has no height, so
  // a flex:1 child collapses to zero -- which is exactly how this screen ended
  // up blank once the form was removed.
  container: {
    paddingVertical: t.tkDliteSemanticSpacing400,
  },
  explainer: {
    marginBottom: t.tkDliteSemanticSpacing500,
    fontSize: t.tkDliteSemanticTypographySize300,
  },
  action: {
    marginBottom: t.tkDliteSemanticSpacing300,
  },
});

/**
 * Offline records: prepare the device for a shift without a connection.
 *
 * AS-39: this screen used to also offer a community-filtered query, which
 * overwrote the entire resident cache with only the matching subset -- the exact
 * failure the auto-populate path guards against
 * (impacto-design-system/Extensions/FindResidents/index.js:100). Because
 * cacheResidentDataMulti's write guard let an empty array through, a filter that
 * matched nothing wiped the cache and still reported success. Since the Find
 * Records overhaul the cache populates itself from any unfiltered search, so the
 * control had no remaining job worth that risk and was removed.
 */
function OfflineData() {
  const theme = useTheme();
  const settingsStyles = useMemo(() => createSettingsStyles(theme), [theme]);
  const [cacheSuccess, setCacheSuccess] = useState(false);
  const [submittedForms, setSubmittedForms] = useState(0);
  const { populateResidentDataCache, isLoading } = useContext(OfflineContext);

  const repopulateAllData = async () =>
    populateResidentDataCache().then((records) => {
      setSubmittedForms(records.length);
      setCacheSuccess(true);
    });

  // Clearing the cache is destructive and only recoverable with a connection --
  // rebuilding runs populateResidentDataCache(). Name the cost before doing it.
  const confirmClearCachedForms = async () => {
    const cached = await getData("residentData");
    const count = cached?.length ?? 0;

    Alert.alert(
      I18n.t("accountSettings.clearCacheTitle"),
      I18n.t("accountSettings.clearCacheWarning", { count }),
      [
        { text: I18n.t("global.cancel"), style: "cancel" },
        {
          text: I18n.t("accountSettings.clearCacheConfirm"),
          style: "destructive",
          onPress: async () => {
            await deleteData("residentData");
            Alert.alert(
              I18n.t("global.success"),
              I18n.t("accountSettings.clearCacheDone"),
              [{ text: I18n.t("global.ok") }],
              { cancelable: true }
            );
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">
        {I18n.t("accountSettings.offlineData")}
      </Text>
      <View style={settingsStyles.horizontalLinePrimary} />
      {/* Say what the screen is for. Without the removed form's header field
          this was two unlabelled buttons on an otherwise empty page. */}
      <Text style={[styles.explainer, { color: theme.colors.onSurfaceVariant }]}>
        {I18n.t("accountSettings.offlineDataExplainer")}
      </Text>
      {/* Download is the primary action on this screen. Clear is destructive
          and belongs behind it visually -- a solid red slab made deleting the
          cache the loudest thing here. */}
      <View style={styles.action}>
        <PaperButton
          testID="offline-download-button"
          mode="contained"
          onPress={repopulateAllData}
          buttonText={I18n.t("accountSettings.populateIdForms")}
          loading={!!isLoading}
          accessibilityLabel={I18n.t("accountSettings.populateIdForms")}
        />
      </View>
      <View style={styles.action}>
        <PaperButton
          testID="offline-clear-button"
          mode="outlined"
          color="error"
          onPress={confirmClearCachedForms}
          buttonText={I18n.t("accountSettings.clearCachedIdForms")}
          icon="delete"
          accessibilityLabel={I18n.t("accountSettings.clearCachedIdForms")}
        />
      </View>
      <PopupSuccess
        success={cacheSuccess}
        setSuccess={setCacheSuccess}
        submittedForms={submittedForms}
      />
    </View>
  );
}
export default OfflineData;
