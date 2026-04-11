import selectedENV from "@app/environment";
import client from "@app/services/parse/client";
import { getData } from "@modules/async-storage";

// notificationTypeRestParams removed - online-only mode, no email/SMS confirmation

const { parseAppId, parseJavascriptKey, parseServerUrl, TEST_MODE } =
  selectedENV;
const Parse = client(TEST_MODE);

function initialize() {
  Parse.initialize(parseAppId, parseJavascriptKey);
  Parse.serverURL = parseServerUrl;
  // eslint-disable-next-line
  console.log(`Initialize Parse for server: ${parseServerUrl}`);
}

function retrieveSignUpFunction(params) {
  const signupParams = params;
  // Don't add notification params - online-only mode, no confirmation
  
  return new Promise((resolve, reject) => {
    Parse.Cloud.run("signup", signupParams).then(
      (u) => {
        // Handle both Parse.User objects and plain objects from cloud code
        const getId = () => u.id || u.objectId;
        const getField = (field) => typeof u.get === 'function' ? u.get(field) : u[field];
        
        const user = {
          ...u,
          id: getId(),
          name: getField("username") || getField("username"),
          firstname: getField("firstname") || "",
          lastname: getField("lastname") || "",
          email: getField("email"),
          organization: getField("organization"),
          role: getField("role"),
          createdAt: `${getField("createdAt")}`,
          // NOTE: Password NOT stored - Parse SDK manages session token securely
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
      // NOTE: Password NOT stored - Parse SDK manages session token securely
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
