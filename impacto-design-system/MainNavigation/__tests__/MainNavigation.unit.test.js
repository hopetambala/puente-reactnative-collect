import { AlertContext } from "@context/alert.context";
import { UserContext } from "@context/auth.context";
import MainNavigation from "@impacto-design-system/MainNavigation/index";
import { getHasSeenOnboarding } from "@modules/settings";
import { act, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

jest.mock("@modules/settings", () => ({
  getHasSeenOnboarding: jest.fn(),
}));

jest.mock("@context/auth.context", () => ({
  UserContext: jest.requireActual("react").createContext(),
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

function navigationWithAuth(auth) {
  return (
    <UserContext.Provider value={auth}>
      <AlertContext.Provider value={{ visible: false, message: "", dismiss: jest.fn() }}>
        <MainNavigation />
      </AlertContext.Provider>
    </UserContext.Provider>
  );
}

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

    render(navigationWithAuth({ isLoading: false, isAuthenticated: false, user: null }));

    expect(screen.queryByTestId("stack-navigator")).toBeNull();

    resolveOnboardingState(true);

    await waitFor(() => {
      expect(screen.getByText("initial-route:Sign In")).toBeDefined();
    });
  });

  test("waits for auth restoration after onboarding has loaded before choosing the initial route", async () => {
    getHasSeenOnboarding.mockResolvedValue(true);
    const { rerender } = render(navigationWithAuth({ isLoading: true, isAuthenticated: false, user: null }));

    // Flush the completed onboarding promise: auth is still unresolved.
    await act(async () => {
      await Promise.resolve();
    });
    expect(getHasSeenOnboarding).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("stack-navigator")).toBeNull();

    rerender(navigationWithAuth({ isLoading: false, isAuthenticated: true, user: { id: "returning-user", isOnline: true } }));

    await waitFor(() => {
      expect(screen.getByText("initial-route:Root")).toBeDefined();
    });
  });

  test.each([true, false])("restores an authenticated returning user to Root when isOnline=%s", async (isOnline) => {
    getHasSeenOnboarding.mockResolvedValue(true);
    render(navigationWithAuth({ isLoading: false, isAuthenticated: true, user: { id: "returning-user", isOnline } }));

    await waitFor(() => {
      expect(screen.getByText("initial-route:Root")).toBeDefined();
    });
  });

  test("waits for onboarding even when a restored authenticated session is ready first", async () => {
    let resolveOnboardingState;
    getHasSeenOnboarding.mockImplementation(() => new Promise((resolve) => {
      resolveOnboardingState = resolve;
    }));
    render(navigationWithAuth({ isLoading: false, isAuthenticated: true, user: { id: "returning-user", isOnline: false } }));

    expect(screen.queryByTestId("stack-navigator")).toBeNull();
    resolveOnboardingState(true);

    await waitFor(() => {
      expect(screen.getByText("initial-route:Root")).toBeDefined();
    });
  });

  test("keeps a first install with no restored session on Onboarding", async () => {
    getHasSeenOnboarding.mockResolvedValue(false);
    render(navigationWithAuth({ isLoading: false, isAuthenticated: false, user: null }));

    await waitFor(() => {
      expect(screen.getByText("initial-route:Onboarding")).toBeDefined();
    });
  });

  test("keeps the navigator mounted and its initial route fixed during a later login", async () => {
    getHasSeenOnboarding.mockResolvedValue(true);
    const { rerender } = render(navigationWithAuth({ isLoading: false, isAuthenticated: false, user: null }));

    await waitFor(() => {
      expect(screen.getByText("initial-route:Sign In")).toBeDefined();
    });

    rerender(navigationWithAuth({ isLoading: true, isAuthenticated: false, user: null }));
    expect(screen.getByTestId("stack-navigator")).toBeDefined();
    expect(screen.getByText("initial-route:Sign In")).toBeDefined();

    rerender(navigationWithAuth({ isLoading: false, isAuthenticated: true, user: { id: "signed-in-user" } }));
    expect(screen.getByTestId("stack-navigator")).toBeDefined();
    expect(screen.getByText("initial-route:Sign In")).toBeDefined();
  });
});
