import UseCameraRoll from "@impacto-design-system/Multimedia/CameraRoll";
import UseCamera from "@impacto-design-system/Multimedia/UseCamera";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import { MOTION_TOKENS } from "@modules/utils/animations";
import * as React from "react";
import { Image, TouchableWithoutFeedback, View } from "react-native";
import {
  Button,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import AutoFill from "./AutoFill";
import AutoFillMS from "./AutoFillMS";
import Geolocation from "./Geolocation";
import HouseholdManager from "./HouseholdManager";
import createPaperInputPickerStyles from "./index.style";
import Looper from "./Looper";

function PaperInputPicker({
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
}) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const {
    styleButton,
    styles,
    stylesDefault,
    stylesPaper,
    styleX,
  } = React.useMemo(() => createPaperInputPickerStyles(theme), [theme]);
  const { label, formikKey, fieldType, sideLabel } = data;

  const { handleChange, handleBlur, errors, setFieldValue, values } =
    formikProps;

  const translatedLabel = customForm ? label : I18n.t(label);
  const translatedLabelSide = customForm ? sideLabel : I18n.t(sideLabel);

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

  // Focus lift animation — spec §5.3: subtle scale lift on focus (spring.smooth)
  // GPU-safe: transform only (no shadow/layout properties)
  const focusScale = useSharedValue(1);
  const focusLiftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
  }));

  const handleInputFocus = React.useCallback(() => {
    focusScale.value = withSpring(1.01, MOTION_TOKENS.spring.smooth);
  }, [focusScale]);

  const handleInputBlur = React.useCallback(() => {
    focusScale.value = withSpring(1, MOTION_TOKENS.spring.smooth);
  }, [focusScale]);

  return (
    <>
      {fieldType === "input" && (
        <Animated.View style={focusLiftStyle}>
          <View style={stylesDefault.container} key={formikKey}>
            {translatedLabel.length > 30 && (
              <Text style={stylesDefault.label}>{translatedLabel}</Text>
            )}
            <TextInput
              label={translatedLabel.length > 30 ? "" : translatedLabel}
              onChangeText={handleChange(formikKey)}
              onBlur={(e) => {
                handleInputBlur();
                handleBlur(formikKey)(e);
              }}
              onFocus={handleInputFocus}
              value={String(values[formikKey] ?? '')}
              {...rest} //eslint-disable-line
              mode="outlined"
              theme={stylesPaper}
              style={stylesDefault.label}
            />
            <Text style={styles.redText}>{errors[formikKey]}</Text>
          </View>
        </Animated.View>
      )}
      {fieldType === "numberInput" && (
        <Animated.View style={focusLiftStyle}>
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
              onBlur={(e) => {
                handleInputBlur();
                handleBlur(formikKey)(e);
              }}
              onFocus={handleInputFocus}
              value={String(values[formikKey] ?? '')}
              {...rest} //eslint-disable-line
              mode="outlined"
              keyboardType="numeric"
              theme={stylesPaper}
              style={stylesDefault.label}
            />
            <Text style={styles.redText}>{errors[formikKey]}</Text>
          </View>
        </Animated.View>
      )}
      {fieldType === "inputSideLabel" && (
        <Animated.View style={focusLiftStyle}>
          <View style={stylesDefault.container} key={formikKey}>
            <View style={{ flexDirection: "row" }}>
              <TextInput
                label={translatedLabel}
                onChangeText={handleChange(formikKey)}
                onBlur={(e) => {
                  handleInputBlur();
                  handleBlur(formikKey)(e);
                }}
                onFocus={handleInputFocus}
                value={String(values[formikKey] ?? '')}
                {...rest} //eslint-disable-line
                mode="outlined"
                theme={{
                  colors: { placeholder: theme.colors.primary },
                }}
                style={{ flex: 1 }}
              />
              <Text style={styleX.sideLabel}>{translatedLabelSide}</Text>
            </View>
            <Text style={styles.redText}>{errors[formikKey]}</Text>
          </View>
        </Animated.View>
      )}
      {fieldType === "inputSideLabelNum" && (
        <Animated.View style={focusLiftStyle}>
          <View style={stylesDefault} key={formikKey}>
            <View style={{ flexDirection: "row" }}>
              <TextInput
                label={translatedLabel}
                onChangeText={handleChange(formikKey)}
                onBlur={(e) => {
                  handleInputBlur();
                  handleBlur(formikKey)(e);
                }}
                onFocus={handleInputFocus}
                value={String(values[formikKey] ?? '')}
                {...rest} //eslint-disable-line
                mode="outlined"
                keyboardType="numeric"
                theme={stylesPaper}
                style={{ flex: 1 }}
              />
              <Text style={styleX.sideLabel}>{translatedLabelSide}</Text>
            </View>
            {errors[formikKey] && (
              <Text style={styles.errorText}>
                {errors[formikKey]}
              </Text>
            )}
          </View>
        </Animated.View>
      )}
      {fieldType === "inputSideLabelTextQuestNumber" && (
        <Animated.View style={focusLiftStyle}>
          <View style={stylesDefault} key={formikKey}>
            <Text style={stylesDefault.label}>{translatedLabel}</Text>
            <View style={{ flexDirection: "row" }}>
              <TextInput
                onChangeText={handleChange(formikKey)}
                onBlur={(e) => {
                  handleInputBlur();
                  handleBlur(formikKey)(e);
                }}
                onFocus={handleInputFocus}
                value={String(values[formikKey] ?? '')}
                {...rest} //eslint-disable-line
                mode="outlined"
                keyboardType="numeric"
                theme={{
                  colors: { placeholder: theme.colors.primary },
                }}
                style={{ flex: 1 }}
              />
              <Text style={styleX.sideLabel}>{translatedLabelSide}</Text>
            </View>
            <Text style={styles.redText}>{errors[formikKey]}</Text>
          </View>
        </Animated.View>
      )}
      {fieldType === "inputSideBySideLabel" && (
        <Animated.View style={focusLiftStyle}>
          <View style={stylesDefault} key={formikKey}>
            <View style={{ flexDirection: "row" }}>
              <TextInput
                label={translatedLabel}
                onChangeText={handleChange(formikKey)}
                onBlur={(e) => {
                  handleInputBlur();
                  handleBlur(formikKey)(e);
                }}
                onFocus={handleInputFocus}
                {...rest} //eslint-disable-line
                mode="outlined"
                theme={{
                  colors: { placeholder: theme.colors.primary },
                }}
                style={{ flex: 1 }}
              />
              <Text style={styleX.sideLabel}>{translatedLabelSide}</Text>
              <TextInput
                label={translatedLabel}
                onChangeText={handleChange(formikKey)}
                onBlur={(e) => {
                  handleInputBlur();
                  handleBlur(formikKey)(e);
                }}
                onFocus={handleInputFocus}
                {...rest} //eslint-disable-line
                mode="outlined"
                theme={{
                  colors: { placeholder: theme.colors.primary },
                }}
                style={{ flex: 1 }}
              />
            </View>
            <Text style={styles.redText}>{errors[formikKey]}</Text>
          </View>
        </Animated.View>
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
                        <Text style={styles.whiteText}>
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
                      <Text style={styles.primaryText}>
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
                    }}
                  />
                  <Text style={styles.redText}>{errors[result.textKey]}</Text>
                </View>
              )}
            </View>
          ))}
          <Text style={styles.redText}>{errors[formikKey]}</Text>
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
                            <Text style={styles.whiteText}>
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
                        <Text style={styles.primaryText}>
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
                    <Text style={{ color: theme.colors.error }}>
                      {errors[result.textKey]}
                    </Text>
                  </View>
                )}
            </View>
          ))}
          <Text style={styles.redText}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "autofill" && (
        <View key={formikKey}>
          <AutoFill
            parameter={data.parameter}
            formikProps={formikProps}
            formikKey={formikKey}
            label={label}
            translatedLabel={translatedLabel}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
            theme={theme}
          />
          <Text style={styles.redText}>{errors[formikKey]}</Text>
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
            theme={theme}
          />
          <Text style={styles.redText}>{errors[formikKey]}</Text>
        </View>
      )}
      {fieldType === "geolocation" && (
        <Geolocation
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
          <Text variant="headlineMedium" style={stylesDefault.header}>{translatedLabel}</Text>
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
                <Animated.View key={result.value} style={[stylesDefault.inputItem, focusLiftStyle]}>
                  <TextInput
                    label={customForm ? result.label : I18n.t(result.label)}
                    onChangeText={handleChange(
                      customForm ? result.label : I18n.t(result.label)
                    )}
                    onBlur={(e) => {
                      handleInputBlur();
                      handleBlur(
                        customForm ? result.label : I18n.t(result.label)
                      )(e);
                    }}
                    onFocus={handleInputFocus}
                    {...rest} //eslint-disable-line
                    mode="outlined"
                    theme={{
                      colors: { placeholder: theme.colors.primary },
                    }}
                  />
                  <Text style={styles.redText}>
                    {errors[customForm ? result.label : I18n.t(result.label)]}
                  </Text>
                </Animated.View>
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
                <Animated.View key={result.value} style={[stylesDefault.inputItem, focusLiftStyle]}>
                  <TextInput
                    label={customForm ? result.label : I18n.t(result.label)}
                    onChangeText={handleChange(result.value)}
                    onBlur={(e) => {
                      handleInputBlur();
                      handleBlur(result.value)(e);
                    }}
                    onFocus={handleInputFocus}
                    value={String(values[result.value] ?? '')}
                    {...rest} //eslint-disable-line
                    mode="outlined"
                    keyboardType="numeric"
                    maxLength={result.maxLength ? result.maxLength : null}
                    theme={{
                      colors: { placeholder: theme.colors.primary },
                    }}
                  />
                  <Text style={styles.redText}>{errors[result.value]}</Text>
                </Animated.View>
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
}

export default PaperInputPicker;
