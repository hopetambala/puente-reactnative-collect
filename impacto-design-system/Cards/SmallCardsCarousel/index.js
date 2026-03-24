import ModernCard from "@impacto-design-system/Cards/ModernCard";
import I18n from "@modules/i18n";
import { theme } from "@modules/theme";
import { getTokens } from "@modules/theme/tokens";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

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
  const isDark = currentTheme.dark;
  const tokens = getTokens(isDark ? "dark" : "light");
  
  const styles = useMemo(() => StyleSheet.create({
    cardSmallStyle: {
      height: 110,
      width: 150,
      margin: theme.spacing.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    text: {
      textAlign: "center",
      color: tokens.tkDliteSemanticColorTextPrimary,
      fontWeight: "700",
      fontSize: 12,
    },
  }), [currentTheme]);

  return <ScrollView horizontal>
    {puenteForms.map((form) => (
      <ModernCard
        key={form.tag}
        style={[
          styles.cardSmallStyle,
          { backgroundColor: tokens[isDark ? form.colorTokenDark : form.colorTokenLight] }
        ]}
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
            <Text style={styles.text}>{I18n.t(form.name)}</Text>
      </ModernCard>
    ))}
  </ScrollView>
}

export default SmallCardsCarousel;
