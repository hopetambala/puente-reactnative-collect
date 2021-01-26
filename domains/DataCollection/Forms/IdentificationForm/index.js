import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  View, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { Formik } from 'formik';

import { postIdentificationForm } from '../../../../modules/cached-resources';
import { isEmpty } from '../../../../modules/utils';
import { layout } from '../../../../modules/theme';
import I18n from '../../../../modules/i18n';

import PaperButton from '../../../../components/Button';
import PaperInputPicker from '../../../../components/FormikFields/PaperInputPicker';
import yupValidationPicker from '../../../../components/FormikFields/YupValidation';
import ErrorPicker from '../../../../components/FormikFields/ErrorPicker';
import backgroundPostPatient from './utils';
import surveyingUserFailsafe from '../utils';

import configArray from './config/config';

const IdentificationForm = ({
  scrollViewScroll, setScrollViewScroll,
  setSelectedForm, setSurveyee, surveyingUser, surveyingOrganization
}) => {
  useEffect(() => {
    const interval = setInterval(() => {
      backgroundPostPatient();
    }, 10000);

    setValidationSchema(yupValidationPicker(configArray));

    return () => {
      clearInterval(interval);
    };
  }, [clearInterval]);

  const [inputs, setInputs] = useState({});
  const [photoFile, setPhotoFile] = useState('State Photo String');
  const [validationSchema, setValidationSchema] = useState();

  useEffect(() => {
    setInputs(configArray);
  }, [setInputs, configArray]);

  return (
    <View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss()} accessible={false}>
        <Formik
          initialValues={{}}
          onSubmit={async (values, actions) => {
            setPhotoFile('Submitted Photo String');

            const formObject = values;
            formObject.surveyingOrganization = surveyingOrganization;
            formObject.surveyingUser = await surveyingUserFailsafe(surveyingUser, isEmpty);

            formObject.latitude = values.location?.latitude || 0;
            formObject.longitude = values.location?.longitude || 0;
            formObject.altitude = values.location?.altitude || 0;

            formObject.dob = `${values.Month || '00'}/${values.Day || '00'}/${values.Year || '0000'}`;

            const valuesToPrune = ['Month', 'Day', 'Year', 'location'];
            valuesToPrune.forEach((value) => {
              delete formObject[value];
            });

            const submitAction = () => {
              setTimeout(() => {
                setSelectedForm('');
                actions.setSubmitting(false);
              }, 1000);
            };

            const postParams = {
              parseClass: 'SurveyData',
              signature: 'Sample Signature',
              photoFile,
              localObject: formObject
            };

            postIdentificationForm(postParams).then((surveyee) => {
              setSurveyee(surveyee);
              submitAction();
            });
          }}
          validationSchema={validationSchema}
          // only validate on submit, errors persist after fixing
          validateOnBlur={false}
          validateOnChange={false}
        >
          {(formikProps) => (
            <View style={layout.formContainer}>
              {inputs.length && inputs.map((result) => (
                <View key={result.formikKey}>
                  <PaperInputPicker
                    data={result}
                    formikProps={formikProps}
                    surveyingOrganization={surveyingOrganization}
                    scrollViewScroll={scrollViewScroll}
                    setScrollViewScroll={setScrollViewScroll}
                    customForm={false}
                  // placeholder="Ana"
                  />
                </View>
              ))}
              <ErrorPicker
                // data={result}
                formikProps={formikProps}
                inputs={inputs}
              />
              {formikProps.isSubmitting ? (
                <ActivityIndicator />
              ) : (
                <PaperButton
                  onPressEvent={formikProps.handleSubmit}
                  buttonText={I18n.t('global.submit')}
                />
              // <Button icon="human" onPress={formikProps.handleSubmit}>
              //   <Text>Submit</Text>
              // </Button>
              )}
            </View>
          )}
        </Formik>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default IdentificationForm;
