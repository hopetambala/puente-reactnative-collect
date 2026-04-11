/**
 * Mock for style-dictionary-dlite-tokens
 * Used in tests to avoid ES module parsing issues
 */

const mockTokens = {
  tkDliteSemanticColorPrimary: '#007AFF',
  tkDliteSemanticColorTextOnPrimary: '#FFFFFF',
  tkDliteSemanticColorSecondary: '#5AC8FA',
  tkDliteSemanticColorTextOnSecondary: '#000000',
  tkDliteSemanticColorTertiary: '#34C759',
  tkDliteSemanticColorError: '#FF3B30',
  tkDliteSemanticColorErrorContainer: '#FFE5E5',
  tkDliteSemanticColorOnError: '#FFFFFF',
  tkDliteSemanticColorBackground: '#FFFFFF',
  tkDliteSemanticColorSurface: '#F5F5F5',
  tkDliteSemanticColorOutline: '#CCCCCC',
  tkDliteSemanticColorTextPrimary: '#000000',
  tkDliteSemanticColorTextSecondary: '#666666',
  tkDliteSemanticColorTextTertiary: '#999999',
  tkDliteSemanticColorTextOnSurfaceVariant: '#666666',
  tkDliteSemanticColorSuccess: '#34C759',
  tkDliteSemanticColorWarning: '#FF9500',
  
  colors: {
    primary: '#007AFF',
    onPrimary: '#FFFFFF',
    secondary: '#5AC8FA',
    onSurfaceVariant: '#666666',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    error: '#FF3B30',
    text: '#000000',
  },
  typography: {
    heading: {},
    body: {},
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

module.exports = {
  dark: mockTokens,
  light: mockTokens,
};
