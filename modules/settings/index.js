import { deleteData, getData, storeData } from "@modules/async-storage";

const HAS_SEEN_ONBOARDING_KEY = "hasSeenOnboarding";
const STARTING_PATTERN_KEY = "startingPattern";
const ONBOARDING_STEP_KEY = "onboardingStep";
const HAS_SEEN_COACHMARKS_KEY = "hasSeenCoachmarks";

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

const setHasSeenCoachmarks = async () =>
  storeData(true, HAS_SEEN_COACHMARKS_KEY);

const getHasSeenCoachmarks = async () =>
  getData(HAS_SEEN_COACHMARKS_KEY);

const clearOnboardingData = async () => {
  await deleteData(HAS_SEEN_ONBOARDING_KEY);
  await deleteData(STARTING_PATTERN_KEY);
  await deleteData(ONBOARDING_STEP_KEY);
  await deleteData(HAS_SEEN_COACHMARKS_KEY);
};

const setStartingPattern = async (pattern) =>
  storeData(pattern, STARTING_PATTERN_KEY);

const getStartingPattern = async () =>
  getData(STARTING_PATTERN_KEY);

export {
  clearOnboardingData,
  clearOnboardingStep,
  getHasSeenCoachmarks,
  getHasSeenOnboarding,
  getOnboardingStep,
  getStartingPattern,
  setHasSeenCoachmarks,
  setHasSeenOnboarding,
  setOnboardingStep,
  setStartingPattern,
};
