import I18n from "@modules/i18n";
import React from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";

import styles from "../../index.styles";
import Feedback from "./Feedback";

function SupportSettings({ supportView, setSupportView }) {
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
