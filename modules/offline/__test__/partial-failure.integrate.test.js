/**
 * What happens to the queue when ONE record in a batch cannot be saved?
 *
 * Runs against the mock Cloud Code ported from production Back4App release
 * v120 (`GHA d860f22`), verified byte-identical to master on 2026-09-04.
 *
 * The failure is induced with a Parse schema type conflict — a field saved
 * first as a Number, then sent as a String. That is not a contrived error: it
 * is one of the few ways a single record gets refused by the server while its
 * neighbours are fine, which is the shape the offline queue keeps wedging on.
 *
 * Both tests describe the behaviour we WANT. They currently fail, and the
 * failure is the evidence.
 */
import hooks from "@app/test/hooks";
import { deleteData, getData, storeData } from "@modules/async-storage";
import { postHousehold, postSupplementaryForm } from "@modules/cached-resources";
import { cleanupPostedOfflineForms, postOfflineForms } from "@modules/offline/post";
import { Parse } from "parse/react-native";

import checkOnlineStatus from "..";
import { createOfflineUserMockData } from "./utils";

hooks();

jest.mock("..", () => jest.fn());

// A refused record stays queued BY DESIGN, so without clearing between tests
// each one inherits the previous test's failures and the counts are cumulative.
beforeEach(async () => {
  await Promise.all([
    "offlineIDForms",
    "offlineSupForms",
    "offlineAssetIDForms",
    "offlineAssetSupForms",
    "offlineHouseholds",
  ].map((key) => deleteData(key)));
});

/** Pin a field's type in the Parse schema so a later conflicting write fails. */
const pinSchemaType = async (className, field, value) => {
  const obj = new Parse.Object(className);
  obj.set(field, value);
  obj.set("schemaPin", true);
  await obj.save(null, { useMasterKey: true });
};

describe("one unsaveable record in a batch", () => {
  it("must not report Success when a household failed to save", async () => {
    const marker = `partial-hh-${Date.now()}`;
    await pinSchemaType("Household", "latitude", 12.34);

    checkOnlineStatus.mockResolvedValue(false);
    await createOfflineUserMockData();

    // one good, one that the server will refuse (latitude as a String)
    await postHousehold({
      parseClass: "Household",
      localObject: { latitude: 18.5, longitude: -69.9, householdId: marker },
    });
    await postHousehold({
      parseClass: "Household",
      localObject: { latitude: "not-a-number", longitude: -69.9, householdId: marker },
    });

    checkOnlineStatus.mockResolvedValue(true);
    const { status } = await postOfflineForms();

    const savedInParse = await new Parse.Query("Household")
      .equalTo("householdId", marker)
      .count({ useMasterKey: true });

    // Only one of the two reached Parse — so the sync did NOT fully succeed…
    expect(savedInParse).toBe(1);

    // …and the client must not be told otherwise, because "Success" is what
    // makes it delete the queue. Deleting it here destroys a household record
    // that exists nowhere else: the phone was the only copy.
    expect(status).not.toBe("Success");
  }, 30000);

  it("keeps the queue when a supplementary form failed to save", async () => {
    const marker = `partial-sup-${Date.now()}`;
    await pinSchemaType("FormResults", "fields", [{ title: "t", answer: "a" }]);

    checkOnlineStatus.mockResolvedValue(false);
    const user = await createOfflineUserMockData();

    await postSupplementaryForm({
      parseClass: "FormResults",
      parseParentClass: "SurveyData",
      parseParentClassID: "PatientID-nonexistent",
      parseUser: user.objectId,
      localObject: { title: marker, fields: "a string, not an array" },
    });

    checkOnlineStatus.mockResolvedValue(true);
    const { status } = await postOfflineForms();

    // Nothing saved, so the queue must survive for a retry…
    const queue = await getData("offlineSupForms");
    expect(queue).not.toBeNull();

    // …and it must not be reported as a success, which is what would make the
    // client delete it. Cloud Code reports any refused record as
    // "PartialFailure"; whether ANY record saved is the client's to derive from
    // the `saved` map, which is empty here.
    expect(status).not.toBe("Success");
    expect(["Error", "PartialFailure"]).toContain(status);
  }, 30000);
});

describe("pruning the queue after a partial failure", () => {
  it("deletes only the records that saved and keeps the ones that did not", async () => {
    const marker = `prune-${Date.now()}`;
    await pinSchemaType("Household", "latitude", 12.34);

    checkOnlineStatus.mockResolvedValue(false);
    await createOfflineUserMockData();

    await postHousehold({
      parseClass: "Household",
      localObject: { latitude: 18.5, householdId: `${marker}-ok` },
    });
    await postHousehold({
      parseClass: "Household",
      localObject: { latitude: "not-a-number", householdId: `${marker}-bad` },
    });

    checkOnlineStatus.mockResolvedValue(true);
    const result = await postOfflineForms();

    // The client is told plainly that this was partial, not just "Error" —
    // "Error" would imply nothing saved and invite a full re-send, which is
    // what creates duplicates.
    expect(result.status).toBe("PartialFailure");
    expect(result.failures).toHaveLength(1);

    await cleanupPostedOfflineForms(result.uploadedForms.saved);

    // The saved one is gone from the queue; the refused one survives for a
    // retry. Deleting both loses field data; deleting neither re-sends a
    // record that already saved.
    const queue = await getData("offlineHouseholds");
    expect(queue).toHaveLength(1);
    expect(queue[0].localObject.householdId).toBe(`${marker}-bad`);
  }, 30000);
});

describe("a queue entry written before the local-id stamp existed", () => {
  it("is still drained when its whole category saved", async () => {
    // Entries queued by an older build carry no `localObject.objectId`, so
    // there is nothing for an id-only prune to match. Left in place they would
    // survive every sync and be re-sent forever — a duplicate each time.
    const marker = `legacy-${Date.now()}`;
    await pinSchemaType("FormResults", "fields", [{ title: "t", answer: "a" }]);

    checkOnlineStatus.mockResolvedValue(false);
    const user = await createOfflineUserMockData();

    await storeData(
      [{ parseClass: "Household", localObject: { latitude: 18.5, householdId: marker } }],
      "offlineHouseholds"
    );

    // something in ANOTHER category fails, so the sync is partial overall
    await postSupplementaryForm({
      parseClass: "FormResults",
      parseParentClass: "SurveyData",
      parseParentClassID: "PatientID-nonexistent",
      parseUser: user.objectId,
      localObject: { title: marker, fields: "a string, not an array" },
    });

    checkOnlineStatus.mockResolvedValue(true);
    const result = await postOfflineForms();
    expect(result.status).toBe("PartialFailure");

    await cleanupPostedOfflineForms(result.uploadedForms.saved, result.failures);

    // households had no failures and the server confirmed as many as were
    // queued, so the whole queue goes despite the missing id
    expect(await getData("offlineHouseholds")).toBeNull();

    // the category that actually failed keeps its record
    const supQueue = await getData("offlineSupForms");
    expect(supQueue).toHaveLength(1);
  }, 30000);
});
