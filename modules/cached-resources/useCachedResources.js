import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { storeData, getData } from '../async-storage';
import { residentIDQuery } from '../../services/parse/crud';

const fetchResidentData = async (surveyingOrganization) => {
  const queryParams = {
    skip: 0,
    offset: 0,
    limit: 100000,
    parseColumn: 'surveyingOrganization',
    parseParam: surveyingOrganization,
  };
  let records = await residentIDQuery(queryParams);
  records = JSON.parse(JSON.stringify(records));
  return records;
};

export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = React.useState(false);

  // Load any resources or data that we need prior to rendering the app
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

        await getData('organization').then(async (org) => {
          if (org) {
            const residentData = await fetchResidentData(org);
            storeData(residentData || [], 'residentData');
          }
        });
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        // console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoadingComplete;
}
