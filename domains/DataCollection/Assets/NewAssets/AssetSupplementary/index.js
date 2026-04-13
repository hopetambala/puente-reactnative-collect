import SelectedAsset from "@app/domains/DataCollection/Assets/ViewAssets/SelectedAsset";
import {
  addSelectTextInputs,
  cleanLoopSubmissions,
  reverseFormResultsFields,
} from "@app/domains/DataCollection/Forms/SupplementaryForm/utils";
import surveyingUserFailsafe from "@app/domains/DataCollection/Forms/utils";
import { updateObjectInClass } from "@app/services/parse/crud";
import { Button as PaperButton, PopupError } from "@impacto-design-system/Base";
import {
  AssetSearchbar,
  PaperInputPicker,
} from "@impacto-design-system/Extensions";
import { getData } from "@modules/async-storage";
import { postSupplementaryAssetForm } from "@modules/cached-resources";
import { storeAppVersion } from "@modules/cached-resources/populate-cache";
import I18n from "@modules/i18n";
import { isEmpty } from "@modules/utils";
import { Formik } from "formik";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useTheme } from "react-native-paper";

import AssetFormSelect from "./AssetFormSelect";
import styles from "./index.styles";

function AssetSupplementary({
  editMode,
  existingRecord,
  navigation,
  selectedAsset,
  setSelectedAsset,
  surveyingOrganization,
  surveyingUser,
  setPage,
}) {
  const theme = useTheme();
  const [selectedForm, setSelectedForm] = useState();
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState("State Photo String");
  const [submissionError, setSubmissionError] = useState(false);

  const validForm = () => {
    if (Object.keys(selectedAsset).length > 0 && selectedForm?.objectId)
      return true;
    return false;
  };

  // BUILD EDIT FORM VALUES (REVERSE TRANSFORMS)
  const buildEditFormValues = () => {
    if (!editMode || !existingRecord) {
      return {};
    }

    // For asset forms (FormAssetResults): reverse fields array → individual form values
    if (Array.isArray(existingRecord.fields)) {
      return reverseFormResultsFields(existingRecord);
    }

    return {};
  };

  const editFormValues = editMode ? buildEditFormValues() : {};

  return (
    <ScrollView>
      <Formik
        enableReinitialize
        initialValues={editMode && editFormValues ? editFormValues : {}}
        onSubmit={async (values, actions) => {
          setPhotoFile("Submitted Photo String");
          setSubmitting(true);

          const formObject = values;
          const user = await getData("currentUser");

          const surveyingUserFailSafe = await surveyingUserFailsafe(
            user,
            surveyingUser,
            isEmpty
          );
          const appVersion = (await storeAppVersion()) || "";

          let formObjectUpdated = addSelectTextInputs(values, formObject);
          formObjectUpdated = cleanLoopSubmissions(values, formObjectUpdated);

          // EDIT MODE: Update existing asset form
          if (editMode && existingRecord && existingRecord.objectId) {
            await updateObjectInClass(
              "FormAssetResults",
              existingRecord.objectId,
              formObjectUpdated,
              user.id || user.objectId
            );
            alert(I18n.t("forms.successfullySubmitted"));
            setSubmitting(false);
            if (navigation) {
              navigation.goBack();
            }
            return;
          }

          // CREATE MODE: Post new asset form (existing logic)
          const postParams = {
            parseParentClassID: selectedAsset.objectId,
            parseParentClass: "Assets",
            parseUser: user.objectId,
            parseClass: "FormAssetResults",
            photoFile,
            localObject: formObjectUpdated,
            typeOfForm: "Asset",
          };

          const fieldsArray = Object.entries(formObject).map((obj) => ({
            title: obj[0],
            answer: obj[1],
          }));

          postParams.localObject = {
            title: selectedForm?.name || "",
            description: selectedForm?.description || "",
            formSpecificationsId: selectedForm?.objectId || "",
            fields: fieldsArray,
            surveyingOrganization,
            surveyingUser: surveyingUserFailSafe,
            appVersion,
            phoneOS: Platform.OS || "",
          };

          const submitAction = () => {
            setTimeout(() => {
              setSubmitting(false);
            }, 1000);
            setSelectedForm({});
          };

          postSupplementaryAssetForm(postParams)
            .then(() => {
              submitAction();
            })
            .then(() => actions.resetForm())
            .catch((e) => {
              console.log(e); //eslint-disable-line
              setSubmitting(false);
              setSubmissionError(true);
            });
        }}
      >
        {(formikProps) => (
          <TouchableWithoutFeedback>
            <View style={styles.assetContainer}>
              <AssetFormSelect
                setSelectedForm={setSelectedForm}
                surveyingOrganization={surveyingOrganization}
              />

              <AssetSearchbar
                selectedAsset={selectedAsset}
                setSelectedAsset={setSelectedAsset}
                surveyingOrganization={surveyingOrganization}
              />
              {Object.keys(selectedAsset).length !== 0 && (
                <SelectedAsset selectedMarker={selectedAsset} />
              )}
              <SafeAreaView edges={['top']}>
                {editMode && existingRecord?.fields?.length > 0
                  ? existingRecord.fields.map((field) => (
                    <View key={field.title}>
                      <PaperInputPicker
                        data={{ formikKey: field.title, fieldType: 'string', question: field.title }}
                        formikProps={formikProps}
                        customForm
                      />
                    </View>
                  ))
                  : selectedForm?.fields?.length > 0 && selectedForm.fields.map((result) => (
                    <View key={result.formikKey}>
                      <PaperInputPicker
                        data={result}
                        formikProps={formikProps}
                        customForm
                      />
                    </View>
                  ))}
                {submitting ? (
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                  />
                ) : (
                  <PaperButton
                    testID="formSubmit"
                    disabled={!validForm()}
                    style={{
                      backgroundColor: validForm() ? theme.colors.success : theme.colors.error,
                    }}
                    onPress={() => formikProps.handleSubmit()}
                    icon={validForm() ? "plus" : "alert-octagon"}
                    buttonText={
                      validForm()
                        ? I18n.t("global.submit")
                        : I18n.t("assetForms.attachForm")
                    } // eslint-disable-line
                  />
                )}
                <PaperButton
                  mode="text"
                  buttonText={I18n.t("assetCore.tapCreateAsset")}
                  onPress={() => setPage("assetCore")}
                />
              </SafeAreaView>
              <PopupError
                error={submissionError}
                setError={setSubmissionError}
                errorMessage="submissionError.error"
              />
            </View>
          </TouchableWithoutFeedback>
        )}
      </Formik>
    </ScrollView>
  );
}
export default AssetSupplementary;
