import { handleUpload } from "../upload";

describe("handleUpload", () => {
  it("should not cleanup offline forms when postOfflineForms returns No Internet Access", async () => {
    const postOfflineForms = jest.fn().mockResolvedValue("No Internet Access");
    const cleanupPostedOfflineForms = jest.fn();
    const setIsSubmitting = jest.fn();
    const setSubmission = jest.fn();

    await handleUpload({ postOfflineForms, cleanupPostedOfflineForms, setIsSubmitting, setSubmission });

    expect(cleanupPostedOfflineForms).not.toHaveBeenCalled();
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
});
