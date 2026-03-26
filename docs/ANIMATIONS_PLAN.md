# Comprehensive Animations Plan

**Status**: In Implementation  
**Aesthetic**: Playful & Bouncy (Spring Physics)  
**Global Timing**: 700ms (DURATION_GLOBAL), 300ms (TAB_TRANSITION), 400ms (SECTION_DELAY)  
**Performance**: GPU-accelerated, older device compatible  
**Accessibility**: Full animations for all users

---

## 1. Core Animation Presets

### Spring Physics Configuration
- **Elasticity**: 0.8 (bouncy feel with controlled overshoot)
- **Speed**: 12 (responsive but smooth)
- **Bounciness**: 1.2 (10-20% overshoot)
- **Duration**: 300ms (consistent rhythm)

---

## 2. Screen Transitions

### Default Stack Navigation (Normal Flow)
- **Animation**: Slide from right + fade
- **Direction**: Horizontal (LTR)
- **Duration**: 300ms
- **Use**: Form navigation, data entry flows

### Auth & Modal Flows
- **Animation**: Slide from bottom + backdrop fade
- **Direction**: Vertical (bottom-up)
- **Duration**: 300ms
- **Use**: Authentication, modals, overlays

### Return Navigation
- **Animation**: Slide + scale (zoom return)
- **Direction**: Horizontal (RTL)
- **Duration**: 300ms
- **Use**: Back navigation

---

## 3. Tab Interactions (Bottom Navigation)

### Tab Press Animation
1. Icon scales: 0.9 → 1.0 with spring bounce (overshoot 1.05)
2. Icon rotates: 0° → 12° → 0° (snappy spin)
3. Label color transitions: Secondary → Primary with fade
4. Duration: 300ms all parallel

### Tab Indicator
- **Slide**: Smoothly slides under pressed tab
- **Duration**: 300ms
- **Easing**: Spring curve (ease-in-out)

### Screen Transition
- Previous screen fades out
- New screen fades in
- Duration: 300ms

---

## 4. Button & Touch Interactions

### Press Feedback (All Buttons)
1. **Scale**: 1.0 → 0.95 immediately on press
2. **Ripple**: Propagates from center outward
3. **Color Flash**: Slight highlight (10% lighter)
4. **Spring Back**: 0.95 → 1.0 with overshoot (1.05) on release

### Ripple Effect
- Origin: Press point
- Duration: 300ms to full ripple
- Opacity: Fade from 0.5 → 0

### Feedback
- Visual: All three (scale + ripple + color flash)
- Timing: All parallel
- Duration: 300ms

---

## 5. Form Field Animations

### Focus State
1. **Label**: Floats up + shrinks (scale 1.0 → 0.8)
2. **Underline**: Grows in width (0% → 100%)
3. **Glow**: Field shadow increases + blue tint appears
4. **All parallel**: 300ms spring

### Input State
- **Field**: Slight height expand (padding increase)
- **Shadow**: Intensifies + spreads
- **Duration**: 300ms

### Error State
1. **Animation**: Shake (3 bounces: -5px, +5px, -2px, 0)
2. **Color**: Flash red then fade to error color
3. **Text**: Error message slides in from bottom
4. **Duration**: 300ms shake + 200ms message slide

### Success State
1. **Checkmark**: Draws in + bounce scale (0.5 → 1.1 → 1.0)
2. **Field**: Highlights green + fades out
3. **Duration**: 300ms total
4. **Feedback**: Sustained 500ms before fading

---

## 6. List & Card Animations

### Mount Animation (Staggered Entrance)
- **Items**: Slide in from left + fade in
- **Stagger**: 50ms delay between each item
- **Duration**: 300ms per item
- **Effect**: Cascade entrance

### Card Press
- **Scale**: 0.95 with spring back
- **Duration**: 300ms

### Item Addition
- **Animation**: Slide in from bottom + bounce settle
- **Duration**: 300ms

