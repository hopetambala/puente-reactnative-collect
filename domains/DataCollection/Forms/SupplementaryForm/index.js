// Make this render but switch between forms
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  View
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Formik } from 'formik';

import { postSupplementaryForm } from '../../../../modules/cached-resources';

import { layout } from '../../../../modules/theme';
import I18n from '../../../../modules/i18n';
import { isEmpty } from '../../../../modules/utils';

import PaperInputPicker from '../../../../components/FormikFields/PaperInputPicker';
import yupValidationPicker from '../../../../components/FormikFields/YupValidation';

import envConfig from './configs/envhealth.config';
import medConfig from './configs/medical-evaluation.config';
import vitalsConfig from './configs/vitals.config';

import surveyingUserFailsafe from '../utils';
import { addSelectTextInputs, vitalsBloodPressue } from './utils';
import ErrorPicker from '../../../../components/FormikFields/ErrorPicker';

const SupplementaryForm = ({
  navigation, selectedForm, setSelectedForm, surveyee, surveyingUser, surveyingOrganization,
  customForm
}) => {
  const [config, setConfig] = useState({});
  const [photoFile, setPhotoFile] = useState('State Photo String');
  const [validationSchema, setValidationSchema] = useState();

  const toRoot = () => {
    navigation.navigate('Root');
    setSelectedForm('');
  };

  useEffect(() => {
    if (selectedForm === 'env') {
      setConfig(envConfig);
      setValidationSchema(yupValidationPicker(envConfig.fields));
    }
    if (selectedForm === 'med-eval') {
      setConfig(medConfig);
      setValidationSchema(yupValidationPicker(medConfig.fields));
    }
    if (selectedForm === 'vitals') {
      setConfig(vitalsConfig);
    }
    if (selectedForm === 'custom') setConfig(customForm);
  }, [selectedForm, config]);

  return (
    <Formik
      initialValues={{}}
      onSubmit={async (values, actions) => {
        setPhotoFile('Submitted Photo String');

        const formObject = values;
        formObject.surveyingUser = await surveyingUserFailsafe(surveyingUser, isEmpty);
        formObject.surveyingOrganization = surveyingOrganization;

        let formObjectUpdated = addSelectTextInputs(values, formObject);
        if (selectedForm === 'vitals') {
          formObjectUpdated = vitalsBloodPressue(values, formObjectUpdated);
        }
        const postParams = {
          parseParentClassID: surveyee.objectId,
          parseParentClass: 'SurveyData',
          parseClass: config.class,
          photoFile,
          localObject: formObjectUpdated
        };

        if (selectedForm === 'custom') {
          postParams.parseClass = 'FormResults';

          const fieldsArray = Object.entries(formObjectUpdated).map((obj) => ({
            title: obj[0],
            answer: obj[1]
          }));

          postParams.localObject = {
            title: customForm.name || '',
            description: customForm.description || '',
            formSpecificationsId: customForm.objectId,
            fields: fieldsArray,
            surveyingUser: formObject.surveyingUser,
            surveyingOrganization: formObject.surveyingOrganization

          };
        }

        postSupplementaryForm(postParams).then(() => {
          setTimeout(() => {
            actions.setSubmitting(false);
            toRoot();
          }, 1000);
        });
      }}
      validationSchema={validationSchema}
      // only validate on submit, errors persist after fixing
      validateOnBlur={false}
      validateOnChange={false}
    >
      {(formikProps) => (
        <View style={layout.formContainer}>
          {config.fields && config.fields.map((result) => (
            <View key={result.formikKey}>
              <PaperInputPicker
                data={result}
                formikProps={formikProps}
                customForm={config.customForm}
              />
            </View>
          ))}

          <ErrorPicker
            // data={result}
            formikProps={formikProps}
            inputs={config.fields}
          />

          {formikProps.isSubmitting ? (
            <ActivityIndicator />
          ) : (
            <Button
              disabled={!surveyee.objectId}
              onPress={formikProps.handleSubmit}
            >
              {surveyee.objectId && <Text>{I18n.t('global.submit')}</Text>}
              {!surveyee.objectId && <Text>{I18n.t('supplementaryForms.attachResident')}</Text>}
            </Button>
          )}
        </View>
      )}
    </Formik>
  );
};

export default SupplementaryForm;
