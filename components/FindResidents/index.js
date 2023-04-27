import { Spinner } from 'native-base';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import {
  Button, Headline, Searchbar
} from 'react-native-paper';

import { OfflineContext } from '../../context/offline.context';
import { getData } from '../../modules/async-storage';
import I18n from '../../modules/i18n';
import checkOnlineStatus from '../../modules/offline';
import parseSearch from './_utils';
import styles from './index.styles';
import ResidentCard from './Resident/ResidentCard';
import ResidentPage from './Resident/ResidentPage';

const FindResidents = ({
  selectPerson, setSelectPerson, organization, puenteForms, navigateToNewRecord,
  surveyee, setSurveyee, setView, scrollViewScroll, setScrollViewScroll
}) => {
  const [query, setQuery] = useState('');
  const [residentsData, setResidentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const { residentOfflineData } = useContext(OfflineContext);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    checkOnlineStatus().then(async (connected) => {
      if (connected) fetchData(true, '');
      if (!connected) fetchData(false, '');
    });
  }, [organization, selectPerson]);

  const fetchOfflineData = () => {
    setOnline(false);
    return residentOfflineData().then((residents) => {
      setResidentsData(residents);
      setLoading(false);
    });
  };

  const fetchOnlineData = async (qry) => {
    setOnline(true);

    const records = await parseSearch(organization, qry);

    let offlineData = [];

    await getData('offlineIDForms').then((offlineResidentData) => {
      if (offlineResidentData !== null) {
        Object.entries(offlineResidentData).forEach(([key, value]) => { //eslint-disable-line
          offlineData = offlineData.concat(value.localObject);
        });
      }
    });

    const allData = records.concat(offlineData);
    setResidentsData(allData.slice());
    setLoading(false);
  };

  const fetchData = (onLine, qry) => {
    if (!onLine) fetchOfflineData();
    if (onLine) fetchOnlineData(qry);
  };

  const filterOfflineList = () => residentsData.filter(
    (listItem) => {
      const fname = listItem.fname || ' ';
      const lname = listItem.lname || ' ';
      const nickname = listItem.nickname || ' ';
      return fname.toLowerCase().includes(query.toLowerCase())
        || lname
          .toLowerCase()
          .includes(query.toLowerCase())
        || `${fname} ${lname}`
          .toLowerCase()
          .includes(query.toLowerCase())
        || nickname
          .toLowerCase()
          .includes(query.toLowerCase());
    }
  );

  const onChangeSearch = (input) => {
    setLoading(true);

    if (input === '') setLoading(false);

    clearTimeout(searchTimeout);

    setQuery(input);

    setSearchTimeout(setTimeout(() => {
      fetchData(online, input);
    }, 1000));
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
          </>
        )}

        {!online
          && <Button onPress={() => fetchData(false, '')}>{I18n.t('global.refresh')}</Button>}
        {loading
          && <Spinner color="blue" />}

        {!selectPerson
          && (
            <FlatList
              data={online ? residentsData : filterOfflineList(residentsData)}
              renderItem={renderItem}
              keyExtractor={(item) => item.objectId}
            />
          )}
      </View>

      {selectPerson && (
        <ResidentPage
          fname={selectPerson.fname}
          lname={selectPerson.lname}
          age={selectPerson.age}
          nickname={selectPerson.nickname}
          city={selectPerson.city}
          license={selectPerson.license}
          picture={selectPerson.picture ? selectPerson.picture.url : ''}
          selectPerson={selectPerson}
          setSelectPerson={setSelectPerson}
          puenteForms={puenteForms}
          navigateToNewRecord={navigateToNewRecord}
          surveyee={surveyee}
          setSurveyee={setSurveyee}
          setView={setView}
          scrollViewScroll={scrollViewScroll}
          setScrollViewScroll={setScrollViewScroll}
          surveyingOrganization={organization}
          edit={edit}
          setEdit={setEdit}
          fetchData={fetchData}
        />
      )}
    </View>
  );
};

export default FindResidents;
