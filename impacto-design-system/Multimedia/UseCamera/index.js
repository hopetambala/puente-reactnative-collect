import I18n from "@modules/i18n";
import { Camera } from "expo-camera";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Modal, Portal, Text, useTheme } from "react-native-paper";

export default function UseCamera({
  cameraVisible,
  setCameraVisible,
  formikProps,
  formikKey,
  setImage,
}) {
  const appTheme = useTheme();
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [cameraImage, setCameraImage] = useState(null);
  const [zoom, setZoom] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const camera = useRef(null);

  // Create styles dynamically based on theme
  const styles = useMemo(
    () =>
      StyleSheet.create({
        modal: {
          backgroundColor: appTheme.colors.surfaceRaised,
          width: Dimensions.get("window").width,
          height: Dimensions.get("window").height,
        },
        button: {
          marginTop: 30,
        },
        cameraButtonContainer: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0)",
          flexDirection: "row",
        },
        flipContainer: {
          flex: 0.2,
          alignSelf: "flex-end",
          alignItems: "center",
        },
        zoomContainer: {
          flex: 1,
          alignSelf: "flex-end",
          alignItems: "flex-end",
          alignContent: "flex-end",
        },
        cameraButtonText: {
          fontSize: 24,
          marginBottom: 10,
          color: appTheme.colors.onSurface,
          marginRight: 10,
        },
      }),
    [appTheme.colors]
  );

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestPermissionsAsync();
        setHasPermission(status === "granted");
      } catch (error) {
        console.error("Error requesting camera permissions:", error);
        setHasPermission(false);
      }
    })();
  }, []);

  const takePicture = async () => {
    if (!camera.current) {
      console.error("Camera reference not available");
      return;
    }
    
    try {
      setIsLoading(true);
      const photo = await camera.current.takePictureAsync({
        base64: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!photo || !photo.uri) {
        console.error("Photo capture failed: missing uri");
        setIsLoading(false);
        return;
      }

      setCameraImage(photo.uri);
      setImage(photo.uri);
      formikProps.setFieldValue(
        formikKey,
        `data:image/jpg;base64,${photo.base64}`
      );
    } catch (error) {
      console.error("Error taking picture:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPicture = () => {
    setCameraImage(null);
    formikProps.setFieldValue(formikKey, null);
  };

  const renderModalContent = () => {
    if (hasPermission === null) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 10,
          }}
        >
          <ActivityIndicator animating size="large" />
          <Text style={{ marginTop: 10 }}>
            {I18n.t("camera.requestingPermission")}
          </Text>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 10,
          }}
        >
          <Text>{I18n.t("camera.noAccess")}</Text>
          <Button
            mode="contained"
            style={{ marginTop: 20 }}
            onPress={() => setCameraVisible(false)}
          >
            {I18n.t("camera.done")}
          </Button>
        </View>
      );
    }

    return (
      <View style={{ width: "auto", height: 500, padding: 10 }}>
        {cameraImage ? (
          <>
            <Image
              source={{ uri: cameraImage }}
              style={{ width: "auto", height: 400 }}
            />
            <Button onPress={resetPicture}>{I18n.t("camera.retake")}</Button>
          </>
        ) : (
          <>
            <Camera
              style={{ flex: 5 }}
              type={type}
              ref={camera}
              autofocus
              zoom={zoom}
              base64
            >
              <View style={styles.cameraButtonContainer}>
                <TouchableOpacity
                  style={styles.flipContainer}
                  onPress={() => {
                    setType(
                      type === Camera.Constants.Type.back
                        ? Camera.Constants.Type.front
                        : Camera.Constants.Type.back
                    );
                  }}
                >
                  <Text style={styles.cameraButtonText}>
                    {I18n.t("camera.flip")}
                  </Text>
                </TouchableOpacity>
                <View style={styles.cameraButtonContainer}>
                  <View style={styles.zoomContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        setZoom(zoom === 0.4 ? zoom : zoom + 0.1);
                      }}
                    >
                      <Text style={styles.cameraButtonText}> + </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setZoom(zoom === 0 ? zoom : zoom - 0.1);
                      }}
                    >
                      <Text style={styles.cameraButtonText}> - </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Camera>
            <Button 
              onPress={takePicture}
              disabled={isLoading}
              loading={isLoading}
            >
              {I18n.t("camera.takePicture")}
            </Button>
          </>
        )}
      </View>
    );
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>{I18n.t("camera.noAccess")}</Text>;
  }
  
  return (
    <Portal theme={appTheme}>
      <Modal
        visible={cameraVisible}
        theme={appTheme}
        contentContainerStyle={styles.modal}
        dismissable={false}
      >
        {renderModalContent()}
        <Button
          mode="contained"
          style={styles.button}
          onPress={() => setCameraVisible(false)}
        >
          {I18n.t("camera.done")}
        </Button>
      </Modal>
    </Portal>
  );
}
