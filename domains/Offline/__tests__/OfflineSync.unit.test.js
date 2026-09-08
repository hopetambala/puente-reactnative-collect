import OfflineSyncScreen from "@app/domains/Offline";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";

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

const { getData, storeData } = require("@modules/async-storage");
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

describe("OfflineSyncScreen — the queue can be inspected and unblocked", () => {
  beforeEach(() => jest.clearAllMocks());

  const idRecord = {
    parseClass: "SurveyData",
    localObject: { fname: "Link", lname: "Test" },
  };
  const envRecord = {
    parseClass: "HistoryEnvironmentalHealth",
    localObject: {},
  };

  const queueRecords = (records) => {
    getData.mockImplementation((key) =>
      Promise.resolve(key === "offlineSupForms" ? records : null)
    );
  };

  // A wedged queue showed only a count. The surveyor could not tell which form
  // was stuck, so "3 forms have not reached the server" was the whole story.
  it("lists each queued form by name", async () => {
    getData.mockImplementation((key) => {
      if (key === "offlineIDForms") return Promise.resolve([idRecord]);
      if (key === "offlineSupForms") return Promise.resolve([envRecord]);
      return Promise.resolve(null);
    });

    const tree = render(<OfflineSyncScreen />);

    await waitFor(() => expect(screenText(tree)).toContain("Resident ID"));
    expect(screenText(tree)).toContain("Environmental Health");
  });

  // index is position WITHIN a queue, so a resident form and a supplementary
  // form are both index 0. Keying the controls on it renders duplicate testIDs,
  // which makes getByTestId ambiguous and a Maestro tap non-deterministic.
  it("gives every queued row a distinct discard control", async () => {
    getData.mockImplementation((key) => {
      if (key === "offlineIDForms") return Promise.resolve([idRecord]);
      if (key === "offlineSupForms") return Promise.resolve([envRecord]);
      return Promise.resolve(null);
    });

    const tree = render(<OfflineSyncScreen />);

    await waitFor(() => expect(tree.getByTestId("queued-discard-0")).toBeTruthy());
    expect(tree.getByTestId("queued-discard-1")).toBeTruthy();
  });

  it("names the resident an identification record describes", async () => {
    getData.mockImplementation((key) =>
      Promise.resolve(key === "offlineIDForms" ? [idRecord] : null)
    );

    const tree = render(<OfflineSyncScreen />);

    await waitFor(() => expect(screenText(tree)).toContain("Link Test"));
  });

  // Discarding is unrecoverable — the record exists nowhere else. It must never
  // happen on a single press.
  it("asks for confirmation before discarding, and does not delete yet", async () => {
    queueRecords([envRecord]);
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    const tree = render(<OfflineSyncScreen />);
    await waitFor(() => expect(tree.getByTestId("queued-discard-0")).toBeTruthy());
    fireEvent.press(tree.getByTestId("queued-discard-0"));

    expect(alert).toHaveBeenCalled();
    expect(storeData).not.toHaveBeenCalledWith(expect.anything(), "offlineSupForms");
    alert.mockRestore();
  });

  it("removes the record once the destructive choice is confirmed", async () => {
    queueRecords([envRecord]);
    const alert = jest
      .spyOn(Alert, "alert")
      .mockImplementation(async (title, message, buttons) => {
        const confirm = buttons.find((b) => b.style === "destructive");
        await confirm.onPress();
      });

    const tree = render(<OfflineSyncScreen />);
    await waitFor(() => expect(tree.getByTestId("queued-discard-0")).toBeTruthy());
    fireEvent.press(tree.getByTestId("queued-discard-0"));

    await waitFor(() =>
      expect(storeData).toHaveBeenCalledWith([], "offlineSupForms")
    );
    alert.mockRestore();
  });

  // The row control and the confirmation button must not read the same, or the
  // confirm is ambiguous on screen (and untappable by an E2E flow, which would
  // find two matches). The destructive choice should name its consequence.
  it("labels the confirmation distinctly from the row control", async () => {
    queueRecords([envRecord]);
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    const tree = render(<OfflineSyncScreen />);
    await waitFor(() => expect(tree.getByTestId("queued-discard-0")).toBeTruthy());
    fireEvent.press(tree.getByTestId("queued-discard-0"));

    const [, , buttons] = alert.mock.calls[0];
    const confirm = buttons.find((b) => b.style === "destructive");
    expect(confirm.text).not.toBe("Discard");
    expect(confirm.text).toMatch(/permanently/i);
    alert.mockRestore();
  });

  // The warning has to name the cost. "Are you sure?" is not informed consent
  // about a health record that exists nowhere but this phone.
  it("names the form and the permanence in the confirmation", async () => {
    queueRecords([envRecord]);
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    const tree = render(<OfflineSyncScreen />);
    await waitFor(() => expect(tree.getByTestId("queued-discard-0")).toBeTruthy());
    fireEvent.press(tree.getByTestId("queued-discard-0"));

    const [, message] = alert.mock.calls[0];
    expect(message).toContain("Environmental Health");
    expect(message).toMatch(/permanently|cannot be recovered/i);
    alert.mockRestore();
  });
});
