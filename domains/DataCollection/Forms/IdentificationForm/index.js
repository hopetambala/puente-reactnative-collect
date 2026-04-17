import surveyingUserFailsafe from "@app/domains/DataCollection/Forms/utils";
import { updateObjectInClass } from "@app/services/parse/crud";
import { AlertContext } from "@context/alert.context";
import { Button as PaperButton, PopupError } from "@impacto-design-system/Base";
import {
  ErrorPicker,
  PaperInputPicker,
  YupValidationPicker as yupValidationPicker,
} from "@impacto-design-system/Extensions";
import { getData } from "@modules/async-storage";
import {
  invalidateResidentCache,
  postIdentificationForm,
} from "@modules/cached-resources";
import { storeAppVersion } from "@modules/cached-resources/populate-cache";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import { isEmpty, withTimeoutAbort } from "@modules/utils";
import { Formik } from "formik";
import _ from "lodash";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";

import configArray from "./config/config";

function IdentificationForm({
  scrollViewScroll,
  setScrollViewScroll,
  surveyingOrganization,
  validationSchema,
  setValidationSchema,
  inputs,
  setInputs,
  submitting,
  submissionError,
  setSubmissionError,
  onSubmit,
  editMode,
  editFormValues,
}) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  useEffect(() => {
    setValidationSchema(yupValidationPicker(configArray));
  }, []);

  useEffect(() => {
    setInputs(configArray);
  }, [setInputs, configArray]);

  return (
    <View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <Formik
          enableReinitialize
          initialValues={editMode && editFormValues ? editFormValues : {}}
          validationSchema={validationSchema}
          validateOnBlur={false}
          validateOnChange={false}
          onSubmit={onSubmit}
        >
          {(formikProps) => (
            <View style={layout.formContainer}>
              {inputs.length > 0 &&
                inputs.map((result) => (
                  <View key={result.formikKey}>
                    <PaperInputPicker
                      data={result}
                      formikProps={formikProps}
                      surveyingOrganization={surveyingOrganization}
                      scrollViewScroll={scrollViewScroll}
                      setScrollViewScroll={setScrollViewScroll}
                      customForm={false}
                    />
                  </View>
                ))}
              <ErrorPicker formikProps={formikProps} inputs={inputs} />
              {submitting ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              ) : (
                <PaperButton
                  testID="formSubmit"
                  onPress={formikProps.handleSubmit}
                  buttonText={
                    _.isEmpty(formikProps.values)
                      ? I18n.t("global.emptyForm")
                      : I18n.t("global.submit")
                  }
                  icon={
                    _.isEmpty(formikProps.values) ? "alert-octagon" : "plus"
                  }
                  style={{
                    backgroundColor: _.isEmpty(formikProps.values)
                      ? theme.colors.error
                      : theme.colors.success,
                  }}
                />
              )}
              <PopupError
                error={submissionError}
                setError={setSubmissionError}
                errorMessage="submissionError.error"
              />
            </View>
          )}
        </Formik>
      </TouchableWithoutFeedback>
    </View>
  );
}

function IdentificationFormWrapper({
  scrollViewScroll,
  setScrollViewScroll,
  setSelectedForm,
  setSurveyee,
  surveyingUser,
  surveyingOrganization,
  editMode,
  existingRecord,
  navigation,
}) {
  const { alert } = useContext(AlertContext);
  const [inputs, setInputs] = useState([]);
  const [validationSchema, setValidationSchema] = useState();
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);

  // Helper: Convert existing record back to form values for editing
  const buildEditFormValues = (record) => {
    if (!record) return {};
    
    // Parse dob "MM/DD/YYYY" back to Month, Day, Year
    const dobParts = (record.dob || "").split("/");
    const month = dobParts[0] || "";
    const day = dobParts[1] || "";
    const year = dobParts[2] || "";

    return {
      fname: record.fname || "",
      lname: record.lname || "",
      nickname: record.nickname || "",
      sex: record.sex || "",
      Month: month,
      Day: day,
      Year: year,
      telephoneNumber: record.phone || record.telephoneNumber || "",
      marriageStatus: record.marriageStatus || "",
      educationLevel: record.educationLevel || "",
      communityname: record.communityname || "",
      subcounty: record.subcounty || "",
      city: record.city || "",
      province: record.province || "",
      region: record.region || "",
      location: {
        latitude: record.latitude || 0,
        longitude: record.longitude || 0,
        altitude: record.altitude || 0,
      },
    };
  };

  const editFormValues = editMode ? buildEditFormValues(existingRecord) : {};

  const onSubmit = async (values) => {
    setSubmitting(true);

    try {
      const { photoFile } = values;

      const formObject = values;
      const user = await getData("currentUser");

      formObject.surveyingOrganization =
        surveyingOrganization || user.organization;
      formObject.surveyingUser = await surveyingUserFailsafe(
        user,
        surveyingUser,
        isEmpty
      );

      formObject.appVersion = await withTimeoutAbort(storeAppVersion, 300, "");
      formObject.phoneOS = Platform.OS || "";

      formObject.latitude = values.location?.latitude || 0;
      formObject.longitude = values.location?.longitude || 0;
      formObject.altitude = values.location?.altitude || 0;

      formObject.dob = `${values.Month || "00"}/${values.Day || "00"}/${
        values.Year || "0000"
      }`;

      formObject.searchIndex = [
        values.fname,
        values.lname,
        values.nickname,
        values.communityname,
      ]
        .filter((result) => result)
        .map((result) => result.toLowerCase().trim());

      formObject.fullTextSearchIndex = formObject.searchIndex.join(" ");

      const valuesToPrune = ["Month", "Day", "Year", "location", "photoFile"];
      valuesToPrune.forEach((value) => {
        delete formObject[value];
      });

      // EDIT MODE: Use updateObjectInClass
      if (editMode && existingRecord && existingRecord.objectId) {
        await updateObjectInClass(
          "SurveyData",
          existingRecord.objectId,
          formObject,
          user.id || user.objectId
        );
        // Invalidate cache after successful form update
        await invalidateResidentCache(existingRecord.objectId);
        const fname = formObject.fname || "";
        const lname = formObject.lname || "";
        alert(`${fname} ${lname} ${I18n.t("forms.successfullySubmitted")}`.trim());
        setSubmitting(false);
        if (navigation) {
          navigation.goBack();
        }
        return;
      }

      // CREATE MODE: Use postIdentificationForm (existing logic)
      const postParams = {
        parseClass: "SurveyData",
        parseUser: user.objectId,
        photoFile,
        localObject: formObject,
      };

      const surveyee = await postIdentificationForm(postParams);
      setSurveyee(surveyee);
      const fname = surveyee?.fname || "";
      const lname = surveyee?.lname || "";
      alert(`${fname} ${lname} ${I18n.t("forms.successfullySubmitted")}`.trim());
      setSubmitting(false);
      setSelectedForm("");

    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setSubmitting(false);
      setSubmissionError(true);
      alert(I18n.t("submissionError.error"));
    }
  };

  return (
    <IdentificationForm
      scrollViewScroll={scrollViewScroll}
      setScrollViewScroll={setScrollViewScroll}
      onSubmit={onSubmit}
      inputs={inputs}
      setInputs={setInputs}
      validationSchema={validationSchema}
      setValidationSchema={setValidationSchema}
      submitting={submitting}
      setSubmitting={setSubmitting}
      submissionError={submissionError}
      setSubmissionError={setSubmissionError}
      setSelectedForm={setSelectedForm}
      setSurveyee={setSurveyee}
      editMode={editMode}
      editFormValues={editFormValues}
    />
  );
}

export default IdentificationFormWrapper;
