import { retrieveSignInFunction } from "@app/services/parse/auth";
import FormInput from "@impacto-design-system/Extensions/FormikFields/FormInput";
import { deleteData, getData } from "@modules/async-storage";
import { populateCache } from "@modules/cached-resources";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import { Formik } from "formik";
import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import { Button, Text } from "react-native-paper";

function GetPinCode({ navigation }) {
  const [failedAttempts, setFailedAttempts] = useState(1);

  return (
    <Formik
      initialValues={{ pincode: "" }}
      onSubmit={(values, actions) => {
        getData("pincode").then((pincode) => {
          if (values.pincode === pincode) {
            // IF ONLINE, otherwise just log in
            checkOnlineStatus().then((connected) => {
              if (connected) {
                getData("currentUser").then(
                  (asyncUser) => {
                    retrieveSignInFunction(
                      asyncUser.username,
                      asyncUser.credentials.password
                    ).then((signedInUser) => {
                      populateCache(signedInUser);
                    });
                    navigation.navigate("Root");
                  },
                  () => {
                    // error with stored currentUser
                  }
                );
              } else {
                navigation.navigate("Root");
              }
            });
          } else {
            setFailedAttempts(failedAttempts + 1);
            // go back to sign in on 3rd attempt
            if (failedAttempts >= 3) {
              deleteData("currentUser");
              deleteData("pincode");
              deleteData("organization");
              navigation.navigate("Sign In");
            } else if (failedAttempts === 2) {
              alert(I18n.t("pinCode.getPinCode.incorrect1")); // eslint-disable-line
            } else {
              alert(I18n.t("pinCode.getPinCode.incorrect2")); // eslint-disable-line
            }
          }
        });

        setTimeout(() => {
          actions.setSubmitting(false);
        }, 1000);
      }}
    >
      {(formikProps) => (
        <>
          <FormInput
            label={I18n.t("pinCode.getPinCode.enterPinCode")}
            formikProps={formikProps}
            formikKey="pincode"
            placeholder="123456"
            keyboardType="numeric"
          />
          {formikProps.isSubmitting ? (
            <ActivityIndicator />
          ) : (
            <Button onPress={formikProps.handleSubmit}>
              <Text>{I18n.t("global.submit")}</Text>
            </Button>
          )}
        </>
      )}
    </Formik>
  );
}

export default GetPinCode;
