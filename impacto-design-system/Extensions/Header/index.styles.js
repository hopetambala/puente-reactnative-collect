import { spacing, typography } from "@modules/theme";
import { StyleSheet } from "react-native";

/**
 * Create Header styles dynamically with theme
 * Modern design: clean, minimal, uses semantic tokens
 */
// eslint-disable-next-line import/prefer-default-export
export const createHeaderStyles = (theme) => {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline,
    },
    header: {
      height: 56,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
    },
    title: {
      fontSize: typography.heading1.fontSize,
      fontWeight: "600",
      color: colors.textPrimary,
      flex: 1,
      marginLeft: spacing.md,
    },
    iconButton: {
      color: colors.textPrimary,
    },
    drawerContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.background,
    },
    greeting: {
      ...typography.heading2,
      color: colors.textPrimary,
      marginVertical: spacing.md,
      textAlign: "center",
    },
    volunteerDate: {
      ...typography.body1,
      color: colors.textSecondary,
      textAlign: "center",
      marginVertical: spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: colors.outline,
      marginVertical: spacing.md,
    },
    successText: {
      ...typography.body1,
      color: colors.textPrimary,
      textAlign: "center",
      marginVertical: spacing.sm,
    },
    errorText: {
      ...typography.body1,
      color: colors.error,
      textAlign: "center",
      marginVertical: spacing.sm,
    },
    buttonContainer: {
      marginVertical: spacing.sm,
    },
    // FormCounts styles
    headerFormText: {
      ...typography.heading2,
      color: colors.textPrimary,
      marginVertical: spacing.md,
    },
    horizontalLineGray: {
      height: 1,
      backgroundColor: colors.outline,
      marginVertical: spacing.sm,
    },
    countContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: spacing.sm,
    },
    label: {
      ...typography.body1,
      color: colors.textPrimary,
    },
    count: {
      ...typography.body1,
      color: colors.textSecondary,
      fontWeight: "600",
    },
  });
};
