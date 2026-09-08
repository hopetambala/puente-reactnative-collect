import {
  describeQueuedForms,
  removeQueuedForm,
} from "@modules/offline/queue";

jest.mock("@modules/async-storage", () => ({
  getData: jest.fn(),
  storeData: jest.fn().mockResolvedValue(undefined),
}));

const { getData, storeData } = require("@modules/async-storage");

const idForm = (fname, lname) => ({
  parseClass: "SurveyData",
  localObject: { fname, lname, objectId: `PatientID-${fname}` },
  isOfflineLocal: true,
});

const supForm = (parseClass, extra = {}) => ({
  parseClass,
  parseParentClassID: "abc123",
  localObject: { ...extra },
});

describe("describeQueuedForms", () => {
  // The Offline Sync screen could only say HOW MANY forms were queued. When one
  // record is rejected by the server the whole batch stops syncing, and a
  // surveyor had no way to see what was stuck, let alone act on it.
  it("returns one entry per queued record, addressable by key and index", () => {
    const entries = describeQueuedForms({
      offlineIDForms: [idForm("Link", "Test")],
      offlineSupForms: [supForm("Vitals"), supForm("Vitals")],
    });

    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({ storageKey: "offlineIDForms", index: 0 });
    expect(entries[2]).toMatchObject({ storageKey: "offlineSupForms", index: 1 });
  });

  it("names an identification record after the resident it describes", () => {
    const [entry] = describeQueuedForms({
      offlineIDForms: [idForm("Link", "Test")],
    });

    expect(entry.formNameKey).toBe("puenteForms.ResidentID");
    expect(entry.personName).toBe("Link Test");
  });

  it("maps a supplementary parse class to its form name", () => {
    const entries = describeQueuedForms({
      offlineSupForms: [
        supForm("HistoryEnvironmentalHealth"),
        supForm("EvaluationMedical"),
        supForm("Vitals"),
      ],
    });

    expect(entries.map((e) => e.formNameKey)).toEqual([
      "puenteForms.EnvironmentalHealth",
      "puenteForms.MedicalEvaluation",
      "puenteForms.Vitals",
    ]);
  });

  // A custom form is FormResults for every one of them, so the class name says
  // nothing. The title the surveyor actually chose is in the payload.
  it("uses the custom form's own title when the class cannot distinguish it", () => {
    const [entry] = describeQueuedForms({
      offlineSupForms: [supForm("FormResults", { title: "Water Access Survey" })],
    });

    expect(entry.customTitle).toBe("Water Access Survey");
  });

  it("survives a queue key that is absent or null", () => {
    expect(describeQueuedForms({ offlineIDForms: null })).toEqual([]);
    expect(describeQueuedForms({})).toEqual([]);
  });
});

describe("removeQueuedForm", () => {
  beforeEach(() => jest.clearAllMocks());

  // Discarding is the only way to unblock a queue the server keeps refusing.
  // It must take exactly one record with it.
  it("removes only the named record and leaves the rest queued", async () => {
    const keep1 = supForm("Vitals", { note: "keep1" });
    const drop = supForm("Vitals", { note: "drop" });
    const keep2 = supForm("Vitals", { note: "keep2" });
    getData.mockResolvedValue([keep1, drop, keep2]);

    await removeQueuedForm("offlineSupForms", 1);

    expect(storeData).toHaveBeenCalledWith([keep1, keep2], "offlineSupForms");
  });

  it("does nothing when the index is out of range", async () => {
    getData.mockResolvedValue([supForm("Vitals")]);

    await removeQueuedForm("offlineSupForms", 7);

    expect(storeData).not.toHaveBeenCalled();
  });

  // Refuses a key that is not a queue, so a caller cannot delete the resident
  // cache by passing the wrong string.
  it("refuses a storage key that is not an offline queue", async () => {
    await expect(removeQueuedForm("residentData", 0)).rejects.toThrow();
    expect(storeData).not.toHaveBeenCalled();
  });
});
