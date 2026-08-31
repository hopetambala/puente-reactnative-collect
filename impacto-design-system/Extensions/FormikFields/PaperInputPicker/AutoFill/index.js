import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { MOTION_TOKENS } from "@modules/utils/animations";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { resolveAutofillFields } from "./fields";
import {
  keyForSuggestion,
  listHeightFor,
  SUGGESTION_ROW_HEIGHT,
  visibleSuggestions,
} from "./interaction";

LogBox.ignoreAllLogs(true);

/**
 * The suggestion list, drawn as plain views at MODULE scope.
 *
 * Two things this shape fixes, both of which made a visible row untappable:
 *
 * It is NOT a FlatList. The library renders one by default, and nesting a
 * VirtualizedList inside the signup form's ScrollView at the same orientation
 * is what React Native warns "can break windowing and other functionality" —
 * touch delivery included.
 *
 * And it lives OUTSIDE the parent component. Defined during render it would be
 * a new component type on every keystroke, so React would destroy and recreate
 * the subtree — and a TouchableOpacity remounted between touch-down and
 * touch-up can never complete a press.
 */
function SuggestionList({ data, styles, onSelect }) {
  const items = visibleSuggestions(data);
  return (
    <View style={[styles.listContainer, { height: listHeightFor(items.length) }]}>
      {items.map((item) => (
        <TouchableOpacity
          key={keyForSuggestion(item)}
          style={styles.suggestionRow}
          accessibilityRole="button"
          accessibilityLabel={item}
          onPress={() => onSelect(item)}
        >
          <Text style={styles.itemText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

SuggestionList.propTypes = {
  data: PropTypes.arrayOf(PropTypes.string),
  styles: PropTypes.shape({}).isRequired,
  onSelect: PropTypes.func.isRequired,
};

SuggestionList.defaultProps = { data: [] };

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
    // Optional explicit list. When present the autofill cache is bypassed.
    options,
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
        //  wins and skips the cache entirely: the signup screen reads
        // the Organization class directly, because the cache is populated only
        // after login and derives from _User free-text strings.
        const cached = Array.isArray(options) ? null : await getData("autofill_information");
        const result = resolveAutofillFields({ options, cached, parameter });
        setFields(result);
        setValues(result.length > 0);
      } catch (error) {
        // Degrade to free text rather than leaving the field in a half state.
        setFields([]);
        setValues(false);
      }
    }
    loadAutofillData();
  }, [parameter, options]);

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

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      paddingLeft: 15,
      paddingRight: 15,
      paddingTop: 10,
      marginBottom: 75,
    },
    // The library positions its suggestion list against THIS container. It was
    // referenced twice and never defined, so the list rendered outside any
    // parent that bounded it - and on iOS a touch outside a view's bounds is
    // never delivered to its children. That is what made a plainly visible row
    // refuse to be tapped.
    autocompleteContainer: {
      position: "relative",
      // Above the fields below it, so the open list is not merely visible but
      // actually on top of them for hit-testing.
      zIndex: 10,
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
    // The ROW owns the hit area. Previously this one style was applied to both
    // the touchable and the Text inside it, so the tappable region was just the
    // text - about 29px against a 44 floor.
    suggestionRow: {
      height: SUGGESTION_ROW_HEIGHT,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    itemText: {
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    listContainer: {
      // Opaque: the list overlays the form beneath it, and a transparent
      // dropdown over other fields is unreadable.
      backgroundColor: theme.colors.surface,
      zIndex: 10,
      borderBottomRightRadius: 4,
      borderBottomLeftRadius: 4,
    },
  }), [theme]);

  const handleSelect = useCallback((item) => {
    setQuery(item);
    formikProps.setFieldValue(formikKey, item);
  }, [formikKey, formikProps]);

  // Stable identity: a component built fresh each render is a new TYPE, and
  // React would remount the list between touch-down and touch-up.
  const ResultList = useMemo(
    () => function Results(listProps) {
      return <SuggestionList {...listProps} styles={styles} onSelect={handleSelect} />;
    },
    [styles, handleSelect]
  );

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
            renderResultList={ResultList}
            onStartShouldSetResponderCapture={() => {
              // this allows for us to scroll within the result list when the user is touching it
              // and on the screen when they are not
              setScrollViewScroll(false);
              if (foundFields.length === 0 && scrollViewScroll === false) {
                setScrollViewScroll(true);
              }
            }}
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
            renderResultList={ResultList}
          />
        </Animated.View>
      )}
    </View>
  );
}

export default AutoFill;
