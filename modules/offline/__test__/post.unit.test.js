import {
  postIdentificationForm,
  postSupplementaryForm,
} from "@modules/cached-resources";
import { postOfflineForms } from "@modules/offline/post";

import checkOnlineStatus from "..";
import {
  createOfflineUserMockData,
  createResidentMockData,
  createSupplementaryFormMockData,
} from "./utils";

// Mock the crud services module
jest.mock("@app/services/parse/crud", () => ({
  uploadOfflineForms: jest.fn().mockResolvedValue({}),
}));

jest.mock("..", () => jest.fn());

describe("Testing full feature of offline posting", () => {
  test("Testing number of postOfflineForms", async () => {
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

    const { offlineForms } = await postOfflineForms();

    expect(numberOfResidents + numberofSupplementaryFormsCollected).toEqual(
      offlineForms.residentForms.length +
        offlineForms.residentSupplementaryForms.length
    );
  });
});
