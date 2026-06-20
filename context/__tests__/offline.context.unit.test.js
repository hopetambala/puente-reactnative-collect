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
