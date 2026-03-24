import { getData, storeData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { theme } from "@modules/theme";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import {
  Button,
  IconButton,
  Text,
  TextInput,
} from "react-native-paper";

import styles from "../../../index.styles";

function FindRecords() {
  useEffect(() => {
    async function setUserInformation() {
      const storedLimit = await getData("findRecordsLimit");
      const currentLimit =
        storedLimit === null || storedLimit === undefined ? 2000 : storedLimit;
      const residentData = await getData("residentData");
      const residentDataCount = residentData.length;

      setCurrentData({
        currentLimit,
        residentDataCount,
      });
    }
    setUserInformation().then(() => {
      setInputs([
        {
          label: I18n.t("findRecordSettings.currentReccordsStored"),
          value: currentData.residentDataCount,
          key: "residentDataCount",
          edit: false,
        },
        {
          label: I18n.t("findRecordSettings.recordStorageLimit"),
          value: currentData.currentLimit,
          key: "currentLimit",
          edit: true,
        },
      ]);
      setUpdated(false);
    });
  }, [updated]);

  const handleFailedAttempt = () => {
    Alert.alert(
      I18n.t("global.error"),
      I18n.t("findRecordSettings.errorMessage"),
      [{ text: I18n.t("global.ok") }],
      { cancelable: true }
    );
  };

  const handleSucccessfullAttempt = () => {
    Alert.alert(
      I18n.t("global.success"),
      I18n.t("findRecordSettings.successMessage"),
      [{ text: I18n.t("global.ok") }],
      { cancelable: true }
    );
  };

  const updateUser = async () => {
    setSubmitting(true);

    const newLimit = currentData.currentLimit;

    const submitAction = () => {
      setTimeout(() => {
        setSubmitting(false);
        handleSucccessfullAttempt();
      }, 1000);
    };

    await storeData(newLimit, "findRecordsLimit").then(
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
  };

  const updateCurrentData = (key, text) => {
    const copyUserObject = currentData;
    copyUserObject[key] = text;
    setCurrentData(copyUserObject);
  };

  const [currentData, setCurrentData] = useState({});
  const [edit, setEdit] = useState("");
  const [inputs, setInputs] = useState([]);
  const [updated, setUpdated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <View>
      <Text variant="headlineMedium">{I18n.t("findRecordSettings.findRecords")}</Text>
      <View style={styles.horizontalLinePrimary} />
      {inputs.length > 0 &&
        inputs.map((result) => (
          <View key={result.key}>
            <Text style={styles.text}>{result.label}</Text>
            <View>
              {edit !== result.key && (
                <View style={styles.textContainer}>
                  <Text style={styles.text}>{currentData[result.key]}</Text>
                  {result.edit === true && (
                    <Button
                      style={{ marginLeft: "auto" }}
                      onPress={() => {
                        setEdit(result.key);
                      }}
                    >
                      {I18n.t("findRecordSettings.edit")}
                    </Button>
                  )}
                </View>
              )}
              {edit === result.key && (
                <View style={styles.textContainer}>
                  <TextInput
                    style={{ flex: 3 }}
                    placeholder={result.value}
                    mode="outlined"
                    onChangeText={(text) => updateCurrentData(result.key, text)}
                  />
                  <View style={styles.buttonContainer}>
                    <IconButton
                      icon="check"
                      size={25}
                      color={theme.colors.primary}
                      style={styles.svg}
                      onPress={() => {
                        setEdit("");
                      }}
                    />
                    <IconButton
                      icon="window-close"
                      size={25}
                      color={theme.colors.primary}
                      style={styles.svg}
                      onPress={() => {
                        setEdit("");
                      }}
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
        <Button onPress={() => updateUser()}>{I18n.t("global.submit")}</Button>
      )}
    </View>
  );
}

export default FindRecords;
