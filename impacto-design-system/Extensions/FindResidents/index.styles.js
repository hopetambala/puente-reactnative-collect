import { spacing, typography } from "@modules/theme";
import { StyleSheet } from "react-native";

const createStyles = (theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: {
    ...typography.heading2,
    fontWeight: "bold",
    color: theme.colors.onSurface,
    marginTop: spacing.sm,
  },
  container: {
    flex: 1,
  },
  offlineNotice: {
    ...typography.body2,
    color: theme.colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  loadingRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchingText: {
    ...typography.body2,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.body1,
    fontWeight: "600",
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    ...typography.body2,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});

export default createStyles;
