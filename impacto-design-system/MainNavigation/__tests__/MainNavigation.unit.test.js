import React from "react";
import { Text, View } from "react-native";
import { render, screen, waitFor } from "@testing-library/react-native";

import MainNavigation from "../index";
import { AlertContext } from "@context/alert.context";
import { getHasSeenOnboarding } from "@modules/settings";

jest.mock("@modules/settings", () => ({
  getHasSeenOnboarding: jest.fn(),
}));

jest.mock("@modules/i18n", () => ({
  t: (key) => key,
}));

jest.mock("@modules/utils/animations", () => ({
  ROOT_ENTERING: {},
}));

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }) => React.createElement(View, null, children),
  };
});

jest.mock("react-native-paper", () => ({
  useTheme: () => ({
    colors: {
      background: "#ffffff",
    },
  }),
}));

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    NavigationContainer: ({ children }) => React.createElement(View, { testID: "navigation-container" }, children),
  };
});

jest.mock("@react-navigation/native-stack", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ initialRouteName, children }) =>
        React.createElement(
          View,
          { testID: "stack-navigator" },
          React.createElement(Text, null, `initial-route:${initialRouteName}`),
          children
        ),
      Screen: ({ name }) => React.createElement(Text, null, `screen:${name}`),
    }),
  };
});

jest.mock("@impacto-design-system/Base/Toast", () => () => null);
jest.mock("@app/domains/Auth/PinCode/GetPinCode", () => () => null);
jest.mock("@app/domains/Auth/PinCode/StorePinCode", () => () => null);
jest.mock("@app/domains/Auth/SignIn", () => () => null);
jest.mock("@app/domains/Auth/SignUp", () => () => null);
jest.mock("@app/domains/Onboarding", () => () => null);
jest.mock("@app/domains/Settings", () => () => null);
jest.mock("../BottomTabNavigator", () => () => null);
jest.mock("../LinkingConfiguration", () => ({}));

describe("MainNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not render Stack.Navigator until onboarding state is loaded, then renders with resolved initial route", async () => {
    let resolveOnboardingState;
    getHasSeenOnboarding.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOnboardingState = resolve;
        })
    );

    render(
      <AlertContext.Provider value={{ visible: false, message: "", dismiss: jest.fn() }}>
        <MainNavigation />
      </AlertContext.Provider>
    );

    expect(screen.queryByTestId("stack-navigator")).toBeNull();

    resolveOnboardingState(true);

    await waitFor(() => {
      expect(screen.getByText("initial-route:Sign In")).toBeDefined();
    });
  });
});