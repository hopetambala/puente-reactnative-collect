import { DefaultTheme, MD3DarkTheme } from "react-native-paper";

import { createLayoutStyles } from "./layout";
import { shadows } from "./shadows";
import { spacing } from "./spacing";
import { getTokens } from "./tokens";
import { typography } from "./typography";

// Create dynamic theme based on light/dark mode
const createTheme = (mode = "light") => {
  const isDark = mode === "dark";
  const baseTheme = isDark ? MD3DarkTheme : DefaultTheme;
  const colorTokens = getTokens(mode);

  const theme = {
    ...baseTheme,
    // Theme mode indicator
    mode,
    isDark,
    isLight: !isDark,

    // Design tokens
    tokens: colorTokens,
    typography,
    spacing,

    // Color palette (merged into Paper theme)
    colors: {
      ...baseTheme.colors,
      // Primary color
      // TODO(dlite): tkDliteSemanticColorPrimary (#3d80fc) fails WCAG AA in light
      // mode in BOTH directions -- 3.44:1 as a label on the app background, and
      // 3.69:1 as a surface under white onPrimary text (contrast is symmetric, so
      // text buttons and contained buttons fail equally). Composed from
      // ActionPrimaryActive (#0a46b6, the Blue700 step) which gives 7.64:1 and
      // 8.19:1 respectively. Dark mode already clears AA at 7.06:1, so it keeps
      // the base token. Fix belongs upstream in style-dictionary-dlite-tokens.
      primary: isDark
        ? colorTokens.tkDliteSemanticColorPrimary
        : colorTokens.tkDliteSemanticColorActionPrimaryActive,
      onPrimary: colorTokens.tkDliteSemanticColorTextOnPrimary,

      // Secondary color
      secondary: colorTokens.tkDliteSemanticColorSecondary,
      onSecondary: colorTokens.tkDliteSemanticColorTextSecondary,

      // Paper's SegmentedButtons reads secondaryContainer for the selected
      // segment. Left unmapped it falls back to the MD3 baseline lavender
      // (#E8DEF8), which is off-brand against every other action in the app.
      secondaryContainer: isDark
        ? colorTokens.tkDliteSemanticColorSurfaceRaised
        : colorTokens.tkDlitePrimitiveColorBlue100,
      onSecondaryContainer: isDark
        ? colorTokens.tkDliteSemanticColorPrimary
        : colorTokens.tkDliteSemanticColorActionPrimaryActive,

      // Brand color (explicit semantic brand identity)
      brand: colorTokens.tkDliteSemanticColorBrand,
      onBrand: colorTokens.tkDliteSemanticColorTextOnBrand,

      // Semantic colors - Feedback
      success: colorTokens.tkDliteSemanticColorFeedbackSuccess,
      error: colorTokens.tkDliteSemanticColorFeedbackDanger,
      // TODO: Add errorContainer token to design system. Temporarily derive from error color.
      // Material Design 3 pattern: errorContainer is a tinted version of error for background surfaces
      errorContainer: colorTokens.tkDliteSemanticColorFeedbackDangerContainer || (isDark ? "#4D1A1A" : "#FFDDDD"), // dlite-optional
      warning: colorTokens.tkDliteSemanticColorFeedbackWarning,
      info: colorTokens.tkDliteSemanticColorFeedbackInfo,

      // Surfaces
      background: colorTokens.tkDliteSemanticColorBackground,
      surface: colorTokens.tkDliteSemanticColorSurfaceBase,
      surfaceVariant: colorTokens.tkDliteSemanticColorSurfaceRaised,
      surfaceRaised: colorTokens.tkDliteSemanticColorSurfaceRaised,
      onBackground: colorTokens.tkDliteSemanticColorTextPrimary,
      onSurface: colorTokens.tkDliteSemanticColorTextPrimary,
      onSurfaceVariant: colorTokens.tkDliteSemanticColorTextSecondary,

      // Outlines and borders
      outline: colorTokens.tkDliteSemanticColorBorder,
      outlineVariant: colorTokens.tkDliteSemanticColorMuted,

      // Scrim (overlay)
      scrim: colorTokens.tkDliteSemanticColorBackground,

      // Additional semantic colors for app-specific use
      border: colorTokens.tkDliteSemanticColorBorder,
      divider: colorTokens.tkDliteSemanticColorMuted,
      placeholder: colorTokens.tkDliteSemanticColorTextTertiary,

      // Actions
      actionPrimary: colorTokens.tkDliteSemanticColorActionPrimary,
      actionPrimaryActive: colorTokens.tkDliteSemanticColorActionPrimaryActive,
      actionSecondary: colorTokens.tkDliteSemanticColorActionSecondary,
      actionSecondaryActive: colorTokens.tkDliteSemanticColorActionSecondaryActive,

      // Accessibility
      muted: colorTokens.tkDliteSemanticColorMuted,
      foreground: colorTokens.tkDliteSemanticColorForeground,

      // Text colors
      textPrimary: colorTokens.tkDliteSemanticColorTextPrimary,
      textSecondary: colorTokens.tkDliteSemanticColorTextSecondary,
      textTertiary: colorTokens.tkDliteSemanticColorTextTertiary,

      // Link/interaction
      link: colorTokens.tkDliteSemanticColorFeedbackInfo,
      disabled: colorTokens.tkDliteSemanticColorMuted,

      // Surface variants
      surfaceSunken: colorTokens.tkDliteSemanticColorSurfaceSunken,
      surfaceOverlay: colorTokens.tkDliteSemanticColorSurfaceOverlay,

      // Paper-specific colors mapped to semantic tokens (needed for proper dark mode)
      // These ensure all Paper components respect the theme
      accent: colorTokens.tkDliteSemanticColorSecondary || colorTokens.tkDliteSemanticColorActionSecondary,
      black: colorTokens.tkDliteSemanticColorTextPrimary,
      white: colorTokens.tkDliteSemanticColorSurfaceBase,
    },

    // Shadows (elevation system)
    elevations: shadows,

    // Layout factory
    createLayoutStyles,

    // Dark Mode Support Documentation:
    // All color tokens are automatically switched by dlite design system based on mode
    // The following tokens update their values for dark mode:
    // - tkDliteSemanticColorBackground (light: #f7f7f7, dark: darker shade)
    // - tkDliteSemanticColorSurfaceBase/SurfaceSunken/SurfaceRaised (adjust contrast)
    // - tkDliteSemanticColorTextPrimary/Secondary/Tertiary (light: dark text, dark: light text)
    // - tkDliteSemanticColorBorder (light: #d4d4d4, dark: lighter for contrast)
    // - All feedback colors (error, success, warning) remain consistent but with adjusted transparency
    // 
    // To ensure dark mode works: Always use colors.* tokens, never hardcode colors.
    // Dlite tokens handle the switching automatically per light/dark mode.
  };

  return theme;
};

// Default light theme for backwards compatibility
const theme = createTheme("light");

export { createLayoutStyles, createTheme, shadows, spacing, theme, typography };

