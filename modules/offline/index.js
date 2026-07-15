import { getData } from "@modules/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Network from "expo-network";
import { Platform } from "react-native";

// checks whether user is connected to internet, return true if connected, false otherwise
const checkOnlineStatus = async ({ skipDevOverride = false } = {}) => {
  if (__DEV__ && !skipDevOverride) {
    const devForceOffline = await getData("DEV_FORCE_OFFLINE");
    if (devForceOffline) return false;
  }

  if (Platform.OS === "ios") {
    const status = await Network.getNetworkStateAsync();
    return status.isConnected;
  }

  const state = await NetInfo.fetch();
  // details is null/undefined when there is no network interface at all.
  // Do not check details.strength — Android RSSI is 0–4 (not 0–100),
  // so any numeric threshold produces false negatives on a strong signal.
  // Use != null (not !==) to treat both null and undefined as "no interface".
  return state.isConnected && state.details != null;
};
export default checkOnlineStatus;
