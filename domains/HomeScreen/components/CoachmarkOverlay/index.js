import { Ionicons } from "@expo/vector-icons";
import I18n from "@modules/i18n";
import { getHasSeenCoachmark, getHasSeenCoachmarks, setHasSeenCoachmark, setHasSeenCoachmarks } from "@modules/settings";
import { spacing, typography } from "@modules/theme";
import React, { useCallback, useEffect, useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

/**
 * CoachmarkTip — Internal component that renders a single tip card shown bottom-sheet style.
 * Supports both single-tip mode (simple dismiss) and multi-step mode (pagination).
 *
 * @param {Object} props
 * @param {string} props.icon - Ionicons icon name (e.g., "bar-chart-outline", "search-outline")
 * @param {string} props.title - Tip title text
 * @param {string} props.description - Tip body description text
 * @param {() => void} props.onDismiss - Callback when tip is dismissed (X or final CTA)
 * @param {boolean} [props.isMultiStep=false] - Whether this is part of a multi-step sequence
 * @param {number} [props.currentStep] - Current step number (only used if isMultiStep=true)
 * @param {number} [props.totalSteps] - Total steps in sequence (only used if isMultiStep=true)
 * @param {() => void} [props.onNext] - Callback to advance to next step (only used if isMultiStep=true)
 *
 * @returns {React.ReactNode} Animated tip card component
 *
 * @internal This is an internal component. Use CoachmarkOverlay instead.
 *
 * @example
 * ```jsx
 * // Single-tip mode
 * const handleDismiss = () => {};
 * <CoachmarkTip
 *   icon="info-outline"
 *   title={I18n.t("coachmarks.homeTitle")}
 *   description={I18n.t("coachmarks.homeDescription")}
 *   onDismiss={handleDismiss}
 * />
 * ```
 *
 * @example
 * ```jsx
 * // Multi-step mode (with pagination)
 * const handleDismiss = () => {};
 * const handleNext = () => {};
 * <CoachmarkTip
 *   icon="info-outline"
 *   title={tipTitle}
 *   description={tipDescription}
 *   isMultiStep
 *   currentStep={1}
 *   totalSteps={3}
 *   onNext={handleNext}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
function CoachmarkTip({
  icon,
  title,
  description,
  onDismiss,
  isMultiStep = false,
  currentStep,
  totalSteps,
  onNext,
}) {
  const theme = useTheme();

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
        <Text style={[styles.tipTitle, { color: theme.colors.onSurface }]}>{title}</Text>
        <TouchableOpacity
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={I18n.t("coachmarks.dismiss")}
        >
          <Ionicons name="close-outline" size={22} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <Text style={[styles.tipDescription, { color: theme.colors.onSurfaceVariant }]}>
        {description}
      </Text>

      {/* Step counter (multi-step only) */}
      {isMultiStep && (
        <Text style={[styles.tipStep, { color: theme.colors.onSurfaceVariant }]}>
          {currentStep} / {totalSteps}
        </Text>
      )}

      {/* CTA row */}
      <View style={styles.tipCtaRow}>
        {isMultiStep && currentStep < totalSteps && (
          <TouchableOpacity
            onPress={onNext}
            style={[styles.tipCta, { backgroundColor: theme.colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={I18n.t("coachmarks.next")}
          >
            <Text style={[styles.tipCtaText, { color: theme.colors.onPrimary }]}>
              {I18n.t("coachmarks.next")}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onDismiss}
          style={[styles.tipCta, { backgroundColor: theme.colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={I18n.t("coachmarks.gotIt")}
        >
          <Text style={[styles.tipCtaText, { color: theme.colors.onPrimary }]}>
            {I18n.t("coachmarks.gotIt")}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

/**
 * CoachmarkOverlay — Flexible coachmark system supporting both single-tip and multi-step modes.
 * Automatically detects which mode to use based on props.
 *
 * The component manages its own visibility state and AsyncStorage persistence.
 * Single-tip mode persists per-screen flags; multi-step mode uses a global flag.
 *
 * @param {Object} props
 *
 * @param {string} [props.seenKey] - Unique key for single-tip mode ("home"|"collect"|"find"|"settings").
 *                                    When provided, enables single-tip mode. Ignored if `steps` is provided.
 * @param {string} [props.icon] - Ionicons icon name for single-tip mode (e.g., "bar-chart-outline")
 * @param {string} [props.title] - Tip title text for single-tip mode
 * @param {string} [props.description] - Tip body text for single-tip mode
 *
 * @param {Array<{icon: string, title: string, description: string}>} [props.steps] - Array of tip objects
 *                                                                                      for multi-step mode.
 *                                                                                      When provided, enables
 *                                                                                      multi-step mode with
 *                                                                                      pagination.
 *
 * @param {() => void} [props.onComplete] - Optional callback invoked after all tips are dismissed
 *
 * @returns {React.ReactNode} Modal with coachmark overlay (or null if tip was already seen)
 *
 * @example
 * ```jsx
 * // Single-tip mode: shown once on first screen visit
 * <CoachmarkOverlay
 *   seenKey="home"
 *   icon="bar-chart-outline"
 *   title={I18n.t("coachmarks.homeTitle")}
 *   description={I18n.t("coachmarks.homeDescription")}
 *   onComplete={() => console.log("Home tip dismissed")}
 * />
 * ```
 *
 * @example
 * ```jsx
 * // Multi-step mode: sequence of tips with "Next" pagination
 * <CoachmarkOverlay
 *   steps={[
 *     {
 *       icon: "info-outline",
 *       title: "Step 1: Overview",
 *       description: "Welcome to the feature",
 *     },
 *     {
 *       icon: "touch-outline",
 *       title: "Step 2: How to Use",
 *       description: "Tap the button to proceed",
 *     },
 *     {
 *       icon: "checkmark-circle-outline",
 *       title: "Step 3: Done",
 *       description: "You're all set",
 *     },
 *   ]}
 *   onComplete={() => console.log("Tutorial finished")}
 * />
 * ```
 *
 * @note
 * - For new screens, always use single-tip mode (seenKey + icon/title/description)
 * - Multi-step mode is only for backward compatibility with legacy coachmark sequences
 * - The overlay automatically handles AsyncStorage persistence and won't show twice
 * - X button in header always dismisses immediately
 * - Single-tip mode shows one "Got it" button; multi-step shows "Next" and "Got it"
 */
export function CoachmarkOverlay({ seenKey, icon, title, description, steps, onComplete }) {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const isMultiStep = Array.isArray(steps) && steps.length > 0;
  const isSingleTip = seenKey && !isMultiStep;

  useEffect(() => {
    if (isSingleTip) {
      // Single-tip mode
      getHasSeenCoachmark(seenKey).then((seen) => {
        if (!seen) setVisible(true);
        setChecked(true);
      });
    } else if (isMultiStep) {
      // Multi-step mode (legacy)
      getHasSeenCoachmarks().then((seen) => {
        if (!seen) setVisible(true);
        setChecked(true);
      });
    }
  }, [seenKey, isMultiStep, isSingleTip]);

  const dismissSingleTip = useCallback(async () => {
    await setHasSeenCoachmark(seenKey);
    setVisible(false);
    onComplete?.();
  }, [seenKey, onComplete]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      dismissMultiStep();
    }
  }, [currentStep, steps]);

  const dismissMultiStep = useCallback(async () => {
    await setHasSeenCoachmarks();
    setVisible(false);
    setCurrentStep(0);
    onComplete?.();
  }, [onComplete]);

  if (!checked || !visible) return null;

  // Render based on mode
  if (isSingleTip) {
    return (
      <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.backdrop}
        >
          <View style={styles.tipContainer}>
            <CoachmarkTip
              icon={icon}
              title={title}
              description={description}
              onDismiss={dismissSingleTip}
            />
          </View>
        </Animated.View>
      </Modal>
    );
  } if (isMultiStep) {
    const step = steps[currentStep];
    return (
      <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.backdrop}
        >
          <View style={styles.tipContainer}>
            <CoachmarkTip
              icon={step.icon}
              title={step.title}
              description={step.description}
              isMultiStep
              currentStep={currentStep + 1}
              totalSteps={steps.length}
              onNext={nextStep}
              onDismiss={dismissMultiStep}
            />
          </View>
        </Animated.View>
      </Modal>
    );
  }

  return null;
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
    alignItems: "center",
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
    flex: 1,
  },
  tipDescription: {
    ...typography.body2,
    lineHeight: 22,
  },
  tipStep: {
    ...typography.caption,
    textAlign: "center",
  },
  tipCtaRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  tipCta: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: 9999,
  },
  tipCtaText: {
    ...typography.label1,
    fontWeight: "600",
  },
});
