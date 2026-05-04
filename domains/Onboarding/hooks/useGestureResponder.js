import { useEffect, useRef } from "react";
import { PanResponder } from "react-native";
import Animated, { runOnJS } from "react-native-reanimated";

/**
 * useGestureResponder - Detects left/right swipe gestures
 * @param {Function} onSwipeLeft - Called when user swipes left
 * @param {Function} onSwipeRight - Called when user swipes right
 * @param {number} threshold - Minimum distance to register swipe (default: 50)
 * @returns {Object} PanResponder handlers for View
 */
export function useGestureResponder(onSwipeLeft, onSwipeRight, threshold = 50) {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        // Only respond to horizontal swipes (not vertical)
        return Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;

        // Swipe left (next)
        if (dx < -threshold) {
          if (onSwipeLeft) {
            runOnJS(onSwipeLeft)();
          }
        }
        // Swipe right (back)
        else if (dx > threshold) {
          if (onSwipeRight) {
            runOnJS(onSwipeRight)();
          }
        }
      },
    })
  ).current;

  return panResponder.panHandlers;
}
