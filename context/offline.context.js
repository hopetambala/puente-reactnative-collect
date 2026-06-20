import { getData, storeData } from "@modules/async-storage";
import { populateCache, residentQuery } from "@modules/cached-resources";
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
      const queryParams = {
        skip: 0,
        offset: 0,
        limit: 2000,
        parseColumn: "surveyingOrganization",
        parseParam: user.organization,
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
    async () =>
      residentOnlineData().then((records) => {
        populateCache(user);
        return records;
      }),
    [user, residentOnlineData]
  );

  // getData and setResidents are both stable references — empty dep array is intentional
  const residentOfflineData = useCallback(
    () =>
      getData("residentData").then(async (data) => {
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
      }),
    []
  );

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
