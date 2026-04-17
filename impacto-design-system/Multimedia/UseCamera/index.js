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

  // Permission flow:
  // - Don't request if permission is already determined (granted or denied)
  // - Don't request if permission state is still loading (null)
  // - Only request when permission is in "undetermined" state and camera becomes visible
  useEffect(() => {
    if (!cameraVisible) {
      return;
    }

    // If permission is already determined (granted or denied), do nothing
    if (isGranted || isDenied) {
      return;
    }

    // If permission state is still initializing (null), do nothing
    if (permission === null) {
      return;
    }

    // At this point: cameraVisible=true, !isGranted, !isDenied, permission exists but undetermined
    // Request permission when camera is about to be shown
    requestPermission();
  }, [cameraVisible, isGranted, isDenied, permission, requestPermission]);

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
