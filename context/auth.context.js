import {
  retrieveCurrentUserAsyncFunction,
  retrieveSignInFunction,
  retrieveSignOutFunction,
  retrieveSignUpFunction,
} from "@app/services/parse/auth/index";
import { getData, storeData } from "@modules/async-storage";
import checkOnlineStatus from "@modules/offline";
import React, { createContext, useEffect, useState } from "react";

export const UserContext = createContext();

export function UserContextProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    retrieveCurrentUserAsyncFunction().then((currentParseUser) => {
      if (currentParseUser) {
        const usr = currentParseUser;
        usr.isOnline = true;
        setUser(usr);
        storeData(usr, "currentUser");
        setIsLoading(false);
      } else {
        getData("currentUser").then((currentAsyncUser) => {
          if (currentAsyncUser) {
            const usr = currentAsyncUser;
            usr.isOnline = false;
            setUser(usr);
          }
          setIsLoading(false);
        });
      }
    });
  }, []);

  const onlineLogin = async (enteredCredentials) => {
    const { username, password } = enteredCredentials;
    setIsLoading(true);
    return retrieveSignInFunction(username, password)
      .then((currentParseUser) => {
        const usr = currentParseUser;
        usr.isOnline = true;
        setUser(usr);
        storeData(usr, "currentUser");
        storeData(password, "password");
        setError(null);
        setIsLoading(false);
        return true;
      })
      .catch(async (e) => {
        setError(e.toString());
        setIsLoading(false);
        return false;
      });
  };

  const offlineLogin = (enteredCredentials) => {
    const { username, password } = enteredCredentials;
    const { name: usrname, password: pswd } = user; // cached user

    setIsLoading(true);

    if (username !== usrname || password !== pswd) {
      setError("signIn.usernamePasswordIncorrect");
      setIsLoading(false);
      return false;
    }

    setError(null);
    setIsLoading(false);

    return true;
  };

  /**
   * @param {*} params
   * @returns User Object
   */

  const register = async (params, notificationType) => {
    const { password } = params;
    storeData(password, "password");
    setIsLoading(true);
    try {
      const u = await retrieveSignUpFunction(params, notificationType);
      setUser(u);
      setError(null);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      setError(e.toString());
    }
  };

  const onLogout = async () => {
    const connected = await checkOnlineStatus();
    if (connected) {
      return retrieveSignOutFunction().then(() => {
        setError(null);
        return true;
      });
    }

    setError(null);
    return true;
  };

  return (
    <UserContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        isLoading,
        error,
        onlineLogin,
        offlineLogin,
        register,
        onLogout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
