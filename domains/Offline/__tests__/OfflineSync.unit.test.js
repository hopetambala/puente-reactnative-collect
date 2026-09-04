import OfflineSyncScreen from "@app/domains/Offline";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";

jest.mock("@modules/async-storage", () => ({
  getData: jest.fn(),
  storeData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@modules/offline/post", () => ({
  postOfflineForms: jest.fn(),
  cleanupPostedOfflineForms: jest.fn(),
}));

jest.mock("@impacto-design-system/Extensions/Header/upload", () => ({
  handleUpload: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true, details: {} }),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock("@react-navigation/native", () => ({
  // Run the effect immediately, the way a focused screen does.
  useFocusEffect: (cb) => {
    // eslint-disable-next-line global-require
    require("react").useEffect(cb, [cb]);
  },
}));

const { getData } = require("@modules/async-storage");
const { handleUpload } = require("@impacto-design-system/Extensions/Header/upload");

// Flatten the tree into the string a surveyor actually reads. Asserting on
// JSON.stringify instead looks equivalent and is not: the children of one Text
// arrive as separate array entries, so `"1 forms!"` never appears as a
// substring and an assertion against it passes no matter what rendered.
const flatten = (node) => {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flatten).join("");
  return flatten(node.children);
};
const screenText = (tree) => flatten(tree.toJSON());

const queue = (counts) => {
  getData.mockImplementation((key) => {
    if (key === "offlineIDForms") return Promise.resolve(new Array(counts.id ?? 0).fill({}));
    if (key === "offlineSupForms") return Promise.resolve(new Array(counts.sup ?? 0).fill({}));
    return Promise.resolve(null);
  });
};

describe("OfflineSyncScreen — the success line agrees with what was sent", () => {
  beforeEach(() => jest.clearAllMocks());

  // handleUpload sets `submission` to the count it sent and THEN resets the
  // queue count to 0. A formWord derived from the queue count is therefore
  // always the plural by the time the success line renders, so syncing exactly
  // one form announced "You have just submitted 1 forms!".
  it("uses the singular when exactly one form synced", async () => {
    queue({ sup: 1 });
    handleUpload.mockImplementation(async ({ setSubmission, resetFormCount }) => {
      setSubmission(1);
      resetFormCount(0);
    });

    const tree = render(<OfflineSyncScreen />);
    await waitFor(() => expect(tree.getByTestId("offline-retry-button")).toBeTruthy());
    fireEvent.press(tree.getByTestId("offline-retry-button"));

    await waitFor(() => expect(screenText(tree)).toContain("Success!"));
    expect(screenText(tree)).not.toContain("1 forms!");
  });
});

describe("OfflineSyncScreen — queued forms are not reported as submitted", () => {
  beforeEach(() => jest.clearAllMocks());

  // A queued form has NOT reached the server. Telling a surveyor it was
  // "submitted" invites them to close the app on unsynced work, which is the
  // exact data loss this screen exists to prevent.
  it("does not claim a queued form was submitted", async () => {
    queue({ sup: 1 });
    const tree = render(<OfflineSyncScreen />);

    await waitFor(() => expect(screenText(tree)).toContain("1"));

    expect(screenText(tree)).not.toContain("just submitted");
  });

  it("says the queued form has not reached the server yet", async () => {
    queue({ sup: 1 });
    const tree = render(<OfflineSyncScreen />);

    await waitFor(() =>
      expect(screenText(tree)).toContain("has not reached the server yet")
    );
  });

  it("pluralises the count for more than one queued form", async () => {
    queue({ id: 2, sup: 1 });
    const tree = render(<OfflineSyncScreen />);

    await waitFor(() =>
      expect(screenText(tree)).toContain(
        "3 forms are saved on this device and have not reached the server yet"
      )
    );
  });
});

describe("OfflineSyncScreen — a failed sync explains itself", () => {
  beforeEach(() => jest.clearAllMocks());

  const failWith = (reason) => {
    handleUpload.mockImplementation(async ({ setSubmission }) => {
      setSubmission(reason);
    });
  };

  const renderAndRetry = async () => {
    const tree = render(<OfflineSyncScreen />);
    await waitFor(() =>
      expect(tree.getByTestId("offline-retry-button")).toBeTruthy()
    );
    fireEvent.press(tree.getByTestId("offline-retry-button"));
    return tree;
  };

  // The queue deliberately survives a failed upload (modules/offline/post keeps
  // it so the records can be retried). The screen never said so, leaving a red
  // error as the only feedback — which reads like the work was lost.
  it("reassures that queued forms are still on the device", async () => {
    queue({ sup: 1 });
    failWith(false);

    const tree = await renderAndRetry();

    await waitFor(() =>
      expect(screenText(tree)).toContain("still saved on this device")
    );
  });

  // header.tryAgain blames the internet connection. When the app is online and
  // the SERVER refused the records, that advice sends a surveyor to go stand
  // somewhere with better signal for a problem signal cannot fix.
  it("does not blame the connection when the app is online", async () => {
    queue({ sup: 1 });
    failWith(false);

    const tree = await renderAndRetry();

    await waitFor(() => expect(screenText(tree)).toContain("still saved"));
    expect(screenText(tree)).not.toContain("connected to the internet");
  });

  // handleUpload reports an expired session as the string "SessionExpired".
  // The screen tested `submission === false` and `typeof submission ===
  // "number"`, so this matched neither branch: the spinner stopped and NOTHING
  // rendered. Retry looked like it did nothing, forever.
  it("reports an expired session instead of failing silently", async () => {
    queue({ sup: 1 });
    failWith("SessionExpired");

    const tree = await renderAndRetry();

    await waitFor(() => expect(screenText(tree)).toContain("Session expired"));
  });
});
