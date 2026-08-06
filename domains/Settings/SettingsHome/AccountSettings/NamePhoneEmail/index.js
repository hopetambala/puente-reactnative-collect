import { getData, storeData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import { Parse } from "parse/react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import {
  Button,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { createSettingsStyles } from "../../../index.styles";

function NamePhoneEmail() {
  const theme = useTheme();
  const styles = useMemo(() => createSettingsStyles(theme), [theme]);
  const [userObject, setUserObject] = useState({});
  const [edit, setEdit] = useState("");
  const [draft, setDraft] = useState("");
  const [objectId, setObjectId] = useState("");
  const [updated, setUpdated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function setUserInformation() {
      const currentUser = await getData("currentUser");
      setObjectId(currentUser.objectId);
      setUserObject({
        firstName: currentUser.firstname,
        lastName: currentUser.lastname,
        phoneNumber: currentUser.phonenumber,
        email: currentUser.email,
      });
      setUpdated(false);
    }
    setUserInformation();
  }, [updated]);

  // Derived, not stored. The previous version built this inside .then(),
  // reading userObject from the PREVIOUS render's closure -- so every value was
  // undefined on first mount and the edit fields rendered blank.
  const inputs = useMemo(
    () => [
      {
        label: I18n.t("namePhoneEmailSettings.userInformation.fname"),
        key: "firstName",
      },
      {
        label: I18n.t("namePhoneEmailSettings.userInformation.lname"),
        key: "lastName",
      },
      {
        label: I18n.t("namePhoneEmailSettings.userInformation.phoneNumber"),
        key: "phoneNumber",
      },
      {
        label: I18n.t("namePhoneEmailSettings.userInformation.email"),
        key: "email",
      },
    ],
    []
  );

  const startEdit = (key) => {
    setDraft(userObject[key] ?? "");
    setEdit(key);
  };

  // Copy before setting. Mutating the existing object and handing the same
  // reference back lets React legitimately skip the re-render.
  const commitEdit = (key) => {
    setUserObject((previous) => ({ ...previous, [key]: draft }));
    setEdit("");
    setDraft("");
  };

  const cancelEdit = () => {
    setEdit("");
    setDraft("");
  };

  const handleFailedAttempt = () => {
    Alert.alert(
      I18n.t("global.error"),
      I18n.t("namePhoneEmailSettings.errorMessage"),
      [{ text: "OK" }],
      { cancelable: true }
    );
  };

  const handleSucccessfullAttempt = () => {
    Alert.alert(
      I18n.t("global.success"),
      I18n.t("namePhoneEmailSettings.successMessage"),
      [{ text: "OK" }],
      { cancelable: true }
    );
  };

  const updateUser = async () => {
    setSubmitting(true);

    // Saving here is a full network round trip (Parse.User.logIn below). Detect
    // the offline case first and name it, rather than letting the request reject
    // into a generic modal. The typed values stay in userObject either way.
    const online = await checkOnlineStatus();
    if (!online) {
      setSubmitting(false);
      Alert.alert(
        I18n.t("global.error"),
        I18n.t("namePhoneEmailSettings.offlineMessage"),
        [{ text: I18n.t("global.ok") }],
        { cancelable: true }
      );
      return;
    }

    const postParams = {
      objectId,
      firstname: userObject.firstName,
      lastname: userObject.lastName,
      email: userObject.email,
      phonenumber: userObject.phoneNumber,
    };
    const currentUser = await getData("currentUser");

    const user = await Parse.User.logIn(
      currentUser.username,
      currentUser.password
    );

    // eslint-disable-next-line
    for (const key in postParams) {
      user.set(String(key), postParams[key]);
    }

    const submitAction = () => {
      setTimeout(() => {
        setSubmitting(false);
        handleSucccessfullAttempt();
      }, 1000);
    };

    await user.save().then(
      async (updatedUser) => {
        await storeData(updatedUser, "currentUser").then(
          () => {
            setUpdated(true);
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
  };

  return (
    <View>
      <Text variant="headlineMedium">{I18n.t("namePhoneEmailSettings.namePhoneEmail")}</Text>
      <View style={styles.horizontalLinePrimary} />
      {inputs.map((result) => (
          <View key={result.key}>
            <Text style={styles.text}>{result.label}</Text>
            <View>
              {edit !== result.key && (
                <View style={styles.textContainer}>
                  <Text style={styles.text}>{userObject[result.key]}</Text>
                  <Button
                    testID={`edit-${result.key}`}
                    accessibilityLabel={`${I18n.t("findRecordSettings.edit")} ${result.label}`}
                    style={{ marginLeft: "auto" }}
                    onPress={() => startEdit(result.key)}
                  >
                    {I18n.t("findRecordSettings.edit")}
                  </Button>
                </View>
              )}
              {edit === result.key && (
                <View style={styles.textContainer}>
                  <TextInput
                    testID={`input-${result.key}`}
                    accessibilityLabel={result.label}
                    style={{ flex: 3 }}
                    value={draft}
                    mode="outlined"
                    onChangeText={setDraft}
                  />
                  <View style={styles.buttonContainer}>
                    <IconButton
                      testID={`confirm-${result.key}`}
                      accessibilityLabel={I18n.t("global.ok")}
                      icon="check"
                      size={25}
                      iconColor={theme.colors.primary}
                      style={styles.svg}
                      onPress={() => commitEdit(result.key)}
                    />
                    <IconButton
                      testID={`cancel-${result.key}`}
                      accessibilityLabel={I18n.t("global.cancel")}
                      icon="window-close"
                      size={25}
                      iconColor={theme.colors.primary}
                      style={styles.svg}
                      onPress={cancelEdit}
                    />
                  </View>
                </View>
              )}
            </View>
            <View style={styles.horizontalLineGray} />
          </View>
        ))}
      {submitting ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <Button testID="profile-submit" onPress={() => updateUser()}>
          {I18n.t("global.submit")}
        </Button>
      )}
    </View>
  );
}

export default NamePhoneEmail;
