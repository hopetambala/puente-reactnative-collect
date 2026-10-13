import { retrieveCurrentUserAsyncFunction } from "@app/services/parse/auth/index";
import { UserContext, UserContextProvider } from "@context/auth.context";
import { render } from "@testing-library/react-native";
import React, { useContext } from "react";

jest.mock("@app/services/parse/auth/index", () => ({
  retrieveCurrentUserAsyncFunction: jest.fn(),
  retrieveSignInFunction: jest.fn(),
  retrieveSignOutFunction: jest.fn(),
  retrieveSignUpFunction: jest.fn(),
}));

jest.mock("@modules/async-storage", () => ({
  deleteData: jest.fn(),
  getData: jest.fn(),
  storeData: jest.fn(),
}));

jest.mock("@modules/offline", () => jest.fn());

describe("UserContextProvider session restoration", () => {
  test("reports loading on its first render while the persisted session is unresolved", () => {
    retrieveCurrentUserAsyncFunction.mockReturnValue(new Promise(() => {}));
    const observedStates = [];
    function ObserveAuth() {
      const auth = useContext(UserContext);
      observedStates.push({ isLoading: auth.isLoading, isAuthenticated: auth.isAuthenticated });
      return null;
    }

    render(<UserContextProvider><ObserveAuth /></UserContextProvider>);

    expect(retrieveCurrentUserAsyncFunction).toHaveBeenCalledTimes(1);
    expect(observedStates[0]).toEqual({ isLoading: true, isAuthenticated: false });
    expect(observedStates.every((auth) => auth.isLoading)).toBe(true);
  });
});
