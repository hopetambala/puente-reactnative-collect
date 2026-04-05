import {
  retrieveCurrentUserAsyncFunction,
  retrieveSignInFunction,
  retrieveSignOutFunction,
  retrieveSignUpFunction,
} from "@app/services/parse/auth/index";
import { deleteData, getData, storeData } from "@modules/async-storage";
import checkOnlineStatus from "@modules/offline";
import I18n from "@modules/i18n";
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
        // User has valid Parse session - restore from server
        const usr = currentParseUser;
        usr.isOnline = true;
        setUser(usr);
        storeData(usr, "currentUser");
        setIsLoading(false);
      } else {
        // No valid session - check for cached user (read-only fallback, online-only mode)
        getData("currentUser").then((currentAsyncUser) => {
          if (currentAsyncUser) {
            // Note: In online-only mode, cached user is informational only
            // User must login again to get a valid session token
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
        // Store user object for display, but NOT password
        // Parse SDK automatically manages session token securely
        storeData(usr, "currentUser");
        setError(null);
        setIsLoading(false);
        return true;
      })
      .catch(async (e) => {
        const errorCode = e.code ? parseInt(e.code) : null;
        // Handle invalid session token error (code 209)
        if (errorCode === 209) {
          setError("signIn.invalidSessionToken");
          // Clear invalid session
          setUser(null);
          deleteData("currentUser");
        } else {
          setError(e.toString());
        }
        setIsLoading(false);
        return false;
      });
  };

  const offlineLogin = (enteredCredentials) => {
    // Online-only mode: offline login is no longer supported
    // User must have internet connection to authenticate
    setIsLoading(true);
    setError("signIn.offlineLoginError");
    setIsLoading(false);
    return false;
  };

  /**
   * @param {*} params - User data: firstname, lastname, email, phone, password, organization
   * @returns User Object
   */

  const register = async (params) => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!params.firstname?.trim() || !params.lastname?.trim() || !params.email?.trim() || !params.password?.trim() || !params.organization?.trim()) {
        throw new Error("All fields are required");
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(params.email)) {
        throw new Error("Invalid email format");
      }
      
      // Clear any existing session data before registering new user
      await deleteData("currentUser");
      
      // Remove password2 (form confirmation field) before sending to cloud
      const cleanParams = {
        firstname: params.firstname.trim(),
        lastname: params.lastname.trim(),
        email: params.email.trim(),
        phonenumber: params.phonenumber?.trim() || "",
        password: params.password,
        organization: params.organization.trim(),
      };
      
      // Call signup without notificationType (online-only, no confirmation)
      const u = await retrieveSignUpFunction(cleanParams);
      
      // Store new user to persistent storage
      // Parse SDK automatically manages session token securely
      setUser(u);
      await storeData(u, "currentUser");
      
      setError(null);
      setIsLoading(false);
      
      // Return success - allow caller to handle navigation
      return u;
    } catch (e) {
      setIsLoading(false);
      const errorMessage = e.message || e.toString();
      setError(errorMessage);
      // Throw error so caller (SignUp component) can handle it
      throw e;
    }
  };

  const onLogout = async () => {
    const connected = await checkOnlineStatus();
    if (connected) {
      return retrieveSignOutFunction().then(() => {
        // Clear user state and persistent storage on logout
        // Parse SDK automatically invalidates session token
        setUser(null);
        setError(null);
        deleteData("currentUser");
        return true;
      });
    }

    // Offline logout: still clear state and storage
    setUser(null);
    setError(null);
    deleteData("currentUser");
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
