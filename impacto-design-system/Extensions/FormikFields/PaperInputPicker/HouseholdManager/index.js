import ResidentIdSearchbar from "@impacto-design-system/Extensions/ResidentIdSearchbar";
import { postHousehold } from "@modules/cached-resources";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useCallback,useState } from "react";
import { Modal, View } from "react-native";
import {   Appbar,
  Button,
  RadioButton,
  Text,
  TextInput,
useTheme ,
} from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import styles from "./index.style";

function HouseholdManager(props) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const { formikProps, formikKey, surveyingOrganization, values } = props;
  const { setFieldValue, handleBlur, handleChange, errors } = formikProps;
  const [relationships] = useState([
    "Parent",
    "Sibling",
    "Grand-Parent",
    "Cousin",
    "Other",
  ]);
  const [relationship, setRelationship] = useState("");
  const [selectPerson, setSelectPerson] = useState();
  const [modalView, setModalView] = useState("unset");
  const [householdSet, setHouseholdSet] = useState(false);

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

  const onSubmit = () => {
    if (!selectPerson) {
      alert("You must search and select an individual."); //eslint-disable-line
    } else if (relationship === "") {
      alert("You must select a role/relationship in the household."); //eslint-disable-line
    } else {
      setModalView("third");
      attachToExistingHousehold();
      postHouseholdRelation();
    }
  };

  const attachToExistingHousehold = () => {
    // set householdId (from selectPerson) on the residentIdForm
    setFieldValue(
      formikKey,
      selectPerson.householdId || "No Household Id Found"
    );
  };

  const postHouseholdRelation = () => {
    let finalRelationship = relationship;
    if (relationship === "Other") {
      finalRelationship += `__${values.other}`;
    }
    const postParams = {
      parseParentClassID: selectPerson.householdId,
      parseParentClass: "Household",
      parseClass: "Household",
      localObject: {
        relationship: finalRelationship,
        latitude: 0,
        longitude: 0,
      },
    };

    postHousehold(postParams).then((result) => {
      // Online: result is a string id; Offline: result is an array of household objects
      const objectId = typeof result === "string"
        ? result
        : result[result.length - 1]?.localObject?.objectId;
      setFieldValue(formikKey, objectId);
    }).catch((e) => {
      console.log(e); //eslint-disable-line
      alert(I18n.t("submissionError.error")); //eslint-disable-line
    });
  };

  const createNewHousehold = () => {
    // create new householdId and attach on the residentIdForm
    const postParams = {
      parseClass: "Household",
      localObject: {
        latitude: 0,
        longitude: 0,
      },
    };
    postHousehold(postParams).then((result) => {
      // Online: result is a string id; Offline: result is an array of household objects
      const objectId = typeof result === "string"
        ? result
        : result[result.length - 1]?.localObject?.objectId;
      setFieldValue(formikKey, objectId);
    }).catch((e) => {
      console.log(e); //eslint-disable-line
      alert(I18n.t("submissionError.error")); //eslint-disable-line
    });
    setHouseholdSet(true);
  };

  return (
    <View style={layout.formContainer}>
      {modalView !== "second" && modalView !== "third" && (
        <View>
          {!householdSet && modalView !== "zero" && (
            <RadioButton.Group
              onValueChange={(value) => {
                setModalView(value);
              }}
              value={modalView}
            >
              <RadioButton.Item
                label={I18n.t("householdManager.doNothing")}
                value="zero"
              />
              <RadioButton.Item
                label={I18n.t("householdManager.createHousehold")}
                value="first"
              />
              {modalView === "first" && (
                <Button
                  style={layout.buttonGroupButtonStyle}
                  icon="plus"
                  mode="contained"
                  onPress={createNewHousehold}
                >
                  {I18n.t("householdManager.household")}
                </Button>
              )}
              <RadioButton.Item
                label={I18n.t("householdManager.linkIndividual")}
                value="second"
              />
            </RadioButton.Group>
          )}
          {householdSet && modalView === "first" && (
            <Text>{I18n.t("householdManager.successCreateHousehold")}</Text>
          )}
          {modalView === "zero" && (
            <View>
              <Text>{I18n.t("householdManager.noHousehold")}</Text>
              <Button
                style={{ marginTop: 10 }}
                onPress={() => setModalView("")}
              >
                {I18n.t("householdManager.addCreateHousehold")}
              </Button>
            </View>
          )}
        </View>
      )}

      {modalView === "second" && (
        <Modal animationType="slide" visible>
          <Appbar.Header style={{ backgroundColor: theme.colors.surfaceRaised }}>
            <Appbar.BackAction onPress={() => setModalView("first")} />
            <Appbar.Content
              title={I18n.t("householdManager.householdManager")}
              subtitle=""
              titleStyle={{ fontSize: 20, fontWeight: "bold" }}
            />
          </Appbar.Header>

          <View style={styles.container}>
            <ResidentIdSearchbar
              surveyee={selectPerson}
              setSurveyee={setSelectPerson}
              surveyingOrganization={surveyingOrganization}
            />
            {!selectPerson && (
              <Text style={{ fontWeight: "bold", padding: 10 }}>
                {I18n.t("householdManager.useSearchBar")}
              </Text>
            )}
            {selectPerson && (
              <Text>{I18n.t("householdManager.relationshipHousehold")}</Text>
            )}
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {selectPerson &&
                relationships.map((result) => (
                  <View key={result} style={layout.buttonGroupButtonStyle}>
                    {relationship === result ? (
                      <Button mode="contained">{result}</Button>
                    ) : (
                      <Button
                        mode="outlined"
                        onPress={() => setRelationship(result)}
                      >
                        {result}
                      </Button>
                    )}
                  </View>
                ))}
            </View>
            {relationship === "Other" && (
              <Animated.View style={focusLiftStyle}>
                <TextInput
                  label={I18n.t("global.other")}
                  onChangeText={handleChange("other")}
                  onBlur={(e) => {
                    handleInputBlur();
                    handleBlur("other");
                  }}
                  onFocus={handleInputFocus}
                  mode="outlined"
                  theme={{
                    colors: { placeholder: theme.colors.primary },
                    text: theme.colors.textPrimary,
                  }}
                />
                <Text style={{ color: theme.colors.error }}>{errors.other}</Text>
              </Animated.View>
            )}
            {selectPerson ? (
              <Button
                style={{ marginTop: 10 }}
                theme={{ backgroundColor: theme.colors.primary }}
                mode="contained"
                onPress={onSubmit}
              >
                {I18n.t("global.submit")}
              </Button>
            ) : (
              <Button
                theme={{ backgroundColor: theme.colors.primary }}
                mode="contained"
                onPress={onSubmit}
                disabled
              >
                {I18n.t("global.submit")}
              </Button>
            )}
          </View>
        </Modal>
      )}
      {modalView === "third" && (
        <View>
          <RadioButton.Group
            onValueChange={(value) => setModalView(value)}
            value={modalView}
          >
            <RadioButton.Item
              label={I18n.t("householdManager.linked")}
              value="third"
            />
          </RadioButton.Group>
        </View>
      )}
    </View>
  );
}

export default HouseholdManager;
