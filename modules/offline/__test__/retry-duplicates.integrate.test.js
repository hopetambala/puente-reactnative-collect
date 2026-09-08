/**
 * Does a retried sync duplicate health records?
 *
 * A partially-failed sync leaves the WHOLE batch queued on the device — that is
 * deliberate, so nothing is lost — which means the next Retry re-sends records
 * that already saved. Cloud Code is supposed to recognise those and return the
 * existing record instead of creating a second one.
 *
 * This runs the real retry path against the mock Cloud Code, which was ported
 * from production Back4App release v120 (`GHA d860f22`) on 2026-09-04 and
 * verified byte-identical to master — so what happens here is what happens on
 * the server, not what the old invented mock pretended.
 *
 * Residents carry a `PatientID-` local id, which Cloud Code converts to
 * `objectIdOffline` and dedupes on. Supplementary forms — vitals, environmental
 * health, medical evaluations — carry no local id at all, because the client
 * change that stamped one was reverted in 60f01be.
 */
import hooks from "@app/test/hooks";
import {
  postIdentificationForm,
  postSupplementaryForm,
} from "@modules/cached-resources";
import { postOfflineForms } from "@modules/offline/post";
import { Parse } from "parse/react-native";

import checkOnlineStatus from "..";
import { createOfflineUserMockData } from "./utils";

hooks();

jest.mock("..", () => jest.fn());

describe("a retried sync after a partial failure", () => {
  it("does not create a second copy of a record that already saved", async () => {
    const marker = `retry-proof-${Date.now()}`;

    // ── collected in the field, no signal ────────────────────────────────
    checkOnlineStatus.mockResolvedValue(false);
    const user = await createOfflineUserMockData();

    const resident = await postIdentificationForm({
      parseClass: "SurveyData",
      parseUser: user.objectId,
      localObject: { fname: marker, lname: "Proof" },
    });

    await postSupplementaryForm({
      parseClass: "FormResults",
      parseParentClass: "SurveyData",
      parseParentClassID: resident.objectId,
      parseUser: user.objectId,
      localObject: {
        title: marker,
        description: "vitals collected offline",
        fields: [{ title: "heartRate", answer: "70" }],
      },
    });

    // ── back in signal: first sync ───────────────────────────────────────
    checkOnlineStatus.mockResolvedValue(true);
    await postOfflineForms();

    // ── the retry ────────────────────────────────────────────────────────
    // NO cleanup between the two calls. That is the whole point: a partial
    // failure returns status Error, the client keeps the queue in full, and
    // the surveyor presses Retry — re-sending records that already saved.
    await postOfflineForms();

    const residentCopies = await new Parse.Query("SurveyData")
      .equalTo("fname", marker)
      .count({ useMasterKey: true });

    const supplementaryCopies = await new Parse.Query("FormResults")
      .equalTo("title", marker)
      .count({ useMasterKey: true });

    // Residents are protected: PatientID- becomes objectIdOffline, and Cloud
    // Code returns the existing record rather than creating another.
    expect(residentCopies).toBe(1);

    // Supplementary forms have no idempotency key, so this is the duplicate
    // health record. One more on every further retry.
    expect(supplementaryCopies).toBe(1);
  }, 30000);
});
