import UseCameraRoll from "@impacto-design-system/Multimedia/CameraRoll";
import UseCamera from "@impacto-design-system/Multimedia/UseCamera";
import I18n from "@modules/i18n";
import { layout, theme } from "@modules/theme";
import * as React from "react";
import { Image, Text, TouchableWithoutFeedback, View } from "react-native";
import { Button, Headline, TextInput } from "react-native-paper";

import AutoFill from "./AutoFill";
import AutoFillMS from "./AutoFillMS";
import Geolocation from "./Geolocation";
import HouseholdManager from "./HouseholdManager";
import {
  styleButton,
  styles,
  stylesDefault,
  stylesPaper,
  styleX,
} from "./index.style";
import Looper from "./Looper";

const PaperInputPicker = ({
  data,
  formikProps,
  scrollViewScroll,
  setScrollViewScroll,
  surveyingOrganization,
  customForm,
  config,
  loopsAdded,
  setLoopsAdded,
  ...rest
}) => {
  const { label, formikKey, fieldType, sideLabel } = data;

  const { handleChange, handleBlur, errors, setFieldValue, values } =
    formikProps;

  const translatedLabel = customForm ? label : I18n.t(label);
  const translatedLabelSide = customForm ? sideLabel : I18n.t(sideLabel);
  // const dateOfBirth = values[formikKey].split('/', 3); // ACCOUNT FOR NULL DOB

  const addArrayVal = (result) => {
    if (values[formikKey] || values[formikKey] === []) {
      setFieldValue(formikKey, values[formikKey].concat([result.value]));
    } else {
      setFieldValue(formikKey, [result.value]);
    }
  };

  const [cameraVisible, setCameraVisible] = React.useState(false);
  const [pictureUris, setPictureUris] = React.useState({});
  const [image, setImage] = React.useState(null);

  const [additionalQuestions, setAdditionalQuestions] = React.useState([]);

  React.useEffect(() => {
    // setInputs(configArray.fields);
    if (fieldType === 'select' && values[formikKey]) setFieldValue(values[formikKey]);

    if (fieldType === 'photo' && values[formikKey]) setImage(values[formikKey]);
  }, [data]);

  return (
    <>
      {fieldType === "input" && (
        <View style={stylesDefault.container} key={formikKey}>
          {translatedLabel.length > 30 && (
            <Text style={stylesDefault.label}>{translatedLabel}</Text>
          )}
          <TextInput
            label={translatedLabel.length > 30 ? "" : translatedLabel}
            onChangeText={handleChange(formikKey)}
            onBlur={handleBlur(formikKey)}
            {...rest} //eslint-disable-line
            mode="outlined"
            theme={stylesPaper}
            style={stylesDefault.label}
          />
          <Text style={{ color: "red" }}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "numberInput" && (
        <View style={stylesDefault.container} key={formikKey}>
          {translatedLabel.length > 30 && (
            <Text
              style={[
                stylesDefault.label,
                {
                  bottom: -15,
                  zIndex: 1,
                  left: 5,
                  padding: 5,
                },
              ]}
            >
              {translatedLabel}
            </Text>
          )}
          <TextInput
            label={translatedLabel.length > 30 ? "" : translatedLabel}
            onChangeText={handleChange(formikKey)}
            onBlur={handleBlur(formikKey)}
            {...rest} //eslint-disable-line
            mode="outlined"
            keyboardType="numeric"
            defaultValue={_.isEmpty(formikProps.values) ? '' : values[formikKey]}
            theme={stylesPaper}
            style={stylesDefault.label}
          />
          <Text style={{ color: "red" }}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "inputSideLabel" && (
        <View style={stylesDefault.container} key={formikKey}>
          <View style={{ flexDirection: "row" }}>
            <TextInput
              label={translatedLabel}
              onChangeText={handleChange(formikKey)}
              onBlur={handleBlur(formikKey)}
              {...rest} //eslint-disable-line
              mode="outlined"
              theme={{
                colors: { placeholder: theme.colors.primary },
                text: "black",
              }}
              style={{ flex: 1 }}
            />
            <Text style={styleX.sideLabel}>{translatedLabelSide}</Text>
          </View>
          <Text style={{ color: "red" }}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "inputSideLabelNum" && (
        <View style={stylesDefault} key={formikKey}>
          <View style={{ flexDirection: "row" }}>
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
          <Text style={{ color: "red" }}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "inputSideLabelTextQuestNumber" && (
        <View style={stylesDefault} key={formikKey}>
          <Text style={stylesDefault.label}>{translatedLabel}</Text>
          <View style={{ flexDirection: "row" }}>
            <TextInput
              onChangeText={handleChange(formikKey)}
              onBlur={handleBlur(formikKey)}
              {...rest} //eslint-disable-line
              mode="outlined"
              keyboardType="numeric"
              theme={{
                colors: { placeholder: theme.colors.primary },
                text: "black",
              }}
              style={{ flex: 1 }}
            />
            <Text style={styleX.sideLabel}>{translatedLabelSide}</Text>
          </View>
          <Text style={{ color: "red" }}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "inputSideBySideLabel" && (
        <View style={stylesDefault} key={formikKey}>
          <View style={{ flexDirection: "row" }}>
            <TextInput
              label={translatedLabel}
              onChangeText={handleChange(formikKey)}
              onBlur={handleBlur(formikKey)}
              {...rest} //eslint-disable-line
              mode="outlined"
              theme={{
                colors: { placeholder: theme.colors.primary },
                text: "black",
              }}
              style={{ flex: 1 }}
            />
            <Text style={styleX.sideLabel}>{translatedLabelSide}</Text>
            <TextInput
              label={translatedLabel}
              onChangeText={handleChange(formikKey)}
              onBlur={handleBlur(formikKey)}
              {...rest} //eslint-disable-line
              mode="outlined"
              theme={{
                colors: { placeholder: theme.colors.primary },
                text: "black",
              }}
              style={{ flex: 1 }}
            />
          </View>
          <Text style={{ color: "red" }}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "select" && (
        <View key={formikKey} style={stylesDefault.container}>
          <Text style={[layout.selectLabel, stylesDefault.label]}>
            {translatedLabel}
          </Text>
          <View style={layout.buttonGroupContainer}>
            {data.options.map((result) => (
              <View key={result.value}>
                {/* selected value */}
                {result.value === values[formikKey] && (
                  <TouchableWithoutFeedback
                    OnPress={() => setFieldValue(formikKey, result.value)}
                  >
                    <View style={styleButton.selected}>
                      <View style={styles.button}>
                        <Text style={{ color: "white" }}>
                          {customForm ? result.label : I18n.t(result.label)}
                        </Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                )}
                {/* non-selected value */}
                {result.value !== values[formikKey] && (
                  <TouchableWithoutFeedback
                    onPress={() => setFieldValue(formikKey, result.value)}
                  >
                    <View style={styleButton.unselected}>
                      <Text style={{ color: theme.colors.primary }}>
                        {customForm ? result.label : I18n.t(result.label)}
                      </Text>
                    </View>
                  </TouchableWithoutFeedback>
                )}
              </View>
            ))}
          </View>
          {/* text input option along with select option */}
          {data.options.map((result) => (
            <View key={result.value}>
              {result.text === true && result.value === values[formikKey] && (
                <View style={stylesDefault} key={result.textKey}>
                  {result.textQuestion !== undefined &&
                    result.textQuestion.length > 0 && (
                      <Text>
                        {customForm
                          ? result.textQuestion
                          : I18n.t(result.textQuestion)}
                      </Text>
                    )}
                  <TextInput
                    label={customForm ? result.label : I18n.t(result.label)}
                    onChangeText={handleChange(result.textKey)}
                    onBlur={handleBlur(result.textKey)}
                    {...rest} //eslint-disable-line
                    mode="outlined"
                    theme={{
                      colors: { placeholder: theme.colors.primary },
                      text: "black",
                    }}
                  />
                  <Text style={{ color: "red" }}>{errors[result.textKey]}</Text>
                </View>
              )}
            </View>
          ))}
          <Text style={{ color: "red" }}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "selectMulti" && (
        <View key={formikKey} style={stylesDefault.container}>
          <Text style={[layout.selectLabel, stylesDefault.label]}>
            {translatedLabel}
          </Text>
          <View style={layout.buttonGroupContainer}>
            {data.options.map((result) => (
              <View key={result.value}>
                {/* selected value */}
                {values[formikKey] &&
                  values[formikKey].includes(result.value) && (
                    <View>
                      <TouchableWithoutFeedback
                        onPress={() => {
                          const test = values[formikKey].filter(
                            (item) => item !== result.value
                          );
                          setFieldValue(formikKey, test);
                        }}
                      >
                        <View style={styleButton.selected}>
                          <View style={styles.button}>
                            <Text style={{ color: "white" }}>
                              {customForm ? result.label : I18n.t(result.label)}
                            </Text>
                          </View>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  )}
                {/* non-selected value */}
                {(!values[formikKey] ||
                  !values[formikKey].includes(result.value)) && (
                  <View style={stylesDefault}>
                    <TouchableWithoutFeedback
                      onPress={() => addArrayVal(result)}
                    >
                      <View style={styleButton.unselected}>
                        <Text style={{ color: theme.colors.primary }}>
                          {customForm ? result.label : I18n.t(result.label)}
                        </Text>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                )}
              </View>
            ))}
          </View>
          {/* text input option along with select option */}
          {data.options.map((result) => (
            <View key={result.value}>
              {result.text === true &&
                values[formikKey] &&
                values[formikKey].includes(result.value) && (
                  <View style={stylesDefault} key={result.textKey}>
                    {result.textQuestion !== undefined &&
                      result.textQuestion.length > 0 && (
                        <Text>
                          {customForm
                            ? result.textQuestion
                            : I18n.t(result.textQuestion)}
                        </Text>
                      )}
                    <TextInput
                      label={customForm ? result.label : I18n.t(result.label)}
                      onChangeText={handleChange(result.textKey)}
                      onBlur={handleBlur(result.textKey)}
                      {...rest} //eslint-disable-line
                      mode="outlined"
                      theme={{
                        colors: { placeholder: theme.colors.primary },
                        text: "black",
                      }}
                    />
                    <Text style={{ color: "red" }}>
                      {errors[result.textKey]}
                    </Text>
                  </View>
                )}
            </View>
          ))}
          <Text style={{ color: "red" }}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "autofill" && (
        <View key={formikKey}>
          <AutoFill
            parameter={data.parameter}
            formikProps={formikProps}
            formikKey={formikKey}
            label={label}
            initialValue={values[formikKey] ? values[formikKey] : ''}
            translatedLabel={translatedLabel}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
          />
          <Text style={{ color: "red" }}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "autofillms" && (
        <View key={formikKey}>
          <AutoFillMS
            parameter={data.parameter}
            formikProps={formikProps}
            formikKey={formikKey}
            label={label}
            translatedLabel={translatedLabel}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
          />
          <Text style={{ color: "red" }}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "geolocation" && (
        <Geolocation
          values={values}
          errors={errors}
          formikKey={formikKey}
          setFieldValue={setFieldValue}
        />
      )}
      {fieldType === "household" && (
        <View key={formikKey}>
          <HouseholdManager
            formikProps={formikProps}
            formikKey={formikKey}
            surveyingOrganization={surveyingOrganization}
            values={values}
          />
        </View>
      )}
      {fieldType === "header" && (
        <View key={translatedLabel} style={stylesDefault.container}>
          <Headline style={stylesDefault.header}>{translatedLabel}</Headline>
          <View style={stylesDefault.horizontalLine} />
        </View>
      )}
      {fieldType === "multiInputRow" && (
        <View style={stylesDefault.container}>
          <Text style={stylesDefault.label}>{translatedLabel}</Text>
          <View style={stylesDefault.multiInputContainer}>
            {data.options.map((result) =>
              result.textSplit ? (
                <View key={`${result}`} style={{ flex: 1 }}>
                  <Text style={styleX.textSplit}>{result.label}</Text>
                </View>
              ) : (
                <View key={result.value} style={stylesDefault.inputItem}>
                  <TextInput
                    label={customForm ? result.label : I18n.t(result.label)}
                    onChangeText={handleChange(
                      customForm ? result.label : I18n.t(result.label)
                    )}
                    onBlur={handleBlur(
                      customForm ? result.label : I18n.t(result.label)
                    )}
                    {...rest} //eslint-disable-line
                    mode="outlined"
                    theme={{
                      colors: { placeholder: theme.colors.primary },
                      text: "black",
                    }}
                  />
                  <Text style={{ color: "red" }}>
                    {errors[customForm ? result.label : I18n.t(result.label)]}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>
      )}
      {fieldType === "multiInputRowNum" && (
        <View style={stylesDefault.container}>
          <Text style={stylesDefault.label}>{translatedLabel}</Text>
          <View style={stylesDefault.multiInputContainer}>
            {data.options.map((result) =>
              result.textSplit ? (
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
                    theme={{
                      colors: { placeholder: theme.colors.primary },
                      text: "black",
                    }}
                  />
                  <Text style={{ color: "red" }}>{errors[result.value]}</Text>
                </View>
              )
            )}
          </View>
        </View>
      )}
      {fieldType === "photo" && (
        <View style={stylesDefault.container}>
          {!cameraVisible && image === null && (
            <View>
              <Text style={stylesDefault.labelImage}>{translatedLabel}</Text>
              <Button onPress={() => setCameraVisible(true)}>
                {I18n.t("paperButton.takePhoto")}
              </Button>
              <UseCameraRoll
                pictureUris={pictureUris}
                setPictureUris={setPictureUris}
                formikProps={formikProps}
                formikKey={formikKey}
                image={image}
                setImage={setImage}
              />
            </View>
          )}
          {!cameraVisible && image !== null && (
            <View>
              <Text style={stylesDefault.labelImage}>{translatedLabel}</Text>
              <Image
                source={{ uri: image }}
                style={{ width: "auto", height: 400 }}
              />
              <Button
                onPress={() => {
                  setCameraVisible(true);
                }}
              >
                {I18n.t("paperButton.takePhoto")}
              </Button>
              <UseCameraRoll
                pictureUris={pictureUris}
                setPictureUris={setPictureUris}
                formikProps={formikProps}
                formikKey={formikKey}
                image={image}
                setImage={setImage}
              />
            </View>
          )}
          {cameraVisible && (
            <View>
              <Text style={stylesDefault.labelImage}>{label}</Text>
              <UseCamera
                cameraVisible={cameraVisible}
                setCameraVisible={setCameraVisible}
                pictureUris={pictureUris}
                setPictureUris={setPictureUris}
                formikProps={formikProps}
                formikKey={formikKey}
                image={image}
                setImage={setImage}
              />
            </View>
          )}
        </View>
      )}
      {fieldType === "loop" && (
        <View key={formikKey}>
          {additionalQuestions !== undefined &&
            additionalQuestions.length !== 0 &&
            additionalQuestions.map((question) => (
              <PaperInputPicker
                data={question}
                formikProps={formikProps}
                customForm={customForm}
                config={config}
                loopsAdded={loopsAdded}
                setLoopsAdded={setLoopsAdded}
                surveyingOrganization={surveyingOrganization}
                scrollViewScroll={scrollViewScroll}
                setScrollViewScroll={setScrollViewScroll}
              />
            ))}
          <Looper
            data={data}
            config={config}
            additionalQuestions={additionalQuestions}
            setAdditionalQuestions={setAdditionalQuestions}
            translatedLabel={translatedLabel}
            loopsAdded={loopsAdded}
            setLoopsAdded={setLoopsAdded}
          />
        </View>
      )}
      {/* relies on function to clean the values prior to submission */}
      {fieldType === "loopSameForm" && (
        <View key={formikKey}>
          {additionalQuestions !== undefined &&
            additionalQuestions.length !== 0 &&
            additionalQuestions.map((question) => (
              <PaperInputPicker
                data={question}
                formikProps={formikProps}
                customForm={customForm}
                config={config}
                surveyingOrganization={surveyingOrganization}
                scrollViewScroll={scrollViewScroll}
                setScrollViewScroll={setScrollViewScroll}
              />
            ))}
          <Looper
            data={data}
            config={config}
            additionalQuestions={additionalQuestions}
            setAdditionalQuestions={setAdditionalQuestions}
            translatedLabel={translatedLabel}
            sameForm
          />
        </View>
      )}
    </>
  );
};

export default PaperInputPicker;
