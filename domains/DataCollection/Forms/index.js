import React, { useState } from 'react';
import { View, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, Button } from 'react-native-paper';

import { layout, theme } from '../../../modules/theme';
import I18n from '../../../modules/i18n';

import IdentificationForm from './IdentificationForm';
import SupplementaryForm from './SupplementaryForm';
import GdprCompliance from '../GdprCompliance';

import ResidentIdSearchbar from '../../../components/ResidentIdSearchbar';
import SmallCardsCarousel from '../../../components/Cards/SmallCardsCarousel';

import PostSubmissionSVG from '../../../assets/graphics/static/Submission-Page-Icon.svg';

const Forms = (props) => {
  const {
    navigation, navigateToGallery,
    selectedForm, setSelectedForm, navigateToNewRecord,
    scrollViewScroll, setScrollViewScroll,
    puenteForms,
    surveyingUser, surveyingOrganization,
    surveyee, setSurveyee,
    customForm, navigateToRoot
  } = props;

  const [consent, setConsent] = useState(false);

  return (
    <View style={layout.screenContainer}>
      {consent === true && selectedForm === 'id' && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <IdentificationForm
            navigation={navigation}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
            setSelectedForm={setSelectedForm}
            setSurveyee={setSurveyee}
            surveyingOrganization={surveyingOrganization}
            surveyingUser={surveyingUser}
          />
        </TouchableWithoutFeedback>
      )}
      {consent === true && selectedForm !== 'id' && selectedForm !== '' && (
        <View>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss()} accessible={false}>
            <View>
              <View style={layout.container}>
                <ResidentIdSearchbar
                  surveyee={surveyee}
                  setSurveyee={setSurveyee}
                  surveyingOrganization={surveyingOrganization}
                />
              </View>
              <SupplementaryForm
                navigation={navigation}
                selectedForm={selectedForm}
                setSelectedForm={setSelectedForm}
                surveyee={surveyee}
                surveyingUser={surveyingUser}
                surveyingOrganization={surveyingOrganization}
                customForm={customForm}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}
      {consent === false && (
        <GdprCompliance
          navigation={navigation}
          setConsent={setConsent}
        />
      )}
      {selectedForm === '' && (
        <View>
          <View style={{
            justifyContent: 'center',
            alignItems: 'center'
          }}
          >
            <PostSubmissionSVG width={350} height={350} />
            <Text style={{ color: theme.colors.primary, fontSize: 25, fontWeight: 'bold' }}>{I18n.t('forms.successfullySubmitted')}</Text>
            <Text style={{ fontSize: 15, marginTop: 10, marginBottom: 10 }}>{I18n.t('forms.grabCoffee')}</Text>
          </View>
          <View style={layout.container}>
            <Text style={{ fontSize: 15, marginBottom: 5 }}>{I18n.t('forms.suggestedForms')}</Text>
            <SmallCardsCarousel
              puenteForms={puenteForms}
              navigateToNewRecord={navigateToNewRecord}
              setUser={false}
            />
            <Button mode="contained" onPress={navigateToGallery}>
              <Text style={{ color: 'white' }}>{I18n.t('forms.viewGallery')}</Text>
            </Button>
            <Button mode="text" onPress={navigateToRoot} style={{ marginTop: 5 }}>
              <Text style={{ color: theme.colors.primary }}>{I18n.t('forms.returnHome')}</Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default Forms;
