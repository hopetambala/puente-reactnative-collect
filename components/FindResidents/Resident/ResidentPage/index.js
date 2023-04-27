import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet, View
} from 'react-native';
import {
  Button,
  Text
} from 'react-native-paper';

import I18n from '../../../../modules/i18n';
import { theme } from '../../../../modules/theme';
import Demographics from './Demographics';
import Forms from './Forms';
import Household from './Housheold';

const ResidentPage = ({
  fname, lname, age, nickname, city, picture, selectPerson, setSelectPerson,
  puenteForms, navigateToNewRecord, setSurveyee, setView, scrollViewScroll, setScrollViewScroll,
  surveyingOrganization, edit, setEdit
}) => {
  const [pictureUrl, setPictureUrl] = useState();
  const [demographics, setDemographics] = useState(true);
  const [forms, setForms] = useState(false);
  const [household, setHousehold] = useState(false);

  useEffect(() => {
    const pic = picture;
    if (pic) {
      setPictureUrl({ uri: pic });
    }
  }, [selectPerson]);

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
      <Button
        icon="arrow-left"
        width={100}
        onPress={() => {
          setSelectPerson();
          setEdit(false);
        }}
      >
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

          { demographics && (
            <Button
              style={styles.button}
              contentStyle={styles.buttonContent}
              onPress={() => setEdit(!edit)}
            >
              {edit ? I18n.t('global.cancel') : I18n.t('findResident.residentPage.household.editProfile')}
            </Button>
          )}

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
            formId={selectPerson.objectId}
            dob={selectPerson.dob}
            city={city}
            community={selectPerson.communityname}
            province={selectPerson.province}
            license={selectPerson.license}
            selectPerson={selectPerson}
            setSelectPerson={setSelectPerson}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
            setView={setView}
            surveyingOrganization={surveyingOrganization}
            fname={fname}
            lname={lname}
            age={age}
            nickname={nickname}
            sex={selectPerson.sex}
            subcounty={selectPerson.subcounty}
            region={selectPerson.region}
            country={selectPerson.country}
            location={selectPerson.location}
            photo={picture}
            householdId={selectPerson.householdId}
            telephonenumber={selectPerson.telephoneNumber}
            marriagestatus={selectPerson.marriageStatus}
            occupation={selectPerson.occupation}
            educationLevel={selectPerson.educationLevel}
            edit={edit}
            setEdit={setEdit}
            selectedPerson={selectPerson}
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
    margin: 20
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
    width: 150,
    marginLeft: -20,
    marginBottom: -20
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
