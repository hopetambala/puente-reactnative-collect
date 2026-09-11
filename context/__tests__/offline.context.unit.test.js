import { getData, storeData } from "@modules/async-storage";
import { populateCache, residentQuery } from "@modules/cached-resources";
import { act, render } from "@testing-library/react-native";
import React, { useContext } from "react";

import { UserContext } from "../auth.context";
import { OfflineContext, OfflineContextProvider } from "../offline.context";

jest.mock("@modules/async-storage", () => ({
  getData: jest.fn(),
  storeData: jest.fn(),
}));

jest.mock("@modules/cached-resources", () => ({
  residentQuery: jest.fn(),
  populateCache: jest.fn(),
}));

const mockGetFindRecordsLimit = jest.fn();
jest.mock("@modules/settings", () => ({
  getFindRecordsLimit: (...args) => mockGetFindRecordsLimit(...args),
}));

const mockUser = { organization: "test-org", objectId: "u1" };

function TestConsumer({ onContext }) {
  const ctx = useContext(OfflineContext);
  React.useEffect(() => {
    onContext(ctx);
  }, [ctx]);
  return null;
}

function renderWithContext(onContext) {
  return render(
    <UserContext.Provider value={{ user: mockUser }}>
      <OfflineContextProvider>
        <TestConsumer onContext={onContext} />
      </OfflineContextProvider>
    </UserContext.Provider>
  );
}

describe("OfflineContext — cache round-trip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeData.mockResolvedValue(undefined);
    // getData returns null by default — round-trip wiring must be explicit
    getData.mockResolvedValue(null);
  });

  it("residentOfflineData returns the records that residentOnlineData fetched and stored", async () => {
    const records = [{ objectId: "r1" }, { objectId: "r2" }];
    residentQuery.mockResolvedValue(records);

    // Wire storeData and getData to the same localStore so the AsyncStorage
    // round-trip is correctly simulated. The test passes because getData reads
    // what storeData wrote — not because of any in-memory residents fallback.
    const localStore = {};
    storeData.mockImplementation((value, key) => {
      localStore[key] = value;
      return Promise.resolve(value);
    });
    getData.mockImplementation((key) =>
      Promise.resolve(localStore[key] ?? null)
    );

    let capturedCtx;
    renderWithContext((ctx) => {
      capturedCtx = ctx;
    });

    await act(async () => {
      await capturedCtx.residentOnlineData();
    });

    let result;
    await act(async () => {
      result = await capturedCtx.residentOfflineData();
    });

    expect(result).toEqual(records);
  });

  it("residentOfflineData returns [] when getData returns null even if residents state was populated by residentOnlineData", async () => {
    const records = [{ objectId: "r1" }];
    residentQuery.mockResolvedValue(records);

    // storeData writes to localStore so residentOnlineData succeeds and
    // populates the residents state inside the provider.
    const localStore = {};
    storeData.mockImplementation((value, key) => {
      localStore[key] = value;
      return Promise.resolve(value);
    });
    // Start with getData wired to localStore so residentOnlineData's storeData
    // call is stored, then override to null to simulate cleared AsyncStorage.
    getData.mockImplementation((key) =>
      Promise.resolve(localStore[key] ?? null)
    );

    let capturedCtx;
    renderWithContext((ctx) => {
      capturedCtx = ctx;
    });

    // Populate residents state via residentOnlineData — this sets residents = records
    await act(async () => {
      await capturedCtx.residentOnlineData();
    });

    // Now simulate cleared AsyncStorage: getData always returns null
    getData.mockResolvedValue(null);

    let result;
    await act(async () => {
      result = await capturedCtx.residentOfflineData();
    });

    // residentOfflineData must only read from AsyncStorage (getData), not fall
    // back to the in-memory residents state. With getData returning null it must
    // return [] — NOT [{ objectId: "r1" }].
    expect(result).toEqual([]);
  });
});

describe("OfflineContext — residentOnlineData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeData.mockResolvedValue(undefined);
    getData.mockResolvedValue(null);
  });

  it("should reset isLoading to false after storeData succeeds", async () => {
    const records = [{ objectId: "r1" }];
    residentQuery.mockResolvedValue(records);
    storeData.mockResolvedValue(undefined);

    let capturedCtx;
    renderWithContext((ctx) => {
      capturedCtx = ctx;
    });

    await act(async () => {
      await capturedCtx.residentOnlineData();
    });

    expect(capturedCtx.isLoading).toBe(false);
  });

  it("resets isLoading to false when residentQuery throws", async () => {
    residentQuery.mockRejectedValue(new Error("network error"));

    let capturedCtx;
    renderWithContext((ctx) => {
      capturedCtx = ctx;
    });

    await act(async () => {
      try {
        await capturedCtx.residentOnlineData();
      } catch {
        // expected — query failed
      }
    });

    expect(capturedCtx.isLoading).toBe(false);
  });

  it("propagates storeData errors instead of swallowing them", async () => {
    const records = [{ objectId: "r1" }];
    residentQuery.mockResolvedValue(records);
    storeData.mockRejectedValue(new Error("storage full"));

    let capturedCtx;
    renderWithContext((ctx) => {
      capturedCtx = ctx;
    });

    await expect(
      act(async () => {
        await capturedCtx.residentOnlineData();
      })
    ).rejects.toThrow("storage full");
  });
});

describe("OfflineContext — populateResidentDataCache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeData.mockResolvedValue(undefined);
    getData.mockResolvedValue(null);
  });

  it("propagates populateCache rejection to the caller", async () => {
    const records = [{ objectId: "r1" }];
    residentQuery.mockResolvedValue(records);
    storeData.mockResolvedValue(undefined);
    populateCache.mockRejectedValue(new Error("cache failure"));

    let capturedCtx;
    renderWithContext((ctx) => {
      capturedCtx = ctx;
    });

    await expect(
      act(async () => {
        await capturedCtx.populateResidentDataCache();
      })
    ).rejects.toThrow("cache failure");
  });
});

/**
 * The "Record storage limit" control in Settings -> Find Records wrote
 * `findRecordsLimit` and nothing read it: the cap here was hardcoded at 2000
 * while parseSearch hardcoded 1000, so whichever path last wrote residentData
 * decided how many residents were searchable offline. Both now read the
 * surveyor's setting.
 */
describe("OfflineContext - residentOnlineData honours the storage limit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeData.mockResolvedValue(undefined);
    getData.mockResolvedValue(null);
    residentQuery.mockResolvedValue([]);
    mockGetFindRecordsLimit.mockResolvedValue(2000);
  });

  it("passes the surveyor's configured limit to residentQuery", async () => {
    mockGetFindRecordsLimit.mockResolvedValue(5000);
    let ctx;
    renderWithContext((c) => { ctx = c; });

    await act(async () => {
      await ctx.residentOnlineData();
    });

    expect(residentQuery).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5000 })
    );
  });

  it("defaults to 2000 when the surveyor never set one", async () => {
    let ctx;
    renderWithContext((c) => { ctx = c; });

    await act(async () => {
      await ctx.residentOnlineData();
    });

    expect(residentQuery).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 2000 })
    );
  });
});
