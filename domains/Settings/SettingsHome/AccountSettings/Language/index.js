import { getData, storeData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Headline } from "react-native-paper";

import styles from "../../../index.styles";

const Language = () => {
  useEffect(() => {
    async function setUserInformation() {
      const currentLocale = await getData("locale");
      setLanguage(currentLocale);
    }
    setUserInformation();
  }, [updated]);

  const [language, setLanguage] = useState("");
  const [updated, setUpdated] = useState(false);

  const handleLanguage = async (lang) => {
    setLanguage(lang);
    await storeData(lang, "locale");
    setUpdated(true);
    I18n.locale = lang;
  };

  return (
    <View>
      <Headline>{I18n.t("languageSettings.chooseLanguage")}</Headline>
      <View style={styles.languageContainer}>
        {language === "en" && (
          <Button mode="contained">{I18n.t("languagePicker.english")}</Button>
        )}
        {language !== "en" && (
          <Button
            mode="outlined"
            onPress={() => {
              handleLanguage("en");
            }}
          >
            {I18n.t("languagePicker.english")}
          </Button>
        )}
      </View>
      <View style={styles.languageContainer}>
        {language === "es" && (
          <Button mode="contained">{I18n.t("languagePicker.spanish")}</Button>
        )}
        {language !== "es" && (
          <Button
            mode="outlined"
            onPress={() => {
              handleLanguage("es");
            }}
          >
            {I18n.t("languagePicker.spanish")}
          </Button>
        )}
      </View>
      <View style={styles.languageContainer}>
        {language === "hk" && (
          <Button mode="contained">{I18n.t("languagePicker.creole")}</Button>
        )}
        {language !== "hk" && (
          <Button
            mode="outlined"
            onPress={() => {
              handleLanguage("hk");
            }}
          >
            {I18n.t("languagePicker.creole")}
          </Button>
        )}
      </View>
    </View>
  );
};

export default Language;
