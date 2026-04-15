import ModernCard from "@impacto-design-system/Cards/ModernCard";
import I18n from "@modules/i18n";
import { createLayoutStyles } from "@modules/theme";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React from "react";
import { ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, { Easing, Keyframe } from "react-native-reanimated";

import createStyles from "../index.styles";

// Spec §5.4: Bottom-up staggered entrance — scale + translateY + opacity
// Consistent with SmallCardsCarousel entrance pattern
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
          entering={ListItemEntrance
            .delay(MOTION_TOKENS.duration.substantial + index * 50)
            .duration(MOTION_TOKENS.duration.base)}
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
