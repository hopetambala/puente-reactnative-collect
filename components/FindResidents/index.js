import React, { useState, useEffect } from 'react';

import { View, FlatList } from 'react-native';
import { Headline, Searchbar, Button } from 'react-native-paper';

import { Spinner } from 'native-base';

import { residentQuery } from '../../modules/cached-resources';

import { getData, storeData } from '../../modules/async-storage';
import I18n from '../../modules/i18n';

import ResidentCard from './Resident/ResidentCard';
import ResidentPage from './Resident/ResidentPage';

import styles from './index.styles';

const FindResidents = ({
  selectPerson, setSelectPerson, organization, puenteForms, navigateToNewRecord,
  surveyee, setSurveyee, setView
}) => {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState('');
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    setOffline(true);
    fetchAsyncData();
  }, [organization, offline]);

  const fetchAsyncData = () => {
    setLoading(true);
    getData('residentData').then((residentData) => {
      if (residentData) {
        let offlineData = [];
        getData('offlineIDForms').then((offlineResidentData) => {
          if (offlineResidentData !== null) {
            Object.entries(offlineResidentData).forEach(([key, value]) => { // eslint-disable-line
              offlineData = offlineData.concat(value.localObject);
            });
          }
          const allData = residentData.concat(offlineData);
          setData(allData || []);
          setResidents(allData.slice() || [].slice());
        });
      }
      setLoading(false);
    });
  };

  const fetchData = async () => {
    setLoading(true);
    const queryParams = {
      skip: 0,
      offset: 0,
      limit: 100000,
      parseColumn: 'surveyingOrganization',
      parseParam: organization,
    };

    const records = await residentQuery(queryParams);

    storeData(records, 'residentData');

    let offlineData = [];
    await getData('offlineIDForms').then((offlineResidentData) => {
      if (offlineResidentData !== null) {
        Object.entries(offlineResidentData).forEach(([key, value]) => { // eslint-disable-line
          offlineData = offlineData.concat(value.localObject);
        });
      }
    });
    const allData = records.concat(offlineData);
    setData(allData);
    setResidents(allData.slice());
    setLoading(false);
  };

  const filterList = () => data.filter(
    (listItem) => {
      const fname = listItem.fname || ' ';
      const lname = listItem.lname || ' ';
      const nickname = listItem.nickname || ' ';
      return fname.toLowerCase().includes(query.toLowerCase())
        || lname
          .toLowerCase()
          .includes(query.toLowerCase())
        || nickname
          .toLowerCase()
          .includes(query.toLowerCase());
    }
  );

  const onChangeSearch = (input) => {
    setResidents(data.slice());
    setQuery(input);
  };

  const onSelectPerson = (listItem) => {
    setSelectPerson(listItem);
    setQuery('');
  };

  const renderItem = ({ item }) => (
    <View key={item.objectId}>
      <ResidentCard
        resident={item}
        onSelectPerson={onSelectPerson}
      />
    </View>
  );

  return (
    <View>
      <View style={styles.container}>
        {!selectPerson && (
          <>
            <Headline style={styles.header}>{I18n.t('findResident.searchIndividual')}</Headline>
            <Searchbar
              placeholder={I18n.t('findResident.typeHere')}
              onChangeText={onChangeSearch}
              value={query}
            />
            <Button onPress={fetchData}>Refresh</Button>
          </>
        )}

        {/* Non-virtualized list */}
        {/* {!selectPerson && filterList(residents).map((listItem,) => (
        <View key={listItem.objectId}>
          <ResidentCard
            resident={listItem}
            onSelectPerson={onSelectPerson}
          />
        </View>
      ))} */}
        {loading
          && <Spinner color="blue" />}

        {!selectPerson
          && (
            <FlatList
              data={filterList(residents)}
              renderItem={renderItem}
              keyExtractor={(item) => item.objectId}
            />
          )}
      </View>

      {selectPerson && (
        <ResidentPage
          fname={selectPerson.fname}
          lname={selectPerson.lname}
          nickname={selectPerson.nickname}
          city={selectPerson.city}
          license={selectPerson.license}
          picture={selectPerson.picture}
          selectPerson={selectPerson}
          setSelectPerson={setSelectPerson}
          puenteForms={puenteForms}
          navigateToNewRecord={navigateToNewRecord}
          surveyee={surveyee}
          setSurveyee={setSurveyee}
          setView={setView}
        />
      )}
    </View>
  );
};

export default FindResidents;
