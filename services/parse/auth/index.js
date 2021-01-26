import { Parse } from 'parse/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import selectedENV from '../../../environment';

function initialize() {
  const { parseAppId, parseJavascriptKey, parseServerUrl } = selectedENV;

  Parse.setAsyncStorage(AsyncStorage);
  Parse.initialize(parseAppId, parseJavascriptKey);
  Parse.serverURL = parseServerUrl;
  console.log(`Initialize Parse with App ID:${parseAppId}, Javascript Key: ${parseJavascriptKey}`); // eslint-disable-line
  createRoles();
}

function createRoles() {
  Parse.Cloud.run('createAdminRole');
  Parse.Cloud.run('createManagerRole');
  Parse.Cloud.run('createContributorRole');
}

function retrieveSignUpFunction(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run('signup', params).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function retrieveSignInFunction(username, password) {
  return new Promise((resolve, reject) => {
    // sign in with either phonenumber (username) or email handled with logIn
    Parse.User.logIn(String(username), String(password)).then((user) => {
      console.log(`User logged in successful with username: ${user.get('username')}`); // eslint-disable-line
      resolve(user);
    }, (error) => {
      console.log(`Error: ${error.code} ${error.message}`); // eslint-disable-line
      reject(error);
    });
  });
}

function retrieveSignOutFunction() {
  return new Promise((resolve, reject) => {
    Parse.User.logOut().then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function retrieveForgotPasswordFunction(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run('forgotPassword', params).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

/**
 * Deprecated
 */
function retrieveCurrentUserFunction() {
  const u = Parse.User.current();
  if (u) {
    const user = new Parse.User();
    user.id = u.id;
    user.name = u.get('username');
    user.email = u.get('email');
    user.organization = u.get('organization');
    user.role = u.get('role');
    return user;
  }
  return null;
}

function retrieveCurrentUserAsyncFunction() {
  return Parse.User.currentAsync().then((u) => {
    const user = {};
    user.id = u.id;
    user.username = u.get('username');
    user.firstname = u.get('firstname');
    user.lastname = u.get('lastname');
    user.email = u.get('email');
    user.organization = u.get('organization');
    user.role = u.get('role');
    return user;
  });
}

function retrieveDeleteUserFunction(params) {
  Parse.Cloud.run('deleteUser', params).then((result) => result);
}

export {
  initialize,
  retrieveSignUpFunction, retrieveSignInFunction, retrieveSignOutFunction,
  retrieveForgotPasswordFunction,
  retrieveCurrentUserFunction, retrieveCurrentUserAsyncFunction,
  retrieveDeleteUserFunction
};
