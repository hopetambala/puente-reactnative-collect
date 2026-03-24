import I18n from "@modules/i18n";
import ModernCard from "@impacto-design-system/Cards/ModernCard";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { theme } from "@modules/theme";

/**
 * Carousel of Forms that are used for Form Navigation
 *
 * @name SmallCardsCarousel
 * @example
 * <SmallCardsCarousel
 *
 * />
 *
 * @param {Array} puenteForms Array of Forms to navigate through
 * @param {Function} navigateToNewRecord Function to navigate to a new form
 * @param {Function} setView Function to set view of the Data Collection Screen
 * @param {Object} surveyee Object for current surveyee (i.e. community resident)
 * @param {Boolean} setUser Boolean that if true, saves the surveyees object in the higher state
 *
 * @returns
 */

function SmallCardsCarousel({
  puenteForms,
  navigateToNewRecord,
  setView,
  surveyee,
  setUser,
  pinForm,
}) {
  const currentTheme = useTheme();
  
  const styles = useMemo(() => StyleSheet.create({
    cardSmallStyle: {
      height: 110,
      width: 150,
     margin: theme.spacing.sm
    },
    svg: {
      marginLeft: "auto",
      marginRight: "auto",
    },
    cardContainer: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },
    textContainer: {
      marginTop: 8,
    },
    text: {
      textAlign: "center",
      color: currentTheme.colors.link,
      fontWeight: "600",
    },
  }), [currentTheme]);

  return <ScrollView horizontal>
    {puenteForms.map((form) => (
      <ModernCard
        key={form.tag}
        style={styles.cardSmallStyle}
        onPress={() => {
          if (setUser) {
            if (setView) {
              setView("Forms");
            }
            navigateToNewRecord(form.tag, surveyee);
          } else {
            navigateToNewRecord(form.tag);
          }
        }}
        onLongPress={pinForm ? () => pinForm(form) : undefined}
      >
        <View style={styles.cardContainer}>
          <form.image height={40} style={styles.svg} />
          <View style={styles.textContainer}>
            <Text style={styles.text}>{I18n.t(form.name)}</Text>
          </View>
        </View>
      </ModernCard>
    ))}
  </ScrollView>
}

export default SmallCardsCarousel;
