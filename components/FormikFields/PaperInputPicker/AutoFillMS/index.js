import React, { useEffect, useState } from 'react';
import {
  LogBox,
  Platform,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import Autocomplete from 'react-native-autocomplete-input';
import { TextInput } from 'react-native-paper';

import { getData } from '../../../../modules/async-storage';
import I18n from '../../../../modules/i18n';
import { theme } from '../../../../modules/theme';
import { stylesDefault, stylesPaper } from '../index.style';

// LogBox.ignoreWarnings(['VirtualizedLists should never be nested']);
LogBox.ignoreAllLogs(true);

const AutoFillMS = (props) => {
  const [fields, setFields] = useState([]);
  const [query, setQuery] = useState('');
  const [values, setValues] = useState(null);
  const [selectedValues, setSelectedValues] = useState([]);

  useEffect(() => {
    const { parameter } = props;
    async function fetchAutofill() {
      return getData('autofill_information');
    }
    fetchAutofill().then((data) => {
      const result = data[parameter];
      setFields(result.sort());
      setValues(result.length > 0);
    });
  }, []);

  const findField = () => {
    if (query === '') {
      return [];
    }
    const regex = new RegExp(`${query.trim()}`, 'i');
    return fields.filter((field) => field.search(regex) >= 0);
  };

  const fieldz = findField(query);
  const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();
  const {
    label, translatedLabel, formikProps, formikKey, scrollViewScroll, setScrollViewScroll
  } = props;

  const placeholder = I18n.t(label);

  return (
    <View style={styles.container}>
      <View>
        {selectedValues.map((item) => <Text style={styles.itemText} key={item}>{item}</Text>)}
      </View>
      {!values && (
        <TextInput
          label={translatedLabel.length > 40 ? '' : translatedLabel}
          onChangeText={formikProps.handleChange(formikKey)}
          onBlur={formikProps.handleBlur(formikKey)}
          mode="outlined"
          theme={stylesPaper}
          style={stylesDefault.label}
        />
      )}
      {values && Platform.OS === 'ios' && (
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
            listStyle={styles.listContainer}
            keyExtractor={(item,) => item.key}
            onStartShouldSetResponderCapture={() => {
              setScrollViewScroll(false);
              if (fieldz.length === 0
                    && scrollViewScroll === false) {
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
                  setQuery('');
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
      {values && Platform.OS === 'android' && (
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
            listStyle={styles.listContainer}
            keyExtractor={(item,) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                key={`${item}`}
                onPress={() => {
                  setQuery(item);
                  selectedValues.push(item);
                  setSelectedValues([...new Set(selectedValues)]);
                  formikProps.setFieldValue(formikKey, selectedValues);
                  setQuery('');
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
};

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
  },
  itemText: {
    fontSize: 15,
    paddingTop: 5,
    paddingBottom: 5,
    margin: 2,
    flex: 1
  },
  listContainer: {
    height: 80,
  }
});

export default AutoFillMS;
