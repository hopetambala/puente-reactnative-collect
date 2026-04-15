/**
 * UseCameraPermissions Hook + UI Component
 * Handles permission request flow with appropriate UI states
 *
 * Returns:
 * - permission: { granted, canAskAgain, status }
 * - permissionUI: React component to render or null if granted
 */

import I18n from "@modules/i18n";
import { useCameraPermissions } from "expo-camera";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

export function usePermissionState() {
  const [permission, requestPermission] = useCameraPermissions();

  return {
    permission,
    requestPermission,
    isGranted: permission?.granted === true,
    isDenied: permission?.granted === false && permission?.canAskAgain === false,
    isRequesting: permission?.status === 'undetermined' || permission === null,
  };
}

export function PermissionRequestUI() {
  const appTheme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: appTheme.colors.surface,
          padding: 20,
        },
        label: {
          fontSize: 16,
          fontWeight: "600",
          color: appTheme.colors.onSurface,
          marginBottom: 15,
          textAlign: "center",
        },
      }),
    [appTheme]
  );

  return (
    <View style={styles.container} testID="permission-request-ui">
      <ActivityIndicator size="large" color={appTheme.colors.primary} />
      <Text style={styles.label}>
        {I18n.t("camera.requestingPermission")}
      </Text>
    </View>
  );
}

export function PermissionDeniedUI({ onClose }) {
  const appTheme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: appTheme.colors.surface,
          padding: 20,
        },
        label: {
          fontSize: 16,
          fontWeight: "600",
          color: appTheme.colors.onSurface,
          marginBottom: 15,
          textAlign: "center",
        },
        button: {
          marginTop: 20,
        },
      }),
    [appTheme]
  );

  return (
    <View style={styles.container} testID="permission-denied-ui">
      <Text style={styles.label}>{I18n.t("camera.noAccess")}</Text>
      <Button
        mode="contained"
        onPress={onClose}
        style={styles.button}
        testID="permission-denied-close-button"
      >
        {I18n.t("camera.done")}
      </Button>
    </View>
  );
}

export default usePermissionState;
