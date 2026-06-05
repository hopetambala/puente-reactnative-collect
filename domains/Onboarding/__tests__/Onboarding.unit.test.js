import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import * as Location from "expo-location";
import { useCameraPermissions } from "expo-camera";
import { getOnboardingStep } from "@modules/settings";

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
}));

jest.mock("expo-camera", () => ({
  useCameraPermissions: jest.fn(),
}));

jest.mock("@modules/i18n", () => ({
  t: (key) => key,
}));

jest.mock("react-native-paper", () => ({
  useTheme: () => ({
    colors: {
      primary: "#000000",
      onSurfaceVariant: "#666666",
      onBackground: "#111111",
      info: "#0066CC",
      success: "#00AA00",
      outlineVariant: "#CCCCCC",
      surface: "#FFFFFF",
      background: "#FFFFFF",
    },
  }),
}));

jest.mock("react-native-reanimated", () => {
  const RN = require("react-native");
  const animation = {
    duration: jest.fn(function() { return this; }),
    delay: jest.fn(function() { return this; }),
    damping: jest.fn(function() { return this; }),
    stiffness: jest.fn(function() { return this; }),
    springify: jest.fn(function() { return this; }),
    withSpring: jest.fn(function() { return this; }),
    withTiming: jest.fn(function() { return this; }),
  };
  
  const React = require("react");
  // Create a base object with createAnimatedComponent method
  const animatedModule = {
    createAnimatedComponent: (Component) => Component,
    ScrollView: ({ children, ...props }) =>
      React.createElement(RN.ScrollView, props, children),
    Text: ({ children, ...props }) =>
      React.createElement(RN.Text, props, children),
    View: ({ children, ...props }) =>
      React.createElement(RN.View, props, children),
    TouchableOpacity: ({ children, ...props }) =>
      React.createElement(RN.TouchableOpacity, props, children),
  };
  
  return {
    __esModule: true,
    default: animatedModule,
    Animated: {
      ScrollView: ({ children, ...props }) =>
        React.createElement(RN.ScrollView, props, children),
      Text: ({ children, ...props }) =>
        React.createElement(RN.Text, props, children),
      View: ({ children, ...props }) =>
        React.createElement(RN.View, props, children),
      TouchableOpacity: ({ children, ...props }) =>
        React.createElement(RN.TouchableOpacity, props, children),
    },
    FadeIn: Object.create(animation),
    FadeInDown: Object.create(animation),
    FadeInUp: Object.create(animation),
    SlideInLeft: {},
    SlideInRight: {},
    Easing: {},
    interpolate: jest.fn(),
    useAnimatedScrollHandler: () => jest.fn(),
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withRepeat: jest.fn(),
    withSequence: jest.fn(),
    withSpring: jest.fn(),
    withTiming: jest.fn(),
  };
});

jest.mock("@modules/utils/animations", () => ({
  ROOT_ENTERING: {},
}));

jest.mock("@context/theme.context", () => ({
  ThemeContext: {
    Provider: ({ children }) => children,
    Consumer: ({ children }) =>
      children({
        colors: {
          primary: "#000000",
        },
      }),
  },
}));

jest.mock("@modules/settings", () => ({
  getOnboardingStep: jest.fn(),
  setOnboardingStep: jest.fn(() => Promise.resolve()),
  setHasSeenOnboarding: jest.fn(() => Promise.resolve()),
  clearOnboardingStep: jest.fn(() => Promise.resolve()),
}));

jest.mock("@modules/theme", () => ({
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    displayLarge: {},
    displayMedium: {},
    bodyMedium: {},
  },
}));

jest.mock("@app/assets/graphics/static/Logo-Black.svg", () => "Logo");

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }) => children,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  }),
  NavigationContainer: ({ children }) => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, null, children);
  },
}));

jest.mock("@react-navigation/native-stack", () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => {
      const React = require("react");
      const { View } = require("react-native");
      return React.createElement(View, null, children);
    },
    Screen: ({ children }) => {
      const React = require("react");
      const { View } = require("react-native");
      return React.createElement(View, null, children);
    },
  }),
}));

// Import the module to get access to test the Onboarding component
import Onboarding from "../index.js";

describe("StepPermissions - initialize locationStatus on mount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should initialize locationStatus from Location.getForegroundPermissionsAsync() on mount so existing permission state is reflected before pressing request", async () => {
    // Setup: Mock Location to return a pre-existing "granted" permission
    Location.getForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });

    // Setup: Mock camera permissions to return not granted
    useCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true },
      jest.fn(),
    ]);

    // Setup: Mock that there's no saved onboarding step, so component starts at step 0
    getOnboardingStep.mockResolvedValue(null);

    // Create mock navigation
    const mockNavigation = {
      replace: jest.fn(),
    };

    // Render the Onboarding component with mock navigation
    render(<Onboarding navigation={mockNavigation} />);

    // Wait for the component to finish async setup and verify the assertion
    await waitFor(() => {
      // The assertion: Location.getForegroundPermissionsAsync should be called
      // when StepPermissions mounts to initialize the existing location permission state
      // before the user presses the request button
      expect(Location.getForegroundPermissionsAsync).toHaveBeenCalled();
    });
  });
});

describe("Onboarding - route param returnTo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should navigate to returnTo route on completion when route param returnTo is provided", async () => {
    // Setup: Mock Location permissions
    Location.getForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });

    // Setup: Mock camera permissions
    useCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true },
      jest.fn(),
    ]);

    // Setup: Mock that there's no saved onboarding step, so component starts at step 0
    getOnboardingStep.mockResolvedValue(null);

    // Setup: Create mock navigation and route with returnTo param
    const mockNavigation = {
      replace: jest.fn(),
    };
    const mockRoute = {
      params: {
        returnTo: "Dashboard",
      },
    };

    // Render the Onboarding component with route params
    render(<Onboarding navigation={mockNavigation} route={mockRoute} />);

    // Simulate completing onboarding - when handleSkip is called (on skip action),
    // navigation.replace should be called. The behavior assertion is that it should
    // use the returnTo route parameter instead of always using "Sign In".
    // Currently, handleSkip always calls navigation.replace("Sign In"),
    // so this test fails until the implementation reads route.params.returnTo
    
    // Wait a bit for async operations to complete, then check the assertion
    await new Promise(resolve => setTimeout(resolve, 100));

    // The assertion: when the component's skip or complete handlers are triggered,
    // navigation.replace should be called with the returnTo route "Dashboard"
    // instead of the hardcoded "Sign In" route.
    // This will fail with current implementation because it always uses "Sign In"
    expect(mockNavigation.replace).toHaveBeenCalledWith("Dashboard");
  });
});
