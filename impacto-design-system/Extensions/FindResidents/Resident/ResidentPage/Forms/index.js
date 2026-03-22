import ComingSoonSVG from "@assets/graphics/static/Adventurer.svg";
import I18n from "@modules/i18n";
import SmallCardsCarousel from "impacto-design-system/Cards/SmallCardsCarousel";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, Title, useTheme } from "react-native-paper";

function Forms({ puenteForms, navigateToNewRecord, surveyee, setView }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return <View style={styles.container}>
    <Title style={styles.title}>
      {I18n.t("findResident.residentPage.forms.completedForms")}
    </Title>
    <Text style={styles.category}>
      {I18n.t("findResident.residentPage.forms.formCategory")}
    </Text>
    <View style={styles.horizontalLine} />
    <ComingSoonSVG width={200} height={200} />
    <Text>{I18n.t("findResident.residentPage.forms.comingSoon")}</Text>
    <Title style={styles.title}>
      {I18n.t("findResident.residentPage.forms.suggestedForms")}
    </Title>
    <SmallCardsCarousel
      puenteForms={puenteForms}
      navigateToNewRecord={navigateToNewRecord}
      surveyee={surveyee}
      setView={setView}
      setUser
    />
  </View>
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      margin: 20,
    },
    title: {
      fontWeight: "bold",
      fontSize: 25,
    },
    category: {
      fontWeight: "bold",
      fontSize: 15,
      marginTop: 10,
      marginBottom: 10,
    },
    horizontalLine: {
      borderBottomColor: theme.colors.primary,
      borderBottomWidth: 1,
    },
  });

export default Forms;
