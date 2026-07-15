import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import checkOnlineStatus from "..";

jest.mock("react-native", () => ({ Platform: { OS: "android" } }));
jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: { fetch: jest.fn() },
}));
jest.mock("expo-network", () => ({ getNetworkStateAsync: jest.fn() }));

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

  it("should resolve false when state.details is undefined", async () => {
    NetInfo.fetch.mockResolvedValue({ isConnected: true, details: undefined });

    await expect(checkOnlineStatus()).resolves.toBe(false);
  });
});

describe("checkOnlineStatus DEV-only offline override", () => {
  const originalDEV = global.__DEV__;

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    // Default: NetInfo returns connected so the fallback resolves true
    NetInfo.fetch.mockResolvedValue({ isConnected: true, details: { strength: 4 } });
  });

  afterEach(() => {
    global.__DEV__ = originalDEV;
  });

  it("returns false and skips network calls when __DEV__ is true and DEV_FORCE_OFFLINE is 'true'", async () => {
    global.__DEV__ = true;
    await AsyncStorage.setItem("DEV_FORCE_OFFLINE", "true");

    const result = await checkOnlineStatus();

    expect(result).toBe(false);
    expect(NetInfo.fetch).not.toHaveBeenCalled();
    // eslint-disable-next-line global-require
    const { getNetworkStateAsync } = require("expo-network");
    expect(getNetworkStateAsync).not.toHaveBeenCalled();
  });

  it("calls through to real network check when __DEV__ is true and DEV_FORCE_OFFLINE is absent", async () => {
    global.__DEV__ = true;
    // DEV_FORCE_OFFLINE not set — AsyncStorage.clear() in beforeEach ensures null

    const result = await checkOnlineStatus();

    expect(result).toBe(true);
    expect(NetInfo.fetch).toHaveBeenCalled();
  });

  it("calls through to real network check and does NOT read AsyncStorage when __DEV__ is false", async () => {
    global.__DEV__ = false;
    await AsyncStorage.setItem("DEV_FORCE_OFFLINE", "true");

    const getItemSpy = jest.spyOn(AsyncStorage, "getItem");

    await checkOnlineStatus();

    expect(getItemSpy).not.toHaveBeenCalled();
    expect(NetInfo.fetch).toHaveBeenCalled();
  });

  it("bypasses DEV_FORCE_OFFLINE and calls real network check when skipDevOverride is true", async () => {
    global.__DEV__ = true;
    await AsyncStorage.setItem("DEV_FORCE_OFFLINE", "true");

    const result = await checkOnlineStatus({ skipDevOverride: true });

    expect(result).toBe(true);
    expect(NetInfo.fetch).toHaveBeenCalled();
  });
});
