import {
  postObjectsToClass,
  postObjectsToClassWithRelation,
} from "@app/services/parse/crud";
import { getData, storeData } from "@modules/async-storage";
import checkOnlineStatus from "@modules/offline";
import { fulfillWithTimeLimit, generateRandomID } from "@modules/utils";

const POST_TIMEOUT_MS = 15000;

const postIdentificationForm = async (postParams) => {
  const isConnected = await checkOnlineStatus();
  if (isConnected) {
    const result = await fulfillWithTimeLimit(
      POST_TIMEOUT_MS,
      postObjectsToClass(postParams),
      null
    );
    if (result.timedOut) throw new Error("postIdentificationForm timed out");
    if (result.error) throw result.error;
    if (!result.value) throw new Error("postIdentificationForm returned null");
    return JSON.parse(JSON.stringify(result.value));
  }

  return getData("offlineIDForms").then(async (offlineIDForms) => {
    const offlineResidentIdForms = offlineIDForms;

    const idParams = postParams;
    const { localObject } = idParams;

    localObject.objectId = `PatientID-${generateRandomID()}`;

    if (offlineResidentIdForms) {
      const forms = offlineResidentIdForms.concat(idParams);
      await storeData(forms, "offlineIDForms");
      return localObject;
    }

    const idData = [idParams];
    await storeData(idData, "offlineIDForms");
    return localObject;
  });
};

/** ***********************************************
 * Function to post asset id form offline offline
 * @name postForms
 * @example
 * postAssetForm(postParam);
 *
 * @param {Object} postParam Object normally configirued for for Parse-server
 *
 *********************************************** */

const postAssetForm = async (postParams) => {
  const isConnected = await checkOnlineStatus();
  if (isConnected) {
    const result = await fulfillWithTimeLimit(
      POST_TIMEOUT_MS,
      postObjectsToClass(postParams),
      null
    );
    if (result.timedOut) throw new Error("postAssetForm timed out");
    if (result.error) throw result.error;
    if (!result.value) throw new Error("postAssetForm returned null");
    return JSON.parse(JSON.stringify(result.value));
  }
  return getData("offlineAssetIDForms").then(async (offlineData) => {
    const id = `AssetID-${generateRandomID()}`;
    const assetIdParams = postParams;
    const offlineAssetForms = offlineData;
    assetIdParams.localObject.objectId = id;

    if (offlineAssetForms) {
      const forms = offlineAssetForms.concat(assetIdParams);
      return storeData(forms, "offlineAssetIDForms");
    }

    const idData = [assetIdParams];
    return storeData(idData, "offlineAssetIDForms");
  });
};

const postSupplementaryForm = async (postParams) => {
  const isConnected = await checkOnlineStatus();
  if (isConnected && !postParams?.parseParentClassID?.includes("PatientID-")) {
    const result = await fulfillWithTimeLimit(
      POST_TIMEOUT_MS,
      postObjectsToClassWithRelation(postParams),
      null
    );
    if (result.timedOut) throw new Error("postSupplementaryForm timed out");
    if (result.error) throw result.error;
    if (!result.value) throw new Error("postSupplementaryForm returned null");
    return result.value;
  }

  return getData("offlineSupForms").then(async (supForms) => {
    if (supForms) {
      const forms = supForms.concat(postParams);
      return storeData(forms, "offlineSupForms");
    }
    const supData = [postParams];
    return storeData(supData, "offlineSupForms");
  });
};

/** ***********************************************
 * Function to post asset supplementary form offline
 * @name postForms
 * @example
 * postSupplementaryAssetForm(postParam);
 *
 * @param {Object} postParams Object normally configured for for Parse-Server Cloud Code
 *
 *********************************************** */
const postSupplementaryAssetForm = async (postParams) => {
  const isConnected = await checkOnlineStatus();

  if (isConnected && !postParams?.parseParentClassID?.includes("AssetID-")) {
    const result = await fulfillWithTimeLimit(
      POST_TIMEOUT_MS,
      postObjectsToClassWithRelation(postParams),
      null
    );
    if (result?.timedOut) throw new Error("postSupplementaryAssetForm timed out");
    if (result?.error) throw result.error;
    return result?.value ?? null;
  }
  return getData("offlineAssetSupForms").then(async (supForms) => {
    if (supForms) {
      const forms = supForms.concat(postParams);
      return storeData(forms, "offlineAssetSupForms");
    }
    const supData = [postParams];
    return storeData(supData, "offlineAssetSupForms");
  });
};

/**
 * Function to post household form. Used for creating a new household
 * @param {*} postParams
 * @returns Househould object
 */
const postHousehold = async (postParams) => {
  const isConnected = await checkOnlineStatus();

  if (isConnected) {
    const result = await fulfillWithTimeLimit(
      POST_TIMEOUT_MS,
      postObjectsToClass(postParams),
      null
    );
    if (result.timedOut) throw new Error("postHousehold timed out");
    if (result.error) throw result.error;
    if (!result.value) throw new Error("postHousehold returned null");
    return result.value.id;
  }

  return getData("offlineHouseholds").then(async (offlineHouseholds) => {
    const households = offlineHouseholds;
    const householdParams = postParams;

    const { localObject } = householdParams;
    localObject.objectId = `Household-${generateRandomID()}`;

    if (households) {
      const forms = households.concat(householdParams);
      await storeData(forms, "offlineHouseholds");
      return forms;
    }
    const householdData = [householdParams];
    await storeData(householdData, "offlineHouseholds");
    return householdData;
  });
};

export {
  postAssetForm,
  postHousehold,
  postIdentificationForm,
  postSupplementaryAssetForm,
  postSupplementaryForm,
};
