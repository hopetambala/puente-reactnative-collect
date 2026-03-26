# Reanimated Migration Plan

## Overview

Consolidate **all** animation code from dual framework (React Native `Animated` + Reanimated) to **Reanimated only**. The central module `modules/utils/animations.js` becomes the single source of truth with Reanimated-native hooks, constants, and layout animation builders.

## Decisions

- **All at once** — single PR, not incremental
- **Architecture first** — redesign central module, then update all consumers
- **Reanimated-only spring config** — switch from `tension/friction` to `damping/stiffness/mass`
- **Mount/unmount for staggers** — use Reanimated `entering` prop with `SlideIn.delay(i * 50)`
- **Layout animations for RootScreenWrapper** — use `entering` prop (e.g. `ZoomIn.springify()`)
- **Reanimated shared values for press feedback** — full hook rewrite
- **Jest + manual testing** for verification

## Phase 1: Redesign `modules/utils/animations.js`

1. **Replace `SPRING_CONFIG`** with Reanimated-native format (`damping/stiffness/mass`)
2. **Add missing constants** to `ANIMATION_CONFIG` (wiggle duration, entrance scale, shake amplitudes)
3. **Create `useShakeAnimation(options)`** — `useSharedValue` + `withSequence(withTiming(...))`
4. **Create `usePressAnimation(options)`** — `useSharedValue` + `withSpring` for press feedback
5. **Create `usePulseAnimation(options)`** — `useSharedValue` + `withRepeat(withSequence(...))`
6. **Create tab layout animation builders** — `getTabEntering`, `getTabExiting`
7. **Create `ROOT_ENTERING`** — layout animation for sign-in → tabs entrance
8. **Remove old RN Animated hooks** — `useFocusAnimation`, old `usePressAnimation`, old `usePulseAnimation`

## Phase 2: Update All Consumers

| File | Change |
|------|--------|
| `FormInput/index.js` | Replace inline shake with `useShakeAnimation({ axis: 'translateX' })` |
| `TabBarIcon/index.js` | Replace inline wiggle with `useShakeAnimation({ axis: 'rotate' })` |
| `Button/index.js` | Replace inline press with `usePressAnimation()` |
| `ModernCard/index.js` | Already uses `usePressAnimation` — swap to Reanimated `Animated.View` |
| `SmallCardsCarousel/index.js` | Replace RN Animated stagger with Reanimated `entering` props |
| `FormsHorizontalView/index.js` | Same stagger pattern as SmallCardsCarousel |
| `MainNavigation/index.js` (RootScreenWrapper) | Replace manual scale/opacity with `entering={ROOT_ENTERING}` |
| `BottomTabNavigator/index.js` | Use new spring config format, keep TabScreenWrapper |
| `AnimatedTabBar.js` | Migrate indicator from RN `Animated.timing` to Reanimated `withTiming` |
| `FieldStateIndicator/index.js` | Replace pulse + entrance with Reanimated equivalents |

## Phase 3: Cleanup

- Remove all `import { Animated } from 'react-native'` from migrated files
- Remove unused RN Animated hooks from `animations.js`
- Update default export to reflect new API

## Phase 4: Verify

1. `npm run lint` — 0 errors
2. `npm run test-run` — all tests pass
3. Manual smoke tests:
   - Sign-in → tabs entrance (ZoomIn spring)
   - Tab switching (scale spring)
   - Form validation (shake)
   - Button/card press feedback (spring scale)
   - Carousel/gallery stagger entrance
   - Tab bar indicator slide
   - Field state indicator pulse/success

## Notes

- Spring config tuning: Reanimated `damping/stiffness/mass` equivalents of current `tension/friction` may need visual tuning
- The "Cannot call a class as a function" error with Reanimated layout animations in tabs needs investigation as part of this migration
