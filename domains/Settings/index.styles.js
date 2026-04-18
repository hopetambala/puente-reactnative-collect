// Factory function to create dynamic styles with theme
import { spacing, typography } from "@modules/theme";
import { StyleSheet } from "react-native";

export const createSettingsStyles = (appTheme) => StyleSheet.create({
  text: {
    flexShrink: 1,
    ...typography.body1,
    color: appTheme.colors.onSurface,
    marginVertical: spacing.sm,
  },
  horizontalLineGray: {
    borderBottomColor: appTheme.colors.outline,
    borderBottomWidth: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  horizontalLinePrimary: {
    borderBottomColor: appTheme.colors.primary,
    borderBottomWidth: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  mainContainer: {
    paddingHorizontal: spacing.lg,
  },
  lineContainer: {
    marginBottom: spacing.xxl,
  },
  textContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    flexDirection: "row",
    marginLeft: "auto",
    marginTop: "auto",
    marginBottom: "auto",
    flex: 1,
  },
  svg: {
    marginLeft: "auto",
    marginTop: -3,
    marginBottom: -5,
  },
  languageContainer: {
    paddingTop: spacing.sm,
  },
});
