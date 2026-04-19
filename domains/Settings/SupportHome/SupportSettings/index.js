import I18n from "@modules/i18n";
import React, { useMemo } from "react";
import { View } from "react-native";
import { Button, useTheme } from "react-native-paper";

import { createSettingsStyles } from "../../index.styles";
import Feedback from "./Feedback";

function SupportSettings({ supportView, setSupportView }) {
  const theme = useTheme();
  const styles = useMemo(() => createSettingsStyles(theme), [theme]);

  return <View style={styles.mainContainer}>
    {supportView === "feedback" && <Feedback />}
    <Button
      onPress={() => {
        setSupportView("");
      }}
    >
      {I18n.t("supportHome.back")}
    </Button>
  </View>
}

export default SupportSettings;
