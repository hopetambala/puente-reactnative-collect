import React, { Component } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View,
  YellowBox
} from 'react-native';
import Autocomplete from 'react-native-autocomplete-input';
import { TextInput } from 'react-native-paper';

import { cacheAutofillData } from '../../../../modules/cached-resources';

import I18n from '../../../../modules/i18n';
import { getData } from '../../../../modules/async-storage';

import { stylesDefault, stylesPaper } from '../index.style';

YellowBox.ignoreWarnings(['VirtualizedLists should never be nested']);

export default class AutoFill extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fields: [],
      query: '',
      values: null
    };
  }

  componentDidMount() {
    const { parameter } = this.props;
    cacheAutofillData(parameter)
      .then(async () => {
        const data = await getData('autofill_information');
        const result = data[parameter];
        this.setState({
          fields: result,
          values: result.length > 0
        });
      });
  }

  findField(query) {
    // method called everytime when we change the value of the input
    if (query === '') {
      return [];
    }

    const { fields } = this.state;
    // making a case insensitive regular expression to get similar value from the film json
    const regex = new RegExp(`${query.trim()}`, 'i');
    return fields.filter((field) => field.search(regex) >= 0);
  }

  render() {
    const { query, values } = this.state;
    const fields = this.findField(query);
    const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();
    const {
      label, translatedLabel, formikProps, formikKey, scrollViewScroll, setScrollViewScroll
    } = this.props;

    const placeholder = `${I18n.t('components.autofill.placeholder')} ${I18n.t(label)} ${I18n.t('components.autofill.placeholder_end')}`;

    return (
      <View style={styles.container}>
        {/* handle issues where autofil does not populate any data */}
        {!values ? (
          <TextInput
            label={translatedLabel.length > 40 ? '' : translatedLabel}
            onChangeText={formikProps.handleChange(formikKey)}
            onBlur={formikProps.handleBlur(formikKey)}
            mode="outlined"
            theme={stylesPaper}
            style={stylesDefault.label}
          />
        ) : (
          <View>
            <Autocomplete
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.autocompleteContainer}
                // data to show in suggestion
              data={fields.length === 1 && comp(query, fields[0]) ? [] : fields}
                // default value if you want to set something in input
              defaultValue={query}
                /* onchange of the text changing the state of the query which will trigger
                the findFilm method to show the suggestions */
              onChangeText={(text) => {
                this.setState({ query: text });
                formikProps.setFieldValue(formikKey, text);
              }}
              placeholder={placeholder}
              listStyle={styles.listContainer}
              keyExtractor={(item,) => item.key}
              onStartShouldSetResponderCapture={() => {
                // this allows for us to scroll within the result list when the user is toouching it
                // and on the screen when they are not
                setScrollViewScroll(false);
                if (fields.length === 0
                    && scrollViewScroll === false) {
                  setScrollViewScroll(true);
                }
              }}
              renderItem={({ item }) => (
                // you can change the view you want to show in suggestion from here
                <TouchableOpacity
                  key={`${item}`}
                  onPress={() => {
                    this.setState({ query: item });
                    formikProps.setFieldValue(formikKey, item);
                  }}
                >
                  <Text style={styles.itemText} key={item}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <View style={styles.descriptionContainer}>
              {fields.length > 0 ? (
                <Text style={styles.infoText}>{query}</Text>
              ) : (
                <Text style={styles.infoText}>{placeholder}</Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    // backgroundColor: '#F5FCFF',
    flex: 1,
    padding: 16,
    // marginTop: 40,
    marginBottom: 40,
  },
  autocompleteContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 0
  },
  descriptionContainer: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: 20
  },
  itemText: {
    fontSize: 15,
    paddingTop: 5,
    paddingBottom: 5,
    margin: 2,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 16,
  },
  listContainer: {
    height: 80,
  }
});
