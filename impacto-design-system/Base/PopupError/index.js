import GlassView from "@impacto-design-system/Base/GlassView";
import I18n from "@modules/i18n";
import { spacing, typography } from "@modules/theme";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Snackbar, useTheme } from "react-native-paper";

function PopupError({ error, setError, errorMessage }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(error);
  }, [error]);

  const dismissSnackBar = () => {
    setVisible(false);
    setError(false);
  };

  const styles = StyleSheet.create({
    glassContainer: {
      borderRadius: spacing.radiusMedium,
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
      overflow: "hidden",
    },
    snackbar: {
      backgroundColor: "transparent",
      borderRadius: spacing.radiusMedium,
      marginHorizontal: 0,
      marginBottom: 0,
    },
    text: {
      fontSize: typography.label1.fontSize,
      fontWeight: typography.label1.fontWeight,
      color: theme.colors.onPrimary,
    },
  });

  return (
    <GlassView
      style={styles.glassContainer}
      glassEffectStyle="regular"
      tintColor="rgba(220, 38, 38, 0.3)"
    >
      <Snackbar
        visible={visible}
        onDismiss={dismissSnackBar}
        duration={MOTION_TOKENS.duration.dismiss}
        style={styles.snackbar}
      >
        <Text style={styles.text}>
          {I18n.t(errorMessage)}
        </Text>
      </Snackbar>
    </GlassView>
  );
}

export default PopupError;
