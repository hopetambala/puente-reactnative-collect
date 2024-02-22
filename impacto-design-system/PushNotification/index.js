import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { toInteger } from "lodash";
import { Platform } from "react-native";

const axios = require("axios");
const awsFlaskAPIUrl = process.env.EXPO_PUBLIC_AWS_FLASK_API;
const expoPushTokenUrl = process.env.EXPO_PUBLIC_PUSH_TOKEN_URL;

const registerForPushNotificationsAsync = async () => {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      // alert('Failed to get push token for push notification!');
      return "";
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    // alert('Must use physical device for Push Notifications');
    return "";
  }

  // handle notifications when app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
  await checkAppVersionAndSendPush(token);
  return token;
};

const checkAppVersionAndSendPush = async (token) => {
  await getData("appVersion").then(async (appVersion) => {
    const [majorCurrent, minorCurrent, patchCurrent] = appVersion.split(".");
    const majorCurrentInt = toInteger(majorCurrent);
    const minorCurrentInt = toInteger(minorCurrent);
    const patchCurrentInt = toInteger(patchCurrent);
    if (Platform.OS === "android") {
      await axios
        .get(`${awsFlaskAPIUrl}android`)
        .then((latestVersion) => {
          const [majorLatest, minorLatest, patchLatest] =
            latestVersion.data.version.version_number.split(".");
          const majorLatestInt = toInteger(majorLatest);
          const minorLatestInt = toInteger(minorLatest);
          const patchLatestInt = toInteger(patchLatest);
          if (
            !(
              majorCurrentInt > majorLatestInt ||
              (majorCurrentInt === majorLatestInt &&
                minorCurrentInt > minorLatestInt) ||
              (majorCurrentInt === majorLatestInt &&
                minorCurrentInt === minorLatestInt &&
                patchCurrentInt > patchLatestInt) ||
              (majorCurrentInt === majorLatestInt &&
                minorCurrentInt === minorLatestInt &&
                patchCurrentInt === patchLatestInt)
            )
          ) {
            axios
              .post(expoPushTokenUrl, [
                {
                  to: token,
                  sound: "default",
                  body: I18n.t("pushNotifications.updateApp"),
                },
              ])
              .then(
                (response) => {
                  console.log(response); //eslint-disable-line
                },
                (error) => {
                  console.log(error); //eslint-disable-line
                }
              );
          }
        })
        .catch((error) => console.log("push notification", error)); //eslint-disable-line
    } else if (Platform.OS === "ios") {
      await axios
        .get(`${awsFlaskAPIUrl}ios`)
        .then((latestVersion) => {
          const [majorLatest, minorLatest, patchLatest] =
            latestVersion.data.version.version_number.split(".");
          const majorLatestInt = toInteger(majorLatest);
          const minorLatestInt = toInteger(minorLatest);
          const patchLatestInt = toInteger(patchLatest);
          if (
            !(
              majorCurrentInt > majorLatestInt ||
              (majorCurrentInt === majorLatestInt &&
                minorCurrentInt > minorLatestInt) ||
              (majorCurrentInt === majorLatestInt &&
                minorCurrentInt === minorLatestInt &&
                patchCurrentInt > patchLatestInt) ||
              (majorCurrentInt === majorLatestInt &&
                minorCurrentInt === minorLatestInt &&
                patchCurrentInt === patchLatestInt)
            )
          ) {
            axios
              .post(expoPushTokenUrl, [
                {
                  to: token,
                  sound: "default",
                  body: I18n.t("pushNotifications.updateApp"),
                },
              ])
              .then(
                (response) => {
                  console.log(response); //eslint-disable-line
                },
                (error) => {
                  console.log("push notification", error); //eslint-disable-line
                }
              );
          }
        })
        .catch((error) => console.log("push notification", error)); //eslint-disable-line
    }
  });
};

export default registerForPushNotificationsAsync;
