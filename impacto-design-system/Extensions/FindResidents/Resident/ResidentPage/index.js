import I18n from "@modules/i18n";
import { spacing, typography } from "@modules/theme";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import Animated, { Keyframe } from "react-native-reanimated";

import Demographics from "./Demographics";
import Forms from "./Forms";
import Household from "./Housheold";

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
  setSurveyee,
  setView,
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [pictureUrl, setPictureUrl] = useState();
  const [demographics, setDemographics] = useState(true);
  const [forms, setForms] = useState(false);
  const [household, setHousehold] = useState(false);

  useEffect(() => {
    const pic = picture;
    if (pic) {
      setPictureUrl({ uri: pic.url });
    }
  }, []);

  const showDemographics = () => {
    setForms(false);
    setHousehold(false);
    setDemographics(true);
  };

  const showForms = () => {
    setHousehold(false);
    setDemographics(false);
    setForms(true);
  };

  const showHousehold = () => {
    setForms(false);
    setDemographics(false);
    setHousehold(true);
  };
  return (
    <ScrollView style={{ backgroundColor: theme.colors.background, flex: 1 }}>
      <Button icon="arrow-left" width={100} onPress={() => setSelectPerson()}>
        {I18n.t("dataCollection.back")}
      </Button>
      <View style={styles.picNameContainer}>
        <Animated.View
          entering={ProfileEntrance.duration(MOTION_TOKENS.duration.slow)}
        >
          <Image style={styles.profPic} source={pictureUrl} />
        </Animated.View>
        <Animated.View
          style={{ margin: 7 }}
          entering={NameEntrance
            .delay(150)
            .duration(MOTION_TOKENS.duration.base)}
        >
          <View style={styles.nameContainer}>
            <Text
              style={[styles.name, { fontWeight: "bold" }]}
            >{`${fname} ${lname}`}</Text>
          </View>
          <Text style={styles.name}>{`"${nickname}"`}</Text>
        </Animated.View>
      </View>
      <View style={styles.horizontalLine} />
      <View style={styles.navigationButtonsContainer}>
        <Button
          style={styles.navigationButton}
          labelStyle={styles.navigationButtonText}
          onPress={() => showDemographics()}
        >
          {I18n.t("findResident.residentPage.household.demographics")}
        </Button>
        <Button
          style={styles.navigationButton}
          labelStyle={styles.navigationButtonText}
          onPress={() => showForms(true)}
        >
          {I18n.t("findResident.residentPage.household.forms")}
        </Button>
        <Button
          style={styles.navigationButton}
          labelStyle={styles.navigationButtonText}
          onPress={() => showHousehold(true)}
        >
          {I18n.t("findResident.residentPage.household.household")}
        </Button>
      </View>
      <View style={styles.horizontalLine} />
      {demographics && (
        <Demographics
          dob={selectPerson.dob}
          city={city}
          community={selectPerson.communityname}
          province={selectPerson.province}
          license={selectPerson.license}
          selectPerson={selectPerson}
        />
      )}
      {forms && (
        <Forms
          puenteForms={puenteForms}
          navigateToNewRecord={navigateToNewRecord}
          surveyee={selectPerson}
          setSurveyee={setSurveyee}
          setView={setView}
        />
      )}
      {household && <Household />}
      {navigateToRecordHistory && (
        <Button
          icon="history"
          mode="outlined"
          style={{ margin: spacing.md }}
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
      borderRadius: 12,
      borderColor: theme.colors.outline,
    },
    picNameContainer: {
      flexDirection: "row",
      margin: spacing.md,
    },
    nameContainer: {
      flexDirection: "row",
    },
    name: {
      ...typography.body1,
      color: theme.colors.textSecondary,
      flexShrink: 1,
      marginVertical: spacing.sm,
    },
    button: {
      width: 120,
      marginLeft: -5,
    },
    buttonContent: {
      marginLeft: 0,
    },
    horizontalLine: {
      borderBottomColor: theme.colors.outline,
      borderBottomWidth: 1,
    },
    navigationButtonsContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    navigationButton: {
      flex: 1,
    },
    navigationButtonText: {
      ...typography.label1,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
  });

export default ResidentPage;
