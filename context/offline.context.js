import selectedENV from "@app/environment";
import client from "@app/services/parse/client";
import { getData, storeData } from "@modules/async-storage";
import { populateCache, residentQuery } from "@modules/cached-resources";
import { loadOrganizationScope } from "@modules/organization";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { UserContext } from "./auth.context";

export const OfflineContext = createContext();

export function OfflineContextProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [residents, setResidents] = useState(null);
  const { user } = useContext(UserContext);

  const residentOnlineData = useCallback(async () => {
    setIsLoading(true);
    try {
      // EVERY string this organization's records may carry, not just the one on
      // the account. Records hold what was COLLECTED, and one organization's
      // are spread across several: in production Rayjon has 185 rows under
      // "Rayjon" and 1196 under "Rayjon Eye Clinic". Cached, so it still
      // resolves offline; falls back to the account's own string.
      const parseParam = await loadOrganizationScope(
        user.organization,
        client(selectedENV.TEST_MODE)
      );

      const queryParams = {
        skip: 0,
        offset: 0,
        limit: 2000,
        parseColumn: "surveyingOrganization",
        parseParam,
      };
      const records = await residentQuery(queryParams);
      await storeData(records, "residentData");
      setResidents(records);
      return records;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const populateResidentDataCache = useCallback(
    async () => {
      const records = await residentOnlineData();
      await populateCache(user);
      return records;
    },
    [user, residentOnlineData]
  );

  // getData and setResidents are both stable references — empty dep array is intentional
  const residentOfflineData = useCallback(async () => {
    const data = await getData("residentData");
    const residentData = data || [];
    let offlineData = [];
    const offlineResidentData = await getData("offlineIDForms");
    if (offlineResidentData !== null) {
      Object.entries(offlineResidentData).forEach(([, valueOne]) => {
        offlineData = offlineData.concat(valueOne.localObject);
      });
    }
    const allData = residentData.concat(offlineData);
    setResidents(allData.slice());
    return allData.slice();
  }, []);

  const contextValue = useMemo(
    () => ({
      residents,
      isLoading,
      residentOfflineData,
      residentOnlineData,
      populateResidentDataCache,
    }),
    [residents, isLoading, residentOfflineData, residentOnlineData, populateResidentDataCache]
  );

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
}
