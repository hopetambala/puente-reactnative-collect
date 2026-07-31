import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import { Alert } from "react-native";

/**
 * Tally of records saved on this device that have not reached the server.
 * Mirrors domains/Offline/index.js:26-40 -- same four keys, same null-safety
 * (getData returns null for a key that was never written).
 */
export const countUnsyncedRecords = async () => {
  const [idForms, supForms, assetIdForms, assetSupForms] = await Promise.all([
    getData("offlineIDForms"),
    getData("offlineSupForms"),
    getData("offlineAssetIDForms"),
    getData("offlineAssetSupForms"),
  ]);
  return (
    (idForms?.length ?? 0) +
    (supForms?.length ?? 0) +
    (assetIdForms?.length ?? 0) +
    (assetSupForms?.length ?? 0)
  );
};

/**
 * Confirms before logging out, and escalates the warning when it would strand
 * the user.
 *
 * Offline login is disabled (context/auth.context.js:75-82), so logging out
 * without a connection means the promotor cannot get back in until they find
 * one -- their queued records survive on disk but are unreachable and cannot
 * sync. There is a logout entry point in both SettingsHome and SupportHome;
 * both must route through here, or the stranding path stays reachable.
 */
export const confirmLogout = async (logOut) => {
  const [online, unsyncedCount] = await Promise.all([
    checkOnlineStatus(),
    countUnsyncedRecords(),
  ]);

  const message = [I18n.t("accountSettings.logoutMessage")];
  if (!online) {
    message.push(I18n.t("accountSettings.logoutOfflineWarning"));
  }
  if (unsyncedCount > 0) {
    message.push(
      I18n.t("accountSettings.logoutUnsyncedWarning", { count: unsyncedCount })
    );
  }

  Alert.alert(
    I18n.t("accountSettings.logoutTitle"),
    message.join("\n\n"),
    [
      { text: I18n.t("global.cancel"), style: "cancel" },
      {
        text: I18n.t("accountSettings.logoutConfirm"),
        style: "destructive",
        onPress: logOut,
      },
    ],
    { cancelable: true }
  );
};

export default confirmLogout;
