/* eslint no-param-reassign: ["error",
{ "props": true, "ignorePropertyModificationsFor": ["formikProps"] }] */
import BlackLogo from "@app/assets/graphics/static/Logo-Black.svg";
import FormInput from "@impacto-design-system/Extensions/FormikFields/FormInput";
import LanguagePicker from "@impacto-design-system/Extensions/LanguagePicker";
import TermsModal from "@impacto-design-system/Extensions/TermsModal";
import { deleteData, getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import { spacing, typography } from "@modules/theme";
import { Formik } from "formik";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";

import { UserContext } from "../../../context/auth.context";
import ForgotPassword from "./ForgotPassword";

const validationSchema = yup.object().shape({
  username: yup.string().label(I18n.t("signIn.user")).required(),
  password: yup
    .string()
    .label(I18n.t("signIn.password"))
    .required()
    .min(4, "Seems a bit short..."),
});

function SignIn({ navigation }) {
  const theme = useTheme();
  const [checked, setChecked] = useState(false);
  const [language, setLanguage] = useState("en");
  const [visible, setVisible] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const { onlineLogin, offlineLogin, isLoading, error } =
    useContext(UserContext);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          flex: 1,
          marginLeft: 15,
        },
        passwordText: {
          flex: 7,
          ...typography.body1,
          marginLeft: spacing.sm,
          marginTop: "auto",
          marginBottom: "auto",
          color: theme.colors.onSurface,
        },
        checkbox: {
          flex: 2,
          borderRadius: 5,
          backgroundColor: theme.colors.surfaceRaised,
        },
        submitButton: {
          marginHorizontal: spacing.lg,
          marginTop: spacing.md,
          marginBottom: spacing.sm,
        },
        footer: {
          flex: 1,
        },
        termsContainer: {
          flexDirection: "row",
          marginLeft: "auto",
          marginRight: "auto",
        },
        puenteText: {
          ...typography.body1,
          color: theme.colors.textSecondary,
          marginTop: "auto",
          marginBottom: "auto",
        },
        accountText: {
          ...typography.body1,
          fontWeight: "600",
          color: theme.colors.onSurface,
          marginTop: "auto",
          marginBottom: "auto",
        },
        logoContainer: {
          marginTop: spacing.lg,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: spacing.xl,
        },
      }),
    [theme]
  );

  useEffect(() => {
    async function checkLanguage() {
      const currentLocale = await getData("locale");

      if (
        currentLocale !== "en" &&
        currentLocale !== null &&
        currentLocale !== undefined
      ) {
        handleLanguage(currentLocale);
      }
    }
    checkLanguage();
  }, []);

  const handleFailedAttempt = (err) => {
    const translatedError =
      I18n.t(error) || err || error || I18n.t("global.pleaseTryAgain");

    Alert.alert(
      I18n.t("signIn.unableLogin"),
      translatedError,
      [{ text: "OK" }],
      { cancelable: true }
    );
  };

  const handleSignUp = () => {
    navigation.navigate("Sign Up");
  };

  const handleSignIn = async (values, callback) => {
    if (callback) callback();
    Keyboard.dismiss();
    navigation.navigate("Root", values);
  };

  const handleLanguage = (lang) => {
    setLanguage(lang);
    I18n.locale = lang;
  };

  const handleTermsModal = () => {
    setVisible(true);
  };

  const handleForgotPassword = () => {
    setForgotPassword(true);
  };

  const deleteCreds = () => {
    deleteData("currentUser");
    deleteData("pinnedForms");
  };

  const signin = async (enteredValues, actions) => {
    const connected = await checkOnlineStatus();

    if (connected === true) {
      return onlineLogin(enteredValues).then((status) => {
        if (status) {
          return handleSignIn(enteredValues, actions.resetForm).catch((err) =>
            handleFailedAttempt(err)
          );
        }
        return handleFailedAttempt();
      });
    }
    const offlineStatus = offlineLogin(enteredValues);
    if (offlineStatus === false)
      return handleFailedAttempt(
        "Unable to login offline, please check your credentials"
      );
    return handleSignIn(enteredValues, actions.resetForm);
  };

  return (
    <KeyboardAvoidingView
      enabled
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ backgroundColor: theme.colors.background, flex: 1 }}
    >
      {!forgotPassword && (
        <SafeAreaView style={{ flex: 9 }}>
          <ScrollView keyboardShouldPersistTaps="always">
            <LanguagePicker
              language={language}
              onChangeLanguage={handleLanguage}
            />
            <Formik
              initialValues={{ username: "", password: "" }}
              onSubmit={async (values, actions) => {
                await signin(values, actions);
                setTimeout(() => {}, 3000);
              }}
              validationSchema={validationSchema}
              validateOnBlur={false}
              validateOnChange={false}
            >
              {(formikProps) => (
                <View>
                  <View style={styles.logoContainer}>
                    <BlackLogo height={130} />
                  </View>
                  <FormInput
                    label={I18n.t("signIn.username")}
                    formikProps={formikProps}
                    formikKey="username"
                    placeholder="johndoe@example.com"
                    value={formikProps.values.username}
                  />
                  <FormInput
                    label={I18n.t("signIn.password")}
                    formikProps={formikProps}
                    formikKey="password"
                    placeholder={I18n.t("signIn.password")}
                    secureTextEntry={!checked}
                    value={formikProps.values.password}
                    right={
                      <TextInput.Icon
                        icon={checked ? "eye-off" : "eye"}
                        onPress={() => setChecked(!checked)}
                        color={theme.colors.textSecondary}
                      />
                    }
                  />

                  <View style={{ flexDirection: "row", justifyContent: "flex-end", marginHorizontal: spacing.lg }}>
                    <Button onPress={handleForgotPassword}>
                      {I18n.t("signIn.forgotPassword.label")}
                    </Button>
                  </View>
                  {isLoading ? (
                    <ActivityIndicator />
                  ) : (
                    <Button
                      mode="contained"
                      theme={theme}
                      style={styles.submitButton}
                      onPress={formikProps.handleSubmit}
                    >
                      {I18n.t("signIn.login")}
                    </Button>
                  )}
                </View>
              )}
            </Formik>
            <Button onPress={deleteCreds}>
              {I18n.t("signIn.deleteCreds")}
            </Button>
          </ScrollView>

          <TermsModal visible={visible} setVisible={setVisible} />
        </SafeAreaView>
      )}
      {forgotPassword && (
        <ForgotPassword
          navigation={navigation}
          forgotPassword={forgotPassword}
          setForgotPassword={setForgotPassword}
        />
      )}

      {!forgotPassword && (
        <View style={styles.footer}>
          <View style={styles.termsContainer}>
            <Text style={styles.accountText}>{I18n.t("signIn.noAccount")}</Text>
            <Button
              mode="text"
              theme={theme}
              color={theme.colors.link}
              onPress={handleSignUp}
              labelStyle={{ marginLeft: 5 }}
            >
              {I18n.t("signIn.signUpLink")}
            </Button>
          </View>
          <View style={styles.termsContainer}>
            <Text style={styles.puenteText}>{I18n.t("signIn.puente2020")}</Text>
            <Button
              mode="text"
              theme={theme}
              onPress={handleTermsModal}
              labelStyle={{ marginLeft: 5 }}
            >
              {I18n.t("signIn.termsConditions")}
            </Button>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

export default SignIn;
