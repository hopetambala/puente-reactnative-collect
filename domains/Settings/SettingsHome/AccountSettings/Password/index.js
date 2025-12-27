import { getData, storeData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { theme } from "@modules/theme";
import { Parse } from "parse/react-native";
import React, { useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { Button, Headline, Text, TextInput } from "react-native-paper";

import styles from "../../../index.styles";

function Password() {
  const [submitting, setSubmitting] = useState(false);
  const [currentState, setCurrentState] = useState("");
  const [newState, setNewState] = useState("");

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
      <Headline>{I18n.t("passwordSettings.changePassword")}</Headline>
      <View style={styles.horizontalLinePrimary} />
      <View style={styles.lineContainer}>
        <Text style={styles.text}>
          {I18n.t("passwordSettings.currentPassword")}
        </Text>
        <TextInput
          mode="outlined"
          onChangeText={(text) => setCurrentState(text)}
        />
      </View>
      <View style={styles.lineContainer}>
        <Text style={styles.text}>
          {I18n.t("passwordSettings.newPassword")}
        </Text>
        <TextInput mode="outlined" onChangeText={(text) => setNewState(text)} />
      </View>
      {submitting ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <Button mode="contained" onPress={() => changePassword()}>
          {I18n.t("passwordSettings.changePassword")}
        </Button>
      )}
    </View>
  );
}

export default Password;
