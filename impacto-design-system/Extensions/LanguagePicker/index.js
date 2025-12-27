import I18n from "@modules/i18n";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

const languages = [
  {
    key: "en",
    label: I18n.t("languagePicker.english"),
  },
  {
    key: "es",
    label: I18n.t("languagePicker.spanish"),
  },
  {
    key: "hk",
    label: I18n.t("languagePicker.creole"),
  },
];

function LanguagePicker(props) {
  const { language, onChangeLanguage } = props;
  return (
    <View style={styles.container}>
      <Picker
        style={styles.picker}
        itemStyle={styles.pickerItem}
        selectedValue={language}
        onValueChange={onChangeLanguage}
        mode={Platform.OS === "android" ? "dropdown" : "dialog"}
      >
        {languages.map((lang) => (
          <Picker.Item
            key={lang.key}
            value={lang.key}
            label={`🌐${lang.label}`}
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10

  },
  picker: {
    width: "100%",
    height: 50,
    
  },
  pickerItem: {
    height: "100%"
  },
});

export default LanguagePicker;
