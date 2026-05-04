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

export {
  clearOnboardingData,
  clearOnboardingStep,
  getHasSeenCoachmark,
  getHasSeenCoachmarks,
  getHasSeenOnboarding,
  getOnboardingStep,
  getStartingPattern,
  setHasSeenCoachmark,
  setHasSeenCoachmarks,
  setHasSeenOnboarding,
  setOnboardingStep,
  setStartingPattern,
};
