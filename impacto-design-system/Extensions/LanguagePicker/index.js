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
