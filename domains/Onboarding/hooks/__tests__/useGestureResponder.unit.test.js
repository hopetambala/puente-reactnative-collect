/**
 * useGestureResponder - RED-GREEN TDD
 * Tests that callbacks are called directly from PanResponder release, without runOnJS wrapper
 */

import { useGestureResponder } from '@app/domains/Onboarding/hooks/useGestureResponder';
import { renderHook } from '@testing-library/react-native';

// Mock runOnJS to throw, ensuring it's NOT called
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: jest.fn(),
  runOnJS: jest.fn(() => {
    throw new Error('runOnJS should not be used - callbacks must be called directly');
  }),
}));

// Mock PanResponder BEFORE importing the hook
jest.mock('react-native', () => ({
  PanResponder: {
    create: jest.fn((handlers) => ({
      panHandlers: {
        onStartShouldSetPanResponder: handlers.onStartShouldSetPanResponder,
        onMoveShouldSetPanResponder: handlers.onMoveShouldSetPanResponder,
        onPanResponderRelease: handlers.onPanResponderRelease,
      },
    })),
  },
  View: jest.fn(),
  Text: jest.fn(),
}));

describe('useGestureResponder - direct callback invocation without runOnJS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should call onSwipeLeft directly when left swipe detected, without runOnJS wrapper', () => {
    const mockOnSwipeLeft = jest.fn();
    const mockOnSwipeRight = jest.fn();

    // Render the hook
    const { result } = renderHook(() =>
      useGestureResponder(mockOnSwipeLeft, mockOnSwipeRight, 50)
    );

    const panHandlers = result.current;

    // Simulate a left swipe gesture (dx < -threshold)
    panHandlers.onPanResponderRelease(
      {},
      { dx: -60, dy: 0 }
    );

    // onSwipeLeft should be called directly, not wrapped in runOnJS
    expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
    expect(mockOnSwipeRight).not.toHaveBeenCalled();
  });

  test('should call onSwipeRight directly when right swipe detected, without runOnJS wrapper', () => {
    const mockOnSwipeLeft = jest.fn();
    const mockOnSwipeRight = jest.fn();

    const { result } = renderHook(() =>
      useGestureResponder(mockOnSwipeLeft, mockOnSwipeRight, 50)
    );

    const panHandlers = result.current;

    // Simulate a right swipe gesture (dx > threshold)
    panHandlers.onPanResponderRelease(
      {},
      { dx: 60, dy: 0 }
    );

    // onSwipeRight should be called directly, not wrapped in runOnJS
    expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
    expect(mockOnSwipeLeft).not.toHaveBeenCalled();
  });
});
