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

const LanguagePicker = (props) => {
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
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 40,
  },
  pickerItem: {
    height: 40,
  },
});

export default LanguagePicker;
