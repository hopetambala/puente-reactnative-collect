import PostSubmissionSVG from "@app/assets/graphics/static/Submission-Page-Icon.svg";
import GdprCompliance from "@app/domains/DataCollection/GdprCompliance";
import ResidentIdSearchbar from "@impacto-design-system/Extensions/ResidentIdSearchbar";
import I18n from "@modules/i18n";
import { layout, theme } from "@modules/theme";
import React, { useState } from "react";
import {
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, Card, Text } from "react-native-paper";

import IdentificationForm from "./IdentificationForm";
import styles from "./index.styles";
import SupplementaryForm from "./SupplementaryForm";

function Forms(props) {
  const {
    navigation,
    navigateToGallery,
    navigateToCustomForm,
    selectedForm,
    setSelectedForm,
    navigateToNewRecord,
    scrollViewScroll,
    setScrollViewScroll,
    pinnedForms,
    surveyingUser,
    surveyingOrganization,
    surveyee,
    setSurveyee,
    customForm,
    navigateToRoot,
  } = props;

  const [consent, setConsent] = useState(false);

  return (
    <View style={layout.screenContainer}>
      {consent === true && selectedForm === "id" && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <IdentificationForm
            navigation={navigation}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
            setSelectedForm={setSelectedForm}
            setSurveyee={setSurveyee}
            surveyingOrganization={surveyingOrganization}
            surveyingUser={surveyingUser}
          />
        </TouchableWithoutFeedback>
      )}
      {consent === true && selectedForm !== "id" && selectedForm !== "" && (
        <View>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View>
              <View style={layout.container}>
                <ResidentIdSearchbar
                  surveyee={surveyee}
                  setSurveyee={setSurveyee}
                  surveyingOrganization={surveyingOrganization}
                />
              </View>
              <SupplementaryForm
                navigation={navigation}
                selectedForm={selectedForm}
                setSelectedForm={setSelectedForm}
                surveyee={surveyee}
                surveyingUser={surveyingUser}
                surveyingOrganization={surveyingOrganization}
                customForm={customForm}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}
      {consent === false && (
        <GdprCompliance navigation={navigation} setConsent={setConsent} />
      )}
      {selectedForm === "" && (
        <View>
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <PostSubmissionSVG width={350} height={350} />
            <Text
              style={{
                color: theme.colors.primary,
                fontSize: 25,
                fontWeight: "bold",
              }}
            >
              {I18n.t("forms.successfullySubmitted")}
            </Text>
            <Text style={{ fontSize: 15, marginTop: 10, marginBottom: 10 }}>
              {I18n.t("forms.grabCoffee")}
            </Text>
          </View>
          <View style={layout.container}>
            <Text style={{ fontSize: 15, marginBottom: 5 }}>
              {I18n.t("forms.suggestedForms")}
            </Text>
            <ScrollView horizontal>
              {pinnedForms &&
                pinnedForms.map((form) => {
                  const {
                    objectId,
                    tag,
                    name,
                    customForm: isCustomForm,
                  } = form;
                  const formName = isCustomForm ? name : I18n.t(name);
                  return (
                    <Card
                      key={objectId ?? tag}
                      style={layout.cardSmallStyle}
                      onPress={() => {
                        if (!form.tag) return navigateToCustomForm(form);
                        return navigateToNewRecord(tag);
                      }}
                    >
                      <View style={styles.cardContainer}>
                        <View style={styles.textContainer}>
                          <Text style={styles.text}>{formName}</Text>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              {pinnedForms.length < 1 && (
                <View style={layout.screenRow}>
                  <Card>
                    <Card.Title title={I18n.t("formsGallery.noPinnedForms")} />
                  </Card>
                </View>
              )}
            </ScrollView>
            <Button mode="contained" onPress={navigateToGallery}>
              <Text style={{ color: "white" }}>
                {I18n.t("forms.viewGallery")}
              </Text>
            </Button>
            <Button
              mode="text"
              onPress={navigateToRoot}
              style={{ marginTop: 5 }}
            >
              <Text style={{ color: theme.colors.primary }}>
                {I18n.t("forms.returnHome")}
              </Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

export default Forms;
