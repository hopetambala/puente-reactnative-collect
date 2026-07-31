import { getData, storeData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import { Parse } from "parse/react-native";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

import { createSettingsStyles } from "../../../index.styles";

function Password() {
  const theme = useTheme();
  const styles = useMemo(() => createSettingsStyles(theme), [theme]);
  const [submitting, setSubmitting] = useState(false);
  const [currentState, setCurrentState] = useState("");
  const [newState, setNewState] = useState("");
  const [confirmState, setConfirmState] = useState("");

  const MIN_PASSWORD_LENGTH = 8;

  const showError = (messageKey) => {
    Alert.alert(
      I18n.t("global.error"),
      I18n.t(messageKey),
      [{ text: I18n.t("global.ok") }],
      { cancelable: true }
    );
  };

  const wrongCredentials = () => {
    Alert.alert(
      I18n.t("global.error"),
      I18n.t("passwordSettings.wrongCreds"),
      [{ text: "OK" }],
      { cancelable: true }
    );
  };

  const handleFailedAttempt = () => {
    Alert.alert(
      I18n.t("global.error"),
      I18n.t("passwordSettings.errorMessage"),
      [{ text: "OK" }],
      { cancelable: true }
    );
  };

  const handleSucccessfullAttempt = () => {
    Alert.alert(
      I18n.t("global.success"),
      I18n.t("passwordSettings.successMessage"),
      [{ text: "OK" }],
      { cancelable: true }
    );
  };

  const changePassword = async () => {
    setSubmitting(true);

    // Changing a password is a full network round trip (Parse.User.logIn below).
    // Detect the offline case first and say so, instead of letting the request
    // reject into a generic modal that guesses at the cause.
    const online = await checkOnlineStatus();
    if (!online) {
      setSubmitting(false);
      showError("passwordSettings.offlineMessage");
      return;
    }

    // A typo here locks the user out on next login -- and while offline login is
    // disabled, that is unrecoverable in the field. Validate before saving.
    if (newState.length < MIN_PASSWORD_LENGTH) {
      setSubmitting(false);
      showError("passwordSettings.tooShort");
      return;
    }
    if (newState !== confirmState) {
      setSubmitting(false);
      showError("passwordSettings.mismatch");
      return;
    }

    const currentUser = await getData("currentUser");

    if (currentState !== currentUser.password) {
      setSubmitting(false);
      wrongCredentials();
    } else {
      const user = await Parse.User.logIn(
        currentUser.username,
        currentUser.password
      );
      user.set("password", newState);

      const submitAction = () => {
        setTimeout(() => {
          setSubmitting(false);
          handleSucccessfullAttempt();
        }, 1000);
      };

      await user.save().then(
        async () => {
          currentUser.password = newState;
          await storeData(currentUser, "currentUser").then(
            () => {
              submitAction();
            },
            (error) => {
              console.log(error); //eslint-disable-line
              setSubmitting(false);
              handleFailedAttempt();
            }
          );
        },
        (error) => {
          console.log(error); //eslint-disable-line
          setSubmitting(false);
          handleFailedAttempt();
        }
      );
    }
  };

  return (
    <View>
      <Text variant="headlineMedium">{I18n.t("passwordSettings.changePassword")}</Text>
      <View style={styles.horizontalLinePrimary} />
      <View style={styles.lineContainer}>
        <Text style={styles.text}>
          {I18n.t("passwordSettings.currentPassword")}
        </Text>
        <TextInput
          testID="password-current"
          mode="outlined"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(text) => setCurrentState(text)}
        />
      </View>
      <View style={styles.lineContainer}>
        <Text style={styles.text}>
          {I18n.t("passwordSettings.newPassword")}
        </Text>
        <TextInput
          testID="password-new"
          mode="outlined"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(text) => setNewState(text)}
        />
      </View>
      <View style={styles.lineContainer}>
        <Text style={styles.text}>
          {I18n.t("passwordSettings.confirmPassword")}
        </Text>
        <TextInput
          testID="password-confirm"
          mode="outlined"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(text) => setConfirmState(text)}
        />
      </View>
      {submitting ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <Button
          testID="password-submit"
          mode="contained"
          onPress={() => changePassword()}
        >
          {I18n.t("passwordSettings.changePassword")}
        </Button>
      )}
    </View>
  );
}

export default Password;
