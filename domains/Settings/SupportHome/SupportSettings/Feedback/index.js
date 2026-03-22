import I18n from "@modules/i18n";
import * as MailComposer from "expo-mail-composer";
import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

import styles from "../../../index.styles";

function Feedback() {
  const handleEmail = async () => {
    await MailComposer.isAvailableAsync().then((mailAvailable) => {
      if (mailAvailable) {
        MailComposer.composeAsync({
          recipients: ["info@puente-dr.org"],
          subject: "User Feedback",
          body: emailBody,
        });
      }
    });
  };

  const [emailBody, setEmailBody] = useState("");

  return (
    <View style={styles.mainContainer}>
      <Text variant="headlineMedium">{I18n.t("feedback.feedback")}</Text>
      <View style={styles.horizontalLinePrimary} />
      <Text>{I18n.t("feedback.enterFeedback")}</Text>
      <View style={styles.horizontalLinePrimary} />
      <TextInput
        multiline
        onChangeText={(text) => setEmailBody(text)}
        placeholder={I18n.t("feedback.typeFeedback")}
      />
      <View style={styles.languageContainer}>
        <Button mode="contained" onPress={() => handleEmail()}>
          {I18n.t("feedback.sendMail")}
        </Button>
      </View>
    </View>
  );
}

export default Feedback;
