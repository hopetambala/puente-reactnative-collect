import { spacing, typography } from "@modules/theme";
import { StyleSheet } from "react-native";

const createStyles = (theme) => StyleSheet.create({
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
    color: theme.colors.onSurface,
    fontWeight: "600",
    marginVertical: spacing.sm,
  },
  header: {
    ...typography.title1,
    color: theme.colors.onSurface,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.label1,
    color: theme.colors.onSurface,
    fontWeight: "600",
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceBase,
  },
});

export default createStyles;
