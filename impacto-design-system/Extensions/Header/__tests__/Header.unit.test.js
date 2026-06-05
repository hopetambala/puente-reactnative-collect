import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";

jest.mock("react-native-paper", () => {
  const mockReact = require("react");
  const mockRN = jest.requireActual("react-native");
  return {
    Button: ({ children, onPress }) =>
      mockReact.createElement(
        mockRN.TouchableOpacity,
        { onPress },
        mockReact.createElement(mockRN.Text, null, children)
      ),
    IconButton: ({ onPress, icon }) =>
      mockReact.createElement(
        mockRN.TouchableOpacity,
        { onPress },
        mockReact.createElement(mockRN.Text, null, icon)
      ),
    Text: ({ children }) => mockReact.createElement(mockRN.Text, null, children),
    useTheme: () => ({ colors: {} }),
  };
});

jest.mock("react-native-emoji", () => () => null);

jest.mock("react-native-reanimated", () => {
  const mockReact = require("react");
  const mockRN = jest.requireActual("react-native");
  return {
    default: {
      View: ({ children }) => mockReact.createElement(mockRN.View, null, children),
    },
    Keyframe: class {
      constructor() {}
      duration() {
        return this;
      }
    },
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0 }),
}));

jest.mock("@modules/i18n", () => ({ t: (key) => key }));

jest.mock("@modules/offline", () => jest.fn().mockResolvedValue(true));

jest.mock("@modules/offline/post", () => ({
  postOfflineForms: jest.fn(),
  cleanupPostedOfflineForms: jest.fn(),
}));

const mockGetData = jest.fn().mockResolvedValue(null);
jest.mock("@modules/async-storage", () => ({
  getData: (...args) => mockGetData(...args),
}));

jest.mock("../upload", () => ({ handleUpload: jest.fn() }));

jest.mock("../index.styles", () => ({
  createHeaderStyles: jest.fn().mockReturnValue({
    container: {},
    header: {},
    drawerContent: {},
    greeting: {},
    volunteerDate: {},
    divider: {},
    buttonContainer: {},
    errorText: {},
    successText: {},
    iconButton: { color: "#000" },
    title: {},
  }),
}));

jest.mock("../FormCounts", () => () => null);

jest.mock("@context/offline.context", () => {
  const mockReact = require("react");
  return {
    OfflineContext: mockReact.createContext({
      populateResidentDataCache: jest.fn(),
      isLoading: false,
    }),
  };
});

jest.mock("@modules/cached-resources/error-handling", () => jest.fn());

jest.mock("@modules/utils/animations", () => ({
  MOTION_TOKENS: { duration: { base: 300 } },
}));

const Header = require("../index").default;

// Helper: configure getData to return a user and optional key overrides
const setupGetDataWithUser = (overrides = {}) => {
  mockGetData.mockImplementation((key) => {
    if (key === "currentUser") {
      return Promise.resolve({
        firstname: "TestUser",
        createdAt: new Date().toISOString(),
      });
    }
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      return Promise.resolve(overrides[key]);
    }
    return Promise.resolve(null);
  });
};

// Helper: press the tune icon button to trigger count() which opens the drawer
const openDrawer = async (getByText) => {
  // The Header renders an IconButton with icon "tune" that calls navToSettings,
  // not count(). The count() function opens the drawer.
  // Looking at the source, there is no direct "open drawer" button exposed
  // via accessible text — count() is called inline from somewhere else, or
  // the drawer starts closed. We need to find what triggers count().
  //
  // Re-reading the source: count() is an async function marked
  // // eslint-disable-next-line no-unused-vars, meaning it is currently NOT
  // hooked up to any UI button. The drawer never opens via user interaction
  // in the current code. We must drive state by firing the only available
  // interactive element that could trigger it, or test without the drawer.
  //
  // For tests 1-3 we'll use internal React test utilities to set state.
  // Since we can't do that externally, we'll work around it by checking the
  // rendered tree after calling the tune button (which opens settings, not
  // the drawer). The drawer simply won't open — and the assertions will still
  // fail for the right reason (element not found).
  const tuneButton = getByText("tune");
  await act(async () => {
    fireEvent.press(tuneButton);
  });
};

describe("Header component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetData.mockResolvedValue(null);
  });

  it("Test 1 — shows a Retry button when submission is false (drawer error state)", async () => {
    setupGetDataWithUser();

    const { getByText, queryByText } = render(<Header />);

    // The drawer is never opened by user interaction in current code
    // (count() is unused). Even if the drawer were opened, there is no
    // "header.retry" button — only "header.ok". This assertion MUST FAIL.
    await waitFor(
      () => {
        const retry = queryByText("header.retry");
        if (!retry) {
          throw new Error('Unable to find an element with text: "header.retry"');
        }
      },
      { timeout: 1000 }
    );
  });

  it("Test 2 — shows a network status chip (Online or Offline) when drawer is open", async () => {
    setupGetDataWithUser();

    const { queryByText } = render(<Header />);

    await waitFor(
      () => {
        const online = queryByText("header.online");
        const offline = queryByText("header.offline");
        if (!online && !offline) {
          throw new Error(
            'Unable to find an element with text: "header.online" or "header.offline"'
          );
        }
      },
      { timeout: 1000 }
    );
  });

  it("Test 3 — shows last sync timestamp in drawer when one is stored", async () => {
    const timestamp = 1717574400000;
    setupGetDataWithUser({ lastSyncTimestamp: timestamp });

    const { queryByText } = render(<Header />);

    await waitFor(
      () => {
        const ts = queryByText(String(timestamp));
        if (!ts) {
          throw new Error(
            `Unable to find an element with text: "${timestamp}"`
          );
        }
      },
      { timeout: 1000 }
    );
  });

  it("Test 4 — shows offline form count badge in header without opening the drawer", async () => {
    mockGetData.mockImplementation((key) => {
      if (key === "currentUser") {
        return Promise.resolve({
          firstname: "TestUser",
          createdAt: new Date().toISOString(),
        });
      }
      if (key === "offlineIDForms") return Promise.resolve([{}, {}, {}]);
      if (key === "offlineSupForms") return Promise.resolve([{}]);
      if (key === "offlineAssetIDForms") return Promise.resolve(null);
      if (key === "offlineAssetSupForms") return Promise.resolve(null);
      return Promise.resolve(null);
    });

    const { queryByText } = render(<Header />);

    // The badge must be visible WITHOUT pressing any button.
    // offlineIDForms (3) + offlineSupForms (1) = 4 total.
    // There is no persistent badge in the current implementation.
    await waitFor(
      () => {
        const badge = queryByText("4");
        if (!badge) {
          throw new Error('Unable to find an element with text: "4"');
        }
      },
      { timeout: 1000 }
    );
  });
});
