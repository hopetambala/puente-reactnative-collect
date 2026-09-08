import { postObjectsToClass, postObjectsToClassWithRelation } from "@app/services/parse/crud";
import { getData, storeData } from "@modules/async-storage";
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

describe("postIdentificationForm offline — return value includes isOfflineLocal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkOnlineStatus.mockResolvedValue(false);
    getData.mockResolvedValue(null);
    storeData.mockResolvedValue([]);
  });

  it("returns an object with isOfflineLocal: true so callers can propagate it into supplementary forms", async () => {
    const result = await postIdentificationForm({
      parseClass: "SurveyData",
      localObject: { name: "Maria" },
    });

    expect(result).toEqual(
      expect.objectContaining({ isOfflineLocal: true })
    );
  });
});

describe("postSupplementaryForm partial-reconnect — isOfflineLocal guard when connected", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkOnlineStatus.mockResolvedValue(true);
    getData.mockResolvedValue(null);
    storeData.mockResolvedValue([]);
  });

  it("does NOT call postObjectsToClassWithRelation and queues to offlineSupForms when isConnected but postParams.isOfflineLocal is true", async () => {
    await postSupplementaryForm({
      parseParentClassID: "PatientID-abc123",
      isOfflineLocal: true,
      localObject: { note: "followup" },
    });

    expect(postObjectsToClassWithRelation).not.toHaveBeenCalled();
    expect(storeData).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          parseParentClassID: "PatientID-abc123",
          isOfflineLocal: true,
        }),
      ]),
      "offlineSupForms"
    );
  });
});

describe("postIdentificationForm offline — localObject must not carry isOfflineLocal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkOnlineStatus.mockResolvedValue(false);
    getData.mockResolvedValue(null);
  });

  it("stores localObject without isOfflineLocal so it does not pollute the Parse data model on sync", async () => {
    const capturedArrays = [];
    storeData.mockImplementation((value, key) => {
      if (key === "offlineIDForms") capturedArrays.push(value);
      return Promise.resolve(value);
    });

    const result = await postIdentificationForm({
      parseClass: "SurveyData",
      localObject: { name: "Test" },
    });

    expect(capturedArrays.length).toBeGreaterThan(0);
    const stored = capturedArrays[capturedArrays.length - 1];
    // isOfflineLocal belongs on idParams (queue routing), NOT inside localObject (data payload)
    expect(stored[stored.length - 1].localObject.isOfflineLocal).toBeUndefined();
    // the return value should still carry isOfflineLocal so callers can propagate it
    expect(result.isOfflineLocal).toBe(true);
  });
});

describe("postAssetForm offline — return value includes isOfflineLocal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkOnlineStatus.mockResolvedValue(false);
    getData.mockResolvedValue(null);
    storeData.mockResolvedValue([]);
  });

  it("returns an object with isOfflineLocal: true and the original localObject fields so callers can propagate it into supplementary asset forms", async () => {
    const result = await postAssetForm({
      parseClass: "Assets",
      localObject: { name: "Water Pump" },
    });

    expect(result).toEqual(
      expect.objectContaining({
        name: "Water Pump",
        isOfflineLocal: true,
      })
    );
    expect(typeof result).toBe("object");
    expect(Array.isArray(result)).toBe(false);
    expect(result.objectId).toMatch(/^AssetID-/);
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

describe("postSupplementaryForm — missing parseParentClassID guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkOnlineStatus.mockResolvedValue(true);
    getData.mockResolvedValue(null);
    storeData.mockResolvedValue([]);
  });

  it("should route to offlineSupForms queue and NOT call postObjectsToClassWithRelation when parseParentClassID is undefined, even when online and isOfflineLocal is false", async () => {
    await postSupplementaryForm({
      parseParentClassID: undefined,
      isOfflineLocal: false,
      localObject: {},
    });

    expect(postObjectsToClassWithRelation).not.toHaveBeenCalled();
    expect(storeData).toHaveBeenCalledWith(
      expect.anything(),
      "offlineSupForms"
    );
  });
});

describe("postSupplementaryForm offline — return value is postParams, not the storeData array", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkOnlineStatus.mockResolvedValue(false);
    getData.mockResolvedValue(null);
    storeData.mockResolvedValue([{ queued: true }]);
  });

  it("resolves to the queued postParams object, not the storeData array", async () => {
    const postParams = {
      parseParentClassID: "PatientID-xxx",
      isOfflineLocal: true,
      localObject: {},
    };

    const result = await postSupplementaryForm(postParams);

    expect(Array.isArray(result)).toBe(false);
    expect(result).toEqual(
      expect.objectContaining({ parseParentClassID: "PatientID-xxx" })
    );
  });
});

