import { ThemeContext } from "@context/theme.context";
import GlassView from "@impacto-design-system/Base/GlassView";
import { spacing } from "@modules/theme";
import React, { useContext } from "react";
import { StyleSheet } from "react-native";
import { Snackbar } from "react-native-paper";

function Toast({ text, visible, onClick, onClickLabel }) {
  useContext(ThemeContext); // Used for theme switching reactivity

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 999,
    },
    glassToast: {
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
  });

  return (
    <GlassView style={styles.container}>
      <GlassView
        style={styles.glassToast}
        glassEffectStyle="regular"
        tintColor="rgba(34, 197, 94, 0.3)"
      >
        <Snackbar
          visible={visible}
          onDismiss={onClick}
          duration={3000}
          style={styles.snackbar}
          action={{
            label: onClickLabel,
            onPress: () => onClick(),
          }}
        >
          {text}
        </Snackbar>
      </GlassView>
    </GlassView>
  );
}

export default Toast;
