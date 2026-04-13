/**
 * Edit Form Screen
 * Unified component for editing any form type (Identification, Vitals, etc.)
 * Handles edit mode for supplementary forms and identification
 * Part of edit forms feature
 */
import IdentificationForm from '@app/domains/DataCollection/Forms/IdentificationForm';
import SupplementaryForm from '@app/domains/DataCollection/Forms/SupplementaryForm';
import { getData } from '@modules/async-storage';
import I18n from '@modules/i18n';
import { createLayoutStyles } from '@modules/theme';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View,
} from 'react-native';
import { Button, useTheme } from 'react-native-paper';

function EditForm({ navigation, route }) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const [loading, setLoading] = useState(true);
  const [surveyingUser, setSurveyingUser] = useState('');
  const [surveyingOrganization, setSurveyingOrganization] = useState('');
  const {
    editMode, existingRecord, formType, resident,
  } = route.params || {};

  useEffect(() => {
    const setupData = async () => {
      try {
        const currentUser = await getData('currentUser');
        if (currentUser) {
          setSurveyingUser(
            `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim(),
          );
          setSurveyingOrganization(currentUser.organization || '');
        }
        setLoading(false);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading user data:', err);
        setLoading(false);
      }
    };

    setupData();
  }, []);

  if (!editMode || !existingRecord || !formType) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }} testID="error-view">
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Error
        </Text>
        <Text>Invalid edit parameters. Missing editMode, existingRecord, or formType.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          Go Back
        </Button>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} testID="loadingContainer">
        <ActivityIndicator size="large" color={theme.colors.primary} testID="loadingIndicator" />
      </View>
    );
  }

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Render appropriate form based on formType
  if (formType === 'SurveyData' || formType === 'Identification') {
    return (
      <View style={layout.screenContainer}>
        <KeyboardAvoidingView
          enabled
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView>
            <Button icon="arrow-left" onPress={handleGoBack} style={{ marginBottom: 10 }}>
              {I18n.t('dataCollection.back')}
            </Button>
            <Text style={{ fontSize: 18, fontWeight: 'bold', margin: 16 }}>
              Edit Identification
            </Text>
            <IdentificationForm
              editMode={editMode}
              existingRecord={existingRecord}
              navigation={navigation}
              surveyingOrganization={surveyingOrganization}
              surveyingUser={surveyingUser}
              setSelectedForm={() => {}}
              setSurveyee={() => {}}
              scrollViewScroll={false}
              setScrollViewScroll={() => {}}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Supplementary forms
  return (
    <View style={layout.screenContainer}>
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <Button icon="arrow-left" onPress={handleGoBack} style={{ marginBottom: 10 }}>
            {I18n.t('dataCollection.back')}
          </Button>
          <Text style={{ fontSize: 18, fontWeight: 'bold', margin: 16 }}>
            Edit
            {' '}
            {formType}
          </Text>
          <SupplementaryForm
            editMode={editMode}
            existingRecord={existingRecord}
            formType={formType}
            navigation={navigation}
            resident={resident}
            selectedForm={formType}
            setSelectedForm={() => {}}
            surveyee={resident}
            surveyingUser={surveyingUser}
            surveyingOrganization={surveyingOrganization}
            customForm={formType === 'FormResults' ? existingRecord : undefined}
            scrollViewScroll={false}
            setScrollViewScroll={() => {}}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default EditForm;
