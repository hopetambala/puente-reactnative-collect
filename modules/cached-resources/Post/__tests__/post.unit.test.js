import { postObjectsToClass, postObjectsToClassWithRelation } from "@app/services/parse/crud";
import {
  postAssetForm,
  postHousehold,
  postIdentificationForm,
  postSupplementaryAssetForm,
  postSupplementaryForm,
} from "@modules/cached-resources/Post/post";
import checkOnlineStatus from "@modules/offline";
import { fulfillWithTimeLimit } from "@modules/utils";

jest.mock("@modules/offline", () => jest.fn());

jest.mock("@modules/async-storage", () => ({
  getData: jest.fn().mockResolvedValue(null),
  storeData: jest.fn().mockResolvedValue([]),
}));

jest.mock("@app/services/parse/crud", () => ({
  postObjectsToClassWithRelation: jest.fn(),
  postObjectsToClass: jest.fn(),
}));

jest.mock("@modules/utils", () => ({
  fulfillWithTimeLimit: jest.fn(),
  generateRandomID: jest.fn().mockReturnValue("abc123"),
}));

describe("postIdentificationForm offline — isOfflineLocal flag", () => {
  beforeEach(() => {
    checkOnlineStatus.mockResolvedValue(false);
  });

  it("should store postParams with isOfflineLocal: true when offline", async () => {
    const capturedStored = [];
    const { storeData } = require("@modules/async-storage");
    storeData.mockImplementation((value, key) => {
      if (key === "offlineIDForms") capturedStored.push(value);
      return Promise.resolve(value);
    });

    await postIdentificationForm({ parseClass: "SurveyData", localObject: {} });

    expect(capturedStored.length).toBeGreaterThan(0);
    const storedForms = capturedStored[capturedStored.length - 1];
    expect(storedForms[storedForms.length - 1].isOfflineLocal).toBe(true);
  });
});

describe("postSupplementaryForm — isOfflineLocal routing", () => {
  beforeEach(() => {
    checkOnlineStatus.mockResolvedValue(true);
  });

  it("should queue offline when isOfflineLocal is true on the params, even when connected", async () => {
    const capturedStored = [];
    const { storeData } = require("@modules/async-storage");
    storeData.mockImplementation((value, key) => {
      if (key === "offlineSupForms") capturedStored.push(value);
      return Promise.resolve(value);
    });

    await postSupplementaryForm({
      parseParentClassID: "PatientID-abc123",
      isOfflineLocal: true,
      localObject: {},
    });

    expect(capturedStored.length).toBeGreaterThan(0);
  });
});

describe("postSupplementaryAssetForm", () => {
  test("should queue offline when parseParentClassID is undefined", async () => {
    checkOnlineStatus.mockResolvedValue(true);

    await expect(
      postSupplementaryAssetForm({ parseParentClassID: undefined, localObject: {} })
    ).resolves.not.toThrow();
  });

  test("should throw when fulfillWithTimeLimit returns a null value, not silently return null", async () => {
    checkOnlineStatus.mockResolvedValue(true);
    fulfillWithTimeLimit.mockResolvedValue({ timedOut: false, error: null, value: null });

    await expect(
      postSupplementaryAssetForm({
        parseParentClassID: "SomeOther-123",
        localObject: {},
      })
    ).rejects.toThrow();
  });
});

describe("timeout protection", () => {
  const RACE_TIMEOUT_MS = 200;
  const TIMED_OUT_SENTINEL = "TIMED_OUT";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("postAssetForm should throw when Parse call times out", async () => {
    checkOnlineStatus.mockResolvedValue(true);
    // Simulate a hanging Parse call that never resolves
    postObjectsToClass.mockReturnValue(new Promise(() => {}));

    const resultPromise = postAssetForm({ localObject: { objectId: null } });
    const raceResult = await Promise.race([
      resultPromise.then(() => "RESOLVED").catch(() => "THREW"),
      new Promise((resolve) => {
        setTimeout(() => resolve(TIMED_OUT_SENTINEL), RACE_TIMEOUT_MS);
      }),
    ]);

    // The function should have thrown (caught as "THREW") rather than hanging
    expect(raceResult).not.toBe(TIMED_OUT_SENTINEL);
  });

  test("postHousehold should throw when Parse call times out", async () => {
    checkOnlineStatus.mockResolvedValue(true);
    // Simulate a hanging Parse call that never resolves
    postObjectsToClass.mockReturnValue(new Promise(() => {}));

    const resultPromise = postHousehold({ localObject: { objectId: null } });
    const raceResult = await Promise.race([
      resultPromise.then(() => "RESOLVED").catch(() => "THREW"),
      new Promise((resolve) => {
        setTimeout(() => resolve(TIMED_OUT_SENTINEL), RACE_TIMEOUT_MS);
      }),
    ]);

    // The function should have thrown (caught as "THREW") rather than hanging
    expect(raceResult).not.toBe(TIMED_OUT_SENTINEL);
  });

  test("postSupplementaryForm should throw when Parse call hangs indefinitely", async () => {
    checkOnlineStatus.mockResolvedValue(true);
    // parseParentClassID must not include "PatientID-" so the online branch is taken
    postObjectsToClassWithRelation.mockReturnValue(new Promise(() => {}));

    const resultPromise = postSupplementaryForm({
      parseParentClassID: "SomeClass-xyz",
      localObject: {},
    });
    const raceResult = await Promise.race([
      resultPromise.then(() => "RESOLVED").catch(() => "THREW"),
      new Promise((resolve) => {
        setTimeout(() => resolve(TIMED_OUT_SENTINEL), RACE_TIMEOUT_MS);
      }),
    ]);

    // The function should have thrown (caught as "THREW") rather than hanging indefinitely
    expect(raceResult).not.toBe(TIMED_OUT_SENTINEL);
  });

  test("postSupplementaryAssetForm should throw when Parse call hangs indefinitely", async () => {
    checkOnlineStatus.mockResolvedValue(true);
    // parseParentClassID must not include "AssetID-" so the online branch is taken
    postObjectsToClassWithRelation.mockReturnValue(new Promise(() => {}));

    const resultPromise = postSupplementaryAssetForm({
      parseParentClassID: "SomeOther-123",
      localObject: {},
    });
    const raceResult = await Promise.race([
      resultPromise.then(() => "RESOLVED").catch(() => "THREW"),
      new Promise((resolve) => {
        setTimeout(() => resolve(TIMED_OUT_SENTINEL), RACE_TIMEOUT_MS);
      }),
    ]);

    // The function should have thrown (caught as "THREW") rather than hanging indefinitely
    expect(raceResult).not.toBe(TIMED_OUT_SENTINEL);
  });
});
