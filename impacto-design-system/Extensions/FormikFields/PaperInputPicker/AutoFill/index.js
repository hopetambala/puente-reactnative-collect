import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useCallback,useEffect, useState } from "react";
import {
  LogBox,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Autocomplete from "react-native-autocomplete-input";
import { TextInput } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import createPaperInputPickerStyles from "../index.style";

LogBox.ignoreAllLogs(true);

function AutoFill(props) {
  const {
    label,
    translatedLabel,
    parameter,
    formikProps,
    formikKey,
    scrollViewScroll,
    setScrollViewScroll,
    theme,
  } = props;

  const [fields, setFields] = useState([]);
  const [query, setQuery] = useState("");
  const [values, setValues] = useState(null);

  // Focus lift animation for TextInput
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
    async function loadAutofillData() {
      try {
        const data = await getData("autofill_information");
        if (!data) return;
        const result = data[parameter];
        setFields(result.sort());
        setValues(result.length > 0);
      } catch (error) {
        console.error("Autofill Error", error); //eslint-disable-line
      }
    }
    loadAutofillData();
  }, [parameter]);

  const findField = useCallback(
    (searchQuery) => {
      // method called everytime when we change the value of the input
      if (searchQuery === "") {
        return [];
      }
      // making a case insensitive regular expression to get similar value from the film json
      const regex = new RegExp(`${searchQuery.trim()}`, "i");
      return fields.filter((field) => field.search(regex) >= 0);
    },
    [fields]
  );

  const foundFields = findField(query);
  const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();

  const { stylesDefault, stylesPaper } = createPaperInputPickerStyles(theme);
  const placeholder = I18n.t(label);

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
      backgroundColor: theme.colors.surfaceSunken,
    },
    itemText: {
      fontSize: 15,
      margin: 2,
      flex: 1,
      padding: 5,
      color: theme.colors.textPrimary,
    },
    listContainer: {
      height: 80,
      borderBottomRightRadius: 4,
      borderBottomLeftRadius: 4,
    },
  });

  return (
    <View style={styles.container}>
      {/* handle issues where autofil does not populate any data */}
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
            // data to show in suggestion
            data={foundFields.length === 1 && comp(query, foundFields[0]) ? [] : foundFields}
            // default value if you want to set something in input
            defaultValue={query}
            /* onchange of the text changing the state of the query which will trigger
            the findField method to show the suggestions */
            onChangeText={(text) => {
              setQuery(text);
              formikProps.setFieldValue(formikKey, text);
            }}
            onFocus={handleInputFocus}
            onBlur={() => {
              handleInputBlur();
            }}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textPrimary}
            listStyle={styles.listContainer}
            keyExtractor={(item) => item.key}
            onStartShouldSetResponderCapture={() => {
              // this allows for us to scroll within the result list when the user is touching it
              // and on the screen when they are not
              setScrollViewScroll(false);
              if (foundFields.length === 0 && scrollViewScroll === false) {
                setScrollViewScroll(true);
              }
            }}
            renderItem={({ item }) => (
              // you can change the view you want to show in suggestion from here
              <TouchableOpacity
                style={styles.itemText}
                key={`${item}`}
                onPress={() => {
                  setQuery(item);
                  formikProps.setFieldValue(formikKey, item);
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
            // data to show in suggestion
            data={foundFields.length === 1 && comp(query, foundFields[0]) ? [] : foundFields}
            // default value if you want to set something in input
            defaultValue={query}
            /* onchange of the text changing the state of the query which will trigger
            the findField method to show the suggestions */
            onChangeText={(text) => {
              setQuery(text);
              formikProps.setFieldValue(formikKey, text);
            }}
            onFocus={handleInputFocus}
            onBlur={() => {
              handleInputBlur();
            }}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textPrimary}
            listStyle={styles.listContainer}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              // you can change the view you want to show in suggestion from here
              <TouchableOpacity
                key={`${item}`}
                onPress={() => {
                  setQuery(item);
                  formikProps.setFieldValue(formikKey, item);
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

export default AutoFill;
