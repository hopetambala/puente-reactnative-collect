import client from "@app/services/parse/client";

const TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === "true";
const Parse = client(TEST_MODE);

function handleParseError(err, callback) {
  switch (err.code) {
    case Parse.Error.INVALID_SESSION_TOKEN:
      Parse.User.logOut();
      callback();
      break;
    default:
      callback();
  }
}

export default handleParseError;
