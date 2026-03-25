import ModernCard from "@impacto-design-system/Cards/ModernCard";
import I18n from "@modules/i18n";
import { theme } from "@modules/theme";
import { getTokens } from "@modules/theme/tokens";
import { ANIMATION_TIMINGS } from "@modules/utils/animations";
import React, { useEffect, useMemo } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
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
  
  // Create a stable reference for animated values - use useMemo to prevent recreation on every render
  const animatedValuesRef = React.useRef(null);
  
  // Initialize or recreate animated values when forms change
  if (!animatedValuesRef.current || animatedValuesRef.current.length !== safePuenteForms.length) {
    animatedValuesRef.current = safePuenteForms.map(() => ({
      translateX: new Animated.Value(50),
      opacity: new Animated.Value(0),
    }));
  }
  
  const animatedValues = animatedValuesRef.current;

  useEffect(() => {
    // Only trigger animation if there are forms to animate
    if (animatedValues.length === 0) return;

    // Trigger staggered entrance animation
    const animations = animatedValues.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.translateX, {
          toValue: 0,
          duration: ANIMATION_TIMINGS.DURATION_GLOBAL,
          delay: index * ANIMATION_TIMINGS.STAGGER_DELAY,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: ANIMATION_TIMINGS.DURATION_GLOBAL,
          delay: index * ANIMATION_TIMINGS.STAGGER_DELAY,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(0, animations).start();
  }, [safePuenteForms.length]);
  
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
        style={{
          transform: [{ translateX: animatedValues[index].translateX }],
          opacity: animatedValues[index].opacity,
        }}
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
