import { CommonActions } from "@react-navigation/native";
import { Button } from "@impacto-design-system/Base";
import FormInput from "@impacto-design-system/Extensions/FormikFields/FormInput";
import Autofill from "@impacto-design-system/Extensions/FormikFields/PaperInputPicker/AutoFill";
import TermsModal from "@impacto-design-system/Extensions/TermsModal";
import I18n from "@modules/i18n";
import { spacing, typography } from "@modules/theme";
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

  const { register } = useContext(UserContext);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        checkbox: {
          flex: 1,
          borderRadius: 5,
          marginLeft: spacing.lg,
          backgroundColor: theme.colors.surfaceRaised,
        },
        container: {
          flexDirection: "row",
          marginHorizontal: spacing.xl,
          marginBottom: spacing.sm,
        },
        serviceText: {
          flex: 5,
          ...typography.caption,
          color: theme.colors.textSecondary,
        },
        submitButton: {
          marginHorizontal: spacing.lg,
          marginTop: spacing.sm,
          marginBottom: 100,
        },
        serviceButton: {
          marginHorizontal: spacing.lg,
          marginTop: spacing.sm,
        },
        footerContainer: {
          flexDirection: "row",
          marginLeft: "auto",
          marginRight: "auto",
          backgroundColor: theme.colors.background,
          marginBottom: 35,
        },
        loginText: {
          ...typography.body1,
          color: theme.colors.onSurface,
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
          buttonText={I18n.t("global.back")}
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
                  actions.setSubmitting(false);
                } else if (values.password !== values.password2) {
                  alert(I18n.t("signUp.errorPassword")); // eslint-disable-line
                  actions.setSubmitting(false);
                } else {
                  register(values)
                    .then(() => {
                      // Signup successful - navigate to SignIn
                      actions.setSubmitting(false);
                      navigation.dispatch(
                        CommonActions.reset({
                          index: 0,
                          routes: [{ name: "Sign In", params: { registered: true } }],
                        })
                      );
                    })
                    .catch((error) => {
                      // Signup failed - show detailed error and stay on form
                      actions.setSubmitting(false);
                      console.log(`Signup Error: ${error.code} ${error.message}`); // eslint-disable-line
                      
                      // Map Parse error codes to user-friendly messages
                      let errorMessage = I18n.t("signUp.usernameError");
                      
                      if (error.code === 101) {
                        errorMessage = "Email or phone already in use, or invalid format";
                      } else if (error.code === 125) {
                        errorMessage = "Email address format is invalid";
                      } else if (error.code === 200) {
                        errorMessage = "Connection error - please try again";
                      } else if (error.message) {
                        errorMessage = error.message;
                      }
                      
                      alert(`Signup failed: ${errorMessage}`); // eslint-disable-line
                    });
                }
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
                  <Autofill
                    parameter="organization"
                    formikProps={formikProps}
                    formikKey="organization"
                    label="signUp.organization"
                    translatedLabel={I18n.t("signUp.organization")}
                    scrollViewScroll={scrollViewScroll}
                    setScrollViewScroll={setScrollViewScroll}
                    theme={theme}
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
                      disabled={formikProps.isSubmitting}
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


