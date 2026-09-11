import { deleteData, getData, storeData } from "@modules/async-storage";

const HAS_SEEN_ONBOARDING_KEY = "hasSeenOnboarding";
const STARTING_PATTERN_KEY = "startingPattern";
const ONBOARDING_STEP_KEY = "onboardingStep";
const HAS_SEEN_COACHMARKS_KEY = "hasSeenCoachmarks"; // legacy global flag

// Per-screen coachmark keys: "home" | "collect" | "find" | "settings"
const coachmarkKey = (screen) => `hasSeenCoachmark_${screen}`;

const setHasSeenOnboarding = async (value = true) =>
  storeData(!!value, HAS_SEEN_ONBOARDING_KEY);

const getHasSeenOnboarding = async () =>
  getData(HAS_SEEN_ONBOARDING_KEY);

const setOnboardingStep = async (step) =>
  storeData(step, ONBOARDING_STEP_KEY);

const getOnboardingStep = async () =>
  getData(ONBOARDING_STEP_KEY);

const clearOnboardingStep = async () =>
  deleteData(ONBOARDING_STEP_KEY);

// Legacy global coachmark flag (kept for backward compat)
const setHasSeenCoachmarks = async () =>
  storeData(true, HAS_SEEN_COACHMARKS_KEY);

const getHasSeenCoachmarks = async () =>
  getData(HAS_SEEN_COACHMARKS_KEY);

/**
 * Per-screen coachmark — reads both the per-screen key and the legacy global flag.
 * If the user dismissed the old multi-step overlay, they won't see any per-screen tip.
 */
const getHasSeenCoachmark = async (screen) => {
  const global = await getData(HAS_SEEN_COACHMARKS_KEY);
  if (global) return true;
  return getData(coachmarkKey(screen));
};

const setHasSeenCoachmark = async (screen) =>
  storeData(true, coachmarkKey(screen));

const clearOnboardingData = async () => {
  await deleteData(HAS_SEEN_ONBOARDING_KEY);
  await deleteData(STARTING_PATTERN_KEY);
  await deleteData(ONBOARDING_STEP_KEY);
  await deleteData(HAS_SEEN_COACHMARKS_KEY);
  await deleteData(coachmarkKey("home"));
  await deleteData(coachmarkKey("collect"));
  await deleteData(coachmarkKey("find"));
  await deleteData(coachmarkKey("settings"));
};

const setStartingPattern = async (pattern) =>
  storeData(pattern, STARTING_PATTERN_KEY);

const getStartingPattern = async () =>
  getData(STARTING_PATTERN_KEY);

/**
 * How many residents Find Records keeps searchable.
 *
 * Settings -> Find Records has offered this control for a long time, but
 * nothing read the key it wrote: the real caps were hardcoded, and they
 * disagreed (parseSearch used 1000, residentQuery used 2000), so whichever
 * path last wrote `residentData` decided how much of the register a surveyor
 * could search offline. Every cache and search path now reads this.
 *
 * It is a CAP on a query, so a non-positive value would return nothing and
 * empty the cache of whoever mistyped it. Anything not a positive, finite
 * number folds back to the default rather than being trusted.
 */
const FIND_RECORDS_LIMIT_KEY = "findRecordsLimit";
const FIND_RECORDS_LIMIT_DEFAULT = 2000;

const isUsableLimit = (value) => {
  // Arrays and objects coerce to numbers in ways nobody means: Number([]) is 0
  // and Number(["5"]) is 5. Only numbers and numeric strings are considered.
  if (typeof value !== "number" && typeof value !== "string") return false;
  if (typeof value === "string" && value.trim() === "") return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const getFindRecordsLimit = async () => {
  // A read failure must not blank the cache — fall back, never throw.
  let stored;
  try {
    stored = await getData(FIND_RECORDS_LIMIT_KEY);
  } catch (error) {
    return FIND_RECORDS_LIMIT_DEFAULT;
  }
  // Older builds stored whatever string the keyboard produced.
  return isUsableLimit(stored) ? Number(stored) : FIND_RECORDS_LIMIT_DEFAULT;
};

const setFindRecordsLimit = async (value) => {
  if (!isUsableLimit(value)) {
    throw new Error(
      `findRecordsLimit must be a positive number, got ${JSON.stringify(value)}`
    );
  }
  return storeData(Number(value), FIND_RECORDS_LIMIT_KEY);
};

export {
  clearOnboardingData,
  clearOnboardingStep,
  FIND_RECORDS_LIMIT_DEFAULT,
  FIND_RECORDS_LIMIT_KEY,
  getFindRecordsLimit,
  getHasSeenCoachmark,
  getHasSeenCoachmarks,
  getHasSeenOnboarding,
  getOnboardingStep,
  getStartingPattern,
  setFindRecordsLimit,
  setHasSeenCoachmark,
  setHasSeenCoachmarks,
  setHasSeenOnboarding,
  setOnboardingStep,
  setStartingPattern,
};
