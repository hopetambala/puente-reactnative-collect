import I18n from "@modules/i18n";
import { spacing, typography } from "@modules/theme";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

const createDemographicsStyles = (theme) => StyleSheet.create({
  container: {
    margin: spacing.lg,
  },
  labels: {
    marginTop: spacing.lg,
    ...typography.body1,
    color: theme.colors.textSecondary,
  },
  topLabel: {
    ...typography.body1,
    color: theme.colors.textSecondary,
  },
});

function Demographics({ dob, community, province, city, license }) {
  const theme = useTheme();
  const styles = useMemo(() => createDemographicsStyles(theme), [theme]);
  return <View style={styles.container}>
    <Text style={styles.topLabel}>
      {I18n.t("findResident.residentPage.demographics.dob")}
      {` ${dob}`}
    </Text>
    <Text style={styles.labels}>
      {I18n.t("findResident.residentPage.demographics.city")}
      {` ${city}`}
    </Text>
    <Text style={styles.labels}>
      {I18n.t("findResident.residentPage.demographics.community")}
      {` ${community}`}
    </Text>
    <Text style={styles.labels}>
      {I18n.t("findResident.residentPage.demographics.province")}
      {` ${province}`}
    </Text>
    <Text style={styles.labels}>
      {I18n.t("findResident.residentPage.demographics.license")}
      {` ${license}`}
    </Text>
  </View>
}

export default Demographics;
