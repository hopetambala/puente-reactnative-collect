import React, { useState, useEffect } from 'react';

import {
  View
} from 'react-native';

import {
  Text, Button, Chip, Searchbar
} from 'react-native-paper';

import { residentIDQuery } from '../../services/parse/crud';

const ResidentIdSearchbar = ({ selectPerson, setSelectPerson }) => {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState('');
  const [residents, setResidents] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const queryParams = {
      skip: 0,
      offset: 0,
      limit: 10000,
      parseColumn: 'surveyingOrganization',
      parseParam: 'Test',
    };
    let records = await residentIDQuery(queryParams);
    records = JSON.parse(JSON.stringify(records));

    setData(records);
    setResidents(records.slice());
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

  return (
    <View>
      <Text>Search Individual</Text>
      <Searchbar
        placeholder="Type Here..."
        onChangeText={onChangeSearch}
        value={query}
      />

      {query !== '' && filterList(residents).map((listItem,) => (
        <View key={listItem.objectId}>
          <Button onPress={() => onSelectPerson(listItem)}>{listItem.fname}</Button>
        </View>
      ))}

      {selectPerson && (
        <Chip icon="information">
          {selectPerson.fname}
          {selectPerson.lname}
        </Chip>
      )}
    </View>
  );
};

export default ResidentIdSearchbar;