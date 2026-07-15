export async function handleUpload({
  postOfflineForms,
  cleanupPostedOfflineForms,
  setIsSubmitting,
  setSubmission,
  getQueuedFormCount,
  storeLastSyncTimestamp,
  resetFormCount,
}) {
  let count = 0;
  if (getQueuedFormCount) {
    count = await getQueuedFormCount();
    if (count === 0) return;
  }

  const failWith = (reason = false) => {
    setIsSubmitting(false);
    setSubmission(reason);
  };

  setIsSubmitting(true);

  let offlineRecords;
  try {
    offlineRecords = await postOfflineForms();
  } catch (error) {
    failWith(error.code === 209 ? "SessionExpired" : false);
    return;
  }

  if (!offlineRecords || typeof offlineRecords !== "object") {
    failWith();
    return;
  }

  const { status } = offlineRecords;
  if (status === "Error" || status === "Offline") {
    failWith();
    return;
  }

  setSubmission(count);
  setIsSubmitting(false);
  try {
    await cleanupPostedOfflineForms();
  } finally {
    if (resetFormCount) resetFormCount(0);
    if (storeLastSyncTimestamp) await storeLastSyncTimestamp();
  }
}
