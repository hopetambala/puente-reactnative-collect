import GlassView from "@impacto-design-system/Base/GlassView";
import I18n from "@modules/i18n";
import { spacing, typography } from "@modules/theme";
import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Snackbar, useTheme } from "react-native-paper";

function PopupSuccess({ success, setSuccess, submittedForms }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(success);
  }, [success]);

  const dismissSnackBar = () => {
    setVisible(false);
    setSuccess(false);
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
      tintColor="rgba(34, 197, 94, 0.3)"
    >
      <Snackbar
        visible={visible}
        onDismiss={dismissSnackBar}
        duration={MOTION_TOKENS.duration.dismiss}
        style={styles.snackbar}
      >
        {/* Offline-first copy rule: say where the records actually are. These
            are cached on the device, not confirmed on the server. */}
        <Text style={styles.text}>
          {I18n.t("global.recordsStoredOnDevice", { count: submittedForms })}
        </Text>
      </Snackbar>
    </GlassView>
  );
}

export default PopupSuccess;
