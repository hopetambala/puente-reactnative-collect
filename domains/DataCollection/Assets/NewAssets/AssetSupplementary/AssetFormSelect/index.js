import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';

import { assetFormsQuery } from '../../../../../../modules/cached-resources';
import { layout, theme } from '../../../../../../modules/theme';
import styles from './index.style';

const AssetFormSelect = ({ setSelectedForm, surveyingOrganization }) => {
  const [assetForms, setAssetForms] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    assetFormsQuery(surveyingOrganization).then((forms) => {
      setLoading(false);
      setAssetForms(forms);
    });
  }, []);

  const refreshAssetForms = async () => {
    setLoading(true);
    await assetFormsQuery(surveyingOrganization).then((forms) => {
      setAssetForms(forms);
      setLoading(false);
    });
  };

  const selectForm = (form) => {
    setSelectedForm(form);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.header}>Supplementary Asset Forms</Text>
        <IconButton
          style={{ bottom: 7 }}
          color={theme.colors.primary}
          size={20}
          icon="refresh"
          onPress={refreshAssetForms}
        />
      </View>
      {loading
        && <ActivityIndicator />}
      <ScrollView horizontal style={styles.componentContainer}>
        {assetForms && assetForms.map((form) => (
          <Card
            key={form.objectId}
            style={layout.cardSmallStyle}
            onPress={() => selectForm(form)}
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
      </ScrollView>
    </View>
  );
};

export default AssetFormSelect;
