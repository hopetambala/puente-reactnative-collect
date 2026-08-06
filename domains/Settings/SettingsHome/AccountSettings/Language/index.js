import { getData, storeData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { createSettingsStyles } from "../../../index.styles";

function Language() {
  const theme = useTheme();
  const styles = useMemo(() => createSettingsStyles(theme), [theme]);

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

  const languages = [
    { code: "en", label: I18n.t("languagePicker.english") },
    { code: "es", label: I18n.t("languagePicker.spanish") },
    { code: "hk", label: I18n.t("languagePicker.creole") },
  ];

  return (
    <View>
      <Text variant="headlineMedium">{I18n.t("languageSettings.chooseLanguage")}</Text>
      {languages.map(({ code, label }) => {
        const selected = language === code;
        return (
          <View key={code} style={styles.languageContainer}>
            {/* Selection carries a second, non-colour channel: a check icon plus
                accessibilityState. Paper's `mode` alone is colour-only, which
                fails both screen readers and a sunlit screen. */}
            <Button
              testID={`language-${code}`}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              icon={selected ? "check" : undefined}
              mode={selected ? "contained" : "outlined"}
              onPress={selected ? undefined : () => handleLanguage(code)}
            >
              {label}
            </Button>
          </View>
        );
      })}
    </View>
  );
}

export default Language;
