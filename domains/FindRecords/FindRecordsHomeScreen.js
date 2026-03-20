import { puenteForms } from "@app/domains/DataCollection/formsConfig";
import { UserContext } from "@context/auth.context";
import { FindResidents, Header } from "@impacto-design-system/Extensions";
import { getData } from "@modules/async-storage";
import { layout } from "@modules/theme";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";

function FindRecordsHomeScreen({ navigation }) {
  const [scrollViewScroll, setScrollViewScroll] = useState();
  const [selectPerson, setSelectPerson] = useState();
  const [surveyee, setSurveyee] = useState({});
  const [surveyingOrganization, setSurveyingOrganization] = useState("");

  const { user } = useContext(UserContext);

  useFocusEffect(
    useCallback(() => {
      getData("currentUser").then((currentUser) => {
        if (!currentUser) return;
        setSurveyingOrganization(currentUser.organization || "");
      });
    }, [user])
  );

  const openSettings = () => navigation.navigate("Settings");

  const navigateToNewRecord = (formTag, surveyeePerson) => {
    navigation.navigate("FindRecordsForms", {
      formTag: formTag || "id",
      surveyee: surveyeePerson || surveyee,
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
        <FindResidents
          selectPerson={selectPerson}
          setSelectPerson={setSelectPerson}
          organization={surveyingOrganization}
          puenteForms={puenteForms}
          navigateToNewRecord={navigateToNewRecord}
          surveyee={surveyee}
          setSurveyee={setSurveyee}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

export default FindRecordsHomeScreen;
