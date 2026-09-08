import { handleUpload } from "@impacto-design-system/Extensions/Header/upload";

describe("handleUpload", () => {
  it("should not cleanup offline forms when postOfflineForms returns { status: 'Offline' }", async () => {
    const postOfflineForms = jest.fn().mockResolvedValue({ status: "Offline" });
    const cleanupPostedOfflineForms = jest.fn();
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();

    await handleUpload({ postOfflineForms, cleanupPostedOfflineForms, setIsSubmitting, setSubmission });

    expect(cleanupPostedOfflineForms).not.toHaveBeenCalled();
  });

  it("should not cleanup offline forms when postOfflineForms returns { status: 'Error' }", async () => {
    // The queue is the only copy of un-synced field data; a failed upload
    // must leave it on-device for retry.
    const postOfflineForms = jest.fn().mockResolvedValue({ status: "Error" });
    const cleanupPostedOfflineForms = jest.fn();
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();

    await handleUpload({ postOfflineForms, cleanupPostedOfflineForms, setIsSubmitting, setSubmission });

    expect(cleanupPostedOfflineForms).not.toHaveBeenCalled();
    expect(setSubmission).toHaveBeenCalledWith(false);
  });

  it("should call resetFormCount(0) after successful upload", async () => {
    const postOfflineForms = jest.fn().mockResolvedValue({ status: "Success", offlineForms: {}, uploadedForms: {} });
    const cleanupPostedOfflineForms = jest.fn().mockResolvedValue();
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();
    const resetFormCount = jest.fn();

    await handleUpload({ postOfflineForms, cleanupPostedOfflineForms, setIsSubmitting, setSubmission, resetFormCount });

    expect(resetFormCount).toHaveBeenCalledWith(0);
  });

  it("should not call postOfflineForms when queue is empty", async () => {
    const postOfflineForms = jest.fn();
    const cleanupPostedOfflineForms = jest.fn();
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();
    const getQueuedFormCount = jest.fn().mockResolvedValue(0);

    await handleUpload({ postOfflineForms, cleanupPostedOfflineForms, setIsSubmitting, setSubmission, getQueuedFormCount });

    expect(postOfflineForms).not.toHaveBeenCalled();
  });

  it("should set submission to SessionExpired when postOfflineForms throws Parse 209", async () => {
    const err = new Error("Session expired");
    err.code = 209;
    const postOfflineForms = jest.fn().mockRejectedValue(err);
    const cleanupPostedOfflineForms = jest.fn();
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();

    await handleUpload({ postOfflineForms, cleanupPostedOfflineForms, setIsSubmitting, setSubmission });

    expect(setSubmission).toHaveBeenCalledWith("SessionExpired");
  });

  it("should store last sync timestamp after successful upload", async () => {
    const postOfflineForms = jest.fn().mockResolvedValue({
      status: "Success",
      offlineForms: {},
      uploadedForms: {},
    });
    const cleanupPostedOfflineForms = jest.fn().mockResolvedValue();
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();
    const storeLastSyncTimestamp = jest.fn().mockResolvedValue();

    await handleUpload({
      postOfflineForms,
      cleanupPostedOfflineForms,
      setIsSubmitting,
      setSubmission,
      storeLastSyncTimestamp,
    });

    expect(storeLastSyncTimestamp).toHaveBeenCalledTimes(1);
  });

  it("should call resetFormCount(0) even when cleanupPostedOfflineForms throws", async () => {
    const cleanupPostedOfflineForms = jest.fn().mockRejectedValue(new Error("delete failed"));
    const getQueuedFormCount = jest.fn().mockResolvedValue(2);
    const postOfflineForms = jest.fn().mockResolvedValue({ status: "Success", offlineForms: {}, uploadedForms: {} });
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();
    const resetFormCount = jest.fn();

    try {
      await handleUpload({ cleanupPostedOfflineForms, getQueuedFormCount, postOfflineForms, setIsSubmitting, setSubmission, resetFormCount });
    } catch (_) { /* expected: cleanup throws, we only care that resetFormCount ran */ }

    expect(resetFormCount).toHaveBeenCalledWith(0);
  });

  it("should store last sync timestamp even when cleanupPostedOfflineForms throws", async () => {
    const postOfflineForms = jest.fn().mockResolvedValue({ status: "Success", offlineForms: {}, uploadedForms: {} });
    const cleanupPostedOfflineForms = jest.fn().mockRejectedValue(new Error("delete failed"));
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();
    const storeLastSyncTimestamp = jest.fn().mockResolvedValue();

    await handleUpload({
      postOfflineForms,
      cleanupPostedOfflineForms,
      setIsSubmitting,
      setSubmission,
      storeLastSyncTimestamp,
    }).catch(() => {}); // expected: cleanup throws, timestamp must still be stored

    expect(storeLastSyncTimestamp).toHaveBeenCalledTimes(1);
  });

  it("should call resetFormCount(0) even when storeLastSyncTimestamp throws", async () => {
    const postOfflineForms = jest.fn().mockResolvedValue({ status: "Success", offlineForms: {}, uploadedForms: {} });
    const cleanupPostedOfflineForms = jest.fn().mockResolvedValue();
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();
    const storeLastSyncTimestamp = jest.fn().mockRejectedValue(new Error("timestamp store failed"));
    const resetFormCount = jest.fn();

    try {
      await handleUpload({ postOfflineForms, cleanupPostedOfflineForms, setIsSubmitting, setSubmission, storeLastSyncTimestamp, resetFormCount });
    } catch (_) { /* expected: storeLastSyncTimestamp throws, we only care that resetFormCount ran */ }

    expect(resetFormCount).toHaveBeenCalledWith(0);
  });

  it("should call setSubmission with the queued form count, not true, on successful upload", async () => {
    const getQueuedFormCount = jest.fn().mockResolvedValue(3);
    const postOfflineForms = jest.fn().mockResolvedValue({
      status: "Success",
      offlineForms: {},
      uploadedForms: {},
    });
    const cleanupPostedOfflineForms = jest.fn().mockResolvedValue();
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();
    const resetFormCount = jest.fn();

    await handleUpload({
      getQueuedFormCount,
      postOfflineForms,
      cleanupPostedOfflineForms,
      setIsSubmitting,
      setSubmission,
      resetFormCount,
    });

    expect(setSubmission).toHaveBeenCalledWith(3);
    expect(resetFormCount).toHaveBeenCalledWith(0);
  });

  // A partial sync is the dangerous case: some records reached Parse and some
  // did not. Clearing the whole queue destroys the ones that did not — they
  // exist nowhere else. Re-sending the whole queue duplicates the ones that
  // did. So the saved map must be passed through, and the badge must keep
  // showing what is still waiting.
  it("prunes only the saved records when the sync partially failed", async () => {
    const saved = {
      households: [{ objectIdOffline: "Household-1" }],
      residentForms: [{ objectIdOffline: "PatientID-1" }],
    };
    const failures = [
      { category: "households", offlineId: "Household-2", message: "refused" },
    ];
    const postOfflineForms = jest.fn().mockResolvedValue({
      status: "PartialFailure",
      offlineForms: {},
      uploadedForms: { status: "PartialFailure", saved },
      failures,
    });
    const cleanupPostedOfflineForms = jest.fn().mockResolvedValue();
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();
    const resetFormCount = jest.fn();
    // 3 queued before the sync, 1 left after pruning. Deliberately NOT
    // consistent with (queued - failures), so a subtraction would give 2 and
    // only counting the server's `saved` gives the right answer.
    const getQueuedFormCount = jest
      .fn()
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);

    await handleUpload({
      postOfflineForms,
      cleanupPostedOfflineForms,
      setIsSubmitting,
      setSubmission,
      getQueuedFormCount,
      resetFormCount,
    });

    // pruned selectively, and told which records failed so it can tell a
    // fully-drained category from a partially-drained one
    expect(cleanupPostedOfflineForms).toHaveBeenCalledWith(saved, failures);

    // counted from the server's `saved`, not derived by subtraction
    expect(setSubmission).toHaveBeenCalledWith(2);

    // re-measured after pruning, not assumed from failures.length
    expect(resetFormCount).toHaveBeenCalledWith(1);
    expect(setIsSubmitting).toHaveBeenLastCalledWith(false);
  });
});
