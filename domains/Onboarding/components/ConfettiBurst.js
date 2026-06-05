import { MOTION_TOKENS } from "@modules/utils/animations";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get("window");

const CONFETTI_PALETTE = ["#F97316", "#8B5CF6", "#10B981", "#3B82F6", "#F59E0B", "#EF4444"];
const CONFETTI_COUNT = 24;

/**
 * useBounceAnimation — celebration spring bounce (finale only)
 * spring.playful is intentional here: this is a celebration context.
 */
export const useBounceAnimation = () => {
  const scale = useSharedValue(1);

  const bounce = () => {
    scale.value = withSequence(
      withSpring(1.15, MOTION_TOKENS.spring.playful),
      withSpring(1, MOTION_TOKENS.spring.playful)
    );
  };

  return { scale, bounce };
};

/**
 * ConfettiPiece - colored geometric particle bursting in an arc from center
 */
function ConfettiPiece({ index }) {
  const color = CONFETTI_PALETTE[index % CONFETTI_PALETTE.length];
  const isCircle = index % 3 === 0;

  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const angle = (index / CONFETTI_COUNT) * Math.PI * 2;
    const spread = 80 + Math.random() * 160;
    const targetX = Math.sin(angle) * spread + (Math.random() - 0.5) * 40;
    const upAmount = 120 + Math.random() * 140;
    const spinDeg = Math.random() * 360 - 180;

    opacity.value = withTiming(1, { duration: MOTION_TOKENS.duration.micro });
    translateY.value = withSequence(
      withTiming(-upAmount, { duration: MOTION_TOKENS.duration.slow, easing: Easing.out(Easing.cubic) }),
      withTiming(400, { duration: MOTION_TOKENS.duration.pulse, easing: Easing.in(Easing.quad) })
    );
    translateX.value = withTiming(targetX, {
      duration: MOTION_TOKENS.duration.confetti,
      easing: Easing.out(Easing.cubic),
    });
    rotate.value = withTiming(spinDeg, { duration: MOTION_TOKENS.duration.confetti });
    opacity.value = withSequence(
      withTiming(1, { duration: MOTION_TOKENS.duration.slow }),
      withTiming(0, { duration: MOTION_TOKENS.duration.pulse })
    );
  }, [translateY, translateX, rotate, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: "50%",
          left: screenWidth / 2 - 4,
          width: isCircle ? 10 : 8,
          height: isCircle ? 10 : 14,
          borderRadius: isCircle ? 5 : 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * ConfettiBurst - container for confetti particles, shown on onboarding finale
 */
export function ConfettiBurst() {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    setPieces(Array.from({ length: CONFETTI_COUNT }, (_, i) => i));
  }, []);

  return (
    <View pointerEvents="none" style={styles.confettiContainer}>
      {pieces.map((i) => (
        <ConfettiPiece key={`piece-${i}`} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
