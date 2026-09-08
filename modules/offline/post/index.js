import surveyingUserFailsafe from "@app/domains/DataCollection/Forms/utils";
import { uploadOfflineForms } from "@app/services/parse/crud";
import { deleteData, getData, storeData } from "@modules/async-storage";
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

// Which queue each upload category is drained from.
const CATEGORY_QUEUE_KEYS = {
  residentForms: "offlineIDForms",
  residentSupplementaryForms: "offlineSupForms",
  assetForms: "offlineAssetIDForms",
  assetSupplementaryForms: "offlineAssetSupForms",
  households: "offlineHouseholds",
};

const QUEUE_KEYS = Object.values(CATEGORY_QUEUE_KEYS);

// The phone-side id the server echoes back on a record it actually saved.
// Crossing Parse.Cloud.run serialises a Parse.Object to plain JSON, so read the
// field directly and fall back to .get() for an unserialised object.
const offlineIdOf = (row) => {
  if (!row) return null;
  if (row.objectIdOffline) return row.objectIdOffline;
  if (typeof row.get === "function") return row.get("objectIdOffline") || null;
  return null;
};

// Drop only the queue entries the server confirmed. Anything it did not
// confirm stays put: deleting it loses field data that exists nowhere else,
// and re-sending it whole is what creates duplicate health records.
// An entry is removed ONLY when we can positively confirm it saved — either by
// matching the offline id the server echoed back, or because its whole category
// is accounted for. Anything unconfirmed stays queued.
//
// That asymmetry is deliberate. A duplicate health record is recoverable; a
// queue entry deleted while it exists nowhere else is not. So every ambiguous
// case errs toward keeping the record.
//
// The category check exists because entries queued by a build that predates the
// local-id stamp carry no id to match on. They would survive an id-only prune
// forever and be re-sent on every sync.
const pruneSavedFromQueues = async (saved, failures = []) => {
  const failedCategories = new Set(
    (failures || []).map((failure) => failure?.category).filter(Boolean)
  );

  await Promise.all(
    Object.entries(CATEGORY_QUEUE_KEYS).map(async ([category, key]) => {
      const savedRows = saved?.[category] || [];
      const queued = await getData(key);
      if (!Array.isArray(queued) || queued.length === 0) return;

      // Category fully accounted for: nothing in it failed and the server
      // confirmed as many records as the device had queued.
      if (!failedCategories.has(category) && savedRows.length >= queued.length) {
        await deleteData(key);
        return;
      }

      const savedIds = new Set(savedRows.map(offlineIdOf).filter(Boolean));
      if (savedIds.size === 0) return;

      const remaining = queued.filter(
        (entry) => !savedIds.has(entry?.localObject?.objectId)
      );
      if (remaining.length === queued.length) return;
      if (remaining.length === 0) await deleteData(key);
      else await storeData(remaining, key);
    })
  );
};

// With no argument every queue is emptied — the full-success path. Given the
// server's `saved` map, only confirmed records are removed.
const cleanupPostedOfflineForms = async (saved, failures) => {
  if (saved) {
    await pruneSavedFromQueues(saved, failures);
    return;
  }
  const results = await Promise.allSettled(QUEUE_KEYS.map((key) => deleteData(key)));
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error("cleanupPostedOfflineForms: delete failed for key", QUEUE_KEYS[i]);
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
    // Some records saved and some did not. Reported distinctly from "Error",
    // which implies nothing saved and invites a full re-send — the thing that
    // creates duplicates. Cloud Code nests the arrays under `saved` precisely
    // so a build that predates this branch falls into the Error case below and
    // safely keeps its whole queue.
    if (uploadResult.status === "PartialFailure") {
      return {
        offlineForms,
        uploadedForms: uploadResult,
        status: "PartialFailure",
        failures: uploadResult.failures || [],
      };
    }

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
