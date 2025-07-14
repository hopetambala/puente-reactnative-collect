// The below imports are added to support AWS SDK in React Native.
// See: https://stackoverflow.com/questions/70413410/error-url-hostname-is-not-implemented-aws-sns-in-react-native-android
import "react-native-url-polyfill/auto";
import "react-native-get-random-values";

// import selectedENV from "@app/environment";
// import {
//   CloudWatchLogsClient,
//   PutLogEventsCommand,
// } from "@aws-sdk/client-cloudwatch-logs";

// const getAWSLogger = () => {
//   const { logGroupName, logStreamName, accessKeyId, secretAccessKey, region } =
//     selectedENV.cloudWatchLogging;

//   const credentials = {
//     accessKeyId,
//     secretAccessKey,
//   };

//   const config = {
//     region,
//     credentials,
//   };

//   const log = async (message) => {
//     try {
//       // Stringify the message as JSON.
//       const jsonMessage = JSON.stringify(message);
//       const input = {
//         logGroupName,
//         logStreamName,
//         logEvents: [{ message: jsonMessage, timestamp: Date.now() }],
//       };

//       const client = new CloudWatchLogsClient(config);

//       const command = new PutLogEventsCommand(input);

//       const response = await client.send(command);

//       return response;
//     } catch (error) {
//       // eslint-disable-next-line
//       console.log(error);

//       return null;
//     }
//   };

//   return { log };
// };

const getAWSLogger = () => ({ log: () => {} });

export default getAWSLogger;
