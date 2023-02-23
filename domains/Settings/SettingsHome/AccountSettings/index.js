import React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";

import styles from "../../index.styles";
import FindRecords from "./FindRecords";
import Language from "./Language";
import NamePhoneEmail from "./NamePhoneEmail";
import OfflineData from "./OfflineData";
import Password from "./Password";

const AccountSettings = ({
  accountSettingsView,
  setAccountSettingsView,
  surveyingOrganization,
  scrollViewScroll,
  setScrollViewScroll,
}) => (
  <View style={styles.mainContainer}>
    {accountSettingsView === "NamePhoneEmail" && <NamePhoneEmail />}
    {accountSettingsView === "ChangePassword" && <Password />}
    {accountSettingsView === "FindRecords" && <FindRecords />}
    {accountSettingsView === "Language" && <Language />}
    {accountSettingsView === "OfflineData" && (
      <OfflineData
        surveyingOrganization={surveyingOrganization}
        scrollViewScroll={scrollViewScroll}
        setScrollViewScroll={setScrollViewScroll}
      />
    )}
    <Button
      onPress={() => {
        setAccountSettingsView("");
      }}
    >
      Back
    </Button>
  </View>
);

export default AccountSettings;
