import { Parse } from 'parse/react-native';
import { AsyncStorage } from 'react-native';
import getEnvVars from '../../../environment';


function initialize() {
  const { parseAppId, parseJavascriptKey, parseServerUrl } = getEnvVars();

  Parse.setAsyncStorage(AsyncStorage);
  Parse.initialize(parseAppId, parseJavascriptKey);
  Parse.serverURL = parseServerUrl;
  console.log(`Initialize Parse with App ID:${parseAppId}, Javascript Key: ${parseJavascriptKey}`); // eslint-disable-line
}

function retrieveSignUpFunction(params) {
  Parse.Cloud.run('signup', params).then((result) => result);
}

function retrieveSignInFunction(username, password) {
  return new Promise((resolve, reject) => {
    // sign in with either username or email handled with logIn
    Parse.User.logIn(String(username), String(password)).then((user) => {
      // console.log(`User logged in successful with username: ${user.get('username')}`);
      // console.log(user);
      resolve(user);
    }, (error) => {
      // console.log(`Error: ${error.code} ${error.message}`);
      reject(error);
    });
  });
}


function retrieveSignOutFunction() {
  return new Promise((resolve, reject) => {
    Parse.User.logOut().then((result) => {
      // console.log(result);
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function retrieveForgotPasswordFunction(params) {
  Parse.Cloud.run('forgotPassword', params).then((result) => result);
}

function retrieveCurrentUserFunction() {
  const u = Parse.User.current();
  if (u) {
    const user = new Parse.User();
    user.id = u.id;
    user.name = u.get('username');
    user.email = u.get('email');
    user.organization = u.get('organization');
    user.role = u.get('role');
    // console.log(user);
    return user;
  }
  // console.log(null);
  return null;
}

function retrieveDeleteUserFunction(params) {
  Parse.Cloud.run('deleteUser', params).then((result) => result);
}

export {
  initialize, retrieveSignUpFunction, retrieveSignInFunction, retrieveSignOutFunction,
  retrieveForgotPasswordFunction, retrieveCurrentUserFunction, retrieveDeleteUserFunction
};
