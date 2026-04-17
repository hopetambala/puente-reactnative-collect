/**
 * UseCameraControls Hook + Component
 * Handles camera controls: take picture, flip camera, reset, etc.
 *
 * Returns:
 * - takePicture: async function
 * - resetPicture: function
 * - toggleCameraType: function
 * - cameraType: 'front' | 'back'
 * - isLoading: boolean
 * - cameraImage: uri string or null
 */

import I18n from "@modules/i18n";
import { CameraView } from "expo-camera";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

export function useCameraControls(formikProps, formikKey, setImage) {
  const [cameraImage, setCameraImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraType, setCameraType] = useState("back");
  const cameraRef = useRef(null);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
        skipProcessing: true,
      });

      if (!photo || !photo.uri) {
        setIsLoading(false);
        return;
      }

      // Set local state for preview
      setCameraImage(photo.uri);
      setImage(photo.uri);

      // Set formik field with base64-encoded photo
      const base64Photo = `data:image/jpg;base64,${photo.base64}`;
      formikProps.setFieldValue(formikKey, base64Photo);
    } catch (error) {
      console.warn("Photo capture error:", error); //eslint-disable-line
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, formikKey, formikProps, setImage]);

  const resetPicture = useCallback(() => {
    setCameraImage(null);
    setImage(null);
    formikProps.setFieldValue(formikKey, null);
  }, [setImage, formikProps, formikKey]);

  const toggleCameraType = useCallback(() => {
    setCameraType((prev) => (prev === "back" ? "front" : "back"));
  }, []);

  return {
    takePicture,
    resetPicture,
    toggleCameraType,
    cameraType,
    isLoading,
    cameraImage,
    cameraRef,
  };
}

export function CameraActiveUI({
  cameraRef,
  cameraType,
  takePicture,
  toggleCameraType,
  isLoading,
}) {
  const appTheme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: "flex-end",
          alignItems: "center",
          backgroundColor: appTheme.colors.surface,
          padding: 10,
        },
        cameraContainer: {
          width: "100%",
          height: 500,
          backgroundColor: "black",
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 15,
        },
        camera: {
          flex: 1,
        },
        controlsRow: {
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          width: "100%",
          paddingHorizontal: 10,
        },
        button: {
          marginVertical: 10,
        },
      }),
    [appTheme]
  );

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing={cameraType}
          onInitialized={() => {
            // Camera is ready
          }}
          onError={(error) => {
            console.warn("Camera error:", error); //eslint-disable-line
          }}
          testID="camera-view"
        />
      </View>

      <View style={styles.controlsRow}>
        <Button
          icon="camera-flip"
          mode="outlined"
          onPress={toggleCameraType}
          style={styles.button}
          testID="flip-camera-button"
        >
          {I18n.t("camera.flip")}
        </Button>

        <Button
          mode="contained"
          onPress={takePicture}
          disabled={isLoading}
          loading={isLoading}
          style={styles.button}
          testID="take-picture-button"
        >
          {I18n.t("camera.takePicture")}
        </Button>
      </View>
    </View>
  );
}

export function PhotoPreviewUI({ cameraImage, onRetake, onDone }) {
  const appTheme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: appTheme.colors.surface,
          padding: 10,
        },
        image: {
          width: "100%",
          height: 400,
          borderRadius: 8,
          marginBottom: 20,
        },
        controlsRow: {
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          width: "100%",
        },
        button: {
          marginVertical: 10,
        },
      }),
    [appTheme]
  );

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: cameraImage }}
        style={styles.image}
        testID="captured-photo-preview"
      />
      <View style={styles.controlsRow}>
        <Button
          mode="outlined"
          onPress={onRetake}
          style={styles.button}
          testID="retake-button"
        >
          {I18n.t("camera.retake")}
        </Button>
        <Button
          mode="contained"
          onPress={onDone}
          style={styles.button}
          testID="done-button"
        >
          {I18n.t("camera.done")}
        </Button>
      </View>
    </View>
  );
}

export default useCameraControls;
