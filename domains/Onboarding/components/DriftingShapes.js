import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const SHAPES = [
  { glyph: "✦", size: 42, xFrac: 0.08, yFrac: 0.10, delay: 0 },
  { glyph: "◆", size: 28, xFrac: 0.82, yFrac: 0.15, delay: 400 },
  { glyph: "●", size: 20, xFrac: 0.15, yFrac: 0.55, delay: 800 },
  { glyph: "✦", size: 34, xFrac: 0.88, yFrac: 0.50, delay: 200 },
  { glyph: "◆", size: 24, xFrac: 0.50, yFrac: 0.80, delay: 600 },
  { glyph: "●", size: 18, xFrac: 0.72, yFrac: 0.75, delay: 1000 },
];

const DRIFT_DISTANCE = 30;
const DRIFT_DURATION = 2600;

function DriftingShape({ glyph, size, left, top, delay, color }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in with staggered delay
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: MOTION_TOKENS.duration.slow, easing: Easing.out(Easing.quad) })
    );

    // Continuous vertical drift loop
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-DRIFT_DISTANCE, {
            duration: DRIFT_DURATION,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(DRIFT_DISTANCE, {
            duration: DRIFT_DURATION,
            easing: Easing.inOut(Easing.quad),
          })
        ),
        -1,
        true
      )
    );
  }, [delay, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value * 0.1,
  }));

  return (
    <Animated.Text
      style={[
        {
          position: "absolute",
          left,
          top,
          fontSize: size,
          color,
        },
        animatedStyle,
      ]}
    >
      {glyph}
    </Animated.Text>
  );
}

/**
 * DriftingShapes — ambient background decoration for the onboarding hero.
 * Geometric glyphs float vertically in a continuous loop, tinted to the
 * primary theme color at very low opacity for a warm, inviting feel.
 */
export function DriftingShapes() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  return (
    <>
      {SHAPES.map((shape, i) => (
        <DriftingShape
          key={`drift-${shape.glyph}-${shape.xFrac}-${shape.yFrac}`}
          glyph={shape.glyph}
          size={shape.size}
          left={width * shape.xFrac}
          top={height * shape.yFrac}
          delay={shape.delay}
          color={theme.colors.primary}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({});
