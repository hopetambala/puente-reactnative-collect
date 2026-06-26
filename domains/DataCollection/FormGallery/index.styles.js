
import { spacing, typography } from "@modules/theme";
import { getTokens } from "@modules/theme/tokens";
import { StyleSheet } from "react-native";

const t = getTokens("light");

const createStyles = (theme) => StyleSheet.create({
  cardContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: t.tkDliteSemanticSpacing300, // spacing.sm = 12px
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
    marginVertical: 0, // TODO(dlite): zero-reset, no token maps to 0
    fontSize: typography.label2.fontSize, // typography.size.sm ~13px, using label2=12px (closest token)
  },
  header: {
    ...typography.title1,
    color: theme.colors.onSurface,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  mediumHeader: {
    ...typography.title2,
    color: theme.colors.onSurface,
    fontWeight: "600",
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: t.tkDliteSemanticBorderRadiusMedium, // borderRadius.md
    backgroundColor: theme.colors.surfaceBase,
  },
  cardTitle: {
    ...typography.label1,
    color: theme.colors.onSurface,
    fontWeight: "600",
  },
  comingSoonCard: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: t.tkDliteSemanticBorderRadiusMedium, // borderRadius.md
    backgroundColor: theme.colors.surfaceBase,
    padding: spacing.lg,
  },
});

export default createStyles;
