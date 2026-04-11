// Mock for style-dictionary-dlite-tokens/rn/puente/default
const baseTokens = {
  // Semantic colors
  tkDliteSemanticColorPrimary: '#007AFF',
  tkDliteSemanticColorTextOnPrimary: '#FFFFFF',
  tkDliteSemanticColorSecondary: '#5856D6',
  tkDliteSemanticColorTextOnSecondary: '#FFFFFF',
  tkDliteSemanticColorBrand: '#FF6B6B',
  tkDliteSemanticColorTextOnBrand: '#FFFFFF',
  
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
};

module.exports = {
  light: baseTokens,
  dark: { ...baseTokens },
  default: baseTokens,
};
