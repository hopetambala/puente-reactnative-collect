// Make this render but switch between forms
import surveyingUserFailsafe from "@app/domains/DataCollection/Forms/utils";
import { updateObjectInClass } from "@app/services/parse/crud";
import { AlertContext } from "@context/alert.context";
import PopupError from "@impacto-design-system/Base/PopupError";
import ErrorPicker from "@impacto-design-system/Extensions/FormikFields/ErrorPicker";
import PaperInputPicker from "@impacto-design-system/Extensions/FormikFields/PaperInputPicker";
import yupValidationPicker from "@impacto-design-system/Extensions/FormikFields/YupValidation";
import { getData } from "@modules/async-storage";
import {
  invalidateResidentCache,
  postSupplementaryForm,
} from "@modules/cached-resources";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import { isEmpty } from "@modules/utils";
import { Formik } from "formik";
import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Button, Text,useTheme  } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import envConfig from "./configs/envhealth.config";
import medConfig from "./configs/medical-evaluation.config";
import vitalsConfig from "./configs/vitals.config";
import {
  addSelectTextInputs,
  cleanLoopSubmissions,
  reverseFormResultsFields,
  reverseSelectTextInputs,
  reverseVitalsBloodPressure,
  vitalsBloodPressue,
} from "./utils";

function SupplementaryForm({
  editMode,
  existingRecord,
  navigation,
  customForm,
  selectedForm,
  setSelectedForm,
  surveyee,
  surveyingUser,
  surveyingOrganization,
}) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const { alert } = useContext(AlertContext);
  const [config, setConfig] = useState({});
  const [photoFile, setPhotoFile] = useState("State Photo String");
  const [validationSchema, setValidationSchema] = useState();
  const [submitting, setSubmitting] = useState(false);
  const [loopsAdded, setLoopsAdded] = useState(0);
  const [submissionError, setSubmissionError] = useState(false);


  const toRoot = () => {
    navigation.navigate("Root");
    setSelectedForm("");
  };

  useEffect(() => {
    if (selectedForm === "env") {
      setConfig(envConfig);
      setValidationSchema(yupValidationPicker(envConfig.fields));
    }
    if (selectedForm === "med-eval") {
      setConfig(medConfig);
      setValidationSchema(yupValidationPicker(medConfig.fields));
    }
    if (selectedForm === "vitals") {
      setConfig(vitalsConfig);
    }
    if (selectedForm === "custom") {
      // In edit mode with FormSpecifications: use the real field definitions
      if (editMode && existingRecord && customForm && customForm.fields && Array.isArray(customForm.fields)) {
        // customForm is FormSpecificationsV2 with real field definitions
        setConfig(customForm);
      } else if (editMode && existingRecord && Array.isArray(existingRecord.fields)) {
        // Fallback: existingRecord.fields contains [{title, answer}] pairs only,
        // build a synthetic config for rendering
        const syntheticConfig = {
          name: existingRecord.title || "Custom Form",
          customForm: true,
          fields: existingRecord.fields.map((field) => ({
            formikKey: field.title,
            fieldType: "input",
            label: field.title,
          })),
        };
        setConfig(syntheticConfig);
      } else {
        setConfig(customForm);
      }
    }
  }, [selectedForm, editMode, existingRecord, customForm]);

  // BUILD EDIT FORM VALUES (REVERSE TRANSFORMS)
  const buildEditFormValues = () => {
    if (!editMode || !existingRecord) {
      return {};
    }

    // Filter out Parse metadata and system fields that should not be in form values
    const fieldsToExclude = new Set([
      'objectId',
      'createdAt',
      'updatedAt',
      'className',
      '__type',
      'ACL',
      'sessionToken',
      'authData',
      'client', // Parse pointer to resident
      'appVersion', // System field
      'phoneOS', // System field
      'editedAt', // System field
      'editedBy', // System field
    ]);

    // For FormResults, also exclude form structure fields
    if (selectedForm === "custom") {
      fieldsToExclude.add('title');
      fieldsToExclude.add('description');
      fieldsToExclude.add('formSpecificationsId');
      fieldsToExclude.add('fields'); // Will be handled separately via reverseFormResultsFields
    }

    // Start with allowed fields from existingRecord
    const editFormValues = {};
    Object.entries(existingRecord).forEach(([key, value]) => {
      if (!fieldsToExclude.has(key)) {
        editFormValues[key] = value;
      }
    });

    // For custom forms (FormResults): reverse fields array → individual form values
    if (selectedForm === "custom" && Array.isArray(existingRecord.fields)) {
      const customFormReverse = reverseFormResultsFields(existingRecord);
      Object.assign(editFormValues, customFormReverse);
    }

    // For Vitals: reverse blood pressure "120/80" → { Systolic, Diastolic }
    if (selectedForm === "vitals") {
      const bpReverse = reverseVitalsBloodPressure(existingRecord);
      Object.assign(editFormValues, bpReverse);
    }

    // For all forms: reverse custom text fields "option__text" → separate fields
    const selectTextReverse = reverseSelectTextInputs(existingRecord, config);
    Object.assign(editFormValues, selectTextReverse);

    return editFormValues;
  };

  const editFormValues = editMode ? buildEditFormValues() : {};

  return (
    <Formik
      enableReinitialize
      initialValues={editMode && editFormValues ? editFormValues : {}}
      onSubmit={async (values) => {
        setSubmitting(true);
        setPhotoFile("Submitted Photo String");
        let formObjectUpdated;

        try {
          const formObject = values;
          const user = await getData("currentUser");

          formObject.surveyingUser = await surveyingUserFailsafe(
            user,
            surveyingUser,
            isEmpty
          );
          formObject.surveyingOrganization =
            surveyingOrganization || user.organization;
          formObject.appVersion = (await getData("appVersion")) || "";
          formObject.phoneOS = Platform.OS || "";

          formObjectUpdated = addSelectTextInputs(values, formObject);
          if (selectedForm === "vitals") {
            formObjectUpdated = vitalsBloodPressue(values, formObjectUpdated);
          }

          // clean looped form questions
          formObjectUpdated = cleanLoopSubmissions(values, formObjectUpdated);

          // Propagate surveyingUser and surveyingOrganization to formObjectUpdated
          // (required for stats queries to find records)
          formObjectUpdated.surveyingUser = formObject.surveyingUser;
          formObjectUpdated.surveyingOrganization = formObject.surveyingOrganization;

          // EDIT MODE: Update existing record
          if (editMode && existingRecord && existingRecord.objectId) {
            const editClass = selectedForm === "custom" ? "FormResults" : config.class;
            
            // For FormResults: exclude structure fields, rebuild the fields array from answers
            // For other forms: exclude Parse metadata
            const fieldsToExclude = new Set([
              'objectId', 'createdAt', 'updatedAt', 'className', '__type', 'ACL', 'sessionToken', 'authData',
            ]);
            
            // For FormResults, also exclude the form structure (keep only user-provided data)
            if (selectedForm === "custom") {
              fieldsToExclude.add('fields');
              fieldsToExclude.add('title');
              fieldsToExclude.add('description');
              fieldsToExclude.add('formSpecificationsId');
            }
            
            const cleanedUpdateFields = {};
            Object.entries(formObjectUpdated).forEach(([key, value]) => {
              if (!fieldsToExclude.has(key)) {
                // Skip Parse Pointer fields (they have __type === 'Pointer') - don't update relationships
                // eslint-disable-next-line no-underscore-dangle
                if (value && typeof value === 'object' && value.__type === 'Pointer') {
                  return; // Skip pointers, don't update them
                }
                // Convert Parse Objects to JSON if needed
                if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
                  cleanedUpdateFields[key] = value.toJSON();
                } else if (value !== undefined && value !== null) {
                  // Ensure the value is actually serializable
                  try {
                    JSON.stringify(value); // Test if serializable
                    cleanedUpdateFields[key] = value;
                  } catch (e) {
                    console.warn(`Skipping non-serializable field ${key}:`, e.message); // eslint-disable-line
                  }
                }
              }
            });
            
            // For FormResults: rebuild the fields array from the cleaned user data
            if (selectedForm === "custom") {
              const metadataFields = new Set(['surveyingUser', 'surveyingOrganization', 'client', 'appVersion', 'editedBy', 'editedAt']);
              cleanedUpdateFields.fields = Object.entries(cleanedUpdateFields)
                .filter(([key]) => !metadataFields.has(key))
                .map(([title, answer]) => ({
                  title,
                  answer,
                }));
              
              // Remove individual field entries, keep only the fields array and metadata
              Object.keys(cleanedUpdateFields).forEach((key) => {
                if (!metadataFields.has(key) && key !== 'fields') {
                  delete cleanedUpdateFields[key];
                }
              });
            }
            
            console.log('DEBUG: cleanedUpdateFields keys:', Object.keys(cleanedUpdateFields)); // eslint-disable-line
            
            await updateObjectInClass(
              editClass,
              existingRecord.objectId,
              cleanedUpdateFields,
              user.id || user.objectId
            );
            // Invalidate cache after successful form update
            if (surveyee && surveyee.objectId) {
              await invalidateResidentCache(surveyee.objectId);
            }
            alert(I18n.t("forms.successfullySubmitted"));
            setSubmitting(false);
            if (navigation) {
              navigation.goBack();
            }
            return;
          }

          // CREATE MODE: Post new form (existing logic)
          const postParams = {
            parseParentClassID: surveyee.objectId,
            parseParentClass: "SurveyData",
            parseUser: user.objectId,
            parseClass: config.class,
            photoFile,
            localObject: formObjectUpdated,
            loop: loopsAdded !== 0,
          };

          if (selectedForm === "custom") {
            postParams.parseClass = "FormResults";

            const fieldsArray = Object.entries(formObjectUpdated).map((obj) => ({
              title: obj[0],
              answer: obj[1],
            }));

            postParams.localObject = {
              title: customForm.name || "",
              description: customForm.description || "",
              formSpecificationsId: customForm.objectId,
              fields: fieldsArray,
              surveyingUser: formObject.surveyingUser,
              surveyingOrganization: formObject.surveyingOrganization,
            };
          }

          await postSupplementaryForm(postParams);
          alert(I18n.t("forms.successfullySubmitted"));
          setSubmitting(false);
          toRoot();
        } catch (e) {
          console.error('Form submission error:', e); // eslint-disable-line
          console.error('Error details:', { // eslint-disable-line
            message: e?.message,
            code: e?.code,
            errorResponse: e?.response,
            stack: e?.stack,
          });
          // Log formObjectUpdated if available (for debugging data format issues)
          if (typeof formObjectUpdated !== 'undefined') {
            console.error('formObjectUpdated keys:', Object.keys(formObjectUpdated)); // eslint-disable-line
            console.error('formObjectUpdated sample:', { // eslint-disable-line
              ...Object.fromEntries(Object.entries(formObjectUpdated).slice(0, 3)),
            });
          }
          setSubmitting(false);
          setSubmissionError(true);
          alert(I18n.t("submissionError.error"));
        }
      }}
      validationSchema={validationSchema}
      // only validate on submit, errors persist after fixing
      validateOnBlur={false}
      validateOnChange={false}
    >
      {(formikProps) => (
        <SafeAreaView style={layout.formContainer} edges={['top']}>
          {config.fields &&
            config.fields.map((result) => (
              <View key={result.formikKey}>
                <PaperInputPicker
                  data={result}
                  formikProps={formikProps}
                  customForm={config.customForm}
                  config={config}
                  loopsAdded={loopsAdded}
                  setLoopsAdded={setLoopsAdded}
                />
              </View>
            ))}

          <ErrorPicker
            // data={result}
            formikProps={formikProps}
            inputs={config.fields}
          />

          {submitting ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <Button
              testID="formSubmit"
              disabled={!surveyee.objectId}
              onPress={formikProps.handleSubmit}
            >
              {surveyee.objectId && <Text>{I18n.t("global.submit")}</Text>}
              {!surveyee.objectId && (
                <Text>{I18n.t("supplementaryForms.attachResident")}</Text>
              )}
            </Button>
          )}
          <PopupError
            error={submissionError}
            setError={setSubmissionError}
            errorMessage="submissionError.error"
          />
        </SafeAreaView>
      )}
    </Formik>
  );
}

export default SupplementaryForm;
