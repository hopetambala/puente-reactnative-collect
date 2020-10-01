// import * as React from 'react';
import React, { useState } from 'react';
import {
  Text, ScrollView, View
} from 'react-native';

import {
  Button
} from 'react-native-paper';

import { layout } from '../../modules/theme';

import Header from '../../components/Header';

import Forms from './Forms';

import ResidentIdSearchbar from '../../components/ResidentIdSearchbar'

const DataCollection = ({ navigation }) => {
  const [scrollViewScroll, setScrollViewScroll] = useState();
  const [showForms, setShowForms] = React.useState(false);
  const [findForms, setFindForms] = React.useState(false);
  const [selectPerson, setSelectPerson] = useState();

  return (
    <View
      style={layout.screenContainer}
      onStartShouldSetResponderCapture={() => {
        setScrollViewScroll(true);
      }}
    >
      <Header />

      <ScrollView keyboardShouldPersistTaps="always" scrollEnabled={scrollViewScroll}>
        {!showForms && !findForms
          && (
            <View>
              <Text style={layout.line} onPress={() => setShowForms(true)}>New Record</Text>
              <Text style={layout.line} onPress={() => setFindForms(true)}>Find Record</Text>
              <Text style={layout.line}>New Asset</Text>
              <Text style={layout.line}>Find Asset</Text>
            </View>
          )}
        {showForms
          && (
            <View>
              <Button onPress={() => setShowForms(false)}>Back to Data Collection Screen</Button>
              <Forms
                style={layout.line}
                navigation={navigation}
                scrollViewScroll={scrollViewScroll}
                setScrollViewScroll={setScrollViewScroll}
              />
            </View>
          )}
        {findForms
          && (
            <View>
              <ResidentIdSearchbar
                selectPerson={selectPerson}
                setSelectPerson={setSelectPerson}
              />
            </View>
          )
        }
      </ScrollView>
    </View>
  );
};

export default DataCollection;
