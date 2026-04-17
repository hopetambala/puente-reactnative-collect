/**
 * UseCamera Component - Main orchestrator
 * 
 * Production-ready camera implementation using:
 * - expo-camera with CameraView + useCameraPermissions hook
 * - Modern permission handling
 * - Composable sub-components for permissions and controls
 * - Error handling and edge cases
 */

import {
  CameraActiveUI,
  PhotoPreviewUI,
  useCameraControls,
} from "@impacto-design-system/Multimedia/UseCameraControls";
import {
  PermissionDeniedUI,
  PermissionRequestUI,
  usePermissionState,
} from "@impacto-design-system/Multimedia/UseCameraPermissions";
import React, { useCallback, useEffect } from "react";

export default function UseCamera({
  cameraVisible,
  setCameraVisible,
  formikProps,
  formikKey,
  setImage,
}) {
  // Permission state management
  const { permission, requestPermission, isGranted, isDenied, isRequesting } = usePermissionState();

  // Request permission when camera is about to be shown.
  // isGranted and isDenied are derived from permission.granted and canAskAgain
  // inside usePermissionState, so they safely cover all permission states.
  useEffect(() => {
    if (cameraVisible && !isGranted && !isDenied) {
      requestPermission();
    }
  }, [cameraVisible, isGranted, isDenied, requestPermission]);

  // Camera controls (take photo, flip, reset)
  const {
    takePicture,
    resetPicture,
    toggleCameraType,
    cameraType,
    isLoading,
    cameraImage,
    cameraRef,
  } = useCameraControls(formikProps, formikKey, setImage);

  const closeCameraModal = useCallback(() => {
    setCameraVisible(false);
    resetPicture();
  }, [setCameraVisible, resetPicture]);

  // REQUESTING PERMISSION STATE
  if (isRequesting) {
    return <PermissionRequestUI />;
  }

  // PERMISSION DENIED STATE
  if (isDenied) {
    return <PermissionDeniedUI onClose={closeCameraModal} />;
  }

  // PHOTO PREVIEW STATE
  if (cameraImage) {
    return (
      <PhotoPreviewUI
        cameraImage={cameraImage}
        onRetake={resetPicture}
        onDone={closeCameraModal}
      />
    );
  }

  // CAMERA ACTIVE STATE (permission granted)
  if (isGranted) {
    return (
      <CameraActiveUI
        cameraRef={cameraRef}
        cameraType={cameraType}
        takePicture={takePicture}
        toggleCameraType={toggleCameraType}
        isLoading={isLoading}
      />
    );
  }

  // Fallback (shouldn't reach here)
  return null;
}
