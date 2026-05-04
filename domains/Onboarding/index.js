import { ThemeContext } from "@context/theme.context";
import I18n from "@modules/i18n";
import { setHasSeenOnboarding } from "@modules/settings";
import { spacing, typography } from "@modules/theme";
import React, { useContext, useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { MOTION_TOKENS } from "./motion/tokens";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TOTAL_STEPS = 8;

/**
 * ProgressBar - animated fill showing onboarding progress
 */
function ProgressBar({ step }) {
  const fillWidth = useSharedValue(0);
  const theme = useTheme();

  useEffect(() => {
    const progress = ((step + 1) / TOTAL_STEPS) * 100;
    fillWidth.value = withSpring(progress, MOTION_TOKENS.spring.smooth);
  }, [step, fillWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: interpolate(
      fillWidth.value,
      [0, 100],
      [0, screenWidth - 32]
    ),
  }));

  return (
    <View style={[styles.progressBarContainer, { marginTop: 24 }]}>
      <View style={styles.progressBarTrack}>
        <Animated.View
          style={[
            styles.progressBarFill,
            fillStyle,
            { backgroundColor: theme.colors.primary },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * PrimaryPill - animated CTA button
 */
function PrimaryPill({ label, onPress, disabled = false }) {
  const scale = useSharedValue(1);
  const theme = useTheme();

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(MOTION_TOKENS.scale.press, MOTION_TOKENS.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, MOTION_TOKENS.spring.snappy);
  };

  return (
    <AnimatedTouchable
      style={[
        styles.primaryPill,
        scaleStyle,
        {
          backgroundColor: disabled ? theme.colors.surfaceDisabled : theme.colors.primary,
        },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.primaryPillText,
          {
            color: disabled
              ? theme.colors.onSurfaceDisabled
              : theme.colors.onPrimary,
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedTouchable>
  );
}

/**
 * StepFooter - common footer for all steps
 */
function StepFooter({ onNext, onBack, onSkip, showBack = false, showSkip = false, nextLabel }) {
  const theme = useTheme();
  return (
    <View style={styles.stepFooter}>
      <View style={styles.footerButtonRow}>
        {showBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessible
            accessibilityRole="button"
            accessibilityLabel={I18n.t("onboarding.back")}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              {I18n.t("onboarding.back")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.ctaContainer}>
        {showSkip && (
          <TouchableOpacity
            onPress={onSkip}
            accessible
            accessibilityRole="button"
            accessibilityLabel={I18n.t("onboarding.skip")}
          >
            <Text style={[styles.skipText, { color: theme.colors.onSurfaceVariant }]}>
              {I18n.t("onboarding.skip")}
            </Text>
          </TouchableOpacity>
        )}
        <PrimaryPill
          label={nextLabel || I18n.t("onboarding.next")}
          onPress={onNext}
        />
      </View>
    </View>
  );
}

/**
 * Step 0 - Welcome
 */
function StepWelcome({ onNext, onSkip }) {
  const theme = useTheme();

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <Animated.Text
        style={[styles.welcomeTitle, { color: theme.colors.primary }]}
        entering={FadeInDown.duration(500)}
      >
        Welcome to Puente
      </Animated.Text>

      <Animated.Text
        style={[styles.welcomeDescription, { color: theme.colors.onSurfaceVariant }]}
        entering={FadeInDown.delay(200).duration(500)}
      >
        {I18n.t("onboarding.welcomeDescription")}
      </Animated.Text>

      <Animated.View
        style={[styles.welcomeAccentBar, { backgroundColor: theme.colors.primary }]}
        entering={FadeInDown.delay(400).duration(500)}
      />

      <StepFooter
        onNext={onNext}
        onSkip={onSkip}
        showSkip
        nextLabel={I18n.t("onboarding.getStarted")}
      />
    </Animated.ScrollView>
  );
}

/**
 * Step 1 - Data Collection
 */
function StepCollection({ onNext, onBack }) {
  const theme = useTheme();

  const collectionTypes = [
    { icon: "📝", label: I18n.t("onboarding.textField"), color: theme.colors.primary },
    { icon: "🔢", label: I18n.t("onboarding.numberField"), color: theme.colors.secondary },
    { icon: "📍", label: I18n.t("onboarding.locationField"), color: theme.colors.success },
    { icon: "📸", label: I18n.t("onboarding.photoField"), color: theme.colors.info },
  ];

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <Animated.Text
        style={[styles.stepTitle, { color: theme.colors.primary }]}
        entering={FadeInDown.duration(500)}
      >
        {I18n.t("onboarding.howToCollect")}
      </Animated.Text>

      <View style={styles.cardGrid}>
        {collectionTypes.map((type, i) => (
          <Animated.View
            key={`collection-${i}`}
            style={[styles.collectionCard, { borderLeftColor: type.color }]}
            entering={FadeInDown.delay(i * 90).duration(500)}
          >
            <Text style={styles.cardIcon}>{type.icon}</Text>
            <Text style={[styles.cardLabel, { color: theme.colors.onBackground }]}>
              {type.label}
            </Text>
          </Animated.View>
        ))}
      </View>

      <Animated.Text
        style={[styles.stepDescription, { color: theme.colors.onSurfaceVariant }]}
        entering={FadeInDown.delay(400).duration(500)}
      >
        {I18n.t("onboarding.collectionDescription")}
      </Animated.Text>

      <StepFooter onNext={onNext} onBack={onBack} showBack />
    </Animated.ScrollView>
  );
}

/**
 * Step 2 - Find Records
 */
function StepFindRecords({ onNext, onBack }) {
  const theme = useTheme();

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <Animated.Text
        style={[styles.stepTitle, { color: theme.colors.primary }]}
        entering={FadeInDown.duration(500)}
      >
        {I18n.t("onboarding.findRecords")}
      </Animated.Text>

      <Animated.View
        style={[
          styles.searchDemoBox,
          { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface },
        ]}
        entering={FadeInDown.delay(100).duration(500)}
      >
        <Text style={{ color: theme.colors.onSurfaceVariant }}>🔍 Search</Text>
      </Animated.View>

      <View style={styles.recordsList}>
        {[1, 2, 3].map((i) => (
          <Animated.View
            key={`record-${i}`}
            style={[
              styles.recordCard,
              {
                borderColor: theme.colors.outlineVariant,
                backgroundColor: theme.colors.surface,
                borderLeftColor: theme.colors.info,
              },
            ]}
            entering={FadeInDown.delay(200 + i * 100).duration(500)}
          >
            <Text style={{ color: theme.colors.onBackground }}>
              Record {i}
            </Text>
          </Animated.View>
        ))}
      </View>

      <Animated.Text
        style={[styles.stepDescription, { color: theme.colors.onSurfaceVariant }]}
        entering={FadeInDown.delay(500).duration(500)}
      >
        {I18n.t("onboarding.findDescription")}
      </Animated.Text>

      <StepFooter onNext={onNext} onBack={onBack} showBack />
    </Animated.ScrollView>
  );
}

/**
 * Step 3 - Offline Capability
 */
function StepOffline({ onNext, onBack }) {
  const theme = useTheme();

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <Animated.Text
        style={[styles.stepTitle, { color: theme.colors.primary }]}
        entering={FadeInDown.duration(500)}
      >
        {I18n.t("onboarding.offlineMode")}
      </Animated.Text>

      <Animated.Text
        style={[styles.offlineIcon]}
        entering={FadeInDown.delay(100).duration(500)}
      >
        🔄
      </Animated.Text>

      <Animated.Text
        style={[styles.stepDescription, { color: theme.colors.onSurfaceVariant }]}
        entering={FadeInDown.delay(300).duration(500)}
      >
        {I18n.t("onboarding.offlineDescription")}
      </Animated.Text>

      <StepFooter onNext={onNext} onBack={onBack} showBack />
    </Animated.ScrollView>
  );
}

/**
 * Step 4 - Language Selection
 */
function StepLanguage({ onNext, onBack }) {
  const theme = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState(I18n.locale);

  const languages = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "hk", label: "Kreyòl", flag: "🇭🇹" },
  ];

  const handleLanguageSelect = (code) => {
    setSelectedLanguage(code);
    I18n.locale = code;

    // Try haptics if available
    try {
      // eslint-disable-next-line global-require
      const Haptics = require("expo-haptics");
      if (Haptics?.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (e) {
      // Haptics not available, skip
    }
  };

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <Animated.Text
        style={[styles.stepTitle, { color: theme.colors.primary }]}
        entering={FadeInDown.duration(500)}
      >
        {I18n.t("onboarding.chooseLanguage")}
      </Animated.Text>

      <View style={styles.languageGrid}>
        {languages.map((lang, i) => (
          <Animated.View
            key={`lang-${lang.code}`}
            entering={FadeInDown.delay(i * 90).duration(500)}
          >
            <TouchableOpacity
              style={[
                styles.languageOption,
                {
                  borderColor:
                    selectedLanguage === lang.code
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                  backgroundColor:
                    selectedLanguage === lang.code
                      ? theme.colors.primaryContainer
                      : theme.colors.surface,
                },
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
              accessible
              accessibilityRole="radio"
              accessibilityLabel={lang.label}
              accessibilityState={{ selected: selectedLanguage === lang.code }}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.languageLabel,
                  { color: theme.colors.onBackground },
                ]}
              >
                {lang.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <Animated.Text
        style={[styles.stepDescription, { color: theme.colors.onSurfaceVariant }]}
        entering={FadeInDown.delay(300).duration(500)}
      >
        {I18n.t("onboarding.languageDescription")}
      </Animated.Text>

      <StepFooter onNext={onNext} onBack={onBack} showBack />
    </Animated.ScrollView>
  );
}

/**
 * Step 5 - Theme Selection
 */
function StepTheme({ onNext, onBack }) {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const theme = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(mode === "dark");

  // Sync local state with context changes
  useEffect(() => {
    setIsDarkMode(mode === "dark");
  }, [mode]);

  const handleThemeToggle = async () => {
    await toggleTheme();

    // Try haptics
    try {
      // eslint-disable-next-line global-require
      const Haptics = require("expo-haptics");
      if (Haptics?.impactAsync) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (e) {
      // Haptics not available
    }
  };

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <Animated.Text
        style={[styles.stepTitle, { color: theme.colors.primary }]}
        entering={FadeInDown.duration(500)}
      >
        {I18n.t("onboarding.chooseTheme")}
      </Animated.Text>

      <View style={styles.themeToggleContainer}>
        <Animated.View
          style={[
            styles.themeOption,
            {
              backgroundColor: !isDarkMode ? theme.colors.tertiary : theme.colors.surface,
              borderColor: !isDarkMode ? theme.colors.tertiary : theme.colors.outlineVariant,
            },
          ]}
          entering={FadeInDown.delay(100).duration(500)}
        >
          <TouchableOpacity
            style={styles.themeCardButton}
            onPress={async () => !isDarkMode || (await handleThemeToggle())}
            accessible
            accessibilityRole="radio"
            accessibilityLabel={I18n.t("onboarding.light")}
            accessibilityState={{ selected: !isDarkMode }}
          >
            <Text style={styles.themeOptionEmoji}>☀️</Text>
            <Text
              style={[
                styles.themeOptionLabel,
                {
                  color: !isDarkMode ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {I18n.t("onboarding.light")}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.themeOption,
            {
              backgroundColor: isDarkMode ? theme.colors.primary : theme.colors.surface,
              borderColor: isDarkMode ? theme.colors.primary : theme.colors.outlineVariant,
            },
          ]}
          entering={FadeInDown.delay(100).duration(500)}
        >
          <TouchableOpacity
            style={styles.themeCardButton}
            onPress={async () => isDarkMode || (await handleThemeToggle())}
            accessible
            accessibilityRole="radio"
            accessibilityLabel={I18n.t("onboarding.dark")}
            accessibilityState={{ selected: isDarkMode }}
          >
            <Text style={styles.themeOptionEmoji}>🌙</Text>
            <Text
              style={[
                styles.themeOptionLabel,
                {
                  color: isDarkMode ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {I18n.t("onboarding.dark")}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.Text
        style={[styles.stepDescription, { color: theme.colors.onSurfaceVariant }]}
        entering={FadeInDown.delay(300).duration(500)}
      >
        {I18n.t("onboarding.themeDescription")}
      </Animated.Text>

      <StepFooter onNext={onNext} onBack={onBack} showBack />
    </Animated.ScrollView>
  );
}

/**
 * Step 6 - Privacy
 */
function StepPrivacy({ onNext, onBack }) {
  const theme = useTheme();

  const privacyPoints = [
    { icon: "🔒", title: I18n.t("onboarding.dataEncrypted") },
    { icon: "👁️", title: I18n.t("onboarding.userPrivacy") },
    { icon: "🛡️", title: I18n.t("onboarding.securePlatform") },
  ];

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <Animated.Text
        style={[styles.stepTitle, { color: theme.colors.primary }]}
        entering={FadeInDown.duration(500)}
      >
        {I18n.t("onboarding.privacy")}
      </Animated.Text>

      <View style={styles.privacyList}>
        {privacyPoints.map((point, i) => (
          <Animated.View
            key={`privacy-${i}`}
            style={styles.privacyItem}
            entering={FadeInDown.delay(i * 100).duration(500)}
          >
            <Text style={styles.privacyIcon}>{point.icon}</Text>
            <Text
              style={[styles.privacyTitle, { color: theme.colors.onBackground }]}
            >
              {point.title}
            </Text>
          </Animated.View>
        ))}
      </View>

      <Animated.Text
        style={[styles.stepDescription, { color: theme.colors.onSurfaceVariant }]}
        entering={FadeInDown.delay(400).duration(500)}
      >
        {I18n.t("onboarding.privacyDescription")}
      </Animated.Text>

      <StepFooter onNext={onNext} onBack={onBack} showBack />
    </Animated.ScrollView>
  );
}

/**
 * ConfettiPiece - subtle animated confetti element
 */
function ConfettiPiece({ index }) {
  const randomX = Math.random() * 150 - 75;
  const randomSpinDegrees = Math.random() * 720 - 360;

  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withTiming(screenHeight, {
      duration: 1800,
    });
    translateX.value = withTiming(randomX, {
      duration: 1800,
    });
    rotate.value = withTiming(randomSpinDegrees, {
      duration: 1800,
    });
    opacity.value = withSequence(
      withTiming(1, { duration: 1600 }),
      withTiming(0, { duration: 200 })
    );
  }, [translateY, translateX, rotate, opacity, randomX, randomSpinDegrees]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      key={`confetti-${index}`}
      style={[
        {
          position: "absolute",
          width: 20,
          height: 20,
          justifyContent: "center",
          alignItems: "center",
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: 16 }}>✨</Text>
    </Animated.View>
  );
}

/**
 * ConfettiBurst - container for confetti particles
 */
function ConfettiBurst() {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    setPieces(Array.from({ length: 15 }, (_, i) => i));
  }, []);

  return (
    <View style={styles.confettiContainer}>
      {pieces.map((i) => (
        <ConfettiPiece key={`piece-${i}`} index={i} />
      ))}
    </View>
  );
}

/**
 * Step 7 - Finale
 */
function StepFinale({ navigation }) {
  const theme = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(async () => {
      try {
        await setHasSeenOnboarding(true);
        navigation.replace("Sign In");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error completing onboarding:", e);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[styles.stepContainer, styles.finaleContainer]}>
      {showConfetti && <ConfettiBurst />}
      <Animated.View entering={FadeIn.duration(500)}>
        <Text style={[styles.finaleTitle, { color: theme.colors.primary }]}>
          🎯
        </Text>
      </Animated.View>

      <Animated.Text
        style={[styles.finaleMessage, { color: theme.colors.onBackground }]}
        entering={FadeInDown.delay(300).duration(500)}
      >
        {I18n.t("onboarding.youreIn")}
      </Animated.Text>

      <Animated.Text
        style={[styles.finaleSubtext, { color: theme.colors.onSurfaceVariant }]}
        entering={FadeInDown.delay(600).duration(500)}
      >
        {I18n.t("onboarding.readyToBegin")}
      </Animated.Text>
    </View>
  );
}

/**
 * Main Onboarding Screen
 */
export default function Onboarding({ navigation }) {
  const [step, setStep] = useState(0);
  const theme = useTheme();

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = async () => {
    try {
      await setHasSeenOnboarding(true);
      navigation.replace("Sign In");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error skipping onboarding:", e);
    }
  };

  const handleComplete = async () => {
    try {
      await setHasSeenOnboarding(true);
      navigation.replace("Sign In");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error completing onboarding:", e);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepWelcome onNext={goNext} onSkip={handleSkip} />
        );
      case 1:
        return (
          <StepCollection onNext={goNext} onBack={goBack} />
        );
      case 2:
        return (
          <StepFindRecords onNext={goNext} onBack={goBack} />
        );
      case 3:
        return (
          <StepOffline onNext={goNext} onBack={goBack} />
        );
      case 4:
        return (
          <StepLanguage onNext={goNext} onBack={goBack} />
        );
      case 5:
        return (
          <StepTheme onNext={goNext} onBack={goBack} />
        );
      case 6:
        return (
          <StepPrivacy onNext={goNext} onBack={goBack} />
        );
      case 7:
        return (
          <StepFinale navigation={navigation} />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ProgressBar step={step} />
      <View style={styles.stepWrapper}>
        {renderStep()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 0 : spacing.md,
  },
  stepWrapper: {
    flex: 1,
    marginTop: spacing.md,
  },
  stepContainer: {
    flex: 1,
  },
  stepContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  progressBarContainer: {
    paddingHorizontal: spacing.md,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  // Welcome step
  welcomeTitle: {
    ...typography.heading1,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    textAlign: "left",
  },
  welcomeAccentBar: {
    width: 60,
    height: 6,
    borderRadius: 3,
    marginVertical: spacing.lg,
  },
  welcomeDescription: {
    ...typography.body1,
    marginBottom: spacing.xxl,
  },
  // Step title/description
  stepTitle: {
    ...typography.heading2,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  stepDescription: {
    ...typography.body2,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  // Cards
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  collectionCard: {
    width: "48%",
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: spacing.radiusLarge,
    alignItems: "center",
    borderWidth: 1,
    borderLeftWidth: 5,
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: spacing.md,
  },
  cardLabel: {
    ...typography.label1,
    textAlign: "center",
  },
  // Search/Records
  searchDemoBox: {
    padding: spacing.lg,
    borderRadius: spacing.radiusLarge,
    borderWidth: 1,
    marginVertical: spacing.md,
    alignItems: "center",
  },
  recordsList: {
    marginVertical: spacing.md,
  },
  recordCard: {
    padding: spacing.md,
    borderRadius: spacing.radiusLarge,
    borderWidth: 1,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  // Offline
  offlineIcon: {
    fontSize: 56,
    textAlign: "center",
    marginVertical: spacing.xxl,
  },
  // Language
  languageGrid: {
    marginVertical: spacing.sm,
  },
  languageOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.radiusLarge,
    alignItems: "center",
    marginBottom: spacing.sm,
    borderWidth: 2,
  },
  languageFlag: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  languageLabel: {
    ...typography.label1,
  },
  // Theme
  themeToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  themeOption: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: spacing.radiusLarge,
    alignItems: "center",
    borderWidth: 2,
  },
  themeCardButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  themeOptionEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  themeOptionLabel: {
    ...typography.label1,
    textTransform: "uppercase",
  },
  // Privacy
  privacyList: {
    marginVertical: spacing.lg,
  },
  privacyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  privacyIcon: {
    fontSize: 28,
    marginRight: spacing.lg,
    marginTop: 0,
  },
  privacyTitle: {
    flex: 1,
    ...typography.label1,
  },
  // Finale
  finaleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  finaleTitle: {
    fontSize: 64,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  finaleMessage: {
    ...typography.heading2,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  finaleSubtext: {
    ...typography.body2,
    textAlign: "center",
    marginTop: spacing.md,
  },
  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  // Footer
  stepFooter: {
    marginTop: "auto",
    paddingTop: spacing.lg,
  },
  footerButtonRow: {
    marginBottom: spacing.md,
  },
  backButton: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  backButtonText: {
    ...typography.label1,
  },
  ctaContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  primaryPill: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.radiusFull,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryPillText: {
    ...typography.label1,
    color: "#FFFFFF",
  },
  skipText: {
    ...typography.label1,
    marginRight: spacing.md,
  },
});
