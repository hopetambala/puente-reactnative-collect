/* eslint-disable global-require */
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true, details: {} }),
}));

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

const Header = require("@impacto-design-system/Extensions/Header").default;

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


describe("Header component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetData.mockResolvedValue(null);
  });

  it("useEffect loadStatusBar does not call setIsOnline after the component unmounts (cancellation guard)", async () => {
    // React 19 silently ignores setState on unmounted components, so we cannot
    // rely on console.error warnings.  Instead, we inject a getter spy into the
    // resolved value that loadStatusBar reads AFTER await Promise.all():
    //
    //   const total = (idForms?.length ?? 0) + ...;
    //
    // If a cancellation guard (`if (cancelled) return`) is in place, this line
    // is never reached after unmount and the spy is never called.
    // Without the guard the spy IS called — making the test RED.
    const lengthAccessSpy = jest.fn(() => 0);

    // Hold Promise.all hostage until after we unmount.
    let resolveOnline;
    const checkOnlineStatus = require("@modules/offline");
    checkOnlineStatus.mockReturnValue(
      new Promise((res) => { resolveOnline = res; })
    );

    const resolvers = [];
    mockGetData.mockImplementation(() => {
      let res;
      const p = new Promise((r) => { res = r; });
      resolvers.push(res);
      return p;
    });

    const { unmount } = render(<Header />);

    // Unmount BEFORE the Promise.all settles.
    unmount();

    // Resolve all deferred promises so the async continuation in loadStatusBar runs.
    // One of the resolved values has a .length getter wired to our spy.
    resolveOnline(true);
    if (resolvers[0]) resolvers[0](null);  // lastSyncTimestamp
    const spyArray = { get length() { return lengthAccessSpy(); } };
    if (resolvers[1]) resolvers[1](spyArray);  // offlineIDForms — spy here
    if (resolvers[2]) resolvers[2](null);  // offlineSupForms
    if (resolvers[3]) resolvers[3](null);  // offlineAssetIDForms
    if (resolvers[4]) resolvers[4](null);  // offlineAssetSupForms

    // Flush microtasks so the async continuation executes.
    await new Promise((res) => { setImmediate(res); });
    await new Promise((res) => { setImmediate(res); });

    // With the cancellation guard the spy is never reached → 0 calls.
    // Without the guard the spy fires → test fails (RED).
    expect(lengthAccessSpy).not.toHaveBeenCalled();
  });

  it("shows a Retry button when there are queued offline forms", async () => {
    setupGetDataWithUser({ offlineIDForms: [{}] });

    const { queryByText } = render(<Header />);

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

  it("shows a network status chip (Online or Offline) when drawer is open", async () => {
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

  it("shows last sync timestamp in drawer when one is stored", async () => {
    const timestamp = 1717574400000;
    setupGetDataWithUser({ lastSyncTimestamp: timestamp });

    const { queryByText } = render(<Header />);

    await waitFor(
      () => {
        const ts = queryByText(new Date(timestamp).toLocaleTimeString());
        if (!ts) {
          throw new Error(
            `Unable to find an element with text: "${new Date(timestamp).toLocaleTimeString()}"`
          );
        }
      },
      { timeout: 1000 }
    );
  });

  it("displays last sync timestamp as a formatted time string, not as a raw millisecond number", async () => {
    const timestamp = 1717574400000;
    setupGetDataWithUser({ lastSyncTimestamp: timestamp });

    const { queryByText } = render(<Header />);

    const formattedTime = new Date(timestamp).toLocaleTimeString();

    await waitFor(
      () => {
        const formatted = queryByText(formattedTime);
        if (!formatted) {
          throw new Error(
            `Unable to find an element with the formatted time: "${formattedTime}". The component may still be rendering the raw number "${timestamp}".`
          );
        }
      },
      { timeout: 2000 }
    );

    // The raw number must NOT appear
    expect(queryByText(String(timestamp))).toBeNull();
  });

  it("does NOT render the Retry button when offlineFormCount is 0", async () => {
    // All four offline form keys return null → offlineFormCount === 0
    mockGetData.mockImplementation((key) => {
      if (key === "currentUser") {
        return Promise.resolve({
          firstname: "TestUser",
          createdAt: new Date().toISOString(),
        });
      }
      // offlineIDForms, offlineSupForms, offlineAssetIDForms, offlineAssetSupForms
      return Promise.resolve(null);
    });

    const { queryByText } = render(<Header />);

    // Allow the useEffect / Promise.all to resolve
    await act(async () => {});

    // When there are no queued forms the Retry button must be absent
    expect(queryByText("header.retry")).toBeNull();
  });

  it("subscribes to NetInfo changes on mount for live connectivity updates", async () => {
    const NetInfo = require("@react-native-community/netinfo");
    mockGetData.mockResolvedValue(null);

    render(<Header />);

    await act(async () => {});

    expect(NetInfo.addEventListener).toHaveBeenCalled();
  });

  it("unsubscribes from NetInfo on unmount to prevent memory leaks", async () => {
    const NetInfo = require("@react-native-community/netinfo");
    const mockUnsubscribe = jest.fn();
    NetInfo.addEventListener.mockReturnValue(mockUnsubscribe);
    mockGetData.mockResolvedValue(null);

    const { unmount } = render(<Header />);
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("shows online/offline status text on initial mount via NetInfo.fetch, not just on next network change", async () => {
    // Block the checkOnlineStatus (Promise.all) path so it never resolves during this test.
    // If the component calls NetInfo.fetch() on mount, isOnline is set immediately and the
    // status text appears. Without NetInfo.fetch() the status bar stays hidden (isOnline===null).
    const checkOnlineStatus = require("@modules/offline");
    checkOnlineStatus.mockReturnValue(new Promise(() => {})); // never resolves

    const NetInfo = require("@react-native-community/netinfo");
    NetInfo.fetch.mockResolvedValue({ isConnected: true, details: {} });

    mockGetData.mockResolvedValue(null);

    const { queryByText } = render(<Header />);

    await waitFor(
      () => {
        const online = queryByText("header.online");
        const offline = queryByText("header.offline");
        if (!online && !offline) {
          throw new Error(
            'Unable to find "header.online" or "header.offline" — status text not shown on initial mount'
          );
        }
      },
      { timeout: 1000 }
    );
  });

  it("handles handleUpload rejection gracefully: catch resets isSubmitting so the UI does not freeze", async () => {
    // Arrange: queue one offline form so the Retry button renders
    setupGetDataWithUser({ offlineIDForms: [{}] });

    // Track whether the rejection was caught by the component.
    // We do this by making handleUpload return a specially-crafted promise:
    // its .catch is wrapped so we know if the component called .catch on it.
    const { handleUpload } = require("@impacto-design-system/Extensions/Header/upload");
    let rejectionWasCaught = false;
    const rejectedPromise = Promise.reject(new Error("network failure"));
    // Attach a no-op catch on our side so Node doesn't fire unhandledRejection
    // from our test setup — the component's upload() must ALSO catch it.
    rejectedPromise.catch(() => {});
    // Wrap: replace the promise's .catch so we can observe if it's called
    const originalCatch = rejectedPromise.catch.bind(rejectedPromise);
    rejectedPromise.catch = (fn) => {
      rejectionWasCaught = true;
      return originalCatch(fn);
    };
    handleUpload.mockReturnValueOnce(rejectedPromise);

    const { queryByText } = render(<Header />);

    // Wait for the Retry button to appear
    await waitFor(
      () => {
        const retry = queryByText("header.retry");
        if (!retry) throw new Error('Unable to find "header.retry"');
      },
      { timeout: 1000 }
    );

    // Act: press the Retry button — upload() calls handleUpload() and gets back
    // the rejected promise. With the fix, upload() chains .catch() on it.
    fireEvent.press(queryByText("header.retry"));

    // Flush microtasks
    await act(async () => {
      await new Promise((res) => { setImmediate(res); });
    });

    // With current code: upload() returns handleUpload(...) without .catch,
    // so our instrumented .catch was never called → rejectionWasCaught is false
    // → this assertion FAILS (RED).
    // After the fix: upload() calls .catch(...) on the returned promise
    // → rejectionWasCaught is true → assertion passes (GREEN).
    expect(rejectionWasCaught).toBe(true);
  });

  it("calls console.error with the rejection error in the upload catch handler", async () => {
    // Arrange: queue one offline form so the Retry button renders
    setupGetDataWithUser({ offlineIDForms: [{}] });

    const { handleUpload } = require("@impacto-design-system/Extensions/Header/upload");
    const uploadError = new Error("upload network failure");
    const rejectedPromise = Promise.reject(uploadError);
    // Suppress unhandledRejection from our test setup; the component's .catch must also catch it
    rejectedPromise.catch(() => {});
    handleUpload.mockReturnValueOnce(rejectedPromise);

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { queryByText } = render(<Header />);

    // Wait for the Retry button to appear
    await waitFor(
      () => {
        const retry = queryByText("header.retry");
        if (!retry) throw new Error('Unable to find "header.retry"');
      },
      { timeout: 1000 }
    );

    // Act: press Retry — upload() calls handleUpload() which rejects
    fireEvent.press(queryByText("header.retry"));

    // Flush microtasks so the .catch() handler runs
    await act(async () => {
      await new Promise((res) => { setImmediate(res); });
    });

    // Assert: the catch handler must have called console.error with the error
    expect(consoleErrorSpy).toHaveBeenCalledWith(uploadError);

    consoleErrorSpy.mockRestore();
  });

  it("shows offline form count badge in header without opening the drawer", async () => {
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

    // Badge visible without pressing any button. offlineIDForms (3) + offlineSupForms (1) = 4.
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
