import React, { useState, useEffect } from 'react';
import { View, FlatList, Text } from 'react-native';
import { Headline, Button, Searchbar } from 'react-native-paper';
import { Spinner } from 'native-base';

import { residentQuery } from '../../modules/cached-resources';

import { getData } from '../../modules/async-storage';
import I18n from '../../modules/i18n';

import ResidentCard from '../FindResidents/Resident/ResidentCard';

import styles from './index.styles';

const ResidentIdSearchbar = ({ surveyee, setSurveyee, surveyingOrganization }) => {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState('');
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAsyncData();
  }, [surveyingOrganization]);

  const fetchAsyncData = () => {
    setLoading(true);
    getData('residentData').then((residentData) => {
      if (residentData) {
        let offlineData = [];
        getData('offlineIDForms').then((offlineResidentData) => {
          if (offlineResidentData !== null) {
            Object.entries(offlineResidentData).forEach(([key, value]) => { //eslint-disable-line
              offlineData = offlineData.concat(value.localObject);
            });
          }
          const allData = residentData.concat(offlineData);
          // console.log(allData)
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
      parseParam: surveyingOrganization,
    };
    const records = await residentQuery(queryParams);
    let offlineData = [];
    await getData('offlineIDForms').then((offlineResidentData) => {
      if (offlineResidentData !== null) {
        Object.entries(offlineResidentData).forEach(([key, value]) => { //eslint-disable-line
          offlineData = offlineData.concat(value.localObject);
        });
      }
    });
    // console.log(allData)
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

  const onSelectSurveyee = (listItem) => {
    // console.log(listItem)
    setSurveyee(listItem);
    setQuery('');
  };

  const renderItem = ({ item }) => (
    <View>
      <Button onPress={() => onSelectSurveyee(item)} contentStyle={{ marginRight: 5 }}>
        <Text style={{ marginRight: 10 }}>{`${item?.fname} ${item?.lname}`}</Text>
        {/* offline IDform */}
        {item.objectId.includes('PatientID-') && (
          <View style={{
            backgroundColor: '#f8380e',
            width: 1,
            height: 10,
            paddingLeft: 10,
            marginTop: 'auto',
            marginBottom: 'auto',
            borderRadius: 20
          }}
          />
        )}
      </Button>
    </View>
  );

  return (
    <View>
      <Headline style={styles.header}>{I18n.t('residentIdSearchbar.searchIndividual')}</Headline>
      <Searchbar
        placeholder="Type Here..."
        onChangeText={onChangeSearch}
        value={query}
      />
      <Button onPress={fetchData}>Refresh</Button>
      {loading
        && <Spinner color="blue" />}

      {/* {query !== '' && filterList(residents).map((listItem,) => (
        <View key={listItem.objectId}>
          <Button onPress={() => onSelectSurveyee(listItem)}>
          {listItem.fname || listItem.lname}
          </Button>
        </View>
      ))} */}

      {query !== '' && (
        <FlatList
          data={filterList(residents)}
          renderItem={renderItem}
          keyExtractor={(item) => item.objectId}
        />
      )}

      {surveyee && surveyee.objectId && (
        <ResidentCard resident={surveyee} />
      )}
    </View>
  );
};

export default ResidentIdSearchbar;
