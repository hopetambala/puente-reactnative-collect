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
import React, { useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
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

const PARSE_METADATA_FIELDS = new Set([
  'objectId', 'createdAt', 'updatedAt', 'className', '__type', 'ACL', 'sessionToken', 'authData',
]);

const FORM_STRUCTURE_FIELDS = new Set(['fields', 'title', 'description', 'formSpecificationsId']);

// Fields written by the app, not entered by the user — excluded from the field-building loop
const FORM_RESULT_METADATA = new Set([
  'surveyingUser', 'surveyingOrganization', 'client', 'appVersion', 'editedBy', 'editedAt',
]);

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
      if (editMode && existingRecord && customForm && customForm.fields && Array.isArray(customForm.fields)) {
        setConfig(customForm);
      } else if (editMode && existingRecord && Array.isArray(existingRecord.fields)) {
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

  const editFormValues = useMemo(() => {
    if (!editMode || !existingRecord) return {};

    const excluded = new Set([
      ...PARSE_METADATA_FIELDS,
      ...FORM_RESULT_METADATA,
      'phoneOS',
    ]);
    if (selectedForm === "custom") {
      FORM_STRUCTURE_FIELDS.forEach((f) => excluded.add(f));
    }

    const values = {};
    Object.entries(existingRecord).forEach(([key, value]) => {
      if (!excluded.has(key)) values[key] = value;
    });

    if (selectedForm === "custom" && Array.isArray(existingRecord.fields)) {
      Object.assign(values, reverseFormResultsFields(existingRecord));
    }
    if (selectedForm === "vitals") {
      Object.assign(values, reverseVitalsBloodPressure(existingRecord));
    }
    Object.assign(values, reverseSelectTextInputs(existingRecord, config));

    return values;
  }, [editMode, existingRecord, selectedForm, config]);

  return (
    <Formik
      enableReinitialize
      initialValues={editFormValues}
      onSubmit={async (values) => {
        setSubmitting(true);
        let formObjectUpdated;

        try {
          const formObject = { ...values };
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
          formObjectUpdated = cleanLoopSubmissions(values, formObjectUpdated);
          formObjectUpdated.surveyingUser = formObject.surveyingUser;
          formObjectUpdated.surveyingOrganization = formObject.surveyingOrganization;

          if (editMode && existingRecord && existingRecord.objectId) {
            const editClass = selectedForm === "custom" ? "FormResults" : config.class;

            const fieldsToExclude = new Set(PARSE_METADATA_FIELDS);
            if (selectedForm === "custom") {
              FORM_STRUCTURE_FIELDS.forEach((f) => fieldsToExclude.add(f));
            }

            const cleanedUpdateFields = {};
            Object.entries(formObjectUpdated).forEach(([key, value]) => {
              if (fieldsToExclude.has(key)) return;
              // eslint-disable-next-line no-underscore-dangle
              if (value && typeof value === 'object' && value.__type === 'Pointer') return;
              if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
                cleanedUpdateFields[key] = value.toJSON();
              } else if (value !== undefined && value !== null) {
                try {
                  JSON.stringify(value);
                  cleanedUpdateFields[key] = value;
                } catch (e) {
                  console.warn("SupplementaryForm: skipping non-serializable field", key);
                }
              }
            });

            if (selectedForm === "custom") {
              cleanedUpdateFields.fields = Object.entries(cleanedUpdateFields)
                .filter(([key]) => !FORM_RESULT_METADATA.has(key))
                .map(([title, answer]) => ({ title, answer }));
              Object.keys(cleanedUpdateFields).forEach((key) => {
                if (!FORM_RESULT_METADATA.has(key) && key !== 'fields') {
                  delete cleanedUpdateFields[key];
                }
              });
            }

            await updateObjectInClass(
              editClass,
              existingRecord.objectId,
              cleanedUpdateFields,
              user.id || user.objectId
            );
            if (surveyee && surveyee.objectId) {
              await invalidateResidentCache(surveyee.objectId);
            }
            alert(I18n.t("forms.successfullySubmitted"));
            setSubmitting(false);
            if (navigation) navigation.goBack();
            return;
          }

          const postParams = {
            parseParentClassID: surveyee.objectId,
            parseParentClass: "SurveyData",
            parseUser: user.objectId,
            parseClass: config.class,
            localObject: formObjectUpdated,
            loop: loopsAdded !== 0,
            isOfflineLocal: surveyee?.isOfflineLocal || false,
          };

          if (selectedForm === "custom") {
            postParams.parseClass = "FormResults";
            postParams.localObject = {
              title: customForm.name || "",
              description: customForm.description || "",
              formSpecificationsId: customForm.objectId,
              fields: Object.entries(formObjectUpdated).map(([title, answer]) => ({ title, answer })),
              surveyingUser: formObject.surveyingUser,
              surveyingOrganization: formObject.surveyingOrganization,
            };
          }

          await postSupplementaryForm(postParams);
          alert(I18n.t("forms.successfullySubmitted"));
          setSubmitting(false);
          toRoot();
        } catch (e) {
          console.error("SupplementaryForm submit error:", e);
          setSubmitting(false);
          setSubmissionError(true);
          alert(I18n.t("submissionError.error"));
        }
      }}
      validationSchema={validationSchema}
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
