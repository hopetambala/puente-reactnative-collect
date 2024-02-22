// The below imports are added to support AWS SDK in React Native.
// See: https://stackoverflow.com/questions/70413410/error-url-hostname-is-not-implemented-aws-sns-in-react-native-android
import "react-native-url-polyfill/auto";
import "react-native-get-random-values";

import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

const getAWSLogger = () => {

  const credentials = {
    accessKeyId: process.env.EXPO_PUBLIC_AWS_CLOUDWATCH_LOG_ACCESS_KEY_ID,
    secretAccessKey: process.env.EXPO_PUBLIC_AWS_CLOUDWATCH_LOG_SECRET_ACCESS_KEY,
  };

  const config = {
    region,
    credentials,
  };

  const log = async (message) => {
    try {
      // Stringify the message as JSON.
      const jsonMessage = JSON.stringify(message);
      const input = {
        logGroupName: process.env.EXPO_PUBLIC_AWS_CLOUDWATCH_LOG_GROUP_NAME,
        logStreamName: process.env.EXPO_PUBLIC_AWS_CLOUDWATCH_LOG_STREAM_NAME,
        logEvents: [{ message: jsonMessage, timestamp: Date.now() }],
      };

      const client = new CloudWatchLogsClient(config);

      const command = new PutLogEventsCommand(input);

      const response = await client.send(command);

      return response;
    } catch (error) {
      // eslint-disable-next-line
      console.log(error);

      return null;
    }
  };

  return { log };
};

export default getAWSLogger;
