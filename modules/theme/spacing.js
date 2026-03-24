// Standardized spacing scale - multiples of 4px for consistency
// Based on 8px base grid system

export const spacing = {
  // Base units (4px grid)
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,

  // Aliases for readability
  tiny: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 24,
  massive: 32,
  huge: 48,

  // Common patterns
  gutter: 16, // horizontal padding for screens
  gap: 8, // gap between items
  divider: 12, // space between sections

  // Compact vs spacious
  compact: 8,
  normal: 16,
  spacious: 24,
  generous: 32,

  // Top/bottom padding for screens
  screenPaddingVertical: 16,
  screenPaddingHorizontal: 16,

  // Component padding
  buttonPadding: 12,
  cardPadding: 16,
  inputPadding: 12,

  // Border radius (associated with spacing-like rhythm)
  radiusSmall: 4,
  radiusMedium: 8,
  radiusLarge: 12,
  radiusXL: 16,
  radiusFull: 9999, // for pills/circles
};

export default spacing;
