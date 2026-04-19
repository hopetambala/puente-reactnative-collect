// Factory function to create dynamic styles with theme
import { spacing, typography } from "@modules/theme";
import { StyleSheet } from "react-native";

export const createAssetFormSelectStyles = (appTheme) => StyleSheet.create({
    cardContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
    },
    textContainer: {
      flexDirection: "row",
      justifyContent: "center",
    },
    text: {
      ...typography.label1,
      flexShrink: 1,
      textAlign: "center",
      color: appTheme.colors.onSurface,
      fontWeight: "600",
      marginVertical: spacing.sm,
    },
    header: {
      ...typography.title1,
      color: appTheme.colors.onSurface,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
    componentContainer: {
      borderRadius: 12,
      backgroundColor: appTheme.colors.surfaceBase,
    },
  });
