import surveyingUserFailsafe from "@app/domains/DataCollection/Forms/utils";
import { uploadOfflineForms } from "@app/services/parse/crud";
import { deleteData, getData } from "@modules/async-storage";
import getAWSLogger from "@modules/aws-logging/logger";
import { isEmpty } from "@modules/utils";
import { Platform } from "react-native";

import checkOnlineStatus from "..";

const cleanupPostedOfflineForms = async () => {
  const keys = [
    "offlineIDForms",
    "offlineSupForms",
    "offlineAssetIDForms",
    "offlineAssetSupForms",
    "offlineHouseholds",
  ];
  const results = await Promise.allSettled(keys.map((key) => deleteData(key)));
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      getAWSLogger().log({ type: "CLEANUP_DELETE_FAILED", key: keys[i] });
    }
  });
};

const postOfflineForms = async () => {
  const user = await getData("currentUser");

  if (!user) {
    return { status: "Error" };
  }

  const surveyUser = await surveyingUserFailsafe(user, undefined, isEmpty);
  const { organization } = user;
  const phoneOS = Platform.OS || "";

  const [
    idFormsAsync,
    supplementaryFormsAsync,
    assetIdFormsAsync,
    assetSupFormsAsync,
    householdsAsync,
    appVersionRaw,
  ] = await Promise.all([
    getData("offlineIDForms"),
    getData("offlineSupForms"),
    getData("offlineAssetIDForms"),
    getData("offlineAssetSupForms"),
    getData("offlineHouseholds"),
    getData("appVersion"),
  ]);
  const appVersion = appVersionRaw || "";

  const offlineForms = {
    residentForms: idFormsAsync,
    residentSupplementaryForms: supplementaryFormsAsync,
    households: householdsAsync,
    assetForms: assetIdFormsAsync,
    assetSupplementaryForms: assetSupFormsAsync,
    metadata: {
      surveyingUser: surveyUser,
      surveyingOrganization: organization,
      parseUser: user.objectId,
      appVersion,
      phoneOS,
    },
  };

  const isConnected = await checkOnlineStatus();

  if (isConnected) {
    const uploadResult = await uploadOfflineForms(offlineForms).catch(() => ({
      status: "Error",
    }));
    if (uploadResult.status === "Error") {
      return {
        offlineForms,
        uploadedForms: uploadResult,
        status: "Error",
      };
    }
    getAWSLogger().log({
      type: "OFFLINE_FORM_UPLOADED",
      parseUser: user.objectId,
    });
    return {
      offlineForms,
      uploadedForms: uploadResult,
      status: "Success",
    };
  }

  return { status: "Offline" };
};

export { cleanupPostedOfflineForms, postOfflineForms };
