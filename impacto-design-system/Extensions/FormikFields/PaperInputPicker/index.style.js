import { spacing, typography } from "@modules/theme";
import { StyleSheet } from "react-native";

// Factory function to create dynamic styles with theme colors
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
    },
    label: {
      ...typography.label1,
      color: colors.onSurface,
      backgroundColor: colors.background,
    },
    labelImage: {
      ...typography.label1,
      color: colors.onSurface,
      backgroundColor: colors.background,
      paddingBottom: spacing.md,
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
    },
    redText: {
      color: colors.error,
    },
    whiteText: {
      color: colors.onPrimary,
    },
    blackText: {
      color: colors.onSurface,
    },
    primaryText: {
      color: colors.primary,
    },
  });

  const styleX = StyleSheet.create({
    sideLabel: {
      flex: 1,
      marginTop: "auto",
      marginBottom: "auto",
      padding: spacing.md,
      ...typography.body1,
    },
    textSplit: {
      ...typography.heading1,
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: "auto",
      marginBottom: spacing.lg,
    },
  });

  const styleButton = StyleSheet.create({
    selected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 1,
      borderRadius: spacing.radiusMedium,
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      margin: spacing.xs,
    },
    unselected: {
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: spacing.radiusMedium,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      margin: spacing.xs,
    },
  });

  return { styleButton, styles, stylesDefault, stylesPaper, styleX };
};

export default createPaperInputPickerStyles;
