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
    } catch (_) {}

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

    await handleUpload({
      getQueuedFormCount,
      postOfflineForms,
      cleanupPostedOfflineForms,
      setIsSubmitting,
      setSubmission,
    });

    expect(setSubmission).toHaveBeenCalledWith(3);
  });
});
