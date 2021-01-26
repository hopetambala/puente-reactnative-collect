import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, Image
} from 'react-native';
import {
  Text, Button
} from 'react-native-paper';

import Demographics from './Demographics';
import Forms from './Forms';
import Household from './Housheold';
import { theme } from '../../../../modules/theme';

import I18n from '../../../../modules/i18n';

const ResidentPage = ({
  fname, lname, nickname, city, picture, selectPerson, setSelectPerson,
  puenteForms, navigateToNewRecord, setSurveyee, setView
}) => {
  const [pictureUrl, setPictureUrl] = useState();
  const [demographics, setDemographics] = useState(true);
  const [forms, setForms] = useState(false);
  const [household, setHousehold] = useState(false);

  useEffect(() => {
    const pic = picture;
    if (pic) {
      setPictureUrl({ uri: pic.url });
    }
  }, []);

  const showDemographics = () => {
    setForms(false);
    setHousehold(false);
    setDemographics(true);
  };

  const showForms = () => {
    setHousehold(false);
    setDemographics(false);
    setForms(true);
  };

  const showHousehold = () => {
    setForms(false);
    setDemographics(false);
    setHousehold(true);
  };
  return (
    <View>
      <Button icon="arrow-left" width={100} onPress={() => setSelectPerson()}>
        {I18n.t('dataCollection.back')}
      </Button>
      <View style={styles.picNameContainer}>
        <Image
          style={styles.profPic}
          source={pictureUrl}
        />
        <View style={{ margin: 7 }}>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { fontWeight: 'bold' }]}>{`${fname} ${lname}`}</Text>
          </View>
          <Text style={styles.name}>{`"${nickname}"`}</Text>

          {/* <Button
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {I18n.t('findResident.residentPage.household.editProfile')}
          </Button> */}
        </View>
      </View>
      <View
        style={styles.horizontalLine}
      />
      <View style={styles.navigationButtonsContainer}>
        <Button style={styles.navigationButton} labelStyle={styles.navigationButtonText} onPress={() => showDemographics()}>{I18n.t('findResident.residentPage.household.demographics')}</Button>
        <Button style={styles.navigationButton} labelStyle={styles.navigationButtonText} onPress={() => showForms(true)}>{I18n.t('findResident.residentPage.household.forms')}</Button>
        <Button
          style={styles.navigationButton}
          labelStyle={styles.navigationButtonText}
          onPress={() => showHousehold(true)}
        >
          {I18n.t('findResident.residentPage.household.household')}
        </Button>
      </View>
      <View
        style={styles.horizontalLine}
      />
      {
        demographics && (
          <Demographics
            dob={selectPerson.dob}
            city={city}
            community={selectPerson.communityname}
            province={selectPerson.province}
            license={selectPerson.license}
            selectPerson={selectPerson}
          />
        )
      }
      {
        forms && (
          <Forms
            puenteForms={puenteForms}
            navigateToNewRecord={navigateToNewRecord}
            surveyee={selectPerson}
            setSurveyee={setSurveyee}
            setView={setView}
          />
        )
      }
      {
        household && (
          <Household />
        )
      }
      <Button onPress={() => setSelectPerson()}>{I18n.t('findResident.residentPage.household.goBack')}</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  profPic: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#D0D0D0'
  },
  picNameContainer: {
    flexDirection: 'row',
    margin: 14
  },
  nameContainer: {
    flexDirection: 'row',
  },
  name: {
    color: '#696969',
    flexShrink: 1,
    marginVertical: 7,
  },
  button: {
    width: 120,
    marginLeft: -5
  },
  buttonContent: {
    marginLeft: 0
  },
  horizontalLine: {
    borderBottomColor: theme.colors.primary,
    borderBottomWidth: 1,
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  navigationButton: {
    flex: 1,
  },
  navigationButtonText: {
    fontWeight: 'bold'
  }
});

export default ResidentPage;
