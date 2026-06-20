import NetInfo from "@react-native-community/netinfo";

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

describe("checkOnlineStatus on Android", () => {
  it("should resolve false when state.details is null", async () => {
    NetInfo.fetch.mockResolvedValue({ isConnected: true, details: null });

    await expect(checkOnlineStatus()).resolves.toBe(false);
  });

  it("should resolve true when isConnected is true and strength is 4", async () => {
    // Android reports signal strength as 0–4 (RSSI buckets), not 0–100.
    // strength: 4 means excellent signal. The device is genuinely online.
    // The buggy condition `> 10` rejects this valid connection and returns false.
    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      details: { strength: 4 },
    });

    await expect(checkOnlineStatus()).resolves.toBe(true);
  });

  it("should resolve false when isConnected is false regardless of strength", async () => {
    NetInfo.fetch.mockResolvedValue({
      isConnected: false,
      details: { strength: 4 },
    });

    await expect(checkOnlineStatus()).resolves.toBe(false);
  });
});
