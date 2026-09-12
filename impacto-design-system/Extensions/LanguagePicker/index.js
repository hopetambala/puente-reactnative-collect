import I18n from "@modules/i18n";
import { spacing } from "@modules/theme";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, RadioButton } from "react-native-paper";

const languages = [
  { key: "en", label: "languagePicker.english" },
  { key: "es", label: "languagePicker.spanish" },
  { key: "hk", label: "languagePicker.creole" },
];

/**
 * The languages this picker offers, for callers that must decide whether a
 * locale is one of them — SignIn seeds its state from the device locale and
 * has to fall back for anything else.
 *
 * Exported rather than copied: a second hardcoded list is how a fourth
 * language gets added to the picker and silently falls back to English
 * everywhere else.
 */
export const OFFERED_LANGUAGE_KEYS = languages.map((l) => l.key);

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "flex-start",
  },
  button: {
    borderRadius: spacing.radiusMedium,
  },
});

function LanguagePicker({ language, onChangeLanguage }) {
  const [dialogVisible, setDialogVisible] = useState(false);

  const selectedLabel =
    languages.find((l) => l.key === language)?.label ?? "languagePicker.english";

  return (
    <View style={styles.container}>
      <Button
        mode="outlined"
        onPress={() => setDialogVisible(true)}
        icon="web"
        style={styles.button}
      >
        {I18n.t(selectedLabel)}
      </Button>
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        >
          <Dialog.Title>🌐 Language</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              value={language}
              onValueChange={(value) => {
                onChangeLanguage(value);
                setDialogVisible(false);
              }}
            >
              {languages.map((lang) => (
                <RadioButton.Item
                  key={lang.key}
                  value={lang.key}
                  label={I18n.t(lang.label)}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}

LanguagePicker.propTypes = {
  language: PropTypes.string.isRequired,
  onChangeLanguage: PropTypes.func.isRequired,
};

export default LanguagePicker;
