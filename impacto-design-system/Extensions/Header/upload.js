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

  // Some records reached Parse and some did not. Clearing the whole queue
  // destroys the ones that did not — the device is their only copy — and
  // re-sending it whole duplicates the ones that did. So prune by the server's
  // `saved` map and leave the rest queued for a retry.
  if (status === "PartialFailure") {
    const failures = offlineRecords.failures || [];
    const saved = offlineRecords.uploadedForms?.saved;

    // Count what the server SAYS saved. Deriving it as (queued - failures)
    // assumes those are the same unit, and they are not: `count` comes from the
    // queue and a failure is one record the server refused.
    const savedCount = Object.values(saved || {}).reduce(
      (total, rows) => total + (Array.isArray(rows) ? rows.length : 0),
      0
    );

    setSubmission(savedCount);
    setIsSubmitting(false);
    try {
      await cleanupPostedOfflineForms(saved, failures);
    } finally {
      // Re-measure. The badge must match what is actually left in the queue
      // after pruning — zeroing it would tell the surveyor their queue is
      // empty while records are still in it.
      if (resetFormCount) {
        const remaining = getQueuedFormCount
          ? await getQueuedFormCount()
          : failures.length;
        resetFormCount(remaining);
      }
      if (storeLastSyncTimestamp) await storeLastSyncTimestamp();
    }
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
