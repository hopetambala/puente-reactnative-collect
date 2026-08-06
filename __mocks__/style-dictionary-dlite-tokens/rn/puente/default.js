// Mock for style-dictionary-dlite-tokens/rn/puente/default
const baseTokens = {
  // Semantic colors
  tkDliteSemanticColorPrimary: '#007AFF',
  tkDliteSemanticColorTextOnPrimary: '#FFFFFF',
  tkDliteSemanticColorSecondary: '#5856D6',
  tkDliteSemanticColorTextOnSecondary: '#FFFFFF',
  tkDliteSemanticColorBrand: '#FF6B6B',
  tkDliteSemanticColorTextOnBrand: '#FFFFFF',

  // Text colors
  tkDliteSemanticColorTextPrimary: '#161616',
  tkDliteSemanticColorTextSecondary: '#6E6E6E',
  tkDliteSemanticColorTextTertiary: '#A5A5A5',
  tkDliteSemanticColorTextOnSurfaceVariant: '#6E6E6E',

  // Feedback colors
  tkDliteSemanticColorFeedbackSuccess: '#34C759',
  tkDliteSemanticColorFeedbackDanger: '#FF3B30',
  tkDliteSemanticColorFeedbackDangerContainer: '#FFE5E5',
  tkDliteSemanticColorFeedbackWarning: '#FF9500',
  tkDliteSemanticColorFeedbackInfo: '#00C7FF',

  // Neutral colors
  tkDliteSemanticColorNeutral: '#8E8E93',

  // Surface colors
  tkDliteSemanticColorSurface: '#FFFFFF',
  tkDliteSemanticColorSurfaceInverse: '#1C1C1E',

  // Real values from style-dictionary-dlite-tokens/dist/rn/puente/default.
  // Keep these in sync with the package -- a mock that invents colour values
  // makes any contrast assertion meaningless.
  tkDliteSemanticColorBackground: '#f7f7f7',
  tkDliteSemanticColorSurfaceBase: '#ffffff',
  tkDliteSemanticColorSurfaceRaised: '#ffffff',
  tkDliteSemanticColorActionPrimary: '#3d80fc',
  tkDliteSemanticColorActionPrimaryActive: '#0a46b6',
  tkDlitePrimitiveColorBlue100: '#ebf2ff',

  // Semantic spacing (matches real token values)
  tkDliteSemanticSpacing100: 4,
  tkDliteSemanticSpacing200: 8,
  tkDliteSemanticSpacing300: 12,
  tkDliteSemanticSpacing400: 16,
  tkDliteSemanticSpacing500: 20,
  tkDliteSemanticSpacing600: 24,
  tkDliteSemanticSpacing700: 28,
  tkDliteSemanticSpacing800: 32,
  tkDliteSemanticSpacing900: 36,
  tkDliteSemanticSpacing1000: 40,

  // Hairline steps, for divider rules.
  tkDliteSemanticSpacingXxxs: 1,
  tkDliteSemanticSpacingXxs: 2,

  // Type ramp. Note lineHeight is a RATIO, not pixels, and letterSpacing is a
  // CSS string ("0em") -- neither drops straight into a React Native style.
  tkDliteSemanticTypographyTypeBodyDefaultSize: 16,
  tkDliteSemanticTypographyTypeBodyDefaultWeight: 400,
  tkDliteSemanticTypographyTypeBodyDefaultLineHeight: 1.5,
  tkDliteSemanticTypographyTypeBodyDefaultLetterSpacing: '0em',

  // Typography sizes are numeric only -- there are no named aliases.
  tkDliteSemanticTypographySize100: 10,
  tkDliteSemanticTypographySize200: 12,
  tkDliteSemanticTypographySize300: 14,
  tkDliteSemanticTypographySize400: 16,
};

module.exports = {
  light: baseTokens,
  dark: { ...baseTokens },
  default: baseTokens,
};
