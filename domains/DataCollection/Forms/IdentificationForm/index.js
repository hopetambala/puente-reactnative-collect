import surveyingUserFailsafe from "@app/domains/DataCollection/Forms/utils";
import { AlertContext } from "@context/alert.context";
import { Button as PaperButton, PopupError } from "@impacto-design-system/Base";
import {
  ErrorPicker,
  PaperInputPicker,
  YupValidationPicker as yupValidationPicker,
} from "@impacto-design-system/Extensions";
import { getData } from "@modules/async-storage";
import { postIdentificationForm } from "@modules/cached-resources";
import { storeAppVersion } from "@modules/cached-resources/populate-cache";
import I18n from "@modules/i18n";
import { layout, theme } from "@modules/theme";
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

import configArray from "./config/config";

const IdentificationForm = ({
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
}) => {
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
          initialValues={{}}
          validationSchema={validationSchema}
          validateOnBlur={false}
          validateOnChange={false}
          onSubmit={onSubmit}
        >
          {(formikProps) => (
            <View style={layout.formContainer}>
              {inputs.length &&
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
                      ? "red"
                      : "green",
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
};

const IdentificationFormWrapper = ({
  scrollViewScroll,
  setScrollViewScroll,
  setSelectedForm,
  setSurveyee,
  surveyingUser,
  surveyingOrganization,
}) => {
  const { alert } = useContext(AlertContext);
  const [inputs, setInputs] = useState({});
  const [validationSchema, setValidationSchema] = useState();
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);

  const onSubmit = async (values) => {
    setSubmitting(true);
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

    const submitAction = () => {
      setTimeout(() => {
        setSelectedForm("");
        setSubmitting(false);
      }, 1000);
    };

    const postParams = {
      parseClass: "SurveyData",
      parseUser: user.objectId,
      photoFile,
      localObject: formObject,
    };

    try {
      const surveyee = await postIdentificationForm(postParams);
      setSurveyee(surveyee);
      const { fname, lname } = surveyee;
      alert(`${fname} ${lname}'s ${I18n.t("forms.successfullySubmitted")}`);
      submitAction();
    } catch (e) {
      console.error(e);
      setSubmitting(false);
      setSubmissionError(true);
      alert(`${I18n.t("submissionError.error")}`);
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
    />
  );
};

export default IdentificationFormWrapper;
