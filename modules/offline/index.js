import NetInfo from "@react-native-community/netinfo";
import * as Network from "expo-network";
import { Platform } from "react-native";

// checks whether user is connected to internet, return true if connected, false otherwise
const checkOnlineStatus = () =>
  new Promise((resolve, reject) => {
    if (Platform.OS === "ios") {
      Network.getNetworkStateAsync().then(
        (status) => {
          resolve(status.isConnected);
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      NetInfo.fetch().then(
        (state) => {
          // check if signal strength is strong enough to support online functionality
          if (
            state.isConnected &&
            state.details.strength !== undefined &&
            state.details.strength > 10
          ) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (error) => {
          reject(error);
        }
      );
    }
  });

export default checkOnlineStatus;
