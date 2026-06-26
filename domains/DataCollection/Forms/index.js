import PostSubmissionSVG from "@app/assets/graphics/static/Submission-Page-Icon.svg";
import GdprCompliance from "@app/domains/DataCollection/GdprCompliance";
import ModernCard from "@impacto-design-system/Cards/ModernCard";
import ResidentIdSearchbar from "@impacto-design-system/Extensions/ResidentIdSearchbar";
import I18n from "@modules/i18n";
import { createLayoutStyles, typography } from "@modules/theme";
import { getTokens } from "@modules/theme/tokens";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useState } from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import Animated, { Easing, Keyframe } from "react-native-reanimated";

import IdentificationForm from "./IdentificationForm";
import createStyles from "./index.styles";
import SupplementaryForm from "./SupplementaryForm";

const t = getTokens("light");
const inlineStyles = StyleSheet.create({
  successTitle: {
    fontWeight: "bold",
    fontSize: typography.heading3.fontSize, // typography.size.xl ~25px, using heading3=24px (closest token)
    // TODO(dlite): typography.size.xl (25px) has no exact token match, using heading3.fontSize=24px
  },
  grabCoffeeText: {
    fontSize: typography.body2.fontSize, // typography.size.md ~15px, using body2=14px (closest token)
    marginTop: t.tkDliteSemanticSpacing200, // spacing.xs ~10px, using 200=8px (closest token)
    marginBottom: t.tkDliteSemanticSpacing200, // spacing.xs ~10px, using 200=8px (closest token)
  },
  suggestedFormsText: {
    fontSize: typography.body2.fontSize, // typography.size.md ~15px, using body2=14px (closest token)
    marginBottom: t.tkDliteSemanticSpacing200, // spacing.xxs ~5px, using 200=8px (closest token)
    // TODO(dlite): spacing.xxs (5px) has no exact token match, using 200=8px
  },
  noPinnedFormsCard: {
    padding: t.tkDliteSemanticSpacing400, // spacing.md = 16px
  },
  returnHomeButton: {
    marginTop: t.tkDliteSemanticSpacing200, // spacing.xxs ~5px, using 200=8px (closest token)
    // TODO(dlite): spacing.xxs (5px) has no exact token match, using 200=8px
  },
});

// Spec §1 MEGA: success state entrance uses celebratory scale + fade // lint-animations-ignore
// GPU-safe: transform + opacity only
const SuccessEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.8 }] },
  60: { opacity: 1, transform: [{ scale: 1.05 }], easing: Easing.out(Easing.ease) },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.inOut(Easing.ease) },
});

function Forms(props) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const styles = createStyles(theme);
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
          <Animated.View
            entering={SuccessEntrance.duration(MOTION_TOKENS.duration.slow)}
            style={{ justifyContent: "center", alignItems: "center" }}
          >
            <PostSubmissionSVG width={350} height={350} />
            <Text
              style={[inlineStyles.successTitle, { color: theme.colors.primary }]}
            >
              {I18n.t("forms.successfullySubmitted")}
            </Text>
            <Text style={inlineStyles.grabCoffeeText}>
              {I18n.t("forms.grabCoffee")}
            </Text>
          </Animated.View>
          <View style={layout.container}>
            <Text style={inlineStyles.suggestedFormsText}>
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
                    <ModernCard
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
                    </ModernCard>
                  );
                })}
              {pinnedForms.length < 1 && (
                <View style={layout.screenRow}>
                  <ModernCard>
                    <View style={inlineStyles.noPinnedFormsCard}>
                      <Text>{"📌  "}{I18n.t("formsGallery.noPinnedForms")}</Text>
                    </View>
                  </ModernCard>
                </View>
              )}
            </ScrollView>
            <Button mode="contained" onPress={navigateToGallery}>
              <Text style={{ color: theme.colors.onSurface }}>
                {I18n.t("forms.viewGallery")}
              </Text>
            </Button>
            <Button
              mode="text"
              onPress={navigateToRoot}
              style={inlineStyles.returnHomeButton}
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