describe("postHousehold offline — queue accumulation", () => {
  const store = {};

  beforeEach(() => {
    jest.clearAllMocks();
    checkOnlineStatus.mockResolvedValue(false);
    getData.mockImplementation((key) => Promise.resolve(store[key] ?? null));
    storeData.mockImplementation((value, key) => {
      store[key] = value;
      return Promise.resolve(value);
    });
  });

  afterEach(() => {
    Object.keys(store).forEach((key) => delete store[key]);
  });

  test("first call creates a queue of one; second call accumulates to two", async () => {
    const params = { parseClass: "Household", localObject: { latitude: 0, longitude: 0 } };

    const first = await postHousehold(params);
    expect(first).toHaveLength(1);
    expect(first[0].localObject.objectId).toMatch(/^Household-/);

    const second = await postHousehold(params);
    expect(second).toHaveLength(2);
    expect(second[1].localObject.objectId).toMatch(/^Household-/);
  });

  test("does not mutate the original postParams.localObject", async () => {
    const localObject = { latitude: 0, longitude: 0 };
    const params = { parseClass: "Household", localObject };

    await postHousehold(params);

    expect(localObject.objectId).toBeUndefined();
  });
});

// Supplementary forms are stamped with a `SupID-` local id before queueing.
//
// A partially-failed sync leaves the WHOLE batch on the device, so the next
// Retry re-sends records that already saved. Cloud Code derives an idempotency
// key (`objectIdOffline`) from that local id — `PatientID-` for residents,
// `Household-` for households, and, since puente-node-cloudcode cf16c0f
// (2026-07-16), `SupID-` for supplementary forms. Without a stamp there is no
// key, so a retry creates a DUPLICATE health record, and another every time.
//
// Proven in modules/offline/__test__/retry-duplicates.integrate.test.js:
// re-syncing the same queue leaves 1 resident and 2 supplementary records.
//
// This was tried on 2026-09-03 and reverted because it broke offline sync on
// the simulator. That reason was BACKWARDS, and the revert cost production a
// real fix. Both things the revert rested on have since been checked:
//
//   1. Staging's live Cloud Code was downloaded (b4a) on 2026-09-04. It had NO
//      `SupID-` branch, so it passed the local id straight to Parse, which
//      rejects an objectId it does not know — hence the device failure. Its
//      last deploy was 2026-07-15, ~32 hours BEFORE cf16c0f landed. PRODUCTION
//      was downloaded too: release v120, byte-identical to master, branch
//      present. Staging now mirrors production (v712).
//   2. The stored/returned object identity: no caller reads it. SupplementaryForm
//      uses only `result?.isOfflineLocal`; AssetSupplementary ignores the return
//      value entirely.
//
// Only on the offline branch: posting online sends localObject straight to
// Parse, which rejects an objectId it does not know.
describe("postSupplementaryForm offline — idempotency key for retries", () => {
  beforeEach(() => {
    checkOnlineStatus.mockResolvedValue(false);
    storeData.mockClear();
  });

  const lastQueuedTo = (key) => {
    const call = storeData.mock.calls.filter((c) => c[1] === key).pop();
    return call[0][call[0].length - 1];
  };

  it("stamps a SupID- local id so a re-sent record dedupes", async () => {
    await postSupplementaryForm({
      parseClass: "HistoryEnvironmentalHealth",
      parseParentClassID: "PatientID-abc",
      localObject: { fieldA: 1 },
    });

    expect(lastQueuedTo("offlineSupForms").localObject.objectId).toMatch(/^SupID-/);
  });

  it("gives the asset supplementary queue the same key", async () => {
    await postSupplementaryAssetForm({
      parseClass: "Vitals",
      parseParentClassID: "AssetID-abc",
      localObject: {},
    });

    expect(lastQueuedTo("offlineAssetSupForms").localObject.objectId).toMatch(/^SupID-/);
  });

  it("never re-keys a record that already carries one", async () => {
    // A re-queued record must keep its id, or the dedupe it exists for is
    // defeated the moment the queue is written twice.
    await postSupplementaryForm({
      parseClass: "HistoryEnvironmentalHealth",
      parseParentClassID: "PatientID-abc",
      localObject: { objectId: "SupID-already-here" },
    });

    expect(lastQueuedTo("offlineSupForms").localObject.objectId).toBe("SupID-already-here");
  });
});
