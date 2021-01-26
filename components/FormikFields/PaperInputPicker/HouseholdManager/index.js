import React, { useState } from 'react';
import {
  View, Modal
} from 'react-native';
import {
  Button, RadioButton, Appbar, Text, TextInput
} from 'react-native-paper';

import ResidentIdSearchbar from '../../../ResidentIdSearchbar';

import { theme, layout } from '../../../../modules/theme';
import I18n from '../../../../modules/i18n';

import {
  postHousehold,
  postHouseholdWithRelation
} from '../../../../modules/cached-resources';

import styles from './index.style';

const HouseholdManager = (props) => {
  const {
    formikProps, formikKey, surveyingOrganization, values
  } = props;
  const {
    setFieldValue, handleBlur, handleChange, errors
  } = formikProps;
  const [relationships] = useState([
    'Parent', 'Sibling', 'Grand-Parent', 'Cousin', 'Other'
  ]);
  const [relationship, setRelationship] = useState('');
  const [selectPerson, setSelectPerson] = useState();
  // const [, setHouseholdRelationship] = useState();
  const [modalView, setModalView] = useState('unset');
  const [householdSet, setHouseholdSet] = useState(false);

  const onSubmit = () => {
    if (!selectPerson) {
      alert('You must search and select an individual.') //eslint-disable-line
    } else if (relationship === '') {
      alert('You must select a role/relationship in the household.') //eslint-disable-line
    } else {
      setModalView('third');
      attachToExistingHousehold();
      postHouseholdRelation();
    }
  };

  const attachToExistingHousehold = () => {
    // set householdId (from selectPerson) on the residentIdForm
    setFieldValue(formikKey, selectPerson.householdId || 'No Household Id Found');
  };

  const postHouseholdRelation = () => {
    let finalRelationship = relationship;
    if (relationship === 'Other') {
      finalRelationship += `__${values.other}`;
    }
    const postParams = {
      parseParentClassID: selectPerson.householdId,
      parseParentClass: 'Household',
      parseClass: 'Household',
      localObject: {
        relationship: finalRelationship,
        latitude: 0,
        longitude: 0
      }
    };
    postHouseholdWithRelation(postParams).then((id) => {
      setFieldValue(formikKey, id);
    });
  };

  const createNewHousehold = () => {
    // create new householdId and attach on the residentIdForm
    const postParams = {
      parseClass: 'Household',
      localObject: {
        latitude: 0,
        longitude: 0
      }
    };
    postHousehold(postParams).then((id) => {
      setFieldValue(formikKey, id);
    });
    setHouseholdSet(true);
  };

  return (
    <View style={layout.formContainer}>
      {modalView !== 'second' && modalView !== 'third'
        && (
          <View>
            {!householdSet && modalView !== 'zero' && (
              <RadioButton.Group
                onValueChange={(value) => { setModalView(value); }}
                value={modalView}
              >
                <RadioButton.Item label={I18n.t('householdManager.doNothing')} value="zero" />
                <RadioButton.Item label={I18n.t('householdManager.createHousehold')} value="first" />
                {modalView === 'first'
                  && <Button style={layout.buttonGroupButtonStyle} icon="plus" mode="contained" onPress={createNewHousehold}>{I18n.t('householdManager.household')}</Button>}
                <RadioButton.Item label={I18n.t('householdManager.linkIndividual')} value="second" />
              </RadioButton.Group>
            )}
            {householdSet && modalView === 'first'
              && <Text>{I18n.t('householdManager.successCreateHousehold')}</Text>}
            {modalView === 'zero' && (
              <View>
                <Text>{I18n.t('householdManager.noHousehold')}</Text>
                <Button style={{ marginTop: 10 }} onPress={() => setModalView('')}>{I18n.t('householdManager.addCreateHousehold')}</Button>
              </View>
            )}
          </View>
        )}

      {modalView === 'second' && (
        <Modal
          animationType="slide"
          visible
        >
          <Appbar.Header style={{ backgroundColor: theme.colors.accent }}>
            <Appbar.BackAction onPress={() => setModalView('first')} />
            <Appbar.Content title={I18n.t('householdManager.householdManager')} subtitle="" titleStyle={{ fontSize: 20, fontWeight: 'bold' }} />
          </Appbar.Header>

          <View style={styles.container}>
            <ResidentIdSearchbar
              surveyee={selectPerson}
              setSurveyee={setSelectPerson}
              surveyingOrganization={surveyingOrganization}
            />
            {!selectPerson && (
              <Text style={{ fontWeight: 'bold', padding: 10 }}>{I18n.t('householdManager.useSearchBar')}</Text>
            )}
            {selectPerson && (
              <Text>{I18n.t('householdManager.relationshipHousehold')}</Text>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {selectPerson && relationships.map((result) => (
                <View key={result} style={layout.buttonGroupButtonStyle}>
                  {relationship === result ? (
                    <Button mode="contained">{result}</Button>
                  ) : (
                    <Button mode="outlined" onPress={() => setRelationship(result)}>{result}</Button>
                  )}
                </View>
              ))}
            </View>
            {relationship === 'Other' && (
              <View style={styles}>
                <TextInput
                  label="Other"
                  onChangeText={handleChange('other')}
                  onBlur={handleBlur('other')}
                  mode="outlined"
                  theme={{ colors: { placeholder: theme.colors.primary }, text: 'black' }}
                />
                <Text style={{ color: 'red' }}>
                  {errors.other}
                </Text>
              </View>
            )}
            {selectPerson ? (
              <Button style={{ marginTop: 10 }} theme={{ backgroundColor: theme.colors.primary }} mode="contained" onPress={onSubmit}>
                {I18n.t('global.submit')}
              </Button>
            ) : (
              <Button theme={{ backgroundColor: theme.colors.primary }} mode="contained" onPress={onSubmit} disabled>
                {I18n.t('global.submit')}
              </Button>
            )}

          </View>
        </Modal>
      )}
      {modalView === 'third' && (
        <View>
          <RadioButton.Group onValueChange={(value) => setModalView(value)} value={modalView}>
            <RadioButton.Item label={I18n.t('householdManager.linked')} value="third" />
          </RadioButton.Group>
        </View>
      )}
    </View>
  );
};

export default HouseholdManager;
