import React from 'react';
import {
  View, StyleSheet, ScrollView
} from 'react-native';
import {
  Card, Text
} from 'react-native-paper';

import I18n from '../../../modules/i18n';
import { theme } from '../../../modules/theme';

import NewRecordSVG from '../../../assets/icons/New-Record-icon.svg';
import EnvSVG from '../../../assets/icons/Home-icon.svg';
import MedEvalSVG from '../../../assets/icons/Heart-Icon.svg';

/**
 * Carousel of Forms that are used for Form Navigation
 *
 * @name SmallCardsCarousel
 * @example
 * <SmallCardsCarousel
 *
 * />
 *
 * @param {Array} puenteForms Array of Forms to navigate through
 * @param {Function} navigateToNewRecord Function to navigate to a new form
 * @param {Function} setView Function to set view of the Data Collection Screen
 * @param {Object} surveyee Object for current surveyee (i.e. community resident)
 * @param {Boolean} setUser Boolean that if true, saves the surveyees object in the higher state
 *
 * @returns
 */

const SmallCardsCarousel = ({
  puenteForms, navigateToNewRecord, setView, surveyee, setUser
}) => (
  <ScrollView horizontal>
    {puenteForms.map((form) => (
      <Card
        key={form.tag}
        style={styles.cardSmallStyle}
        onPress={() => {
          if (setUser) {
            setView('Forms');
            navigateToNewRecord(form.tag, surveyee);
          } else {
            navigateToNewRecord(form.tag);
          }
        }}
      >
        {form.tag === 'id' && (
        <View style={styles.cardContainer}>
          <NewRecordSVG height={40} style={styles.svg} />
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              {I18n.t('cards.smallCards.residentID')}
            </Text>
          </View>
        </View>
        )}

        {form.tag === 'env' && (
        <View style={styles.cardContainer}>
          <EnvSVG height={40} style={styles.svg} />
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              {`${I18n.t('cards.smallCards.environmental')} ${I18n.t('cards.smallCards.history')}`}
            </Text>
          </View>
        </View>
        )}
        {form.tag === 'med-eval' && (
        <View style={styles.cardContainer}>
          <MedEvalSVG height={40} style={styles.svg} />
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              {`${I18n.t('cards.smallCards.medical')} ${I18n.t('cards.smallCards.evaluation')}`}
            </Text>
          </View>
        </View>
        )}
        {form.tag === 'vitals' && (
        <View style={styles.cardContainer}>
          <NewRecordSVG height={40} style={styles.svg} />
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              {I18n.t('cards.smallCards.vitals')}
            </Text>
          </View>
        </View>
        )}
      </Card>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  cardSmallStyle: {
    height: 110,
    width: 150,
    marginHorizontal: 7,
    marginVertical: 7,
  },
  svg: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  cardContainer: {
    alignItems: 'center',
    marginHorizontal: 14,
    marginVertical: 14,
  },
  textContainer: {
    flexDirection: 'row'
  },
  text: {
    flexShrink: 1,
    textAlign: 'center',
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginVertical: 7,
  }
});

export default SmallCardsCarousel;
