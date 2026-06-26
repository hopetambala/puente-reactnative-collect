import FormGallery from "@app/domains/DataCollection/FormGallery";
import { puenteForms } from "@app/domains/DataCollection/formsConfig";
import { CoachmarkOverlay } from "@app/domains/HomeScreen/components/CoachmarkOverlay";
import { UserContext } from "@context/auth.context";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import checkOnlineStatus from "@modules/offline";
import { createLayoutStyles, spacing, typography } from "@modules/theme";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const galleryScreenStyles = StyleSheet.create({
  offlineBanner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: "#fff3e0",
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#f57c00",
  },
});

function DataCollectionGalleryScreen({ navigation }) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const [scrollViewScroll, setScrollViewScroll] = useState();
  const [loading, setLoading] = useState(false);
  const [pinnedForms, setPinnedForms] = useState([]);
  const [surveyingOrganization, setSurveyingOrganization] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  const { user } = useContext(UserContext);

  useEffect(() => {
    checkOnlineStatus().then((online) => setIsOffline(!online));
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkOnlineStatus().then((online) => setIsOffline(!online));
      getData("currentUser").then((currentUser) => {
        if (!currentUser) return;
        setSurveyingOrganization(currentUser.organization || "");
      });
      getData("pinnedForms").then((forms) => {
        if (forms) setPinnedForms(forms);
      });
    }, [user])
  );

  const navigateToNewRecord = (formTag, surveyee) => {
    navigation.navigate("DataCollectionForms", {
      formTag: formTag || "id",
      surveyee: surveyee || {},
    });
  };

  const navigateToCustomForm = (form, surveyee) => {
    navigation.navigate("DataCollectionForms", {
      formTag: "custom",
      customForm: form,
      surveyee: surveyee || {},
    });
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
        {loading === true && <ActivityIndicator />}
        {isOffline && (
          <View style={galleryScreenStyles.offlineBanner}>
            <Text style={galleryScreenStyles.offlineBannerText}>
              {I18n.t("forms.offlineBanner")}
            </Text>
          </View>
        )}
        <ScrollView
          keyboardShouldPersistTaps="never"
          scrollEnabled={scrollViewScroll}
          style={layout.screenContainer}
        >
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
            <Text style={{ ...typography.heading2, fontWeight: "bold", color: theme.colors.onSurface, marginTop: spacing.sm }}>
              {I18n.t("dataCollection.collectData")}
            </Text>
          </View>
          <FormGallery
            navigateToNewRecord={navigateToNewRecord}
            puenteForms={puenteForms}
            navigateToCustomForm={navigateToCustomForm}
            setLoading={setLoading}
            surveyingOrganization={surveyingOrganization}
            pinnedForms={pinnedForms}
            setPinnedForms={setPinnedForms}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <CoachmarkOverlay
        seenKey="collect"
        icon="add-circle-outline"
        title={I18n.t("coachmarks.collectTitle")}
        description={I18n.t("coachmarks.collectDescription")}
      />
    </SafeAreaView>
  );
}

export default DataCollectionGalleryScreen;
