import hooks from "@app/test/hooks";
import { getData } from "@modules/async-storage";
import {
  postAssetForm,
  postHousehold,
  postIdentificationForm,
  postSupplementaryAssetForm,
  postSupplementaryForm,
} from "@modules/cached-resources";
import {
  cleanupPostedOfflineForms,
  postOfflineForms,
} from "@modules/offline/post";

import checkOnlineStatus from "..";
import {
  createAssetMockData,
  createAssetSupplementaryFormMockData,
  createHouseholdMockData,
  createOfflineUserMockData,
  createResidentMockData,
  createSupplementaryFormMockData,
} from "./utils";

hooks();

jest.mock("..", () => jest.fn());

/**
 * Test offline forms uploading with real connection to a Parse Cloud Code
 * Uses real Parse Server instance managed by Jest
 */
describe("Testing full feature of offline posting", () => {
  test("Testing Resident and Supplmentary Forms stored", async () => {
    checkOnlineStatus.mockResolvedValue(false);

    const numberOfResidents = 3;
    const numberofSupplementaryFormsCollected = 40;

    const user = await createOfflineUserMockData();

    const residents = createResidentMockData(numberOfResidents, user.objectId);
    const resident1 = await postIdentificationForm(residents[0]);
    const resident2 = await postIdentificationForm(residents[1]);
    await postIdentificationForm(residents[2]); // Resident 3 won't have supplementary forms

    const supplementaryForms1 = createSupplementaryFormMockData(
      numberofSupplementaryFormsCollected / 2,
      resident1.objectId,
      user.objectId
    );
    const supplementaryForms2 = createSupplementaryFormMockData(
      numberofSupplementaryFormsCollected / 2,
      resident2.objectId,
      user.objectId
    );

    await supplementaryForms1.reduce(
      (p, form) => p.then(() => postSupplementaryForm(form)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
      Promise.resolve(null)
    );
    await supplementaryForms2.reduce(
      (p, form) => p.then(() => postSupplementaryForm(form)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
      Promise.resolve(null)
    );

    checkOnlineStatus.mockResolvedValue(true);

    const { uploadedForms, offlineForms } = await postOfflineForms();
    expect(uploadedForms.residentForms.length).toEqual(
      offlineForms.residentForms.length
    );
    expect(uploadedForms.residentSupplementaryForms.length).toEqual(
      offlineForms.residentSupplementaryForms.length
    );
  });

  test("Testing Resident Forms and Household Forms stored", async () => {
    checkOnlineStatus.mockResolvedValue(false);

    const numberOfHouseholds = 2;
    const numberOfResidents = 4;

    const user = await createOfflineUserMockData();

    const households = createHouseholdMockData(numberOfHouseholds);

    await postHousehold(households[0]);
    const postedHouseholds = await postHousehold(households[1]);

    const residents1 = createResidentMockData(
      numberOfResidents / 2,
      user.objectId,
      postedHouseholds[0].localObject.objectId
    );
    const residents2 = createResidentMockData(
      numberOfResidents / 2,
      user.objectId,
      postedHouseholds[1].localObject.objectId
    );

    await residents1.reduce(
      (p, resident) => p.then(() => postIdentificationForm(resident)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
      Promise.resolve(null)
    );
    await residents2.reduce(
      (p, resident) => p.then(() => postIdentificationForm(resident)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
      Promise.resolve(null)
    );

    checkOnlineStatus.mockResolvedValue(true);

    const { uploadedForms, offlineForms } = await postOfflineForms();
    expect(uploadedForms.residentForms.length).toEqual(
      offlineForms.residentForms.length
    );
    expect(uploadedForms.households.length).toEqual(
      offlineForms.households.length
    );
  });

  test("Testing Asset and Asset Supplementary Forms stored", async () => {
    checkOnlineStatus.mockResolvedValue(false);

    const numberOfAssets = 3;
    const numberofAssetSupplementaryFormsCollected = 33;

    const user = await createOfflineUserMockData();

    const mockedAssets = createAssetMockData(numberOfAssets, user.objectId);
    const asset1 = await postAssetForm(mockedAssets[0]);
    const asset2 = await postAssetForm(mockedAssets[1]);
    const asset3 = await postAssetForm(mockedAssets[2]);

    const supplementaryForms1 = createAssetSupplementaryFormMockData(
      numberofAssetSupplementaryFormsCollected / numberOfAssets,
      asset1.objectId,
      user.objectId
    );
    const supplementaryForms2 = createAssetSupplementaryFormMockData(
      numberofAssetSupplementaryFormsCollected / numberOfAssets,
      asset2.objectId,
      user.objectId
    );

    const supplementaryForms3 = createAssetSupplementaryFormMockData(
      numberofAssetSupplementaryFormsCollected / numberOfAssets,
      asset3.objectId,
      user.objectId
    );

    await supplementaryForms1.reduce(
      (p, form) => p.then(() => postSupplementaryAssetForm(form)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
      Promise.resolve(null)
    );
    await supplementaryForms2.reduce(
      (p, form) => p.then(() => postSupplementaryAssetForm(form)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
      Promise.resolve(null)
    );
    await supplementaryForms3.reduce(
      (p, form) => p.then(() => postSupplementaryAssetForm(form)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
      Promise.resolve(null)
    );

    checkOnlineStatus.mockResolvedValue(true);

    const { uploadedForms, offlineForms } = await postOfflineForms();
    expect(uploadedForms.assetForms.length).toEqual(
      offlineForms.assetForms.length
    );
    expect(uploadedForms.assetSupplementaryForms.length).toEqual(
      offlineForms.assetSupplementaryForms.length
    );
  });

  test(
    "partial-reconnect: supplementary form is queued when parent resident was collected offline",
    async () => {
      // Step 1: start offline
      checkOnlineStatus.mockResolvedValue(false);

      const user = await createOfflineUserMockData();

      // Step 2: post identification form offline and capture the return value
      const residentPostParams = {
        parseClass: "SurveyData",
        parseUser: user.objectId,
        localObject: { fname: "Maria" },
      };
      const resident = await postIdentificationForm(residentPostParams);

      // Step 3: the return value must carry isOfflineLocal so callers know the parent is not yet on the server
      expect(resident.isOfflineLocal).toBe(true);

      // Step 4: build supplementary form postParams propagating the flag (as SupplementaryForm.js now does)
      const supPostParams = {
        parseParentClassID: resident.objectId,
        parseParentClass: "SurveyData",
        parseUser: user.objectId,
        parseClass: "FormResults",
        isOfflineLocal: resident.isOfflineLocal,
        localObject: {
          title: "Water Survey",
          fields: [],
          surveyingUser: user.username,
          surveyingOrganization: user.organization,
        },
      };

      // Step 5: connectivity returns before supplementary form is submitted
      checkOnlineStatus.mockResolvedValue(true);

      // Snapshot queue length before posting (other tests may have added items)
      const supFormsBeforePost = await getData("offlineSupForms");
      const queueLengthBefore = supFormsBeforePost ? supFormsBeforePost.length : 0;

      // Step 6: post the supplementary form — isOfflineLocal flag must prevent an online post
      await postSupplementaryForm(supPostParams);

      // Step 7: the supplementary form must be in the offline queue, not posted online
      const queuedSupForms = await getData("offlineSupForms");
      expect(queuedSupForms).not.toBeNull();
      expect(queuedSupForms).toHaveLength(queueLengthBefore + 1);

      // Steps 8-9: uploading offline forms reconciles both queues
      const { uploadedForms, offlineForms } = await postOfflineForms();
      expect(uploadedForms.residentForms.length).toEqual(
        offlineForms.residentForms.length
      );
      expect(uploadedForms.residentSupplementaryForms.length).toEqual(
        offlineForms.residentSupplementaryForms.length
      );
    },
    10000
  );

  test(
    "cleanup after upload empties offlineIDForms and offlineSupForms queue keys",
    async () => {
      // Collect offline: one resident and two supplementary forms
      checkOnlineStatus.mockResolvedValue(false);

      const user = await createOfflineUserMockData();

      const residents = createResidentMockData(1, user.objectId);
      const resident = await postIdentificationForm(residents[0]);

      const supplementaryForms = createSupplementaryFormMockData(
        2,
        resident.objectId,
        user.objectId
      );
      await supplementaryForms.reduce(
        (p, form) => p.then(() => postSupplementaryForm(form)),
        Promise.resolve(null)
      );

      // Go back online and run upload + cleanup cycle
      checkOnlineStatus.mockResolvedValue(true);

      const { status } = await postOfflineForms();
      expect(status).toBe("Success");

      await cleanupPostedOfflineForms();

      // After cleanup both queue keys must be null — the queue is truly empty
      const idFormsAfterCleanup = await getData("offlineIDForms");
      const supFormsAfterCleanup = await getData("offlineSupForms");

      expect(idFormsAfterCleanup).toBeNull();
      expect(supFormsAfterCleanup).toBeNull();
    },
    10000
  );
});
