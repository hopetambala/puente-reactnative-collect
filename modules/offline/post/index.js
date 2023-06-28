import surveyingUserFailsafe from "@app/domains/DataCollection/Forms/utils";
import { uploadOfflineForms } from "@app/services/parse/crud";
import { deleteData, getData } from "@modules/async-storage";
import { isEmpty } from "@modules/utils";
import { Platform } from "react-native";

import checkOnlineStatus from "..";
import getAWSLogger from "@modules/aws-logging/hook";

const cleanupPostedOfflineForms = async () => {
  await deleteData("offlineIDForms");
  await deleteData("offlineSupForms");
  await deleteData("offlineAssetIDForms");
  await deleteData("offlineAssetSupForms");
  await deleteData("offlineHouseholds");
};

const postOfflineForms = async () => {
  const user = await getData("currentUser");

  const surveyUser = await surveyingUserFailsafe(user, undefined, isEmpty);
  const { organization } = user;
  const appVersion = (await getData("appVersion")) || "";
  const phoneOS = Platform.OS || "";

  const idFormsAsync = await getData("offlineIDForms");
  const supplementaryFormsAsync = await getData("offlineSupForms");
  const assetIdFormsAsync = await getData("offlineAssetIDForms");
  const assetSupFormsAsync = await getData("offlineAssetSupForms");
  const householdsAsync = await getData("offlineHouseholds");

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
    const uploadedForms = await uploadOfflineForms(offlineForms).catch(() => ({
      status: "Error",
    }));
    getAWSLogger().log({
      type: "OFFLINE_FORM_UPLOADED",
      parseUser: user.objectId
    });
    return {
      offlineForms,
      uploadedForms,
      status: "Success",
    };
  }

  return "No Internet Access";
};

export { cleanupPostedOfflineForms, postOfflineForms };
