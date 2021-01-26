import React from 'react';
import {
  View, StyleSheet
} from 'react-native';
import {
  Text,
} from 'react-native-paper';

import I18n from '../../../../../modules/i18n';

const Demographics = ({
  dob, community, province, city, license
}) => (
  <View style={styles.container}>
    <Text style={styles.topLabel}>
      {I18n.t('findResident.residentPage.demographics.dob')}
      {` ${dob}`}
    </Text>
    <Text style={styles.labels}>
      {I18n.t('findResident.residentPage.demographics.city')}
      {` ${city}`}
    </Text>
    <Text style={styles.labels}>
      {I18n.t('findResident.residentPage.demographics.community')}
      {` ${community}`}
    </Text>
    <Text style={styles.labels}>
      {I18n.t('findResident.residentPage.demographics.province')}
      {` ${province}`}
    </Text>
    <Text style={styles.labels}>
      {I18n.t('findResident.residentPage.demographics.license')}
      {` ${license}`}
    </Text>
  </View>
);
const styles = StyleSheet.create({
  container: {
    margin: 20
  },
  labels: {
    marginTop: 20,
    fontSize: 17,
    color: '#696969'
  },
  topLabel: {
    fontSize: 17,
    color: '#696969'
  }
});

export default Demographics;
