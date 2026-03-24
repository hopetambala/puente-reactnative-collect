import { countService } from "@app/services/parse/crud";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { createHeaderStyles } from "../index.styles";

function FormCounts({ setShowCounts }) {
  const theme = useTheme();
  const styles = createHeaderStyles(theme);
  const [surveyCount, setSurveyCount] = useState(0);
  const [envHealthCount, setEnvHealthCount] = useState(0);
  const [vitalsCount, setVitalsCount] = useState(0);
  const [customCount, setCustomCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [userName, setUserName] = useState(" ");
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);

  const [queryDone, setQueryDone] = useState(false);

  useEffect(() => {
    getData("currentUser").then((user) => {
      const username = `${user.firstname || ""} ${user.lastname || ""}`;
      setUserName(username);
    });
  }, []);

  useEffect(() => {
    const postParamsSurvey = {
      ParseClass: "SurveyData",
      parseColumn: "surveyingUser",
      parseParam: userName,
    };
    const postParamsEnvHealth = {
      ParseClass: "HistoryEnvironmentalHealth",
      parseColumn: "surveyingUser",
      parseParam: userName,
    };
    const postParamsVitals = {
      ParseClass: "Vitals",
      parseColumn: "surveyingUser",
      parseParam: userName,
    };
    const postParamsCustomForms = {
      ParseClass: "FormResults",
      parseColumn: "surveyingUser",
      parseParam: userName,
    };
    const postParamsAssets = {
      ParseClass: "FormResults",
      parseColumn: "surveyingUser",
      parseParam: userName,
    };

    const idPromise = countService(postParamsSurvey);
    const envHealthPromise = countService(postParamsEnvHealth);
    const vitalsPromise = countService(postParamsVitals);
    const customFormsPromise = countService(postParamsCustomForms);
    const assetPromise = countService(postParamsAssets);

    checkOnlineStatus().then(async (connected) => {
      if (connected) {
        Promise.all([
          idPromise,
          envHealthPromise,
          vitalsPromise,
          customFormsPromise,
          assetPromise,
        ]).then(
          (values) => {
            setSurveyCount(values[0]);
            setEnvHealthCount(values[1]);
            setVitalsCount(values[2]);
            setCustomCount(values[3]);
            setAssetCount(values[4]);
            setQueryDone(true);
          },
          () => {
            // error - maybe inform user
            setError(true);
          }
        );
      } else {
        setOffline(true);
      }
    });
  }, [userName]);

  return (
    <View>
      <Text style={styles.headerFormText}>
        {I18n.t("formCounts.surveysCollected")}
      </Text>
      <View style={styles.horizontalLineGray} />
      {error && (
        <View>
          <Text style={styles.label}>f{I18n.t("formCounts.error")}</Text>
        </View>
      )}
      {offline && (
        <View>
          <Text style={styles.label}>{I18n.t("formCounts.offline")}</Text>
        </View>
      )}
      {queryDone && (
        <View>
          <View style={styles.countContainer}>
            <Text style={styles.label}>{I18n.t("formCounts.idForms")}</Text>
            <Text style={styles.count}>{surveyCount}</Text>
          </View>
          <View style={styles.horizontalLineGray} />
          <View style={styles.countContainer}>
            <Text style={styles.label}>
              {I18n.t("formCounts.envHealthForms")}
            </Text>
            <Text style={styles.count}>{envHealthCount}</Text>
          </View>
          <View style={styles.horizontalLineGray} />
          <View style={styles.countContainer}>
            <Text style={styles.label}>{I18n.t("formCounts.vitalsForms")}</Text>
            <Text style={styles.count}>{vitalsCount}</Text>
          </View>
          <View style={styles.horizontalLineGray} />
          <View style={styles.countContainer}>
            <Text style={styles.label}>{I18n.t("formCounts.customForms")}</Text>
            <Text style={styles.count}>{customCount}</Text>
          </View>
          <View style={styles.horizontalLineGray} />
          <View style={styles.countContainer}>
            <Text style={styles.label}>{I18n.t("formCounts.assetForms")}</Text>
            <Text style={styles.count}>{assetCount}</Text>
          </View>
          <View style={styles.horizontalLineGray} />
        </View>
      )}
      {!queryDone && !error && !offline && (
        <ActivityIndicator color={theme.colors.primary} />
      )}
      <Button onPress={() => setShowCounts(false)}>
        {I18n.t("formCounts.back")}
      </Button>
    </View>
  );
}

export default FormCounts;
