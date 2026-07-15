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

  // Semantic spacing (matches real token values)
  tkDliteSemanticSpacing100: 4,
  tkDliteSemanticSpacing200: 8,
  tkDliteSemanticSpacing300: 12,
  tkDliteSemanticSpacing400: 16,
  tkDliteSemanticSpacing500: 20,
  tkDliteSemanticSpacing600: 24,
  tkDliteSemanticSpacing700: 28,
  tkDliteSemanticSpacing800: 32,
};

module.exports = {
  light: baseTokens,
  dark: { ...baseTokens },
  default: baseTokens,
};
