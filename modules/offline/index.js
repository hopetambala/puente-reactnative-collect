import getAWSLogger from "@modules/aws-logging/logger";
import NetInfo from "@react-native-community/netinfo";
import * as Network from "expo-network";
import { Platform } from "react-native";

// checks whether user is connected to internet, return true if connected, false otherwise
const checkOnlineStatus = () => {
  const startTime = new Date();
  const elapsed = () => new Date() - startTime;

  return new Promise((resolve, reject) => {
    if (Platform.OS === "ios") {
      Network.getNetworkStateAsync().then(
        (status) => {
          getAWSLogger().log({
            type: "CHECK_ONLINE_STATUS_SUCCESS",
            duration: elapsed(),
          });
          resolve(status.isConnected);
        },
        (error) => {
          getAWSLogger().log({
            type: "CHECK_ONLINE_STATUS_ERROR",
            duration: elapsed(),
          });
          reject(error);
        }
      );
    } else {
      NetInfo.fetch().then(
        (state) => {
          if (state.isConnected && state.details !== null) {
            getAWSLogger().log({
              type: "CHECK_ONLINE_STATUS_SUCCESS",
              duration: elapsed(),
            });
            resolve(true);
          } else {
            getAWSLogger().log({
              type: "CHECK_ONLINE_STATUS_OFFLINE",
              duration: elapsed(),
            });
            resolve(false);
          }
        },
        (error) => {
          getAWSLogger().log({
            type: "CHECK_ONLINE_STATUS_ERROR",
            duration: elapsed(),
          });
          reject(error);
        }
      );
    }
  });
};
export default checkOnlineStatus;
