import I18n from "@modules/i18n";
import React, { useMemo } from "react";
import { View } from "react-native";
import { Button, useTheme } from "react-native-paper";

import { createSettingsStyles } from "../../index.styles";
import FindRecords from "./FindRecords";
import Language from "./Language";
import NamePhoneEmail from "./NamePhoneEmail";
import OfflineData from "./OfflineData";
import Password from "./Password";

function AccountSettings({
  accountSettingsView,
  setAccountSettingsView,
  surveyingOrganization,
  scrollViewScroll,
  setScrollViewScroll,
}) {
  const theme = useTheme();
  const styles = useMemo(() => createSettingsStyles(theme), [theme]);

  return <View style={styles.mainContainer}>
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
      {I18n.t('accountSettings.back')}
    </Button>
  </View>
}

export default AccountSettings;
