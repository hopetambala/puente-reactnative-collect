import surveyingUserFailsafe from "@app/domains/DataCollection/Forms/utils";
import { uploadOfflineForms } from "@app/services/parse/crud";
import { deleteData, getData } from "@modules/async-storage";
import { isEmpty } from "@modules/utils";
import { Platform } from "react-native";

import checkOnlineStatus from "..";

// Cloud Code's success payload always carries all five categories as arrays.
// Its Offline.upload catches save failures and RETURNS the error (a serialized
// Error crosses Parse as {}), so anything missing a category means records
// were not saved — the local queue must survive for retry.
const UPLOAD_CATEGORIES = [
  "residentForms",
  "residentSupplementaryForms",
  "households",
  "assetForms",
  "assetSupplementaryForms",
];

const isCompleteUploadResult = (result) =>
  !!result &&
  typeof result === "object" &&
  UPLOAD_CATEGORIES.every((key) => Array.isArray(result[key]));

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
      console.error("cleanupPostedOfflineForms: delete failed for key", keys[i]);
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
    if (uploadResult.status === "Error" || !isCompleteUploadResult(uploadResult)) {
      return {
        offlineForms,
        uploadedForms: uploadResult,
        status: "Error",
      };
    }
    return {
      offlineForms,
      uploadedForms: uploadResult,
      status: "Success",
    };
  }

  return { status: "Offline" };
};

export { cleanupPostedOfflineForms, postOfflineForms };
