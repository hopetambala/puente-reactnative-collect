import { Formik } from 'formik';
import _, { isEmpty } from 'lodash';
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  View
} from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import surveyingUserFailsafe from '../../../../../domains/DataCollection/Forms/utils';
import { getData } from '../../../../../modules/async-storage';
import I18n from '../../../../../modules/i18n';
import { updateObject } from '../../../../../services/parse/crud';
import PaperButton from '../../../../Button';
import PaperInputPicker from '../../../../FormikFields/PaperInputPicker';
import configArray from './config/config';

const Demographics = ({
  surveyingOrganization, dob, city, community, province,
  scrollViewScroll, setScrollViewScroll, age, fname, lname,
  nickname, sex, telephonenumber, marriagestatus, occupation,
  educationLevel, subcounty, region, country, location,
  photo, householdId, surveyingUser, setSelectPerson,
  formId, edit, setEdit, selectedPerson, setView
}) => {
  const [inputs, setInputs] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setInputs(configArray.fields);
  }, [setInputs, configArray, selectedPerson]);

  return (
    <View style={styles.container}>
      { edit && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Formik
            initialValues={{
              communityname: community,
              city,
              province,
              dob,
              age,
              fname,
              lname,
              nickname,
              sex,
              subcounty,
              region,
              country,
              location,
              photoFile: photo,
              householdId,
              telephoneNumber: telephonenumber,
              marriageStatus: marriagestatus,
              occupation,
              educationLevel
            }}
            onSubmit={async (values,) => {
              setSubmitting(true);
              const formObject = values;
              const user = await getData('currentUser');
              formObject.surveyingOrganization = surveyingOrganization || user.organization;
              formObject.surveyingUser = await surveyingUserFailsafe(user, surveyingUser, isEmpty);
              formObject.appVersion = await getData('appVersion') || '';
              formObject.phoneOS = Platform.OS || '';

              formObject.latitude = values.location?.latitude || 0;
              formObject.longitude = values.location?.longitude || 0;
              formObject.altitude = values.location?.altitude || 0;

              formObject.dob = values.dob;

              formObject.searchIndex = [
                values.fname,
                values.lname,
                values.nickname,
                values.communityname
              ]
                .filter((result) => result)
                .map((result) => result.toLowerCase().trim());

              formObject.fullTextSearchIndex = formObject.searchIndex.join(' ');

              const submitAction = () => {
                setTimeout(() => {
                  // setSelectedForm('');
                  setSubmitting(false);
                }, 1000);
              };
              const postParams = {
                parseClass: 'SurveyData',
                parseClassID: formId,
                localObject: formObject
              };

              updateObject(postParams).then(() => {
                submitAction();
              }, () => {
                setSubmitting(false);
              });

              setSelectPerson(values);
              setEdit(false);
            }}
            // only validate on submit, errors persist after fixing
            validateOnBlur={false}
            validateOnChange={false}
          >
            {(formikProps) => (
              <View>
                {inputs.length !== 0 && inputs.map((result) => (
                  <View key={result.formikKey}>
                    <PaperInputPicker
                      data={result}
                      formikProps={formikProps}
                      surveyingOrganization={surveyingOrganization}
                      scrollViewScroll={scrollViewScroll}
                      setScrollViewScroll={setScrollViewScroll}
                      customForm={false}
                    />
                  </View>
                ))}
                {submitting ? (
                  <ActivityIndicator />
                ) : (
                  <PaperButton
                    onPress={formikProps.handleSubmit}
                    buttonText={_.isEmpty(formikProps.values) ? I18n.t('global.emptyForm') : I18n.t('demographics.updateForm')}
                    icon={_.isEmpty(formikProps.values) ? 'alert-octagon' : 'plus'}
                    style={{ backgroundColor: _.isEmpty(formikProps.values) ? 'red' : 'green' }}
                  />
                )}
              </View>
            )}

          </Formik>
        </TouchableWithoutFeedback>
      )}
      { !edit && (
        <View style={styles.container}>
          <Text style={styles.topLabel}>
            {I18n.t('findResident.residentPage.demographics.dob')}
          </Text>
          <Text style={styles.values}>
            {` ${dob}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.age')}
          </Text>
          <Text style={styles.values}>
            {` ${age}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.sex')}
          </Text>
          <Text style={styles.values}>
            {` ${sex}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.telephone')}
          </Text>
          <Text style={styles.values}>
            {` ${telephonenumber}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.marriageStatus')}
          </Text>
          <Text style={styles.values}>
            {` ${marriagestatus}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.occupation')}
          </Text>
          <Text style={styles.values}>
            {` ${occupation}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.educationLevel')}
          </Text>
          <Text style={styles.values}>
            {` ${educationLevel}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.community')}
          </Text>
          <Text style={styles.values}>
            {` ${community}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.subcounty')}
          </Text>
          <Text style={styles.values}>
            {` ${subcounty}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.city')}
          </Text>
          <Text style={styles.values}>
            {` ${city}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.province')}
          </Text>
          <Text style={styles.values}>
            {` ${province}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.region')}
          </Text>
          <Text style={styles.values}>
            {` ${region}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.country')}
          </Text>
          <Text style={styles.values}>
            {` ${country}`}
          </Text>
          <Text style={styles.labels}>
            {I18n.t('findResident.residentPage.demographics.location')}
          </Text>
          <Text style={styles.values}>
            {location && `${location.latitude}, ${location.longitude}`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20
  },
  labels: {
    marginTop: 20,
    fontSize: 17,
    color: '#696969',
    fontWeight: 'bold',
    textAlign: 'center',
    textDecorationLine: 'underline'
  },
  topLabel: {
    fontSize: 17,
    color: '#696969',
    fontWeight: 'bold',
    textAlign: 'center',
    textDecorationLine: 'underline'
  },
  values: {
    fontSize: 17,
    textAlign: 'center'
  }
});

export default Demographics;
