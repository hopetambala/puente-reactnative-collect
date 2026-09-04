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

  const offlineResidentIdForms = await getData("offlineIDForms");
  const localObject = { ...postParams.localObject, objectId: `PatientID-${generateRandomID()}` };
  // isOfflineLocal is on idParams (queue routing), NOT inside localObject —
  // Cloud Code reads only form.localObject so this never reaches Parse on sync.
  const idParams = { ...postParams, localObject, isOfflineLocal: true };

  const existing = offlineResidentIdForms ?? [];
  await storeData([...existing, idParams], "offlineIDForms");
  return { ...localObject, isOfflineLocal: true };
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
  const offlineData = await getData("offlineAssetIDForms");
  const localObject = { ...postParams.localObject, objectId: `AssetID-${generateRandomID()}` };
  const assetIdParams = { ...postParams, localObject, isOfflineLocal: true };

  const existing = offlineData ?? [];
  await storeData([...existing, assetIdParams], "offlineAssetIDForms");
  return { ...localObject, isOfflineLocal: true };
};

const postSupplementaryFormBase = async (postParams, { offlineKey, fnName }) => {
  const isConnected = await checkOnlineStatus();
  if (isConnected && postParams?.parseParentClassID && !postParams?.isOfflineLocal) {
    const result = await fulfillWithTimeLimit(
      POST_TIMEOUT_MS,
      postObjectsToClassWithRelation(postParams),
      null
    );
    if (result.timedOut) throw new Error(`${fnName} timed out`);
    if (result.error) throw result.error;
    if (!result.value) throw new Error(`${fnName} returned null`);
    return result.value;
  }

  const supForms = await getData(offlineKey);
  const existing = supForms ?? [];
  await storeData([...existing, postParams], offlineKey);
  return postParams;
};

/** ***********************************************
 * Function to post supplementary form offline
 * @name postSupplementaryForm
 * @example
 * postSupplementaryForm(postParam);
 *
 * @param {Object} postParams Object normally configured for Parse-Server Cloud Code
 *
 *********************************************** */
const postSupplementaryForm = (postParams) =>
  postSupplementaryFormBase(postParams, {
    offlineKey: "offlineSupForms",
    fnName: "postSupplementaryForm",
  });

/** ***********************************************
 * Function to post asset supplementary form offline
 * @name postSupplementaryAssetForm
 * @example
 * postSupplementaryAssetForm(postParam);
 *
 * @param {Object} postParams Object normally configured for for Parse-Server Cloud Code
 *
 *********************************************** */
const postSupplementaryAssetForm = (postParams) =>
  postSupplementaryFormBase(postParams, {
    offlineKey: "offlineAssetSupForms",
    fnName: "postSupplementaryAssetForm",
  });

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

  const households = await getData("offlineHouseholds");
  const localObject = { ...postParams.localObject, objectId: `Household-${generateRandomID()}` };
  const householdParams = { ...postParams, localObject };

  const existing = households ?? [];
  const forms = [...existing, householdParams];
  await storeData(forms, "offlineHouseholds");
  return forms;
};

export {
  postAssetForm,
  postHousehold,
  postIdentificationForm,
  postSupplementaryAssetForm,
  postSupplementaryForm,
};
