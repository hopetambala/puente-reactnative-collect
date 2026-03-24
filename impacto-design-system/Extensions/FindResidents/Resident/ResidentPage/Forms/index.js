import ComingSoonSVG from "@assets/graphics/static/Adventurer.svg";
import SmallCardsCarousel from "@impacto-design-system/Cards/SmallCardsCarousel";
import I18n from "@modules/i18n";
import { spacing, typography } from "@modules/theme";
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
      margin: spacing.lg,
    },
    title: {
      ...typography.title1,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    category: {
      ...typography.label1,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    horizontalLine: {
      borderBottomColor: theme.colors.outline,
      borderBottomWidth: 1,
    },
  });

export default Forms;
