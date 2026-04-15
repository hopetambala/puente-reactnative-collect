import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Autocomplete from "react-native-autocomplete-input";
import { Chip, TextInput, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import uuid from "react-native-uuid";

import createPaperInputPickerStyles from "../index.style";

const createAutoFillMSStyles = (theme) => StyleSheet.create({
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
    backgroundColor: theme.colors.surfaceSunken,
  },
  itemText: {
    fontSize: 15,
    margin: 2,
    flex: 1,
    padding: 5,
    color: theme.colors.onSurface,
  },
  listContainer: {
    height: 80,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  chip: {
    marginRight: 5,
    marginBottom: 5,
  },
});

function AutoFillMS(props) {
  const theme = useTheme();
  const styles = useMemo(() => createAutoFillMSStyles(theme), [theme]);
  const { stylesDefault, stylesPaper } = useMemo(() => createPaperInputPickerStyles(theme), [theme]);
  const [fields, setFields] = useState([]);
  const [query, setQuery] = useState("");
  const [values, setValues] = useState(null);
  const [selectedValues, setSelectedValues] = useState([]);

  // Focus lift animation — spec §5.3: subtle scale lift on focus (spring.smooth)
  // GPU-safe: transform only (no shadow/layout properties)
  const focusScale = useSharedValue(1);
  const focusLiftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
  }));

  const handleInputFocus = useCallback(() => {
    focusScale.value = withSpring(1.01, MOTION_TOKENS.spring.smooth);
  }, [focusScale]);

  const handleInputBlur = useCallback(() => {
    focusScale.value = withSpring(1, MOTION_TOKENS.spring.smooth);
  }, [focusScale]);

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
        <Animated.View style={focusLiftStyle}>
          <TextInput
            label={translatedLabel.length > 40 ? "" : translatedLabel}
            onChangeText={formikProps.handleChange(formikKey)}
            onBlur={(e) => {
              handleInputBlur();
              formikProps.handleBlur(formikKey)(e);
            }}
            onFocus={handleInputFocus}
            mode="outlined"
            theme={stylesPaper}
            style={stylesDefault.label}
          />
        </Animated.View>
      )}
      {values && Platform.OS === "ios" && (
        <Animated.View style={focusLiftStyle}>
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
            onFocus={handleInputFocus}
            onBlur={(e) => {
              handleInputBlur();
            }}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.onSurface}
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
        </Animated.View>
      )}
      {values && Platform.OS === "android" && (
        <Animated.View style={focusLiftStyle}>
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
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.onSurface}
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
        </Animated.View>
      )}
    </View>
  );
}

export default AutoFillMS;
