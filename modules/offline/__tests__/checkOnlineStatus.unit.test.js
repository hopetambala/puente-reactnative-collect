import checkOnlineStatus from "..";

jest.mock("react-native", () => ({ Platform: { OS: "android" } }));
jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: { fetch: jest.fn() },
}));
jest.mock("expo-network", () => ({ getNetworkStateAsync: jest.fn() }));
jest.mock("@modules/aws-logging/logger", () =>
  jest.fn().mockReturnValue({ log: jest.fn() })
);

import NetInfo from "@react-native-community/netinfo";

describe("checkOnlineStatus on Android", () => {
  it("should resolve false when state.details is null", async () => {
    NetInfo.fetch.mockResolvedValue({ isConnected: true, details: null });

    // Bug: state.details.strength throws a TypeError when details is null.
    // The thrown error is swallowed inside the outer Promise constructor, so
    // the promise never settles — it hangs indefinitely instead of resolving
    // false. We race against a 500 ms sentinel to detect the hang.
    const TIMEOUT_SENTINEL = "TIMED_OUT";
    const timeout = new Promise((resolve) =>
      setTimeout(() => resolve(TIMEOUT_SENTINEL), 500)
    );

    const result = await Promise.race([checkOnlineStatus(), timeout]);

    expect(result).toBe(false);
  });
});
