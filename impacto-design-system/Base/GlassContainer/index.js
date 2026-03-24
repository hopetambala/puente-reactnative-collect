import {
  GlassContainer as ExpoGlassContainer,
  isGlassEffectAPIAvailable,
} from "expo-glass-effect";
import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";

/**
 * Cross-platform GlassContainer component
 * Groups multiple glass views with spacing
 * - iOS 26+: Uses native glass container
 * - Other platforms: Regular View container
 */
const GlassContainer = ({
  spacing,
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

  if (!hasChecked) {
    return <View style={style} {...props}>{children}</View>;
  }

  // iOS 26+ with glass effect support
  if (Platform.OS === "ios" && isAvailable) {
    return (
      <ExpoGlassContainer spacing={spacing} style={style} {...props}>
        {children}
      </ExpoGlassContainer>
    );
  }

  // Fallback: regular View with gap if spacing provided
  return (
    <View
      style={[style, spacing ? { gap: spacing } : {}]}
      {...props}
    >
      {children}
    </View>
  );
};

export default GlassContainer;
