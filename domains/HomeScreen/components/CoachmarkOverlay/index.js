import { Ionicons } from "@expo/vector-icons";
import I18n from "@modules/i18n";
import { getHasSeenCoachmarks, setHasSeenCoachmarks } from "@modules/settings";
import { spacing, typography } from "@modules/theme";
import React, { useCallback, useEffect, useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

/**
 * Individual coachmark tooltip — an arrow + bubble anchored below/above a target
 */
function CoachmarkTip({ title, description, icon, step, total, onNext, onDismiss }) {
  const theme = useTheme();
  const isLast = step === total - 1;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}
    >
      {/* Header row */}
      <View style={styles.tipHeader}>
        <View style={[styles.tipIconBadge, { backgroundColor: theme.colors.primaryContainer }]}>
          <Ionicons name={icon} size={22} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tipTitle, { color: theme.colors.onSurface }]}>{title}</Text>
          <Text style={[styles.tipStep, { color: theme.colors.onSurfaceVariant }]}>
            {step + 1} / {total}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} accessibilityRole="button" accessibilityLabel={I18n.t("coachmarks.dismiss")}>
          <Ionicons name="close-outline" size={22} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <Text style={[styles.tipDescription, { color: theme.colors.onSurfaceVariant }]}>
        {description}
      </Text>

      {/* Progress dots */}
      <View style={styles.tipDots}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              styles.tipDot,
              {
                backgroundColor: i === step ? theme.colors.primary : theme.colors.surfaceVariant,
                width: i === step ? 16 : 6,
              },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={onNext}
        style={[styles.tipCta, { backgroundColor: theme.colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={isLast ? I18n.t("coachmarks.gotIt") : I18n.t("coachmarks.next")}
      >
        <Text style={[styles.tipCtaText, { color: theme.colors.onPrimary }]}>
          {isLast ? I18n.t("coachmarks.gotIt") : I18n.t("coachmarks.next")}
        </Text>
        {!isLast && <Ionicons name="arrow-forward" size={16} color={theme.colors.onPrimary} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * CoachmarkOverlay — full-screen dimmed overlay with sequential tip cards.
 * Renders as a Modal so it sits above all navigation chrome.
 *
 * Props:
 *   steps: Array<{ title, description, icon }>
 *   onComplete: () => void  — called after last step or dismiss
 */
export function CoachmarkOverlay({ steps, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getHasSeenCoachmarks().then((seen) => {
      if (!seen) setVisible(true);
      setChecked(true);
    });
  }, []);

  const dismiss = useCallback(async () => {
    await setHasSeenCoachmarks();
    setVisible(false);
    onComplete?.();
  }, [onComplete]);

  const handleNext = useCallback(async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      await dismiss();
    }
  }, [currentStep, steps.length, dismiss]);

  if (!checked || !visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.backdrop}>
        <View style={styles.tipContainer}>
          <CoachmarkTip
            key={currentStep}
            {...steps[currentStep]}
            step={currentStep}
            total={steps.length}
            onNext={handleNext}
            onDismiss={dismiss}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  tipContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tipCard: {
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  tipIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: {
    ...typography.label1,
    fontWeight: "700",
  },
  tipStep: {
    ...typography.caption,
    marginTop: 2,
  },
  tipDescription: {
    ...typography.body2,
    lineHeight: 22,
  },
  tipDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tipDot: {
    height: 6,
    borderRadius: 9999,
  },
  tipCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 9999,
  },
  tipCtaText: {
    ...typography.label1,
    fontWeight: "600",
  },
});
