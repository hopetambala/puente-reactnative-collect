import hooks from "@app/test/hooks";
import {
  // postAssetForm, postHousehold,
  // postSupplementaryAssetForm,
  postIdentificationForm,
  postSupplementaryForm,
} from "@modules/cached-resources";

import checkOnlineStatus from "..";
import {
  // createAssetMockData,
  // createAssetSupplementaryFormMockData,
  // createHouseholdMockData,
  createOfflineUserMockData,
  createResidentMockData,
  createSupplementaryFormMockData,
} from "./utils";

hooks();

jest.mock("..", () => jest.fn());

// Since full feature testing takes longer than normal we define this timeout to be 60s.
const FULL_FEATURE_TESTING_TIMEOUT = 60000;

/**
 * Test offline forms uploading with real connection to a Parse Cloud Code
 */
describe("Testing full feature of online posting", () => {
  test(
    "Testing Resident and Supplmentary Forms",
    async () => {
      checkOnlineStatus.mockResolvedValue(true);

      const numberOfResidents = 3;
      const numberofSupplementaryFormsCollected = 40;

      const user = await createOfflineUserMockData();

      const residents = createResidentMockData(
        numberOfResidents,
        user.objectId
      );
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
    },
    FULL_FEATURE_TESTING_TIMEOUT
  );

  // test('Testing Resident Forms and Household Forms stored', async () => {
  //   checkOnlineStatus.mockResolvedValue(true);

  //   const numberOfHouseholds = 2;
  //   const numberOfResidents = 4;

  //   const user = await createOfflineUserMockData();

  //   const households = createHouseholdMockData(numberOfHouseholds);

  //   await postHousehold(households[0]);
  //   const postedHouseholds = await postHousehold(households[1]);

  //   const residents1 = createResidentMockData(
  //     numberOfResidents / 2,
  //     user.objectId,
  //     postedHouseholds[0].localObject.objectId
  //   );
  //   const residents2 = createResidentMockData(
  //     numberOfResidents / 2,
  //     user.objectId,
  //     postedHouseholds[1].localObject.objectId
  //   );

  //   await residents1.reduce(
  //     (p, resident) => p.then(() => postIdentificationForm(resident)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
  //     Promise.resolve(null)
  //   );
  //   await residents2.reduce(
  //     (p, resident) => p.then(() => postIdentificationForm(resident)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
  //     Promise.resolve(null)
  //   );
  // });

  // test('Testing Asset and Asset Supplementary Forms stored', async () => {
  //   checkOnlineStatus.mockResolvedValue(true);

  //   const numberOfAssets = 3;
  //   const numberofAssetSupplementaryFormsCollected = 33;

  //   const user = await createOfflineUserMockData();

  //   const mockedAssets = createAssetMockData(numberOfAssets, user.objectId);
  //   await postAssetForm(mockedAssets[0]);
  //   await postAssetForm(mockedAssets[1]);
  //   const assets = await postAssetForm(mockedAssets[2]);

  //   const supplementaryForms1 = createAssetSupplementaryFormMockData(
  //     numberofAssetSupplementaryFormsCollected / numberOfAssets,
  //     assets[0].localObject.objectId,
  //     user.objectId
  //   );
  //   const supplementaryForms2 = createAssetSupplementaryFormMockData(
  //     numberofAssetSupplementaryFormsCollected / numberOfAssets,
  //     assets[1].localObject.objectId,
  //     user.objectId
  //   );

  //   const supplementaryForms3 = createAssetSupplementaryFormMockData(
  //     numberofAssetSupplementaryFormsCollected / numberOfAssets,
  //     assets[2].localObject.objectId,
  //     user.objectId
  //   );

  //   await supplementaryForms1.reduce(
  //     (p, form) => p.then(() => postSupplementaryAssetForm(form)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
  //     Promise.resolve(null)
  //   );
  //   await supplementaryForms2.reduce(
  //     (p, form) => p.then(() => postSupplementaryAssetForm(form)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
  //     Promise.resolve(null)
  //   );
  //   await supplementaryForms3.reduce(
  //     (p, form) => p.then(() => postSupplementaryAssetForm(form)), // https://jrsinclair.com/articles/2019/how-to-run-async-js-in-parallel-or-sequential/
  //     Promise.resolve(null)
  //   );
  // });
});
