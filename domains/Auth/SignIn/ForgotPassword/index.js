import { retrieveForgotPasswordFunction } from "@app/services/parse/auth";
import FormInput from "@impacto-design-system/Extensions/FormikFields/FormInput";
import I18n from "@modules/i18n";
import { spacing, typography } from "@modules/theme";
import { Formik } from "formik";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

export default function ForgotPassword({ navigation, setForgotPassword }) {
  const theme = useTheme();
  const handleSignUp = () => {
    navigation.navigate("Sign Up");
  };

  const handleSignIn = () => {
    setForgotPassword(false);
  };

  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState(false);

  return (
    <View style={{ flex: 1, marginHorizontal: 15, marginTop: 50 }}>
      <View style={{ flex: 9 }}>
        <Button icon="arrow-left" width={100} onPress={handleSignIn}>
          Back
        </Button>
        {!emailError && !emailSuccess && (
          <View>
            <Formik
              initialValues={{ email: "" }}
              onSubmit={(values, actions) => {
                retrieveForgotPasswordFunction(values).then(
                  (res) => {
                    setEmailSuccess(true);
                    console.log(res); //eslint-disable-line
                  },
                  (error) => {
                    setEmailError(true);
                    console.log(error); //eslint-disable-line
                  }
                );
                setTimeout(() => {
                  actions.setSubmitting(false);
                }, 1000);
              }}
            >
              {(formikProps) => (
                <View>
                  <View>
                    <Text
                      style={{
                        marginHorizontal: spacing.md,
                        ...typography.heading2,
                        fontWeight: "700",
                        color: theme.colors.onSurface,
                      }}
                    >
                      {I18n.t("signIn.forgotPassword.enterEmail")}
                    </Text>
                    <FormInput
                      label={I18n.t("signUp.email")}
                      formikProps={formikProps}
                      formikKey="email"
                      placeholder={I18n.t("signUp.email")}
                    />
                  </View>
                  <Button
                    mode="contained"
                    theme={theme}
                    onPress={formikProps.handleSubmit}
                  >
                    {I18n.t("signIn.forgotPassword.sendLink")}
                  </Button>
                </View>
              )}
            </Formik>
          </View>
        )}
        {emailSuccess && (
          <View>
            <Text
              style={{ marginHorizontal: 15, fontSize: 18, fontWeight: "bold" }}
            >
              {I18n.t("signIn.forgotPassword.resetSuccess")}
            </Text>
            <Button mode="text" theme={theme} onPress={handleSignIn}>
              Back to Sign in
            </Button>
          </View>
        )}
        {emailError && (
          <View>
            <Text
              style={{ marginHorizontal: 15, fontSize: 18, fontWeight: "bold" }}
            >
              {I18n.t("signIn.forgotPassword.resetError")}
            </Text>
            <Button
              style={{ marginTop: 10 }}
              mode="contained"
              onPress={() => setEmailError(false)}
            >
              Try Again
            </Button>
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <View style={styles.termsContainer}>
          <Text style={styles.accountText}>
            {I18n.t("signIn.forgotPassword.noAccount")}
          </Text>
          <Button
            mode="text"
            theme={theme}
            color={theme.colors.link}
            onPress={handleSignUp}
            labelStyle={{ marginLeft: 5 }}
          >
            {I18n.t("signIn.forgotPassword.signUp")}
          </Button>
        </View>
        <View style={styles.termsContainer}>
          <Text style={styles.puenteText}>
            {I18n.t("signIn.forgotPassword.rememberPass")}
          </Text>
          <Button
            mode="text"
            theme={theme}
            onPress={handleSignIn}
            labelStyle={{ marginLeft: 5 }}
          >
            {I18n.t("signIn.forgotPassword.signIn")}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flex: 1,
  },
  termsContainer: {
    flexDirection: "row",
    marginLeft: "auto",
    marginRight: "auto",
  },
  puenteText: {
    fontSize: 15,
    marginTop: "auto",
    marginBottom: "auto",
  },
  accountText: {
    fontSize: 18,
    marginTop: "auto",
    marginBottom: "auto",
  },
  logoContainer: {
    marginTop: 20,
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: 40,
  },
});
