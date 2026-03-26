import ModernCard from "@impacto-design-system/Cards/ModernCard";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import { ANIMATION_TIMINGS } from "@modules/utils/animations";
import React from "react";
import { ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, { SlideInRight } from "react-native-reanimated";

import createStyles from "../index.styles";

function FormsHorizontalView({
  forms,
  header,
  navigateToCustomForm,
  pinForm,
}) {
  const theme = useTheme();
  const layout = createLayoutStyles(theme);
  const styles = createStyles(theme);

  const safeForms = Array.isArray(forms) ? forms : [];

  return <View style={layout.screenRow}>
    {header && (
      <View style={{ flexDirection: "row" }}>
        <Text style={styles.mediumHeader}>{header}</Text>
      </View>
    )}
    <ScrollView horizontal>
      {safeForms.map((form, index) => (
        <Animated.View
          key={form.objectId || form.name}
          entering={SlideInRight.delay(
            ANIMATION_TIMINGS.SECTION_DELAY + index * ANIMATION_TIMINGS.STAGGER_DELAY
          )
            .duration(ANIMATION_TIMINGS.DURATION_GLOBAL)
            .withInitialValues({ transform: [{ translateX: 50 }], opacity: 0 })}
        >
          <ModernCard
            style={layout.cardSmallStyle}
            onPress={() => navigateToCustomForm(form)}
            onLongPress={pinForm ? () => pinForm(form) : undefined}
          >
            <View style={styles.cardContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.text}>{form.name}</Text>
              </View>
            </View>
          </ModernCard>
        </Animated.View>
      ))}
      {safeForms.length < 1 && (
        <View style={layout.screenRow}>
          <ModernCard key="no-custom-forms">
            <View style={{ padding: 16 }}>
              <Text>{I18n.t("formsGallery.noCustomForms")}</Text>
            </View>
          </ModernCard>
        </View>
      )}
    </ScrollView>
  </View>
}

export default FormsHorizontalView;
