import getAWSLogger from "@modules/aws-logging/logger";
import NetInfo from "@react-native-community/netinfo";
import * as Network from "expo-network";
import { Platform } from "react-native";

// checks whether user is connected to internet, return true if connected, false otherwise
const checkOnlineStatus = () => {
  const startTime = new Date();
  return new Promise((resolve, reject) => {
    if (Platform.OS === "ios") {
      Network.getNetworkStateAsync().then(
        (status) => {
          getAWSLogger().log({
            type: "CHECK_ONLINE_STATUS_SUCCESS_TIMER_SUCCESS",
            duration: new Date() - startTime,
          });
          resolve(status.isConnected);
        },
        (error) => {
          getAWSLogger().log({
            type: "CHECK_ONLINE_STATUS_SUCCESS_TIMER_ERROR",
            duration: new Date() - startTime,
          });
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
            getAWSLogger().log({
              type: "CHECK_ONLINE_STATUS_SUCCESS_TIMER_SUCCESS",
              duration: new Date() - startTime,
            });
            resolve(true);
          } else {
            getAWSLogger().log({
              type: "CHECK_ONLINE_STATUS_SUCCESS_TIMER_ERROR",
              duration: new Date() - startTime,
            });
            resolve(false);
          }
        },
        (error) => {
          reject(error);
        }
      );
    }
  });
};
export default checkOnlineStatus;
