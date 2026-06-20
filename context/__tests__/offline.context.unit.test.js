import { residentQuery, populateCache } from "@modules/cached-resources";
import { getData, storeData } from "@modules/async-storage";
import { act, render } from "@testing-library/react-native";
import React, { useContext } from "react";
import { OfflineContext, OfflineContextProvider } from "../offline.context";
import { UserContext } from "../auth.context";

jest.mock("@modules/async-storage", () => ({
  getData: jest.fn(),
  storeData: jest.fn(),
}));

jest.mock("@modules/cached-resources", () => ({
  residentQuery: jest.fn(),
  populateCache: jest.fn(),
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

    // storeData captures what it receives so getData can serve it back,
    // simulating the AsyncStorage round-trip that the production code relies on.
    const localStore = {};
    storeData.mockImplementation((value, key) => {
      localStore[key] = value;
      return Promise.resolve(value);
    });
    // NOTE: getData is intentionally left as mockResolvedValue(null) from
    // beforeEach — it does NOT read from localStore. This exposes that
    // residentOfflineData cannot see what residentOnlineData stored unless
    // the getData mock is wired to the same store that storeData wrote to.
    // The test will go RED: residentOfflineData returns [] instead of records.

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

  it("should reset isLoading to false even when residentQuery throws (BUG: currently stuck true)", async () => {
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

    // BUG: currently isLoading stays true because there is no try/finally
    expect(capturedCtx.isLoading).toBe(false);
  });

  it("should propagate storeData errors rather than swallowing them (BUG: currently silent)", async () => {
    const records = [{ objectId: "r1" }];
    residentQuery.mockResolvedValue(records);
    storeData.mockRejectedValue(new Error("storage full"));

    let capturedCtx;
    renderWithContext((ctx) => {
      capturedCtx = ctx;
    });

    // BUG: currently storeData is not awaited so the error is silently lost
    // After fix: the error should propagate (either thrown or returned as rejection)
    await expect(
      act(async () => {
        await capturedCtx.residentOnlineData();
      })
    ).rejects.toThrow("storage full");
  });
});
