import { uploadOfflineForms } from "@app/services/parse/crud";
import { deleteData, getData } from "@modules/async-storage";
import {
  postIdentificationForm,
  postSupplementaryForm,
} from "@modules/cached-resources";
import { cleanupPostedOfflineForms,postOfflineForms } from "@modules/offline/post";

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

jest.mock("@app/domains/DataCollection/Forms/utils", () =>
  jest.fn().mockResolvedValue("testUser")
);

const mockAsyncStorageStore = {};
jest.mock("@modules/async-storage", () => ({
  getData: jest.fn((key) => Promise.resolve(mockAsyncStorageStore[key] ?? null)),
  deleteData: jest.fn((key) => {
    delete mockAsyncStorageStore[key];
    return Promise.resolve();
  }),
  storeData: jest.fn((value, key) => {
    mockAsyncStorageStore[key] = value;
    return Promise.resolve(value);
  }),
}));

describe("postOfflineForms failure contract", () => {
  beforeEach(() => {
    getData.mockImplementation((key) => {
      if (key === "currentUser") {
        return Promise.resolve({ objectId: "u1", organization: "org1" });
      }
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    getData.mockImplementation((key) =>
      Promise.resolve(mockAsyncStorageStore[key] ?? null)
    );
  });

  it("should return status Error when uploadOfflineForms rejects", async () => {
    checkOnlineStatus.mockResolvedValue(true);
    uploadOfflineForms.mockRejectedValue(new Error("network failure"));

    const result = await postOfflineForms();

    expect(result.status).toBe("Error");
  });

  it("should return status Error when uploadOfflineForms returns error payload", async () => {
    checkOnlineStatus.mockResolvedValue(true);
    uploadOfflineForms.mockResolvedValue({ status: "Error" });

    const result = await postOfflineForms();

    expect(result.status).toBe("Error");
  });

});

describe("postOfflineForms null user safety", () => {
  afterEach(() => {
    getData.mockImplementation((key) =>
      Promise.resolve(mockAsyncStorageStore[key] ?? null)
    );
  });

  it("should return status Error when currentUser is null", async () => {
    getData.mockImplementation(() => Promise.resolve(null));

    await expect(postOfflineForms()).resolves.toMatchObject({ status: "Error" });
  });

  it("should return { status: 'Offline' } (not a string) when not connected", async () => {
    checkOnlineStatus.mockResolvedValue(false);
    getData.mockImplementation((key) => {
      if (key === "currentUser") return Promise.resolve({ objectId: "u1", organization: "org1" });
      return Promise.resolve(null);
    });
    const result = await postOfflineForms();
    expect(typeof result).toBe("object");
    expect(result).toMatchObject({ status: "Offline" });
  });
});

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

describe("postOfflineForms online success path", () => {
  beforeEach(() => {
    uploadOfflineForms.mockClear();
    getData.mockImplementation((key) => {
      if (key === "currentUser") {
        return Promise.resolve({ objectId: "u1", organization: "org1" });
      }
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    getData.mockImplementation((key) =>
      Promise.resolve(mockAsyncStorageStore[key] ?? null)
    );
  });

  it("should call uploadOfflineForms and return status Success when device is online from the start", async () => {
    checkOnlineStatus.mockResolvedValue(true);
    uploadOfflineForms.mockResolvedValue({
      status: "Success",
      residentForms: [],
      residentSupplementaryForms: [],
    });

    const result = await postOfflineForms();

    expect(result.status).toBe("Success");
    expect(uploadOfflineForms).toHaveBeenCalledTimes(1);
  });
});

describe("cleanupPostedOfflineForms", () => {
  afterEach(() => {
    deleteData.mockReset();
    deleteData.mockImplementation(() => Promise.resolve());
  });

  it("should attempt to delete all 5 keys even if the first delete throws", async () => {
    deleteData.mockImplementation((key) => {
      if (key === "offlineIDForms") {
        return Promise.reject(new Error("removeItem failed"));
      }
      return Promise.resolve();
    });

    await cleanupPostedOfflineForms().catch(() => {});

    expect(deleteData).toHaveBeenCalledTimes(5);
  });
});
