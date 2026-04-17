import ModernCard from "@impacto-design-system/Cards/ModernCard";
import I18n from "@modules/i18n";
import { theme } from "@modules/theme";
import { getTokens } from "@modules/theme/tokens";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, { Easing, Keyframe } from "react-native-reanimated";

// Spec §5.4: Bottom-up staggered entrance — scale + translateY + opacity
// More modern than side-slide (FadeInRight); mimics content being revealed naturally
const ListItemEntrance = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: 10 }, { scale: 0.98 }],
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    easing: Easing.out(Easing.ease),
  },
});

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
  puenteForms = [],
  navigateToNewRecord,
  setView,
  surveyee,
  setUser,
  pinForm,
}) {
  const currentTheme = useTheme();
  const isDark = currentTheme.dark;
  const tokens = getTokens(isDark ? "dark" : "light");
  
  // Guard: ensure puenteForms is always an array
  const safePuenteForms = Array.isArray(puenteForms) ? puenteForms : [];
  
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
  }), [currentTheme, tokens]);

  return <ScrollView horizontal>
    {safePuenteForms.map((form, index) => (
      <Animated.View
        key={form.tag}
        entering={ListItemEntrance
          .delay(index * 50)
          .duration(MOTION_TOKENS.duration.base)}
      >
        <ModernCard
          style={[
            styles.cardSmallStyle,
            { 
              backgroundColor: tokens[isDark ? form.colorTokenDark : form.colorTokenLight] 
            }
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
        </Animated.View>
      ))}
  </ScrollView>
}

export default SmallCardsCarousel;
