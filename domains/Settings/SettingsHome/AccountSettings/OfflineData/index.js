import { OfflineContext } from "@context/offline.context";
import {
  Button as PaperButton,
  PopupSuccess,
} from "@impacto-design-system/Base";
import { deleteData, getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import React, { useContext, useState } from "react";
import { Alert, View } from "react-native";
import { useTheme } from "react-native-paper";

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
  const layout = createLayoutStyles(theme);
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
    <View style={layout.formContainer}>
      <PaperButton
        onPress={repopulateAllData}
        buttonText={I18n.t("accountSettings.populateIdForms")}
        loading={!!isLoading}
        accessibilityLabel={I18n.t("accountSettings.populateIdForms")}
        style={{ backgroundColor: theme.colors.info }}
      />
      <PaperButton
        onPress={confirmClearCachedForms}
        buttonText={I18n.t("accountSettings.clearCachedIdForms")}
        icon="delete"
        accessibilityLabel={I18n.t("accountSettings.clearCachedIdForms")}
        style={{ backgroundColor: theme.colors.error }}
      />
      <PopupSuccess
        success={cacheSuccess}
        setSuccess={setCacheSuccess}
        submittedForms={submittedForms}
      />
    </View>
  );
}
export default OfflineData;
