/**
 * Edit Form Screen
 * Unified component for editing any form type (Identification, Vitals, etc.)
 * Handles edit mode for supplementary forms and identification
 * Part of edit forms feature
 */
import IdentificationForm from '@app/domains/DataCollection/Forms/IdentificationForm';
import SupplementaryForm from '@app/domains/DataCollection/Forms/SupplementaryForm';
import client from '@app/services/parse/client';
import { getData } from '@modules/async-storage';
import I18n from '@modules/i18n';
import { createLayoutStyles } from '@modules/theme';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text,
} from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

function EditForm({ navigation, route }) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const [loading, setLoading] = useState(true);
  const [surveyingUser, setSurveyingUser] = useState('');
  const [surveyingOrganization, setSurveyingOrganization] = useState('');
  const [formSpecifications, setFormSpecifications] = useState(null);
  const {
    editMode, existingRecord, formType, resident,
  } = route.params || {};
  
  const Parse = client(false);

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
        
        // For FormResults, fetch the FormSpecifications to get the real field definitions
        if (formType === 'FormResults' && existingRecord?.formSpecificationsId) {
          try {
            const Model = Parse.Object.extend('FormSpecificationsV2');
            const query = new Parse.Query(Model);
            query.equalTo('objectId', existingRecord.formSpecificationsId);
            const specs = await query.first();
            if (specs) {
              setFormSpecifications(specs.toJSON ? specs.toJSON() : specs);
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error fetching FormSpecifications:', err);
          }
        }
        
        setLoading(false);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading user data:', err);
        setLoading(false);
      }
    };

    setupData();
  }, [formType, existingRecord?.formSpecificationsId, Parse]);

  if (!editMode || !existingRecord || !formType) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }} testID="error-view">
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          {I18n.t('global.error')}
        </Text>
        <Text>{I18n.t('findRecordSettings.invalidParams')}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          {I18n.t('global.back')}
        </Button>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} testID="loadingContainer">
        <ActivityIndicator size="large" color={theme.colors.primary} testID="loadingIndicator" />
      </SafeAreaView>
    );
  }

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Map Parse class name to the short form key expected by SupplementaryForm
  const formTypeToSelectedForm = {
    Vitals: 'vitals',
    HistoryEnvironmentalHealth: 'env',
    EvaluationMedical: 'med-eval',
    FormResults: 'custom',
  };
  const mappedForm = formTypeToSelectedForm[formType] || formType;

  // Map Parse class name to translated display label
  const formTypeToI18nKey = {
    Vitals: 'residentHistory.vitals',
    HistoryEnvironmentalHealth: 'residentHistory.environmentalHealth',
    EvaluationMedical: 'residentHistory.medicalEvaluation',
    FormResults: 'residentHistory.customForms',
  };
  const formTypeLabel = formTypeToI18nKey[formType]
    ? I18n.t(formTypeToI18nKey[formType])
    : formType;

  // Render appropriate form based on formType
  if (formType === 'SurveyData' || formType === 'Identification') {
    return (
      <SafeAreaView edges={['top']} style={layout.screenContainer}>
        <KeyboardAvoidingView
          enabled
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView>
            <Button icon="arrow-left" onPress={handleGoBack} style={{ marginBottom: 10 }}>
              {I18n.t('dataCollection.back')}
            </Button>
            <Text style={{ color: theme.colors.onBackground, fontSize: 18, fontWeight: 'bold', margin: 16 }}>
              {`${I18n.t('findRecordSettings.edit')} ${I18n.t('residentHistory.identification')}`}
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
      </SafeAreaView>
    );
  }

  // Supplementary forms
  const getCustomFormProp = () => {
    if (formType !== 'FormResults') {
      return undefined;
    }
    if (formSpecifications) {
      return formSpecifications;
    }
    return existingRecord;
  };

  return (
    <SafeAreaView edges={['top']} style={layout.screenContainer}>
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <Button icon="arrow-left" onPress={handleGoBack}>
            {I18n.t('dataCollection.back')}
          </Button>
          <Text style={{ color: theme.colors.onBackground, fontSize: 18, fontWeight: 'bold', margin: 16, marginBottom: 0, paddingBottom: 0 }}>
            {`${I18n.t('findRecordSettings.edit')} ${formTypeLabel}`}
          </Text>
          <SupplementaryForm
            editMode={editMode}
            existingRecord={existingRecord}
            formType={formType}
            navigation={navigation}
            resident={resident}
            selectedForm={mappedForm}
            setSelectedForm={() => {}}
            surveyee={resident}
            surveyingUser={surveyingUser}
            surveyingOrganization={surveyingOrganization}
            customForm={getCustomFormProp()}
            scrollViewScroll={false}
            setScrollViewScroll={() => {}}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default EditForm;
