import Forms from "@app/domains/DataCollection/Forms";
import { UserContext } from "@context/auth.context";
import { getData } from "@modules/async-storage";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const { user } = useContext(UserContext);

  useFocusEffect(
    useCallback(() => {
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
        if (forms) setPinnedForms(forms);
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
