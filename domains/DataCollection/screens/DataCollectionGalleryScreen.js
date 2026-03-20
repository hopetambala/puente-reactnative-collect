import FormGallery from "@app/domains/DataCollection/FormGallery";
import { puenteForms } from "@app/domains/DataCollection/formsConfig";
import { UserContext } from "@context/auth.context";
import { Header } from "@impacto-design-system/Extensions";
import { getData } from "@modules/async-storage";
import { layout } from "@modules/theme";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

function DataCollectionGalleryScreen({ navigation }) {
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

  const openSettings = () => navigation.navigate("Settings");

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
    <View
      style={layout.screenContainer}
      onStartShouldSetResponderCapture={() => {
        setScrollViewScroll(true);
      }}
    >
      <Header onOpenSettings={openSettings} />
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {loading === true && <ActivityIndicator />}
        <ScrollView
          keyboardShouldPersistTaps="never"
          scrollEnabled={scrollViewScroll}
        >
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
    </View>
  );
}

export default DataCollectionGalleryScreen;
