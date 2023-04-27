import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { theme } from "@modules/theme";
import React, { Component } from "react";
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

import { stylesDefault, stylesPaper } from "../index.style";

LogBox.ignoreAllLogs(true);

export default class AutoFill extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fields: [],
      query: "",
      values: null,
    };
  }

  async componentDidMount() {
    const { parameter } = this.props;
    try {
      const data = await getData("autofill_information");
      if (!data) return;
      const result = data[parameter];
      this.setState({
        fields: result.sort(),
        values: result.length > 0,
      });
    } catch (error) {
      console.error("Autofill Error", error); //eslint-disable-line
    }
  }

  findField(query) {
    // method called everytime when we change the value of the input
    if (query === "") {
      return [];
    }

    const { fields } = this.state;
    // making a case insensitive regular expression to get similar value from the film json
    const regex = new RegExp(`${query.trim()}`, "i");
    return fields.filter((field) => field.search(regex) >= 0);
  }

  render() {
    const { query, values } = this.state;
    const fields = this.findField(query);
    const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();
    const {
      label,
      translatedLabel,
      formikProps,
      formikKey,
      scrollViewScroll,
      setScrollViewScroll,
    } = this.props;

    const placeholder = I18n.t(label);

    return (
      <View style={styles.container}>
        {/* handle issues where autofil does not populate any data */}
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
              // data to show in suggestion
              data={fields.length === 1 && comp(query, fields[0]) ? [] : fields}
              // default value if you want to set something in input
              defaultValue={query || initialValue}
              /* onchange of the text changing the state of the query which will trigger
              the findFilm method to show the suggestions */
              onChangeText={(text) => {
                this.setState({ query: text });
                formikProps.setFieldValue(formikKey, text);
              }}
              placeholder={placeholder}
              placeholderTextColor="black"
              listStyle={styles.listContainer}
              keyExtractor={(item) => item.key}
              onStartShouldSetResponderCapture={() => {
                // this allows for us to scroll within the result list when the user is toouching it
                // and on the screen when they are not
                setScrollViewScroll(false);
                if (fields.length === 0 && scrollViewScroll === false) {
                  setScrollViewScroll(true);
                }
              }}
              renderItem={({ item }) => (
                // you can change the view you want to show in suggestion from here

                <TouchableOpacity
                  style={styles.itemText}
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
          </View>
        )}
        {values && Platform.OS === "android" && (
          <View>
            <Autocomplete
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.autocompleteContainer}
              inputContainerStyle={styles.textInputContainer}
              // data to show in suggestion
              data={fields.length === 1 && comp(query, fields[0]) ? [] : fields}
              // default value if you want to set something in input
              defaultValue={query || initialValue}
              /* onchange of the text changing the state of the query which will trigger
              the findFilm method to show the suggestions */
              onChangeText={(text) => {
                this.setState({ query: text });
                formikProps.setFieldValue(formikKey, text);
              }}
              placeholder={placeholder}
              placeholderTextColor="black"
              listStyle={styles.listContainer}
              keyExtractor={(item) => item.key}
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
          </View>
        )}
      </View>
    );
  }
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
