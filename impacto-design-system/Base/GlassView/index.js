import {
  GlassView as ExpoGlassView,
  isGlassEffectAPIAvailable,
} from "expo-glass-effect";
import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";

/**
 * Cross-platform GlassView component
 * - iOS 26+: Uses native glass effect
 * - Other platforms: Fallback to semi-transparent View
 */
const GlassView = ({
  glassEffectStyle = "regular",
  tintColor,
  colorScheme = "auto",
  isInteractive = false,
  style,
  children,
  ...props
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      const available = isGlassEffectAPIAvailable();
      setIsAvailable(available);
    }
    setHasChecked(true);
  }, []);

  // If not checked yet, render empty to avoid hydration mismatch
  if (!hasChecked) {
    return (
      <View
        style={[
          style,
          {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }

  // iOS 26+ with glass effect support
  if (Platform.OS === "ios" && isAvailable) {
    return (
      <ExpoGlassView
        glassEffectStyle={glassEffectStyle}
        tintColor={tintColor}
        colorScheme={colorScheme}
        isInteractive={isInteractive}
        style={style}
        {...props}
      >
        {children}
      </ExpoGlassView>
    );
  }

  // Fallback: semi-transparent view for Android and unsupported iOS versions
  return (
    <View
      style={[
        style,
        {
          backgroundColor:
            glassEffectStyle === "none"
              ? "transparent"
              : "rgba(255, 255, 255, 0.15)",
        },
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export default GlassView;
