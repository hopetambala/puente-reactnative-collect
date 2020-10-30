// import * as React from 'react';
import React, { useState, useEffect } from 'react';
import {
  Text, ScrollView, View, KeyboardAvoidingView, Platform
} from 'react-native';

import {
  Button, Card
} from 'react-native-paper';

import Forms from './Forms';
import FormGallery from './FormGallery';

import Header from '../../components/Header';
import MapView from '../../components/MapView';
import FindResidents from '../../components/FindResidents';

import { deleteData, getData } from '../../modules/async-storage';
import { layout } from '../../modules/theme';

import { customQueryService } from '../../services/parse/crud';
import { retrieveSignOutFunction } from '../../services/parse/auth';

import ComingSoonSVG from '../../assets/graphics/static/Adventurer.svg';
import FindRecordSVG from '../../assets/graphics/static/Find-Record-Icon.svg';
import NewRecordSVG from '../../assets/icons/New-Record-icon.svg';

import styles from './index.styles';

import I18n from '../../modules/i18n';

const puenteForms = [
  { tag: 'id', name: 'Resident ID' },
  { tag: 'env', name: 'Environmental Health' },
  { tag: 'med-eval', name: 'Medical Evaluation' }
];

const DataCollection = ({ navigation }) => {
  const [scrollViewScroll, setScrollViewScroll] = useState();
  const [view, setView] = useState('Root');
  const [selectedForm, setSelectedForm] = useState('id');

  const [customForms, setCustomForms] = useState([]);
  const [customForm, setCustomForm] = useState();

  const [selectPerson, setSelectPerson] = useState();
  const [surveyee, setSurveyee] = useState({});

  const [surveyingOrganization, setSurveyingOrganization] = useState('');
  const [surveyingUser, setSurveyingUser] = useState();

  useEffect(() => {
    getData('currentUser').then((user) => {
      setSurveyingUser(`${user.firstname || ''} ${user.lastname || ''}`);
    }).catch(() => {
      setSurveyingUser(`${''} ${''}`);
    });

    getData('organization').then((org) => {
      setSurveyingOrganization(org || surveyingOrganization);
    }).catch(() => {
      setSurveyingOrganization(surveyingOrganization || '');
    });
    customQueryService(0, 5000, 'FormSpecificationsV2', 'organizations', surveyingOrganization).then((forms) => {
      setCustomForms(JSON.parse(JSON.stringify(forms)));
    });
  }, [surveyingUser, surveyingOrganization]);

  const navigateToRoot = async () => {
    setView('Root');
  };

  const navigateToNewRecord = async (formTag, surveyeePerson) => {
    await getData('organization').then((org) => {
      setSurveyingOrganization(org || surveyingOrganization || '');
      setView('Forms');
      setSurveyee(surveyeePerson || surveyee);
      setSelectedForm(formTag || 'id');
    });
  };

  const navigateToCustomForm = async (form, surveyeePerson) => {
    await getData('organization').then((org) => {
      setSurveyingOrganization(org || surveyingOrganization || '');
      setView('Forms');
      setSurveyee(surveyeePerson || surveyee);
      setSelectedForm('custom');
      setCustomForm(form || '');
    });
  };

  const navigateToGallery = async () => {
    await getData('organization').then((org) => {
      setSurveyingOrganization(org || surveyingOrganization || '');
      setView('Gallery');
    });
  };

  const navigateToFindRecords = async () => {
    await getData('organization').then((org) => {
      setSurveyingOrganization(org || surveyingOrganization || '');
      setView('Find Records');
    });
  };

  const logOut = () => {
    retrieveSignOutFunction().then(() => {
      deleteData('credentials');
      deleteData('pincode');
      deleteData('organization');
      deleteData('currentUser');
      navigation.navigate('Sign In');
    });
  };

  return (
    <View
      style={layout.screenContainer}
      onStartShouldSetResponderCapture={() => {
        setScrollViewScroll(true);
      }}
    >
      <Header
        logOut={logOut}
      />
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="always" scrollEnabled={scrollViewScroll}>
          {view === 'Root'
            && (
              <View>
                {Platform.OS === 'ios'
                  && <MapView organization={surveyingOrganization} />}
                <View style={styles.screenFlexRowWrap}>
                  <View style={styles.cardContainer}>
                    <Card style={styles.cardSmallStyle} onPress={() => navigateToNewRecord()}>
                      <NewRecordSVG height={70} style={styles.svg} />
                      <Button marginTop="auto">{I18n.t('dataCollection.newRecord')}</Button>
                    </Card>
                    <Card style={styles.cardSmallStyle} onPress={navigateToFindRecords}>
                      <FindRecordSVG height={65} style={styles.svg} />
                      <Button marginTop="auto">{I18n.t('dataCollection.findRecord')}</Button>
                    </Card>
                  </View>
                  <Card style={styles.cardSmallStyle} onPress={navigateToGallery}>
                    <ComingSoonSVG height={65} style={styles.svg} />
                    <Button marginTop="auto">{I18n.t('dataCollection.viewAll')}</Button>
                  </Card>
                </View>
              </View>
            )}
          {view === 'Forms'
            && (
              <View>
                <Button icon="arrow-left" width={100} onPress={navigateToRoot}>
                  <Text>{I18n.t('dataCollection.back')}</Text>
                </Button>
                <Forms
                  style={layout.line}
                  navigation={navigation}
                  scrollViewScroll={scrollViewScroll}
                  setScrollViewScroll={setScrollViewScroll}
                  navigateToGallery={navigateToGallery}
                  navigateToNewRecord={navigateToNewRecord}
                  selectedForm={selectedForm}
                  setSelectedForm={setSelectedForm}
                  puenteForms={puenteForms}
                  surveyingUser={surveyingUser}
                  surveyingOrganization={surveyingOrganization}
                  surveyee={surveyee}
                  setSurveyee={setSurveyee}
                  customForm={customForm}
                />
              </View>
            )}
          {view === 'Gallery' && (
            <View>
              <Button icon="arrow-left" width={100} onPress={navigateToRoot}>
                <Text>{I18n.t('dataCollection.back')}</Text>
              </Button>
              <FormGallery
                navigation={navigation}
                navigateToNewRecord={navigateToNewRecord}
                navigateToCustomForm={navigateToCustomForm}
                puenteForms={puenteForms}
                customForms={customForms}
              />
            </View>
          )}
          {view === 'Find Records'
            && (
              <View>
                <Button icon="arrow-left" width={100} onPress={navigateToRoot}>
                  <Text>{I18n.t('dataCollection.back')}</Text>
                </Button>
                <FindResidents
                  selectPerson={selectPerson}
                  setSelectPerson={setSelectPerson}
                  organization={surveyingOrganization}
                  puenteForms={puenteForms}
                  navigateToNewRecord={navigateToNewRecord}
                  surveyee={surveyee}
                  setSurveyee={setSurveyee}
                  setView={setView}
                />
              </View>
            )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default DataCollection;
