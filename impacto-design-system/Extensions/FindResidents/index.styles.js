import { spacing, typography } from "@modules/theme";
import { StyleSheet } from "react-native";

const createStyles = (theme) => StyleSheet.create({
  header: {
    ...typography.heading2,
    fontWeight: "bold",
    color: theme.colors.onSurface,
    marginTop: spacing.sm,
  },
  container: {
    flex: 1,
  },
});

export default createStyles;
