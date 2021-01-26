import * as React from 'react';
import {
  View, Text
} from 'react-native';
import {
  TextInput, Button, Headline,
} from 'react-native-paper';
import { Spinner } from 'native-base';

import getLocation from '../../../modules/geolocation';
import I18n from '../../../modules/i18n';
import UseCamera from '../../Multimedia/Photo';
import { theme, layout } from '../../../modules/theme';

import PaperButton from '../../Button';
import AutoFill from './AutoFill';
import HouseholdManager from './HouseholdManager';

import { stylesDefault, stylesPaper, styleX } from './index.style';

const PaperInputPicker = ({
  data, formikProps, scrollViewScroll, setScrollViewScroll, surveyingOrganization,
  customForm, ...rest
}) => {
  const {
    label, formikKey, fieldType, sideLabel
  } = data;

  const {
    handleChange, handleBlur, errors, setFieldValue, values
  } = formikProps;

  const [location, setLocation] = React.useState({ latitude: 0, longitude: 0, altitude: 0 });
  const [locationLoading, setLocationLoading] = React.useState(false);

  const handleLocation = async () => {
    setLocationLoading(true);
    const currentLocation = await getLocation().catch((e) => e);
    const { latitude, longitude, altitude } = currentLocation.coords;

    setFieldValue('location', { latitude, longitude, altitude });
    setLocation({ latitude, longitude, altitude });
    setTimeout(() => {
      setLocationLoading(false);
    }, 1000);
  };

  const translatedLabel = customForm ? label : I18n.t(label);
  const translatedLabelSide = customForm ? sideLabel : I18n.t(sideLabel);

  const addArrayVal = (result) => {
    if (values[formikKey] || values[formikKey] === []) {
      setFieldValue(formikKey, values[formikKey].concat([result.value]));
    } else {
      setFieldValue(formikKey, [result.value]);
    }
  };

  return (
    <>
      {fieldType === 'input' && (
        <View style={stylesDefault.container} key={formikKey}>
          {translatedLabel.length > 40
            && <Text style={stylesDefault.label}>{translatedLabel}</Text>}
          <TextInput
            label={translatedLabel.length > 40 ? '' : translatedLabel}
            onChangeText={handleChange(formikKey)}
            onBlur={handleBlur(formikKey)}
            {...rest} //eslint-disable-line
            mode="outlined"
            theme={stylesPaper}
            style={stylesDefault.label}
          />
          <Text style={{ color: 'red' }}>
            {errors[formikKey]}
          </Text>
        </View>
      )}
      {fieldType === 'numberInput' && (
        <View style={stylesDefault.container} key={formikKey}>
          {translatedLabel.length > 40
            && (
              <Text style={[stylesDefault.label, {
                bottom: -15, zIndex: 1, left: 5, padding: 5
              }]}
              >
                {translatedLabel}
              </Text>
            )}
          <TextInput
            label={translatedLabel.length > 40 ? '' : translatedLabel}
            onChangeText={handleChange(formikKey)}
            onBlur={handleBlur(formikKey)}
            {...rest} //eslint-disable-line
            mode="outlined"
            keyboardType="numeric"
            theme={stylesPaper}
            style={stylesDefault.label}
          />
          <Text style={{ color: 'red' }}>
            {errors[formikKey]}
          </Text>
        </View>
      )}
      {fieldType === 'inputSideLabel' && (
        <View style={stylesDefault.container} key={formikKey}>
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              label={translatedLabel}
              onChangeText={handleChange(formikKey)}
              onBlur={handleBlur(formikKey)}
              {...rest} //eslint-disable-line
              mode="outlined"
              theme={{ colors: { placeholder: theme.colors.primary }, text: 'black' }}
              style={{ flex: 1 }}
            />
            <Text style={styleX.sideLabel}>{translatedLabelSide}</Text>
          </View>
          <Text style={{ color: 'red' }}>
            {errors[formikKey]}
          </Text>
        </View>
      )}
      {fieldType === 'inputSideLabelNum' && (
        <View style={stylesDefault} key={formikKey}>
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              label={translatedLabel}
              onChangeText={handleChange(formikKey)}
              onBlur={handleBlur(formikKey)}
              {...rest} //eslint-disable-line
              mode="outlined"
              keyboardType="numeric"
              theme={stylesPaper}
              style={{ flex: 1 }}
            />
            <Text style={styleX.sideLabel}>{translatedLabelSide}</Text>
          </View>
          <Text style={{ color: 'red' }}>
            {errors[formikKey]}
          </Text>
        </View>
      )}
      {fieldType === 'inputSideLabelTextQuestNumber' && (
        <View style={stylesDefault} key={formikKey}>
          <Text style={stylesDefault.label}>{translatedLabel}</Text>
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              onChangeText={handleChange(formikKey)}
              onBlur={handleBlur(formikKey)}
              {...rest} //eslint-disable-line
              mode="outlined"
              keyboardType="numeric"
              theme={{ colors: { placeholder: theme.colors.primary }, text: 'black' }}
              style={{ flex: 1 }}
            />
            <Text style={styleX.sideLabel}>{translatedLabelSide}</Text>
          </View>
          <Text style={{ color: 'red' }}>
            {errors[formikKey]}
          </Text>
        </View>
      )}
      {fieldType === 'inputSideBySideLabel' && (
        <View style={stylesDefault} key={formikKey}>
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              label={translatedLabel}
              onChangeText={handleChange(formikKey)}
              onBlur={handleBlur(formikKey)}
              {...rest} //eslint-disable-line
              mode="outlined"
              theme={{ colors: { placeholder: theme.colors.primary }, text: 'black' }}
              style={{ flex: 1 }}
            />
            <Text style={styleX.sideLabel}>{translatedLabelSide}</Text>
            <TextInput
              label={translatedLabel}
              onChangeText={handleChange(formikKey)}
              onBlur={handleBlur(formikKey)}
              {...rest} //eslint-disable-line
              mode="outlined"
              theme={{ colors: { placeholder: theme.colors.primary }, text: 'black' }}
              style={{ flex: 1 }}
            />
          </View>
          <Text style={{ color: 'red' }}>
            {errors[formikKey]}
          </Text>
        </View>
      )}
      {fieldType === 'select' && (
        <View key={formikKey} style={stylesDefault.container}>
          <Text style={[layout.selectLabel, stylesDefault.label]}>{translatedLabel}</Text>
          <View style={layout.buttonGroupContainer}>
            {data.options.map((result) => (
              <View key={result.value}>
                {/* selected value */}
                {result.value === values[formikKey] && (
                  <View>
                    <Button
                      style={layout.buttonGroupButtonStyle}
                      key={result.value}
                      mode="contained"
                      onPress={() => setFieldValue(formikKey, result.value)}
                    >
                      <Text style={{ color: 'white' }}>{customForm ? result.label : I18n.t(result.label)}</Text>
                    </Button>
                  </View>
                )}
                {/* non-selected value */}
                {result.value !== values[formikKey] && (
                  <View style={stylesDefault}>
                    <Button
                      style={layout.buttonGroupButtonStyle}
                      key={result.value}
                      mode="outlined"
                      onPress={() => setFieldValue(formikKey, result.value)}
                    >
                      <Text style={{ color: theme.colors.primary }}>
                        {customForm ? result.label : I18n.t(result.label)}
                      </Text>
                    </Button>
                  </View>
                )}
              </View>
            ))}
          </View>
          {/* text input option along with select option */}
          {data.options.map((result) => (
            <View key={result.value}>
              {result.text === true && result.value === values[formikKey] && (
                <View style={stylesDefault} key={result.textKey}>
                  <TextInput
                    label={customForm ? result.label : I18n.t(result.label)}
                    onChangeText={handleChange(result.textKey)}
                    onBlur={handleBlur(result.textKey)}
                    {...rest} //eslint-disable-line
                    mode="outlined"
                    theme={{ colors: { placeholder: theme.colors.primary }, text: 'black' }}
                  />
                  <Text style={{ color: 'red' }}>
                    {errors[result.textKey]}
                  </Text>
                </View>
              )}
            </View>
          ))}
          <Text style={{ color: 'red' }}>
            {errors[formikKey]}
          </Text>
        </View>
      )}
      {fieldType === 'selectMulti' && (
        <View key={formikKey} style={stylesDefault.container}>
          <Text style={[layout.selectLabel, stylesDefault.label]}>{translatedLabel}</Text>
          <View style={layout.buttonGroupContainer}>
            {data.options.map((result) => (
              <View key={result.value}>
                {/* selected value */}
                {values[formikKey] && values[formikKey].includes(result.value) && (
                  <View>
                    <Button
                      style={layout.buttonGroupButtonStyle}
                      key={result.value}
                      mode="contained"
                      onPress={() => {
                        const test = values[formikKey].filter((item) => item !== result.value);
                        setFieldValue(formikKey, test);
                      }}
                    >
                      <Text style={{ color: 'white' }}>{customForm ? result.label : I18n.t(result.label)}</Text>
                    </Button>
                  </View>
                )}
                {/* non-selected value */}
                {(!values[formikKey] || !(values[formikKey]).includes(result.value)) && (
                  <View style={stylesDefault}>
                    <Button
                      style={layout.buttonGroupButtonStyle}
                      key={result.value}
                      mode="outlined"
                      onPress={() => addArrayVal(result)}
                    >
                      <Text style={{ color: theme.colors.primary }}>
                        {customForm ? result.label : I18n.t(result.label)}
                      </Text>
                    </Button>
                  </View>
                )}
              </View>
            ))}
          </View>
          {/* text input option along with select option */}
          {data.options.map((result) => (
            <View key={result.value}>
              {result.text === true && values[formikKey]
                && values[formikKey].includes(result.value) && (
                  <View style={stylesDefault} key={result.textKey}>
                    <TextInput
                      label={customForm ? result.label : I18n.t(result.label)}
                      onChangeText={handleChange(result.textKey)}
                      onBlur={handleBlur(result.textKey)}
                      {...rest} //eslint-disable-line
                      mode="outlined"
                      theme={{ colors: { placeholder: theme.colors.primary }, text: 'black' }}
                    />
                    <Text style={{ color: 'red' }}>
                      {errors[result.textKey]}
                    </Text>
                  </View>
              )}
            </View>
          ))}
          <Text style={{ color: 'red' }}>
            {errors[formikKey]}
          </Text>
        </View>
      )}
      {fieldType === 'autofill' && (
        <View key={formikKey}>
          <AutoFill
            parameter={data.parameter}
            formikProps={formikProps}
            formikKey={formikKey}
            label={label}
            translatedLabel={translatedLabel}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
          />
          <Text style={{ color: 'red' }}>
            {errors[formikKey]}
          </Text>
        </View>
      )}
      {fieldType === 'geolocation' && (
        <View key={formikKey}>
          {location === null && (
            <PaperButton
              onPressEvent={handleLocation}
              buttonText="Get Location"
            />
          )}
          {location !== null && (
            <View>
              <PaperButton
                onPressEvent={handleLocation}
                buttonText="Get Location Again"
              />
              <View style={{ marginLeft: 'auto', marginRight: 'auto', flexDirection: 'row' }}>
                {
                  locationLoading === true
                  && <Spinner color={theme.colors.primary} />
                }
                {locationLoading === false
                  && (
                    <View>
                      <Headline>
                        {`(${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)})`}
                      </Headline>
                    </View>
                  )}
              </View>
              <Text style={{ color: 'red' }}>
                {errors[formikKey]}
              </Text>
            </View>
          )}
        </View>
      )}
      {fieldType === 'household' && (
        <View key={formikKey}>
          <HouseholdManager
            formikProps={formikProps}
            formikKey={formikKey}
            surveyingOrganization={surveyingOrganization}
            values={values}
          />
        </View>
      )}
      {fieldType === 'header' && (
        <View key={translatedLabel} style={stylesDefault.container}>
          <Headline style={stylesDefault.header}>{translatedLabel}</Headline>
          <View
            style={stylesDefault.horizontalLine}
          />
        </View>
      )}
      {fieldType === 'multiInputRow' && (
        <View style={stylesDefault.container}>
          <Text style={stylesDefault.label}>{translatedLabel}</Text>
          <View style={stylesDefault.multiInputContainer}>
            {data.options.map((result) => (result.textSplit ? (
              <View key={`${result}`} style={{ flex: 1 }}>
                <Text style={styleX.textSplit}>{result.label}</Text>
              </View>
            ) : (
              <View key={result.value} style={stylesDefault.inputItem}>
                <TextInput
                  label={customForm ? result.label : I18n.t(result.label)}
                  onChangeText={handleChange(customForm ? result.label : I18n.t(result.label))}
                  onBlur={handleBlur(customForm ? result.label : I18n.t(result.label))}
                    {...rest} //eslint-disable-line
                  mode="outlined"
                  theme={{ colors: { placeholder: theme.colors.primary }, text: 'black' }}
                />
                <Text style={{ color: 'red' }}>
                  {errors[customForm ? result.label : I18n.t(result.label)]}
                </Text>
              </View>
            )))}
          </View>
        </View>
      )}
      {
        fieldType === 'multiInputRowNum' && (
          <View style={stylesDefault.container}>
            <Text style={stylesDefault.label}>{translatedLabel}</Text>
            <View style={stylesDefault.multiInputContainer}>
              {data.options.map((result) => (result.textSplit ? (
                <View key={`${result}`} style={{ flex: 1 }}>
                  <Text style={styleX.textSplit}>{result.label}</Text>
                </View>
              ) : (
                <View key={result.value} style={stylesDefault.inputItem}>
                  <TextInput
                    label={customForm ? result.label : I18n.t(result.label)}
                    onChangeText={handleChange(result.value)}
                    onBlur={handleBlur(result.value)}
                      {...rest} //eslint-disable-line
                    mode="outlined"
                    keyboardType="numeric"
                    maxLength={result.maxLength ? result.maxLength : null}
                    theme={{ colors: { placeholder: theme.colors.primary }, text: 'black' }}
                  />
                  <Text style={{ color: 'red' }}>
                    {errors[result.value]}
                  </Text>
                </View>
              )))}
            </View>
          </View>
        )
      }
    </>
  );
};

export default PaperInputPicker;
