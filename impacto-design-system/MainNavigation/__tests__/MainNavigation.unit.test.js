import { AlertContext } from "@context/alert.context";
import MainNavigation from "@impacto-design-system/MainNavigation/index";
import { getHasSeenOnboarding } from "@modules/settings";
import { render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

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
  const ActualReact = jest.requireActual("react");
  const { View: ActualView } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ children }) => ActualReact.createElement(ActualView, null, children),
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
  const ActualReact = jest.requireActual("react");
  const { View: ActualView } = jest.requireActual("react-native");
  return {
    NavigationContainer: ({ children }) => ActualReact.createElement(ActualView, { testID: "navigation-container" }, children),
  };
});

jest.mock("@react-navigation/native-stack", () => {
  const ActualReact = jest.requireActual("react");
  const { View: ActualView, Text: ActualText } = jest.requireActual("react-native");

  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ initialRouteName, children }) =>
        ActualReact.createElement(
          ActualView,
          { testID: "stack-navigator" },
          ActualReact.createElement(ActualText, null, `initial-route:${initialRouteName}`),
          children
        ),
      Screen: ({ name }) => ActualReact.createElement(ActualText, null, `screen:${name}`),
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