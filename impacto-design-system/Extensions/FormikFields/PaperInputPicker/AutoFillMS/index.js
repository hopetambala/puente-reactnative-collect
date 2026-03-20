import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { theme } from "@modules/theme";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Autocomplete from "react-native-autocomplete-input";
import { Chip, TextInput } from "react-native-paper";
import uuid from "react-native-uuid";

import { stylesDefault, stylesPaper } from "../index.style";

function AutoFillMS(props) {
  const [fields, setFields] = useState([]);
  const [query, setQuery] = useState("");
  const [values, setValues] = useState(null);
  const [selectedValues, setSelectedValues] = useState([]);

  useEffect(() => {
    const { parameter } = props;
    async function fetchAutofill() {
      return getData("autofill_information");
    }
    fetchAutofill().then((data) => {
      const result = data[parameter];
      setFields(result.sort());
      setValues(result.length > 0);
    });
  }, []);

  const findField = () => {
    if (query === "") {
      return [];
    }
    const regex = new RegExp(`${query.trim()}`, "i");
    return fields.filter((field) => field.search(regex) >= 0);
  };

  const fieldz = findField(query);
  const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();
  const {
    label,
    translatedLabel,
    formikProps,
    formikKey,
    scrollViewScroll,
    setScrollViewScroll,
  } = props;

  const placeholder = I18n.t(label);

  return (
    <View style={styles.container}>
      <View style={styles.chipRow}>
        {selectedValues.map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.chip}
            onPress={() => {
              const arr = selectedValues.filter((itm) => itm !== item);
              setSelectedValues(arr);
              formikProps.setFieldValue(formikKey, arr);
            }}
          >
            <Chip key={item}>{item}</Chip>
          </TouchableOpacity>
        ))}
      </View>
      {!values && (
        <TextInput
          label={translatedLabel.length > 40 ? "" : translatedLabel}
          onChangeText={formikProps.handleChange(formikKey)}
          onBlur={formikProps.handleBlur(formikKey)}
          mode="outlined"
          theme={stylesPaper}
          style={stylesDefault.label}
        />
      )}
      {values && Platform.OS === "ios" && (
        <View>
          <Autocomplete
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.autocompleteContainer}
            inputContainerStyle={styles.textInputContainer}
            data={fieldz.length === 1 && comp(query, fieldz[0]) ? [] : fieldz}
            defaultValue={query}
            onChangeText={(text) => {
              setQuery(text);
            }}
            placeholder={placeholder}
            placeholderTextColor="black"
            listStyle={styles.listContainer}
            keyExtractor={() => uuid.v4()}
            onStartShouldSetResponderCapture={() => {
              setScrollViewScroll(false);
              if (fieldz.length === 0 && scrollViewScroll === false) {
                setScrollViewScroll(true);
              }
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                key={`${item}`}
                onPress={() => {
                  setQuery(item);
                  selectedValues.push(item);
                  setSelectedValues([...new Set(selectedValues)]);
                  formikProps.setFieldValue(formikKey, selectedValues);
                  setQuery("");
                }}
              >
                <Text style={styles.itemText} key={item}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      {values && Platform.OS === "android" && (
        <View>
          <Autocomplete
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.autocompleteContainer}
            inputContainerStyle={styles.textInputContainer}
            data={fieldz.length === 1 && comp(query, fieldz[0]) ? [] : fieldz}
            defaultValue={query}
            onChangeText={(text) => {
              setQuery(text);
            }}
            placeholder={placeholder}
            placeholderTextColor="black"
            listStyle={styles.listContainer}
            keyExtractor={() => uuid.v4()}
            renderItem={({ item }) => (
              <TouchableOpacity
                key={`${item}`}
                onPress={() => {
                  setQuery(item);
                  selectedValues.push(item);
                  setSelectedValues([...new Set(selectedValues)]);
                  formikProps.setFieldValue(formikKey, selectedValues);
                  setQuery("");
                }}
              >
                <Text style={styles.itemText} key={item}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 10,
    marginBottom: 75,
  },
  textInputContainer: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: 4,
    paddingBottom: 8,
    paddingTop: 8,
    paddingLeft: 10,
    backgroundColor: "#FFFFFF",
  },
  itemText: {
    fontSize: 15,
    margin: 2,
    flex: 1,
    padding: 5,
    color: "#000000",
  },
  listContainer: {
    height: 80,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 4,
  },
});

export default AutoFillMS;
