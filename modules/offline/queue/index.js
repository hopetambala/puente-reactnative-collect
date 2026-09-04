import { getData, storeData } from "@modules/async-storage";

// The four AsyncStorage keys that hold work which has not reached the server.
// Anything else — residentData above all — is a CACHE, and deleting it is a
// different, recoverable act. removeQueuedForm refuses keys outside this list
// so a caller cannot wipe the resident cache by passing the wrong string.
const QUEUE_KEYS = [
  "offlineIDForms",
  "offlineSupForms",
  "offlineAssetIDForms",
  "offlineAssetSupForms",
];

// parseClass is what the payload actually carries; puenteForms.* is what the
// gallery already calls these forms, so a queued record is named the same way
// the surveyor first met it. FormResults is deliberately absent: every custom
// form shares that class, so the class says nothing and the title carries it.
const FORM_NAME_BY_CLASS = {
  SurveyData: "puenteForms.ResidentID",
  HistoryEnvironmentalHealth: "puenteForms.EnvironmentalHealth",
  EvaluationMedical: "puenteForms.MedicalEvaluation",
  Vitals: "puenteForms.Vitals",
};

const personNameOf = (localObject) =>
  `${localObject?.fname ?? ""} ${localObject?.lname ?? ""}`.trim();

// Returns i18n KEYS rather than translated strings, so this stays pure and
// testable and the screen owns presentation.
const describeQueuedForms = (queues = {}) =>
  QUEUE_KEYS.flatMap((storageKey) =>
    (queues?.[storageKey] ?? []).map((record, index) => ({
      storageKey,
      index,
      formNameKey: FORM_NAME_BY_CLASS[record?.parseClass] ?? null,
      customTitle: record?.localObject?.title ?? null,
      personName: personNameOf(record?.localObject),
    }))
  );

/**
 * Drop one record from a queue.
 *
 * This is the only in-app escape from a wedged queue: the upload is
 * all-or-nothing, so a single record the server keeps refusing stops every
 * other queued form from ever syncing. It is destructive and unrecoverable —
 * callers must confirm first, naming what is being discarded.
 *
 * Re-reads the queue at call time rather than trusting an index captured at
 * render, and no-ops if that index no longer addresses a record.
 */
const removeQueuedForm = async (storageKey, index) => {
  if (!QUEUE_KEYS.includes(storageKey)) {
    throw new Error(`removeQueuedForm: ${storageKey} is not an offline queue`);
  }
  const queued = await getData(storageKey);
  if (!Array.isArray(queued) || index < 0 || index >= queued.length) return;
  await storeData(
    queued.filter((_, i) => i !== index),
    storageKey
  );
};

export { describeQueuedForms, QUEUE_KEYS, removeQueuedForm };
