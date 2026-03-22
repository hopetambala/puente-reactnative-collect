import { Button } from "@impacto-design-system/Base";
import FormInput from "@impacto-design-system/Extensions/FormikFields/FormInput";
import Autofill from "@impacto-design-system/Extensions/FormikFields/PaperInputPicker/AutoFill";
import TermsModal from "@impacto-design-system/Extensions/TermsModal";
import I18n from "@modules/i18n";
import { Formik } from "formik";
import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Checkbox, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";

import { UserContext } from "../../../context/auth.context";

const validationSchema = yup.object().shape({
  firstname: yup.string().label("First Name").required(),
  lastname: yup.string().label("Last Name").required(),
  email: yup.string().label("Email").email(),
  phonenumber: yup
    .string()
    .label("Phone Number")
    .min(10, "Seems a bit short.."),
  organization: yup.string().label("Organization").required(),
  password: yup
    .string()
    .label("Password")
    .required()
    .min(4, "Seems a bit short..."),
  password2: yup
    .string()
    .label("Password")
    .required()
    .min(4, "Seems a bit short..."),
});


export default function SignUp({ navigation }) {
  const theme = useTheme();
  const [checked, setChecked] = useState(false);
  const [visible, setVisible] = useState(false);
  const [scrollViewScroll, setScrollViewScroll] = useState();
  const [notificationType, setNotificationType] = useState("email");

  const { register } = useContext(UserContext);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        checkbox: {
          flex: 1,
          borderRadius: 5,
          marginLeft: 20,
          backgroundColor: theme.colors.surfaceSunken,
        },
        container: {
          flexDirection: "row",
          marginLeft: 90,
          marginRight: 90,
          marginBottom: 5,
        },
        serviceText: {
          flex: 5,
          fontSize: 10,
        },
        submitButton: {
          marginLeft: 20,
          marginRight: 20,
          marginTop: 10,
          marginBottom: 100,
        },
        serviceButton: {
          marginLeft: 20,
          marginRight: 20,
          marginTop: 10,
        },
        footerContainer: {
          flexDirection: "row",
          marginLeft: "auto",
          marginRight: "auto",
          backgroundColor: theme.colors.background,
          marginBottom: 35,
        },
        loginText: {
          fontSize: 15,
          marginTop: "auto",
          marginBottom: "auto",
        },
      }),
    [theme]
  );

  return (
    <KeyboardAvoidingView
      enabled
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ backgroundColor: theme.colors.background, flex: 1 }}
    >
      <View>
        <Button
          icon="arrow-left"
          onPress={() => navigation.navigate("Sign In")}
          buttonText="Back"
          style={[styles.serviceButton, { marginTop: 60 }]}
        />
        <ScrollView
          style={{ backgroundColor: theme.colors.background }}
          keyboardShouldPersistTaps="never"
          scrollEnabled={scrollViewScroll}
        >
          <SafeAreaView style={{ marginTop: 50, marginBottom: 150 }}>
            <Formik
              initialValues={{
                firstname: "",
                lastname: "",
                email: "",
                phonenumber: "",
                password: "",
                password2: "",
                organization: "",
              }}
              onSubmit={(values, actions) => {
                if (!checked) {
                  alert(I18n.t("signUp.errorTerms")); // eslint-disable-line
                } else if (values.password !== values.password2) {
                  alert(I18n.t("signUp.errorPassword")); // eslint-disable-line
                } else {
                  register(values, notificationType)
                    .then(() => navigation.navigate("Root"))
                    .catch((error) => {
                      // sign up failed alert user
                      console.log(`Error: ${error.code} ${error.message}`); // eslint-disable-line
                      alert(I18n.t("signUp.usernameError")); // eslint-disable-line
                    });
                }
                setTimeout(() => {
                  actions.setSubmitting(false);
                }, 1000);
              }}
              validationSchema={validationSchema}
            >
              {(formikProps) => (
                <>
                  <FormInput
                    label={I18n.t("signUp.firstName")}
                    formikProps={formikProps}
                    formikKey="firstname"
                    placeholder="John"
                    autoFocus
                  />
                  <FormInput
                    label={I18n.t("signUp.lastName")}
                    formikProps={formikProps}
                    formikKey="lastname"
                    placeholder="Doe"
                  />
                  <FormInput
                    label={I18n.t("signUp.email")}
                    formikProps={formikProps}
                    formikKey="email"
                    placeholder="johndoe@example.com"
                  />
                  <FormInput
                    label={I18n.t("signUp.phoneNumber")}
                    formikProps={formikProps}
                    formikKey="phonenumber"
                    placeholder="123-456-7890"
                    keyboardType="numeric"
                  />
                  <FormInput
                    label={I18n.t("signUp.password")}
                    formikProps={formikProps}
                    formikKey="password"
                    placeholder="Password Here"
                    secureTextEntry
                  />
                  <FormInput
                    label={I18n.t("signUp.password2")}
                    formikProps={formikProps}
                    formikKey="password2"
                    placeholder="Password Here"
                    secureTextEntry
                  />
                  <Button
                    color={notificationType === "email" ? "primary" : "empty"}
                    onPress={() => setNotificationType("email")}
                    buttonText="Send confirmation via email?"
                    style={styles.serviceButton}
                  />
                  <Button
                    color={notificationType === "text" ? "primary" : "empty"}
                    onPress={() => setNotificationType("text")}
                    buttonText="Send confirmation via text?"
                    style={styles.serviceButton}
                  />
                  <Autofill
                    parameter="organization"
                    formikProps={formikProps}
                    formikKey="organization"
                    label="signUp.organization"
                    translatedLabel={I18n.t("signUp.organization")}
                    scrollViewScroll={scrollViewScroll}
                    setScrollViewScroll={setScrollViewScroll}
                  />
                  <Button
                    onPress={() => setVisible(true)}
                    buttonText={I18n.t("signUp.termsOfService.view")}
                    style={styles.serviceButton}
                  />
                  <View style={styles.container}>
                    <Text style={styles.serviceText}>
                      {I18n.t("signUp.termsOfService.acknoledgement")}
                    </Text>
                    <View style={styles.checkbox}>
                      <Checkbox
                        disabled={false}
                        color={theme.colors.primary}
                        status={checked ? "checked" : "unchecked"}
                        onPress={() => {
                          setChecked(!checked);
                        }}
                      />
                    </View>
                  </View>
                  {formikProps.isSubmitting ? (
                    <ActivityIndicator />
                  ) : (
                    <Button
                      onPress={formikProps.handleSubmit}
                      buttonText={I18n.t("signUp.submit")}
                      style={styles.serviceButton}
                    />
                  )}

                  <TermsModal visible={visible} setVisible={setVisible} />
                </>
              )}
            </Formik>
          </SafeAreaView>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}


