import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "@context/theme.context";
import I18n from "@modules/i18n";
import { setHasSeenOnboarding, setOnboardingStep, getOnboardingStep, clearOnboardingStep } from "@modules/settings";
import { spacing, typography } from "@modules/theme";
import React, { useContext, useEffect, useRef, useState } from "react";
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
  Easing,
  FadeIn,
  FadeInDown,
  SlideInLeft,
  SlideInRight,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { MOTION_TOKENS } from "./motion/tokens";
import { useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";

const { width: screenWidth } = Dimensions.get("window");
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Haptics helper — gracefully no-ops when unavailable (Expo Go, older devices)
 */
function triggerHaptic(style = "Light") {
  try {
    // eslint-disable-next-line global-require
    const Haptics = require("expo-haptics");
    const styleMap = {
      Light: Haptics.ImpactFeedbackStyle.Light,
      Medium: Haptics.ImpactFeedbackStyle.Medium,
      Heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    if (Haptics?.impactAsync) {
      Haptics.impactAsync(styleMap[style] ?? Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (e) {
    // Haptics unavailable — skip silently
  }
}

const TOTAL_STEPS = 9;

/**
 * ParallaxScrollView - ScrollView with parallax effect for background
 */
function ParallaxScrollView({ children, style, contentContainerStyle }) {
  const scrollOffset = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollOffset.value = e.contentOffset.y;
    },
  });

  return (
    <Animated.ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      {children(scrollOffset)}
    </Animated.ScrollView>
  );
}

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
    <View style={[styles.progressBarContainer, { marginTop: spacing.xxl }]}>
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
    triggerHaptic("Light");
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
            onPress={() => { triggerHaptic("Light"); onBack?.(); }}
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
            onPress={() => { triggerHaptic("Light"); onSkip?.(); }}
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
        {I18n.t("onboarding.welcome")}
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
    { icon: "document-text-outline", label: I18n.t("onboarding.textField"), color: theme.colors.primary },
    { icon: "keypad-outline", label: I18n.t("onboarding.numberField"), color: theme.colors.secondary },
    { icon: "location-outline", label: I18n.t("onboarding.locationField"), color: theme.colors.success },
    { icon: "camera-outline", label: I18n.t("onboarding.photoField"), color: theme.colors.info },
  ];

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <>
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
              style={[styles.collectionCard, { borderLeftColor: type.color, backgroundColor: theme.colors.surface }]}
              entering={FadeInDown.delay(i * 90).duration(500)}
            >
              <Ionicons name={type.icon} size={32} color={type.color} style={{ marginBottom: spacing.md }} />
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
      </>
    </Animated.ScrollView>
  );
}

/**
 * PermissionCard - single permission row with icon, reason, and Allow/Granted button
 */
