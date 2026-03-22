import FormGallery from "@app/domains/DataCollection/FormGallery";
import { puenteForms } from "@app/domains/DataCollection/formsConfig";
import { UserContext } from "@context/auth.context";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

function DataCollectionGalleryScreen({ navigation }) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const [scrollViewScroll, setScrollViewScroll] = useState();
  const [loading, setLoading] = useState(false);
  const [pinnedForms, setPinnedForms] = useState([]);
  const [surveyingOrganization, setSurveyingOrganization] = useState("");

  const { user } = useContext(UserContext);

  useFocusEffect(
    useCallback(() => {
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
        <ScrollView
          keyboardShouldPersistTaps="never"
          scrollEnabled={scrollViewScroll}
          style={layout.screenContainer}
        >
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text variant="headlineMedium" style={{ fontWeight: "bold", marginTop: 10 }}>
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
    </SafeAreaView>
  );
}

export default DataCollectionGalleryScreen;
