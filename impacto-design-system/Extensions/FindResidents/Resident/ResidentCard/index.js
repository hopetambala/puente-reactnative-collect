import I18n from "@modules/i18n";
import { spacing, typography } from "@modules/theme";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";

function ResidentCard({ resident, onSelectPerson }) {
  const theme = useTheme();
  const { fname, lname, nickname, city, communityname, sex, educationLevel, objectId } =
    resident;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginHorizontal: spacing.md,
          marginVertical: spacing.sm,
          backgroundColor: theme.colors.surfaceRaised,
        },
        content: {
          padding: spacing.md,
        },
        name: {
          ...typography.title2,
          fontWeight: "700",
          color: theme.colors.textPrimary,
        },
        nickname: {
          ...typography.body2,
          color: theme.colors.textSecondary,
          marginTop: spacing.xs,
        },
        meta: {
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: spacing.sm,
          gap: spacing.md,
        },
        metaLabel: {
          ...typography.caption,
          color: theme.colors.textTertiary,
        },
        metaValue: {
          ...typography.caption,
          color: theme.colors.textSecondary,
          fontWeight: "500",
        },
        offlineBadge: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: theme.colors.error,
          marginLeft: 6,
          alignSelf: "center",
        },
        nameRow: {
          flexDirection: "row",
          alignItems: "center",
        },
      }),
    [theme]
  );

  return (
    <Card
      style={styles.card}
      onPress={() => onSelectPerson && onSelectPerson(resident)}
    >
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{`${fname} ${lname}`}</Text>
          {objectId.includes("PatientID-") && (
            <View style={styles.offlineBadge} />
          )}
        </View>
        {nickname ? (
          <Text style={styles.nickname}>{`"${nickname}"`}</Text>
        ) : null}
        <View style={styles.meta}>
          <View>
            <Text style={styles.metaLabel}>
              {I18n.t("findResident.residentCard.city")}
            </Text>
            <Text style={styles.metaValue}>{city}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>
              {I18n.t("findResident.residentCard.community")}
            </Text>
            <Text style={styles.metaValue}>{communityname}</Text>
          </View>
          {sex ? (
            <View>
              <Text style={styles.metaLabel}>
                {I18n.t("findResident.residentCard.sex")}
              </Text>
              <Text style={styles.metaValue}>{sex}</Text>
            </View>
          ) : null}
          {educationLevel ? (
            <View>
              <Text style={styles.metaLabel}>
                {I18n.t("findResident.residentCard.educationLevel")}
              </Text>
              <Text style={styles.metaValue}>{educationLevel}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export default ResidentCard;
