/* global __DEV__ */
import Constants from "expo-constants";

const ENV = {
  dev: {
    parseAppId: "exampleAppId",
    parseJavascriptKey: "exampleJavascriptKey",
    parseServerUrl: "https://parseapi.back4app.com/",
    parseMasterKey: "exampleMasterKey",
    taskyUrlApi: "",
    AWS_LAMBDA_URL: "",
    cloudWatchLogging: {
      logGroupName: "puente-test-logs",
      logStreamName: "test-log-stream",
      accessKeyId: "",
      secretAccessKey: "",
      region: "us-east-1",
    },
  },
  staging: {
    parseAppId: "exampleAppId",
    parseJavascriptKey: "exampleJavascriptKey",
    parseServerUrl: "https://parseapi.back4app.com/",
    parseMasterKey: "exampleMasterKey",
    taskyUrlApi: "",
    AWS_LAMBDA_URL: "",
    cloudWatchLogging: {
      logGroupName: "puente-test-logs",
      logStreamName: "test-log-stream",
      accessKeyId: "",
      secretAccessKey: "",
      region: "us-east-1",
    },
  },
  prod: {
    parseAppId: "exampleAppId",
    parseJavascriptKey: "exampleJavascriptKey",
    parseServerUrl: "https://parseapi.back4app.com/",
    parseMasterKey: "exampleMasterKey",
    taskyUrlApi: "",
    AWS_LAMBDA_URL: "",
    cloudWatchLogging: {
      logGroupName: "puente-test-logs",
      logStreamName: "test-log-stream",
      accessKeyId: "",
      secretAccessKey: "",
      region: "us-east-1",
    },
  },
};

const getEnvVars = (env = Constants.expoConfig.releaseChannel) => {
  // What is __DEV__ ?
  // This variable is set to true when react-native is running in Dev mode.
  // __DEV__ is true when run locally, but false when published.
  if (__DEV__) {
    return ENV.dev;
  }
  if (env === "staging") {
    return ENV.staging;
  }
  if (env === "prod") {
    return ENV.prod;
  }

  return ENV.dev;
};

export default getEnvVars;