### Item Removal
- **Animation**: Slide out to left + fade out
- **Duration**: 300ms

---

## 7. Modal & Overlay Animations

### Modal Entry
1. **Slide**: Bottom → center (translateY: full height → 0)
2. **Backdrop**: Fade in + blur (0 → 8px blur)
3. **Both parallel**: 300ms spring

### Modal Exit
1. **Slide**: Center → bottom (reverse)
2. **Backdrop**: Fade out + blur out
3. **Both parallel**: 300ms

### Backdrop
- **Opacity**: 0 → 0.5 (semi-transparent)
- **Blur**: 0 → 8px
- **Interactive**: Taps dismiss if configured

---

## 8. Loading States

### Spinner Animation
- **Rotation**: Continuous 360° rotation
- **Duration**: 1000ms loop
- **Easing**: Linear (constant speed)
- **Opacity Pulse**: Optional 0.7 → 1.0 → 0.7 (2s loop)

### Loading Overlay
- **Fade In**: 0 → 1 opacity, 300ms
- **Spinner**: Scales up 0.5 → 1.0 parallel

---

## 9. Toast/Notification Animations

### Toast Entry
- **Animation**: Bounce in from bottom
- **Transform**: translateY(100px) → 0 with spring overshoot
- **Duration**: 300ms

### Toast Hold
- **Duration**: 3000ms (auto-dismiss)

### Toast Exit
- **Animation**: Slide down + fade out
- **Duration**: 300ms

### Status Feedback
- **Success**: Green flash + bounce in
- **Error**: Red shake animation + bounce in
- **Warning**: Yellow pulse + bounce in

---

## 10. Form Submission Flow

### Submit Button
1. **Press**: Ripple + scale (standard button feedback)
2. **Transition**: Button morphs to show spinner
   - Opacity fade to spinner: 300ms
   - Button width maintains
3. **On Success**: Checkmark animates in + success toast bounces
4. **On Error**: Error shake + error toast bounces

---

## Implementation Files

| File | What | Status |
|------|------|--------|
| `modules/utils/animations.js` | Spring configs, screen transitions, timing constants | ⏳ TODO |
| `impacto-design-system/MainNavigation/index.js` | Screen transitions in Stack.Navigator | ⏳ TODO |
| `impacto-design-system/MainNavigation/BottomTabNavigator/index.js` | Tab press animations, indicator slide | ⏳ TODO |
| `impacto-design-system/Base/Button/index.js` | Ripple, spring press, color flash | ⏳ TODO |
| `impacto-design-system/Extensions/FormikFields/FormInput/index.js` | Label float, focus glow, error shake, success animation | ⏳ TODO |
| `impacto-design-system/Cards/SmallCardsCarousel/index.js` | Staggered entrance, press animation | ⏳ TODO |
| `domains/DataCollection/FormGallery/index.js` | List animations, pin success feedback | ⏳ TODO |
| `impacto-design-system/Base/Toast/index.js` | Toast bounce, status animations | ⏳ TODO |

---

## Performance Checklist

- [ ] All animations use GPU acceleration (transform/opacity only)
- [ ] Native drivers enabled where applicable
- [ ] No layout thrashing (avoid width/height animations)
- [ ] Stagger delays reasonable (50ms max)
- [ ] Test on older device (60fps target)
- [ ] Lint passes post-implementation

---

## Verification Steps

1. ✅ Visual test: All transitions smooth on device
2. ✅ Interaction latency: Button ripples < 16ms
3. ✅ Form flows: Labels + glow + errors sync
4. ✅ List scrolling: No jank with staggered entrance
5. ✅ Device support: Works on older devices
6. ✅ Code quality: Lint + test pass

---

## Notes

- Spring physics implemented via `react-native-reanimated` v2 or custom Animated API
- All timings follow Material Design 3 + Spring principles
- Playful aesthetic achieved through overshoot (1.05-1.2) in spring configs
- Older device support via native drivers and GPU-only transforms