function PermissionCard({ icon, title, reason, isGranted, isDenied, onRequest, color }) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (isGranted || isDenied) return;
    scale.value = withSequence(
      withTiming(0.97, { duration: 100 }),
      withSpring(1, MOTION_TOKENS.spring.snappy)
    );
    triggerHaptic("Medium");
    onRequest();
  };

  const statusColor = isGranted
    ? theme.colors.success
    : isDenied
    ? theme.colors.error
    : theme.colors.primary;

  const statusLabel = isGranted
    ? I18n.t("onboarding.permissionGranted")
    : isDenied
    ? I18n.t("onboarding.permissionDenied")
    : I18n.t("onboarding.permissionGrant");

  const statusIcon = isGranted
    ? "checkmark-circle"
    : isDenied
    ? "close-circle-outline"
    : "arrow-forward-circle-outline";

  return (
    <Animated.View
      style={[
        styles.permissionCard,
        {
          backgroundColor: theme.colors.surface,
          borderLeftColor: isGranted ? theme.colors.success : color,
        },
        cardStyle,
      ]}
    >
      <Ionicons name={icon} size={36} color={isGranted ? theme.colors.success : color} style={styles.permissionCardIcon} />
      <View style={styles.permissionCardBody}>
        <Text style={[styles.permissionCardTitle, { color: theme.colors.onBackground }]}>
          {title}
        </Text>
        <Text style={[styles.permissionCardReason, { color: theme.colors.onSurfaceVariant }]}>
          {reason}
        </Text>
        <TouchableOpacity
          onPress={handlePress}
          disabled={isGranted || isDenied}
          style={[styles.permissionButton, { borderColor: statusColor }]}
          accessible
          accessibilityRole="button"
          accessibilityLabel={statusLabel}
        >
          <Ionicons name={statusIcon} size={16} color={statusColor} />
          <Text style={[styles.permissionButtonText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

/**
 * Step 2 - Permissions
 */
function StepPermissions({ onNext, onBack }) {
  const theme = useTheme();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationStatus, setLocationStatus] = useState(null);

  const isCameraGranted = cameraPermission?.granted === true;
  const isCameraDenied = cameraPermission?.granted === false && cameraPermission?.canAskAgain === false;

  const isLocationGranted = locationStatus === "granted";
  const isLocationDenied = locationStatus === "denied";

  const handleRequestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(status);
  };

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <>
        <Animated.Text
          style={[styles.stepTitle, { color: theme.colors.primary }]}
          entering={FadeInDown.duration(500)}
        >
          {I18n.t("onboarding.permissions")}
        </Animated.Text>

        <Animated.Text
          style={[styles.stepDescription, { color: theme.colors.onSurfaceVariant }]}
          entering={FadeInDown.delay(150).duration(500)}
        >
          {I18n.t("onboarding.permissionsDescription")}
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.permissionCards}>
          <PermissionCard
            icon="camera-outline"
            title={I18n.t("onboarding.cameraPermission")}
            reason={I18n.t("onboarding.cameraPermissionReason")}
            isGranted={isCameraGranted}
            isDenied={isCameraDenied}
            onRequest={requestCameraPermission}
            color={theme.colors.info}
          />
          <PermissionCard
            icon="location-outline"
            title={I18n.t("onboarding.locationPermission")}
            reason={I18n.t("onboarding.locationPermissionReason")}
            isGranted={isLocationGranted}
            isDenied={isLocationDenied}
            onRequest={handleRequestLocation}
            color={theme.colors.success}
          />
        </Animated.View>

        <StepFooter onNext={onNext} onBack={onBack} showBack />
      </>
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
      <>
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Ionicons name="search-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Search</Text>
        </View>
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
      </>
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
      <>
        <Animated.Text
          style={[styles.stepTitle, { color: theme.colors.primary }]}
          entering={FadeInDown.duration(500)}
        >
          {I18n.t("onboarding.offlineMode")}
        </Animated.Text>

        <Animated.View
          style={styles.offlineIconContainer}
          entering={FadeInDown.delay(100).duration(500)}
        >
          <Ionicons name="cloud-offline-outline" size={64} color={theme.colors.primary} />
        </Animated.View>

        <Animated.Text
          style={[styles.stepDescription, { color: theme.colors.onSurfaceVariant }]}
          entering={FadeInDown.delay(300).duration(500)}
        >
          {I18n.t("onboarding.offlineDescription")}
        </Animated.Text>

        <StepFooter onNext={onNext} onBack={onBack} showBack />
      </>
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
    triggerHaptic("Medium");
  };

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <>
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
      </>
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
    triggerHaptic("Medium");
  };

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <>
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
            <Ionicons
                name="sunny-outline"
                size={32}
                color={!isDarkMode ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                style={{ marginBottom: spacing.sm }}
              />
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
            <Ionicons
                name="moon-outline"
                size={32}
                color={isDarkMode ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                style={{ marginBottom: spacing.sm }}
              />
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
      </>
    </Animated.ScrollView>
  );
}

/**
 * Step 6 - Privacy
 */
function StepPrivacy({ onNext, onBack }) {
  const theme = useTheme();

  const privacyPoints = [
    { icon: "lock-closed-outline", title: I18n.t("onboarding.dataEncrypted") },
    { icon: "eye-outline", title: I18n.t("onboarding.userPrivacy") },
    { icon: "shield-checkmark-outline", title: I18n.t("onboarding.securePlatform") },
  ];

  return (
    <Animated.ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      entering={FadeIn}
      scrollEnabled={false}
    >
      <>
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
            <Ionicons
              name={point.icon}
              size={24}
              color={theme.colors.primary}
              style={{ marginRight: spacing.lg, marginTop: 2 }}
            />
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
      </>
    </Animated.ScrollView>
  );
}

const CONFETTI_PALETTE = ["#F97316", "#8B5CF6", "#10B981", "#3B82F6", "#F59E0B", "#EF4444"];
const CONFETTI_COUNT = 24;

/**
 * ConfettiPiece - colored geometric particle bursting in arc from center
 */
