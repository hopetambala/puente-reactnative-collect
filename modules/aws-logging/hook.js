import { CloudWatchLogsClient, CreateLogStreamCommand, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs"
import { useRef } from "react"
import selectedENV from "@app/environment";

// The below imports are added to support AWS SDK in React Native.
// See: https://stackoverflow.com/questions/70413410/error-url-hostname-is-not-implemented-aws-sns-in-react-native-android
import "react-native-url-polyfill/auto";
import "react-native-get-random-values";


const getAWSLogger = () => {

  const { logGroupName, logStreamName, accessKeyId, secretAccessKey, region } =
  selectedENV.cloudWatchLogging;

  const credentials = {
    accessKeyId,
    secretAccessKey,
  }

  const config = {
    region,
    credentials,
  }

  const log = async (message) => {
    try {
      // Stringify the message as JSON.
      const jsonMessage = JSON.stringify(message)
      const input = {
        logGroupName,
        logStreamName,
        logEvents: [{ message: jsonMessage, timestamp: Date.now() }],
      }

      const client = new CloudWatchLogsClient(config)

      const command = new PutLogEventsCommand(input)

      const response = await client.send(command)

      return response;
    } catch (error) {
      
      // eslint-disable-next-line
      console.log(error)

      return null;
    }
  }

  return { log };
}

export default getAWSLogger;
