import { spacing, typography } from "@modules/theme";
import { StyleSheet } from "react-native";

// Factory function to create dynamic styles with theme colors
// All colors automatically switch between light/dark based on theme.mode
const createPaperInputPickerStyles = (theme) => {
  const { colors } = theme;

  const stylesDefault = StyleSheet.create({
    horizontalLine: {
      borderBottomColor: colors.outline,
      borderBottomWidth: 1,
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    inputItem: {
      flex: 7,
      marginHorizontal: spacing.xs,
    },
    multiInputContainer: {
      flexDirection: "row",
    },
    container: {
      flex: 1,
      justifyContent: "center",
      padding: spacing.md,
    },
    header: {
      ...typography.title1,
      marginTop: spacing.md,
      color: colors.textPrimary, // Dark mode aware
    },
    label: {
      ...typography.label1,
      color: colors.onSurface,
      backgroundColor: colors.background,
      fontWeight: "600",
    },
    labelImage: {
      ...typography.label1,
      color: colors.onSurface,
      backgroundColor: colors.background,
      paddingBottom: spacing.md,
      fontWeight: "600",
    },
  });

  const stylesPaper = {
    colors: {
      placeholder: colors.textTertiary,
      primary: colors.primary,
      error: colors.error,
    },
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
    },
    button: {
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
      fontWeight: "500",
    },
    redText: {
      color: colors.error,
    },
    // Use semantic text colors (NOT hardcoded black/white) for dark mode support
    primaryText: {
      color: colors.textPrimary,
    },
    secondaryText: {
      color: colors.textSecondary,
    },
    tertiaryText: {
      color: colors.textTertiary,
    },
    onPrimaryText: {
      color: colors.onPrimary,
    },
    onSurfaceText: {
      color: colors.onSurface,
    },
  });

  const styleX = StyleSheet.create({
    sideLabel: {
      flex: 1,
      marginTop: "auto",
      marginBottom: "auto",
      padding: spacing.md,
      ...typography.body1,
      color: colors.onSurface, // Dark mode aware
    },
    textSplit: {
      ...typography.heading1,
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: "auto",
      marginBottom: spacing.lg,
      color: colors.textPrimary, // Dark mode aware
    },
  });

  const styleButton = StyleSheet.create({
    selected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 1,
      borderRadius: 8, // dlite semantic border radius md
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      margin: spacing.xs,
    },
    unselected: {
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 8, // dlite semantic border radius md
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      margin: spacing.xs,
      backgroundColor: colors.surfaceSunken, // Dark mode aware background
    },
    unselectedText: {
      color: colors.onSurface, // Dark mode aware text
    },
    selectedText: {
      color: colors.onPrimary, // Dark mode aware text
      fontWeight: "600",
    },
  });

  return { styleButton, styles, stylesDefault, stylesPaper, styleX };
};

export default createPaperInputPickerStyles;

