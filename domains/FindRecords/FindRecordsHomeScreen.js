import { puenteForms } from "@app/domains/DataCollection/formsConfig";
import { UserContext } from "@context/auth.context";
import { FindResidents } from "@impacto-design-system/Extensions";
import { getData } from "@modules/async-storage";
import { createLayoutStyles } from "@modules/theme";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

function FindRecordsHomeScreen({ navigation }) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
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

  const navigateToNewRecord = (formTag, surveyeePerson) => {
    navigation.navigate("FindRecordsForms", {
      formTag: formTag || "id",
      surveyee: surveyeePerson || surveyee,
    });
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={layout.screenContainer}
    >
      <KeyboardAvoidingView
        enabled
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[layout.screenContainer, { flex: 1 }]}
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
    </SafeAreaView>
  );
}

export default FindRecordsHomeScreen;
