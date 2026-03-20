import { cleanLoopSubmissions } from "@app/domains/DataCollection/Forms/SupplementaryForm/utils";
import surveyingUserFailsafe from "@app/domains/DataCollection/Forms/utils";
import { AlertContext } from "@context/alert.context";
import { Button as PaperButton, PopupError } from "@impacto-design-system/Base";
import {
  ErrorPicker,
  PaperInputPicker,
} from "@impacto-design-system/Extensions";
import { getData } from "@modules/async-storage";
import { postAssetForm } from "@modules/cached-resources";
import I18n from "@modules/i18n";
import { isEmpty } from "@modules/utils";
import { Formik } from "formik";
import _ from "lodash";
import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, View } from "react-native";
import { Provider } from "react-native-paper";

import configArray from "./config/config";
import styles from "./index.styles";

function AssetCore({
  setSelectedAsset,
  scrollViewScroll,
  setScrollViewScroll,
  surveyingUser,
  surveyingOrganization,
  setPage,
}) {
  const { alert } = useContext(AlertContext);
  const [inputs, setInputs] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);

  useEffect(() => {
    setInputs(configArray);
  }, [configArray]);

  return (
    <ScrollView>
      <Provider>
        <Formik
          initialValues={{}}
          onSubmit={async (values, { resetForm }) => {
            setSubmitting(true);
            try {
              const formObject = values;
              const user = await getData("currentUser");
              formObject.surveyingUser = await surveyingUserFailsafe(
                user,
                surveyingUser,
                isEmpty
              );
              formObject.surveyingOrganization = surveyingOrganization;
              formObject.appVersion = (await getData("appVersion")) || "";
              formObject.phoneOS = Platform.OS || "";
              formObject.latitude = values.location?.latitude || 0;
              formObject.longitude = values.location?.longitude || 0;
              formObject.altitude = values.location?.altitude || 0;

              const formObjectUpdated = cleanLoopSubmissions(values, formObject);

              const postParams = {
                parseClass: "Assets",
                parseUser: user.objectId,
                signature: "Asset Signature",
                photoFile: "photo",
                localObject: formObjectUpdated,
              };

              const asset = await postAssetForm(postParams);
              setSelectedAsset(JSON.parse(JSON.stringify(asset)));
              resetForm();
              setSubmitting(false);
            } catch (e) {
              console.log(e); //eslint-disable-line
              setSubmitting(false);
              setSubmissionError(true);
              alert(I18n.t("submissionError.error"));
            }
          }}
        >
          {(formikProps) => (
            <View style={styles.assetContainer}>
              {inputs.fields &&
                inputs.fields.map((result) => (
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
              <ErrorPicker formikProps={formikProps} inputs={inputs.fields} />

              {submitting ? (
                <ActivityIndicator />
              ) : (
                <PaperButton
                  onPress={formikProps.handleSubmit}
                  buttonText={
                    _.isEmpty(formikProps.values)
                      ? I18n.t("global.emptyForm")
                      : I18n.t("assetForms.createAsset")
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
              <PaperButton
                mode="text"
                buttonText={I18n.t("assetCore.swipeAttachForm")}
                onPress={() => setPage("assetSupplementary")}
              />
              <PopupError
                error={submissionError}
                setError={setSubmissionError}
                errorMessage="submissionError.error"
              />
            </View>
          )}
        </Formik>
      </Provider>
    </ScrollView>
  );
}

export default AssetCore;
