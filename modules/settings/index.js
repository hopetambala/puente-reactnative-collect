import { deleteData, getData, storeData } from "@modules/async-storage";

const HAS_SEEN_ONBOARDING_KEY = "hasSeenOnboarding";
const STARTING_PATTERN_KEY = "startingPattern";

const setHasSeenOnboarding = async (value = true) =>
  storeData(!!value, HAS_SEEN_ONBOARDING_KEY);

const getHasSeenOnboarding = async () =>
  getData(HAS_SEEN_ONBOARDING_KEY);

const clearOnboardingData = async () => {
  await deleteData(HAS_SEEN_ONBOARDING_KEY);
  await deleteData(STARTING_PATTERN_KEY);
};

const setStartingPattern = async (pattern) =>
  storeData(pattern, STARTING_PATTERN_KEY);

const getStartingPattern = async () =>
  getData(STARTING_PATTERN_KEY);

export {
  clearOnboardingData,
  getHasSeenOnboarding,
  getStartingPattern,
  setHasSeenOnboarding,
  setStartingPattern,
};
