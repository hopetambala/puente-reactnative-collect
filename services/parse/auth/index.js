import client from "@app/services/parse/client";
import { getData } from "@modules/async-storage";

import notificationTypeRestParams from "./_signupHelper";

const parseAppId = process.env.EXPO_PUBLIC_PARSE_APP_ID;
const parseJavascriptKey = process.env.EXPO_PUBLIC_PARSE_JAVASCRIPT_KEY;
const parseServerUrl = process.env.EXPO_PUBLIC_PARSE_SERVER_URL;
const TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === "true";

const Parse = client(TEST_MODE);

function initialize() {
  Parse.initialize(parseAppId, parseJavascriptKey);
  Parse.serverURL = parseServerUrl;
  // eslint-disable-next-line
  console.log(
    `Initialize Parse with App ID:${parseAppId}, Javascript Key: ${parseJavascriptKey}`
  );
}

function retrieveSignUpFunction(params, type) {
  const signupParams = params;
  const restParamsData = notificationTypeRestParams(type, signupParams);
  if (restParamsData) signupParams.restParams = restParamsData;

  return new Promise((resolve, reject) => {
    Parse.Cloud.run("signup", signupParams).then(
      (u) => {
        const user = {
          ...u,
          id: u.id,
          name: u.get("username"),
          firstname: u.get("firstname") || "",
          lastname: u.get("lastname") || "",
          email: u.get("email"),
          organization: u.get("organization"),
          role: u.get("role"),
          createdAt: `${u.get("createdAt")}`,
          password: params.password,
        };
        resolve(user);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

async function retrieveSignInFunction(usrn, pswd) {
  const password = await getData("password");
  try {
    const u = await Parse.User.logIn(String(usrn), String(pswd));
    // eslint-disable-next-line
    console.log(
      `User logged in successful with username: ${u.get("username")}`
    );
    const loggedInUser = {
      ...u,
      id: u.id,
      name: u.get("username"),
      firstname: u.get("firstname") || "",
      lastname: u.get("lastname") || "",
      email: u.get("email"),
      organization: u.get("organization"),
      role: u.get("role"),
      createdAt: `${u.get("createdAt")}`,
      password,
    };
    return loggedInUser;
  } catch (error) {
    console.log(`Error: ${error.code} ${error.message}`); // eslint-disable-line
    throw new Error(error);
  }
}

async function retrieveSignOutFunction() {
  return Parse.User.logOut().catch((error) => {
    console.log(error.message); //eslint-disable-line
  });
}

function retrieveForgotPasswordFunction(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run("forgotPassword", params).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

async function retrieveCurrentUserAsyncFunction() {
  const password = await getData("password");
  return Parse.User.currentAsync()
    .then((u) => {
      const user = {
        ...u,
        id: u.id,
        name: u.get("username"),
        firstname: u.get("firstname") || "",
        lastname: u.get("lastname") || "",
        email: u.get("email"),
        organization: u.get("organization"),
        role: u.get("role"),
        createdAt: `${u.get("createdAt")}`,
        password,
      };
      return user;
    })
    .catch(() => undefined);
}

function retrieveDeleteUserFunction(params) {
  Parse.Cloud.run("deleteUser", params).then((result) => result);
}

function retrievAddUserPushToken(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run("addUserPushToken", params).then(
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

export {
  initialize,
  retrievAddUserPushToken,
  retrieveCurrentUserAsyncFunction,
  retrieveDeleteUserFunction,
  retrieveForgotPasswordFunction,
  retrieveSignInFunction,
  retrieveSignOutFunction,
  retrieveSignUpFunction,
};
