export async function handleUpload({
  postOfflineForms,
  cleanupPostedOfflineForms,
  setIsSubmitting,
  setSubmission,
  getQueuedFormCount,
  storeLastSyncTimestamp,
}) {
  if (getQueuedFormCount) {
    const count = await getQueuedFormCount();
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
  if (status === "Error") {
    failWith();
    return;
  }

  setSubmission(true);
  setIsSubmitting(false);
  await cleanupPostedOfflineForms();
  if (storeLastSyncTimestamp) await storeLastSyncTimestamp();
}
