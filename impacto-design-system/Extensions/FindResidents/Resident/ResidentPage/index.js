import SmallCardsCarousel from "@impacto-design-system/Cards/SmallCardsCarousel";
import I18n from "@modules/i18n";
import { spacing, typography } from "@modules/theme";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import Animated, { Keyframe } from "react-native-reanimated";

import Demographics from "./Demographics";

// Spec §1 MEGA: profile picture pops in with energy on detail screen open
const ProfileEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.85 }] },
  65: { opacity: 1, transform: [{ scale: 1.04 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
});

// Name + meta slides up after profile image settles
const NameEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 12 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
});

function ResidentPage({
  fname,
  lname,
  nickname,
  city,
  picture,
  selectPerson,
  setSelectPerson,
  puenteForms,
  navigateToNewRecord,
  navigateToRecordHistory,
  setView,
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  // Derived, not captured in a mount-only effect — the photo must follow the
  // resident when the parent refreshes selectPerson after an edit.
  const pictureUrl = picture ? { uri: picture.url } : undefined;

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background, flex: 1 }}>
      <Button icon="arrow-left" width={100} onPress={() => setSelectPerson()}>
        {I18n.t("dataCollection.back")}
      </Button>
      <View style={styles.picNameContainer}>
        <Animated.View
          entering={ProfileEntrance.duration(MOTION_TOKENS.duration.slow)}
        >
          {pictureUrl ? (
            <Image style={styles.profPic} source={pictureUrl} />
          ) : (
            <View style={styles.profPicPlaceholder} testID="profile-placeholder">
              <Text style={styles.profPicInitials}>
                {`${(fname || "").charAt(0)}${(lname || "").charAt(0)}`.toUpperCase()}
              </Text>
            </View>
          )}
        </Animated.View>
        <Animated.View
          style={styles.nameBlock}
          entering={NameEntrance
            .delay(MOTION_TOKENS.duration.quick)
            .duration(MOTION_TOKENS.duration.base)}
        >
          <View style={styles.nameContainer}>
            <Text
              style={[styles.name, { fontWeight: "bold" }]}
            >{`${fname} ${lname}`}</Text>
          </View>
          {nickname ? <Text style={styles.name}>{`"${nickname}"`}</Text> : null}
        </Animated.View>
      </View>
      <View style={styles.horizontalLine} />
      <View style={styles.navigationButtonsContainer}>
        <Text style={styles.sectionHeaderText}>
          {I18n.t("findResident.residentPage.household.demographics")}
        </Text>
      </View>
      <View style={styles.horizontalLine} />
      <Demographics
        dob={selectPerson.dob}
        city={city}
        community={selectPerson.communityname}
        province={selectPerson.province}
        license={selectPerson.license}
        selectPerson={selectPerson}
      />
      {navigateToNewRecord && puenteForms?.length > 0 && (
        <View style={styles.newFormSection}>
          <Text style={styles.sectionTitle}>
            {I18n.t("findResident.residentPage.forms.suggestedForms")}
          </Text>
          <SmallCardsCarousel
            puenteForms={puenteForms}
            navigateToNewRecord={navigateToNewRecord}
            surveyee={selectPerson}
            setView={setView}
            // Despite the name, setUser is a boolean flag: when true the
            // carousel passes `surveyee` through to navigateToNewRecord.
            setUser
          />
        </View>
      )}
      {navigateToRecordHistory && (
        <Button
          icon="history"
          mode="outlined"
          style={styles.historyButton}
          onPress={() => navigateToRecordHistory(selectPerson)}
        >
          {I18n.t('findResident.residentPage.viewRecordHistory')}
        </Button>
      )}
      <Button onPress={() => setSelectPerson()}>
        {I18n.t("findResident.residentPage.household.goBack")}
      </Button>
    </ScrollView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    profPic: {
      width: 100,
      height: 100,
      borderWidth: 1,
      borderRadius: spacing.radiusLarge,
      borderColor: theme.colors.outline,
    },
    profPicPlaceholder: {
      width: 100,
      height: 100,
      borderWidth: 1,
      borderRadius: spacing.radiusLarge,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    profPicInitials: {
      ...typography.heading2,
      fontWeight: "700",
      color: theme.colors.textSecondary,
    },
    picNameContainer: {
      flexDirection: "row",
      margin: spacing.md,
    },
    nameContainer: {
      flexDirection: "row",
    },
    nameBlock: {
      margin: spacing.sm,
    },
    historyButton: {
      margin: spacing.md,
    },
    name: {
      ...typography.body1,
      color: theme.colors.textSecondary,
      flexShrink: 1,
      marginVertical: spacing.sm,
    },
    horizontalLine: {
      borderBottomColor: theme.colors.outline,
      borderBottomWidth: 1,
    },
    navigationButtonsContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    sectionHeaderText: {
      ...typography.label1,
      fontWeight: "600",
      color: theme.colors.onSurface,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      textAlign: "center",
      flex: 1,
    },
    newFormSection: {
      marginTop: spacing.md,
      marginHorizontal: spacing.md,
    },
    sectionTitle: {
      ...typography.label1,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: spacing.sm,
    },
  });

export default ResidentPage;
