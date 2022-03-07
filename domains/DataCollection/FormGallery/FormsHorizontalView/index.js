import React from 'react';
import {
  ScrollView,
  View,
} from 'react-native';
import {
  Card, Text,
} from 'react-native-paper';

import I18n from '../../../../modules/i18n';
import { layout } from '../../../../modules/theme';
import styles from '../index.styles';

const FormsHorizontalView = ({
  forms, header, navigateToCustomForm, pinForm
}) => (
  <View key={header} style={layout.screenRow}>
    {header && (
    <View style={{ flexDirection: 'row' }}>
      <Text style={styles.mediumHeader}>{header}</Text>
    </View>
    )}
    <ScrollView horizontal>
      {forms.map((form) => (
        <Card
          key={form.objectId}
          style={layout.cardSmallStyle}
          onPress={() => {
            navigateToCustomForm(form);
          }}
          onLongPress={() => pinForm(form)}
        >
          <View style={styles.cardContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.text}>
                {form.name}
              </Text>
            </View>
          </View>
        </Card>
      ))}
      {forms?.length < 1 && (
        <View style={layout.screenRow}>
          <Card>
            <Card.Title title={I18n.t('formsGallery.noCustomForms')} />
            {/* To be used when marketplace is available */}
            {/* <Card.Content>
                <Text>{I18n.t('formsGallery.checkOutMarketplace')}</Text>
                <Button>{I18n.t('formsGallery.viewMarketplace')}</Button>
            </Card.Content> */}
          </Card>
        </View>
      )}
    </ScrollView>
  </View>
);

export default FormsHorizontalView;
