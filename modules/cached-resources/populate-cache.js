import { storeData } from "@modules/async-storage";
import Constants from "expo-constants";

import {
  assetDataQuery,
  assetFormsQuery,
  cacheAutofillData,
  customFormsQuery,
} from "./read";

export const storeAppVersion = async () => {
  const appVersion = Constants.expoConfig.version;
  return await storeData(appVersion, "appVersion");
};

const populateCache = async (user) => {
  const enteredUsrOrg = user.organization;

  return Promise.all([
    cacheAutofillData(enteredUsrOrg),
    customFormsQuery(enteredUsrOrg),
    storeAppVersion(),
    assetDataQuery(enteredUsrOrg).then(() => assetFormsQuery(enteredUsrOrg)),
  ]);
};

export default populateCache;