function ConfettiPiece({ index }) {
  const color = CONFETTI_PALETTE[index % CONFETTI_PALETTE.length];
  const isCircle = index % 3 === 0;

  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Evenly spread angles so particles fan out in all directions
    const angle = (index / CONFETTI_COUNT) * Math.PI * 2;
    const spread = 80 + Math.random() * 160;
    const targetX = Math.sin(angle) * spread + (Math.random() - 0.5) * 40;
    const upAmount = 120 + Math.random() * 140;
    const spinDeg = Math.random() * 360 - 180;

    opacity.value = withTiming(1, { duration: 50 });
    // Arc: burst up/out fast, then gravity pulls down
    translateY.value = withSequence(
      withTiming(-upAmount, { duration: 500, easing: Easing.out(Easing.cubic) }),
      withTiming(400, { duration: 1000, easing: Easing.in(Easing.quad) })
    );
    translateX.value = withTiming(targetX, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
    rotate.value = withTiming(spinDeg, { duration: 1500 });
    opacity.value = withSequence(
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 900 })
    );
  }, [translateY, translateX, rotate, opacity]);

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
      style={[
        {
          position: "absolute",
          top: "50%",
          left: screenWidth / 2 - 4,
          width: isCircle ? 10 : 8,
          height: isCircle ? 10 : 14,
          borderRadius: isCircle ? 5 : 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * ConfettiBurst - container for confetti particles
 */
function ConfettiBurst() {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    setPieces(Array.from({ length: CONFETTI_COUNT }, (_, i) => i));
  }, []);

  return (
    <View pointerEvents="none" style={styles.confettiContainer}>
      {pieces.map((i) => (
        <ConfettiPiece key={`piece-${i}`} index={i} />
      ))}
    </View>
  );
}

/**
 * Step 7 - Finale
 */
function StepFinale({ onComplete, onBack }) {
  const theme = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
  }, []);

  return (
    <Animated.View entering={FadeIn} style={[styles.stepContainer, styles.stepContent]}>
      {showConfetti && <ConfettiBurst />}

      <View style={styles.finaleContent}>
        <Animated.View entering={FadeIn.duration(500)} style={{ marginBottom: spacing.xl }}>
          <Ionicons name="checkmark-circle-outline" size={80} color={theme.colors.primary} />
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

      <StepFooter
        onNext={onComplete}
        onBack={onBack}
        showBack
        nextLabel={I18n.t("onboarding.getStarted")}
      />
    </Animated.View>
  );
}

/**
 * Main Onboarding Screen
 */
export default function Onboarding({ navigation }) {
  const [step, setStep] = useState(0);
  const [isRestoringStep, setIsRestoringStep] = useState(true);
  const theme = useTheme();
  const directionRef = useRef("forward"); // "forward" | "backward"

  // Restore saved step on first mount
  useEffect(() => {
    getOnboardingStep().then((saved) => {
      if (saved !== null && saved > 0 && saved < TOTAL_STEPS) {
        directionRef.current = "forward";
        setStep(saved);
      }
      setIsRestoringStep(false);
    });
  }, []);

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      const nextStep = step + 1;
      directionRef.current = "forward";
      triggerHaptic("Medium");
      setStep(nextStep);
      setOnboardingStep(nextStep);
    }
  };

  const goBack = () => {
    if (step > 0) {
      const prevStep = step - 1;
      directionRef.current = "backward";
      triggerHaptic("Light");
      setStep(prevStep);
      setOnboardingStep(prevStep);
    }
  };

  const handleSkip = async () => {
    try {
      triggerHaptic("Medium");
      await clearOnboardingStep();
      await setHasSeenOnboarding(true);
      navigation.replace("Sign In");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error skipping onboarding:", e);
    }
  };

  const handleComplete = async () => {
    try {
      triggerHaptic("Heavy");
      await clearOnboardingStep();
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
          <StepPermissions onNext={goNext} onBack={goBack} />
        );
      case 3:
        return (
          <StepFindRecords onNext={goNext} onBack={goBack} />
        );
      case 4:
        return (
          <StepOffline onNext={goNext} onBack={goBack} />
        );
      case 5:
        return (
          <StepLanguage onNext={goNext} onBack={goBack} />
        );
      case 6:
        return (
          <StepTheme onNext={goNext} onBack={goBack} />
        );
      case 7:
        return (
          <StepPrivacy onNext={goNext} onBack={goBack} />
        );
      case 8:
        return (
          <StepFinale onComplete={handleComplete} onBack={goBack} />
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
      {isRestoringStep ? null : (
        <>
          <ProgressBar step={step} />
          <Animated.View
            key={`step-${step}`}
            entering={directionRef.current === "forward" ? SlideInRight.duration(300) : SlideInLeft.duration(300)}
            style={styles.stepWrapper}
          >
            {renderStep()}
          </Animated.View>
        </>
      )}
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
  offlineIconContainer: {
    alignItems: "center",
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
  privacyTitle: {
    flex: 1,
    ...typography.label1,
  },
  // Finale
  finaleContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  finaleMessage: {
    ...typography.heading2,
    textAlign: "center",
    alignSelf: "stretch",
    marginTop: spacing.lg,
  },
  finaleSubtext: {
    ...typography.body2,
    textAlign: "center",
    alignSelf: "stretch",
    marginTop: spacing.md,
  },
  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
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
  },
  skipText: {
    ...typography.label1,
    marginRight: spacing.md,
  },
  // Permissions
  permissionCards: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  permissionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
    borderRadius: spacing.radiusLarge,
    borderLeftWidth: 4,
    gap: spacing.md,
  },
  permissionCardIcon: {
    marginTop: 2,
  },
  permissionCardBody: {
    flex: 1,
    gap: spacing.sm,
  },
  permissionCardTitle: {
    ...typography.label1,
  },
  permissionCardReason: {
    ...typography.body2,
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: spacing.radiusFull,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  permissionButtonText: {
    ...typography.caption,
  },
});
