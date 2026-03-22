// Legacy colors - use theme.colors semantic tokens instead
const tintColor = "#3d80fc"; // Use theme.colors.primary

export default {
  // Deprecated: Use semantic tokens from theme.colors instead
  tintColor, // → theme.colors.primary
  tabIconDefault: "#ccc", // → theme.colors.outlineVariant
  tabIconSelected: tintColor, // → theme.colors.primary
  tabBar: "#fefefe", // → theme.colors.surface
  errorBackground: "red", // → theme.colors.error
  errorText: "#fff", // → theme.colors.onError
  warningBackground: "#EAEB5E", // → theme.colors.warning
  warningText: "#666804", // → theme.colors.onWarning (use neutral)
  noticeBackground: tintColor, // → theme.colors.info
  noticeText: "#fff", // → theme.colors.onInfo
};
