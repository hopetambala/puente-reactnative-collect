import React from 'react';
import {
  View, StyleSheet
} from 'react-native';
import {
  Text, Title
} from 'react-native-paper';

import { theme } from '../../../../../modules/theme';
import ComingSoonSVG from '../../../../../assets/graphics/static/Adventurer.svg';
import SmallCardsCarousel from '../../../../Cards/SmallCardsCarousel';

import I18n from '../../../../../modules/i18n';

const Forms = ({
  puenteForms, navigateToNewRecord, surveyee, setView
}) => (
  <View style={styles.container}>
    <Title style={styles.title}>{I18n.t('findResident.residentPage.forms.completedForms')}</Title>
    <Text style={styles.category}>{I18n.t('findResident.residentPage.forms.formCategory')}</Text>
    <View
      style={styles.horizontalLine}
    />
    <ComingSoonSVG width={200} height={200} />
    <Text>{I18n.t('findResident.residentPage.forms.comingSoon')}</Text>
    <Title style={styles.title}>{I18n.t('findResident.residentPage.forms.suggestedForms')}</Title>
    <SmallCardsCarousel
      puenteForms={puenteForms}
      navigateToNewRecord={navigateToNewRecord}
      surveyee={surveyee}
      setView={setView}
      setUser
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    margin: 20
  },
  title: {
    fontWeight: 'bold',
    fontSize: 25,
  },
  category: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 10
  },
  horizontalLine: {
    borderBottomColor: theme.colors.primary,
    borderBottomWidth: 1,
  }
});

export default Forms;
