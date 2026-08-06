import { getData, storeData } from "@modules/async-storage";
import I18n from "@modules/i18n";
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

function FindRecords() {
  const theme = useTheme();
  const styles = useMemo(() => createSettingsStyles(theme), [theme]);
  const [currentData, setCurrentData] = useState({});
  const [edit, setEdit] = useState("");
  const [draft, setDraft] = useState("");
  const [updated, setUpdated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function setUserInformation() {
      const storedLimit = await getData("findRecordsLimit");
      const currentLimit =
        storedLimit === null || storedLimit === undefined ? 2000 : storedLimit;
      // getData returns null for a key that was never written -- on a fresh
      // install, or after "Clear Cached ID Forms". Without the guard this throws
      // and the whole screen renders empty.
      const residentData = await getData("residentData");
      const residentDataCount = residentData?.length ?? 0;

      setCurrentData({
        currentLimit,
        residentDataCount,
      });
      setUpdated(false);
    }
    setUserInformation();
  }, [updated]);

  // Derived, not stored. Building this inside .then() read currentData from the
  // previous render's closure, so the values were stale on first mount.
  const inputs = useMemo(
    () => [
      {
        label: I18n.t("findRecordSettings.currentReccordsStored"),
        key: "residentDataCount",
        edit: false,
      },
      {
        label: I18n.t("findRecordSettings.recordStorageLimit"),
        key: "currentLimit",
        edit: true,
      },
    ],
    []
  );

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

  const startEdit = (key) => {
    setDraft(String(currentData[key] ?? ""));
    setEdit(key);
  };

  // Copy before setting, and coerce -- this is a numeric setting that was being
  // stored as whatever string the keyboard produced.
  const commitEdit = (key) => {
    const parsed = Number(draft);
    const value = Number.isFinite(parsed) && draft !== "" ? parsed : currentData[key];
    setCurrentData((previous) => ({ ...previous, [key]: value }));
    setEdit("");
    setDraft("");
  };

  const cancelEdit = () => {
    setEdit("");
    setDraft("");
  };

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
                      testID={`edit-${result.key}`}
                      accessibilityLabel={`${I18n.t("findRecordSettings.edit")} ${result.label}`}
                      style={{ marginLeft: "auto" }}
                      onPress={() => startEdit(result.key)}
                    >
                      {I18n.t("findRecordSettings.edit")}
                    </Button>
                  )}
                </View>
              )}
              {edit === result.key && (
                <View style={styles.textContainer}>
                  <TextInput
                    testID={`input-${result.key}`}
                    accessibilityLabel={result.label}
                    style={{ flex: 3 }}
                    value={draft}
                    keyboardType="number-pad"
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
        <Button onPress={() => updateUser()}>{I18n.t("global.submit")}</Button>
      )}
    </View>
  );
}

export default FindRecords;
