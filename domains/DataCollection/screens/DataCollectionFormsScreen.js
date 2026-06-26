import Forms from "@app/domains/DataCollection/Forms";
import { UserContext } from "@context/auth.context";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import { createLayoutStyles } from "@modules/theme";
import { getTokens } from "@modules/theme/tokens";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const t = getTokens("light");
const screenStyles = StyleSheet.create({
  headingContainer: {
    paddingHorizontal: t.tkDliteSemanticSpacing400, // spacing.md = 16px
    paddingVertical: t.tkDliteSemanticSpacing300, // spacing.sm = 12px
    marginTop: t.tkDliteSemanticSpacing200, // spacing.xs ~10px, using 200=8px (closest token)
  },
  offlineBanner: {
    paddingHorizontal: t.tkDliteSemanticSpacing400,
    paddingVertical: t.tkDliteSemanticSpacing300,
    backgroundColor: "#fff3e0",
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#f57c00",
  },
});

function DataCollectionFormsScreen({ navigation, route }) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const [scrollViewScroll, setScrollViewScroll] = useState();
  const [selectedForm, setSelectedForm] = useState(route?.params?.formTag || "id");
  const [customForm, setCustomForm] = useState(route?.params?.customForm);
  const [surveyee, setSurveyee] = useState(route?.params?.surveyee || {});
  const [pinnedForms, setPinnedForms] = useState([]);
  const [surveyingOrganization, setSurveyingOrganization] = useState("");
  const [surveyingUser, setSurveyingUser] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  const { user } = useContext(UserContext);

  useEffect(() => {
    checkOnlineStatus().then((online) => setIsOffline(!online));
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkOnlineStatus().then((online) => setIsOffline(!online));

      if (route?.params?.formTag) {
        setSelectedForm(route.params.formTag);
      }
      if (route?.params?.customForm) {
        setCustomForm(route.params.customForm);
      }
      if (route?.params?.surveyee) {
        setSurveyee(route.params.surveyee);
      }

      getData("currentUser").then((currentUser) => {
        if (!currentUser) return;
        setSurveyingUser(`${currentUser.firstname || ""} ${currentUser.lastname || ""}`);
        setSurveyingOrganization(currentUser.organization || "");
      });

      getData("pinnedForms").then((forms) => {
        if (forms) {
          // Deduplicate forms
          const seen = new Set();
          const dedupedForms = forms.filter((form) => {
            const key = form.objectId || form.tag;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setPinnedForms(dedupedForms);
        }
      });
    }, [route?.params, user])
  );

  const navigateToGallery = () => {
    navigation.navigate("DataCollectionGallery");
  };

  const navigateToRoot = () => {
    navigation.navigate("DataCollectionGallery");
  };

  const navigateToNewRecord = (formTag, surveyeePerson) => {
    setSelectedForm(formTag || "id");
    setSurveyee(surveyeePerson || surveyee);
    setCustomForm(undefined);
  };

  const navigateToCustomForm = (form, surveyeePerson) => {
    setSelectedForm("custom");
    setCustomForm(form || "");
    setSurveyee(surveyeePerson || surveyee);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={layout.screenContainer}
      onStartShouldSetResponderCapture={() => {
        setScrollViewScroll(true);
      }}
    >
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={layout.screenContainer}
      >
        {isOffline && (
          <View style={screenStyles.offlineBanner}>
            <Text style={screenStyles.offlineBannerText}>
              {I18n.t("forms.offlineBanner")}
            </Text>
          </View>
        )}
        <ScrollView
          scrollEnabled={scrollViewScroll}
          style={layout.screenContainer}
        >
          <View style={screenStyles.headingContainer}>
            <Text variant="headlineMedium" style={{ fontWeight: "bold" }}>
              {I18n.t("dataCollection.collectData")}
            </Text>
          </View>
          <Button icon="arrow-left" width={100} onPress={navigateToRoot}>
            <Text>{I18n.t("dataCollection.back")}</Text>
          </Button>
          <Forms
            navigation={navigation}
            scrollViewScroll={scrollViewScroll}
            setScrollViewScroll={setScrollViewScroll}
            navigateToGallery={navigateToGallery}
            navigateToNewRecord={navigateToNewRecord}
            navigateToRoot={navigateToRoot}
            navigateToCustomForm={navigateToCustomForm}
            selectedForm={selectedForm}
            setSelectedForm={setSelectedForm}
            surveyingUser={surveyingUser}
            surveyingOrganization={surveyingOrganization}
            surveyee={surveyee}
            setSurveyee={setSurveyee}
            customForm={customForm}
            pinnedForms={pinnedForms}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default DataCollectionFormsScreen;
