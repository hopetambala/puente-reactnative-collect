# Motion Design System Specification

**Version**: 1.3  
**Status**: Active Specification  
**Framework**: React Native Reanimated v4+  
**Target**: Copilot-driven consistent, high-quality animations

---

## 0. Motion Philosophy

All animations in this application follow **3 core principles**. Every animation should celebrate interaction, build trust, and make the app feel alive and responsive.

**Target Aesthetic**: Playful, bouncy, energetic. Users (both healthcare workers and residents/patients) should feel delighted, not slowed down.

### Principle 1: Celebrate Every Interaction
- **Motion is a feature, not a constraint**: Animations are generous, springy, and give feedback life
- **Spring physics everywhere**: Buttons, forms, lists, navigation all use bounce to feel responsive and alive
- **Communicate delight**: Success states, empty states, form submissions should feel celebratory
- **Examples**:
  - ✅ Button scale on press with spring bounce (overshoot 1.05) → feels playful and responsive
  - ✅ Form label float + rise on focus with smooth lift → feels dynamic
  - ✅ Success checkmark entrance with playful spring bounce → celebration energy
  - ✅ List items scale up + slide in together with stagger → feels gathered/assembled
  - ❌ Button press with no animation → feels broken/unresponsive
  - ❌ Form submit that instantly shows success → no celebration

### Principle 2: Continuity & Spatial Awareness
- **Elements feel like they move through space**, not teleport or swap
- **Navigation leaves breadcrumbs**: Previous screen visible/scaled beneath new screen
- **Consistent entrance/exit patterns**: All items move in the same direction, settle at same scale
- **Examples**:
  - ✅ List item springs up from bottom, scales to full size → feels placed
  - ✅ Navigation: previous screen scales 0.9x stay visible as new scales in → depth & memory
  - ✅ Modal springs up from bottom with backdrop fade → feels grounded
  - ✅ Form validation error shakes, then success bounces in → contrasting motion
  - ❌ List item appears instantly → feels jarring
  - ❌ Navigation swaps screens → feels disposable

### Principle 3: Responsiveness First (But Animation Doesn't Block)
- **Button/gesture must respond within 16ms**: Animation plays simultaneously, never blocks next interaction
- **Animation is background job**: User can tap, swipe, type immediately; animations catch up
- **Longer is ok if user can act**: 500-700ms animations fine IF user isn't waiting for them
- **Examples**:
  - ✅ Button responds instantly to press; spring animation plays in background (user can tap again immediately)
  - ✅ Form field focuses immediately; label animation continues smoothly after
  - ✅ Navigation starts instantly; screen enters while previous screen exits
  - ❌ Button waits for animation to finish before responding → feels broken
  - ❌ Gesture disabled during 1000ms animation → frustrating

---

## 1. Motion Hierarchy: Aggression Levels (Not Restriction)

Not all animations need the same energy. This hierarchy ensures motion feels *intentional and coordinated*, not chaotic.

| Level | Scope | Spring? | Duration | Scale | Use Cases | Energy |
|-------|-------|---------|----------|-------|-----------|--------|
| **MEGA** 🔴 | Screen entrance, celebration moments | ✅ PLAYFUL | 500-700ms | Full (0.8→1.0, 1.0→1.2) | Navigation transitions, success flows, empty states | Maximum bounce, overshoot allowed |
| **STANDARD** 🟡 | Buttons, forms, cards, modals | ✅ SMOOTH/SNAPPY | 300-400ms | Medium (0.95-1.05) | Most user interactions | Consistent spring, balanced |
| **QUICK** 🟢 | Micro-feedback, icons, badges | ✅ SNAPPY | 150-200ms | Subtle (0.98-1.02) | Taps, checks, state indicators | Quick bounce, minimal |

### Application Rules

**Spring physics on everything** (except disabled/tertiary states).
- Button press? Spring.
- Form focus? Spring. 
- List entrance? Spring.
- Navigation? Spring.
- Keep it consistent and energetic.

**Multiple animations CAN overlap** — this is a feature, not a bug.
- Example: Button press + ripple + form validation error + success toast all at once = joyful chaos, not chaotic chaos
- Stagger where it looks good (list items), overlap where it feels good (feedback layers)

**Duration escalation**:
- User-initiated actions (button tap): 300-400ms (feels responsive)
- Navigation (screen change): 500-700ms (feels special)
- Screen entrance (first load): 500ms (feels cinematic)
- List entrance: 300ms per item + 50ms stagger (feels assembled)

**No animation should feel stuck** (user satisfaction check):
- If duration > 1000ms: Must be user-initiated (drag) or continuous (spinner loop)
- If duration < 100ms: Feels snappy, good for micro-interactions
- Most should land 200-500ms range

---

## 2. Motion Token System

All animation values must come from this centralized token system. **No hardcoded values in components.**

### Duration Tokens (High-Aggression: Generous Timings)
```javascript
MOTION_TOKENS.duration = {
  instant:     0,      // No animation (accessibility mode)
  micro:       80,     // Icon wiggle, checkbox pulse
  quick:       150,    // Button micro-feedback
  snappy:      200,    // Quick response
  base:        300,    // Standard transitions, button press, form focus
  substantial: 400,    // Card entrance, tab switch
  slow:        500,    // Loading complete, success celebration, modal
  xslow:       700,    // Navigation transitions, screen entrance
  dismiss:     4000,   // Popup success/error auto-dismiss time
  toast:       3000,   // Toast notification hold time
  pulse:       1000,   // Loading spinner loop
};
```

### Spring Presets (Hierarchy-Calibrated)

Spring physics is the **default animation system** across the entire app. Energy is controlled by hierarchy level — not restricted by component type.

| Preset | Hierarchy | Use Cases |
|--------|-----------|----------|
| `tight` | QUICK | Micro-feedback: icons, badges, checkboxes |
| `snappy` | STANDARD | Default everywhere: buttons, forms, cards, lists |
| `smooth` | STANDARD/MEGA | Navigation, modals, spatial movements |
| `playful` | MEGA | Celebrations only: success states, empty states |

```javascript
MOTION_TOKENS.spring = {
  // QUICK interactions (micro-feedback, fast settle, no visible overshoot)
  tight: {
    damping:   20,
    stiffness: 250,
    mass:      0.6,
  },
  // STANDARD interactions (default everywhere — balanced bounce)
  snappy: {
    damping:   14,
    stiffness: 180,
    mass:      0.8,
  },
  // NAVIGATION & MODALS (smooth movement through space)
  smooth: {
    damping:   18,
    stiffness: 120,
    mass:      1,
  },
  // CELEBRATION ONLY (success, empty states — maximum overshoot allowed)
  playful: {
    damping:   8,
    stiffness: 60,
    mass:      1,
  },
};
```

### Easing (When Spring Not Used)
```javascript
MOTION_TOKENS.easing = {
  standard:    'easeInOut',   // Default smooth transitions
  entrance:    'easeOut',     // Fast entry, slow settle
  exit:        'easeIn',      // Slow exit fade
  linear:      'linear',      // Spinners ONLY
};
```

### Scale & Opacity Tokens
```javascript
MOTION_TOKENS.scale = {
  press:       0.95,      // Button/card press (medium energy)
  micro:       0.98,      // Icon/badge scale (quick)
  entrance:    0.98,      // List/modal item entrance scale
  celebrate:   1.2,       // Success state (overshoots to this before settling)
};

MOTION_TOKENS.opacity = {
  interactive: 0.8,       // Pressed state
  disabled:    0.5,       // Disabled state
  backdrop:    0.5,       // Modal backdrop
  entrance:    0,         // Fade in from invisible
};
```

### Theme Integration (Brand-Aware Motion)
Motion should tie to your design system theme tokens. Motion tokens inherit theme context:

```javascript
// Example: Success animation uses brand success color
const successColor = themeTokens.color.semantic.success; // Green
const errorColor = themeTokens.color.semantic.error;     // Red

// Motion duration respects theme density
const duration = themeTokens.motion?.standard || MOTION_TOKENS.duration.base;
```

**Usage Rule**: Always import from `@modules/utils/animations`:
```javascript
import { MOTION_TOKENS, ANIMATION_RULES } from '@modules/utils/animations';

// DO THIS:
const duration = MOTION_TOKENS.duration.base;

// NEVER THIS:
const duration = 300;
```

---

## 3. Animation Rules: What & How to Animate

### Hard Rules (Non-Negotiable)

**GPU-Accelerated Properties ONLY:**
- ✅ `transform` (translateX, translateY, scale, rotate)
- ✅ `opacity`
- ❌ NEVER: `width`, `height`, `top`, `left`, `padding`, `margin`, `backgroundColor`

**Native Drivers Required:**
- All animations must use `useNativeDriver: true` (Reanimated handles this)
- If native driver not available, remove the animation

**No Layout Thrashing:**
- Don't shadow-animate layout properties
- Recomputing layout every frame = jank

### Spring Physics Rules (Hierarchy-Calibrated)

**Spring physics is the default** — it applies to every interaction. What varies is intensity, not presence:

| Component | Spring Preset | Reason |
|-----------|--------------|--------|
| Icons, badges, checkboxes | `tight` | Micro-feedback, no overshoot |
| Buttons, forms, lists, cards | `snappy` | Responsive and bouncy (default) |
| Navigation, modals | `smooth` | Elegant spatial movement |
| Success, empty states | `playful` | Celebratory, maximum energy |

- ✅ Button press: Scale 0.95→1.0 + spring bounce (`snappy`)
- ✅ Form focus: Label float + spring settle (`smooth`)
- ✅ Success: Checkmark entrance + playful bounce (`playful`)
- ✅ List items: Scale 0.98→1.0 + spring entrance (`snappy`)
- ✅ Navigation: Screen scales in + spring settle (`smooth`)
- ✅ Icon tap: Quick scale pulse (`tight`)

**Avoid overshoot > 1.2** — beyond that feels cartoony on this app's aesthetic.

### Per-Component Guidelines

**Buttons:**
- All buttons: Scale 0.95→1.0 spring (SNAPPY) + optional ripple
- Include shadow shift for elevation feedback

**Form Inputs:**
- Focus: Label float (spring SMOOTH), border color fade, background lift
- Error: Shake amplitude ±3-5px, then color transition
- Success: Checkmark entrance (spring PLAYFUL), field highlight

**Lists & Cards:**
- Entrance: Scale 0.98→1.0 + Opacity 0→1 + TranslateY 10px→0 (spring SNAPPY)
- Stagger: 50ms delay between items
- Press: Scale 0.95 (spring SNAPPY)

**Navigation:**
- Forward: TranslateX 100%→0 + Scale 0.98→1.0 + Opacity 0.9→1.0 (spring `smooth`, 500-700ms)
- Back: Reverse
- Previous screen: Visible beneath (94% scale, 0.5 opacity — avoids "dead background" look)

**Modals:**
- Entry: Slide from bottom + backdrop fade (spring SMOOTH)
- Exit: Reverse
- Duration: 300-400ms for quickness

---

## 3.5 Motion Layering Rules

Multiple animations can occur simultaneously — this is encouraged. However, they must follow visual layering so the UI doesn't feel noisy.

**Layer Priority (per screen, at any given moment)**

1. **Primary Motion** — One per screen
   - Navigation transition, modal open/close, or major state change
   - Uses MEGA or STANDARD hierarchy level
   - All other motion defers visually to this

2. **Secondary Motion** — Buttons, cards, form fields
   - Plays simultaneously with primary, but must not overpower it
   - Uses STANDARD hierarchy level
   - If primary is a navigation transition, secondary should be subtle

3. **Tertiary Motion** — Icons, badges, micro-indicators
   - Always subtle and fast (`tight` spring, < 200ms)
   - Never the visual focus

**Rule**: At any given moment, **only ONE animation layer should dominate user attention**. Overlapping is fine; competing for dominance is not.

**Clinical Context Note**: In critical data-entry flows (forms, assessments), prefer secondary + tertiary only. Reserve primary motion for navigation between major screens.

---

## 4. Anti-Patterns: What NOT to Do

### ❌ Ignoring Brand Context (Violates Principle 2)
```javascript
// WRONG: Motion divorced from design system (generic duration, no theme tie-in)
duration={300}

// RIGHT: Motion inherits from theme
const { duration } = useMotion(themeContext);
duration={MOTION_TOKENS.duration.base}  // Respects theme settings
```

### ❌ Breaking Spatial Continuity (Violates Principle 2)
```javascript
// WRONG: Item disappears then appears at new position
setItems(prev => prev.filter(i => i.id !== itemId));
setTimeout(() => setItems(prev => [...prev, updatedItem]), 300);

// RIGHT: Item maintains spatial position while updating
setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
```

### ❌ Blocking User from Acting (Violates Principle 3)
```javascript
// WRONG: User can't tap button again until animation completes
const handlePress = async () => {
  await animateButton(); // User blocked
  submitForm();
};

// RIGHT: Button responds immediately, animation plays in background
const handlePress = () => {
  triggerAnimation(); // Non-blocking
  submitForm();
};
```

### ❌ Overshoot > 1.2 (Too Cartoony)
```javascript
// WRONG: Spring overshoot to 1.3+ (feels gimmicky for this app)
scale: withSpring(1.3, springConfig);

// RIGHT: Keep bounce within 1.05-1.2 range
scale: withSpring(1.1, MOTION_TOKENS.spring.playful); // 10-20% max
```

### ❌ No Animation Where Expected (Violates Principle 1)
```javascript
// WRONG: Button tap with zero feedback
<Pressable onPress={handlePress}>{/* no animation */}</Pressable>

// RIGHT: Button responds visibly
function Button() {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();
  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>{/* content */}</Pressable>
    </Animated.View>
  );
}
```

### ❌ Mismatched Spring Intensity (Feels Disjointed)

Using the same spring config for every component makes the UI feel either chaotic (too bouncy everywhere) or flat (too tight everywhere).

```javascript
// WRONG: `spring.playful` on every interaction → feels like a cartoon
onPressIn() { scale.value = withSpring(0.95, MOTION_TOKENS.spring.playful); } // on a secondary button

// WRONG: Custom spring values bypassing the token system
withSpring(1.0, { damping: 5, stiffness: 300 }); // Never do this

// RIGHT: Spring intensity mapped to hierarchy
// Micro-feedback  → spring.tight   (icons, badges)
// Standard action → spring.snappy  (buttons, forms, lists)
// Navigation      → spring.smooth  (screens, modals)
// Celebration     → spring.playful (success, empty states)
```

### ❌ Hardcoded Values Everywhere
```javascript
// WRONG: Duration spread throughout code, no sync point
duration={300}
duration={500}
duration={700}

// RIGHT: Centralized tokens for consistency
duration={MOTION_TOKENS.duration.base}
duration={MOTION_TOKENS.duration.slow}
duration={MOTION_TOKENS.duration.xslow}
```

---

## 5. Component Animation Patterns

### 5.1 Navigation Transitions

**Forward Navigation (Enter New Screen)**
```
Previous Screen: Scale 1.0 → 0.94, Opacity 1.0 → 0.5 (stays readable, avoids "dead background")
New Screen:     TranslateX 100% → 0, Scale 0.98 → 1.0, Opacity 0.9 → 1.0
Duration:       MOTION_TOKENS.duration.xslow (700ms)
Spring:         MOTION_TOKENS.spring.smooth
```

**Backward Navigation (Return to Previous)**
```
Previous Screen: Scale 0.94 → 1.0, Opacity 0.5 → 1.0
Current Screen: TranslateX 0 → 100%, Scale 1.0 → 0.98, Opacity 1.0 → 0.9
Duration:       MOTION_TOKENS.duration.xslow (700ms)
Easing:         exit (easeIn)
```

**Effect**: "Depth effect" — previous screen visible at 94% scale + 50% opacity, preserving context without looking dead

### 5.2 Button Press Feedback

**High-Priority CTA Button**
```
Press:   Scale 1.0 → 0.95, Opacity 1.0 → 1.0 (immediate)
         Ripple radiates from center (optional, Material Design)
Release: Scale 0.95 → 1.0 + 1.05 overshoot (spring: SNAPPY)
Duration:       MOTION_TOKENS.duration.base (300ms)
Spring Config:  MOTION_TOKENS.spring.snappy
```

**Medium/Secondary Button**
```
Press:   Scale 1.0 → 0.95 (immediate)
Release: Scale 0.95 → 1.0 (smooth easing, no spring)
Duration:       MOTION_TOKENS.duration.base (300ms)
Easing:         standard (easeInOut, no overshoot)
```

### 5.3 Form Field Animations

**Focus Entry**
```
Label:       TranslateY 0 → -12px, Scale 1.0 → 0.8 (parallel)
Underline:   Max-width 0% → 100% (smooth fill from center)
Glow:        Shadow intensifies, color tint blue (opacity fade)
Duration:    MOTION_TOKENS.duration.base (300ms)
Easing:      standard
```

**Error Shake**
```
Amplitude:   ±3px max (not ±5px)
Bounces:     3 (left, right, center)
Duration:    150ms total
Color Flash: TextField border flashes red then fades to error color
Message:     Error text slides in from bottom (50ms delay, 100ms duration)
```

**Success State**
```
Checkmark:   Scale 0.5 → 1.1 (overshoot) → 1.0 (spring: PLAYFUL)
Field:       Highlight green (opacity fade over 500ms)
Duration:    300ms checkmark + 500ms hold then fade
```

### 5.4 List Item Entrance

**Staggered Entrance (More Modern Than Side-Slide)**
```
Per Item:
  Scale:       0.98 → 1.0
  TranslateY:  10px (from bottom) → 0
  Opacity:     0 → 1.0
Duration:      MOTION_TOKENS.duration.base (300ms)
Easing:        entrance (easeOut)
Stagger:       50ms delay between each item (e.g., item 0 @ 0ms, item 1 @ 50ms, item 2 @ 100ms)
```

**Why This Pattern**: Feels modern, bottom-up mimics content being revealed naturally (vs dated left-slide effect)

### 5.5 Modal Entry/Exit

**Entry (Appear)**
```
Slide:       TranslateY 100% (off-bottom) → 0 (centered)
Backdrop:    Opacity 0 → 0.5, optional blur 0 → 8px
Duration:    MOTION_TOKENS.duration.base (300ms)
Spring:      MOTION_TOKENS.spring.smooth (elegant, less bouncy)
```

**Exit (Dismiss)**
```
Slide:       TranslateY 0 → 100%
Backdrop:    Opacity 0.5 → 0, blur reverse
Duration:    MOTION_TOKENS.duration.base (300ms)
Easing:      exit (easeIn)
```

### 5.6 Loading States

**Spinner (Continuous)**
```
Rotation:    Continuous 360° loop
Duration:    MOTION_TOKENS.duration.pulse (1000ms)
Easing:      linear (must be linear for smooth continuous rotation)
```

**Loading → Success Morph (Premium)**
```
Step 1:      Spinner scales out (0.1 opacity), 150ms
Step 2:      Checkmark scales in (0.5 → 1.0 spring), 150ms
Total:       ~300ms, feels like transformation not replacement
```

### 5.7 Toast Notifications

### 5.8 Shared Element Transitions (Required for Premium UX)

Used when the **same element** appears in two screens (card → detail, image → fullscreen).

**Behavior**
```
Element:    Maintains position, size, and visual identity between screens
Transition: Scale + position interpolation (not a new element appearing)
Background: Fades independently from element
```

**Entry**
```
Element:    Scales from thumbnail size/position → full size/position
Background: Opacity 0 → 1 (fades in independently)
Duration:   MOTION_TOKENS.duration.slow (500ms)
Spring:     MOTION_TOKENS.spring.smooth
```

**Exit**
```
Element:    Scales from full size/position → thumbnail size/position
Background: Opacity 1 → 0
Duration:   MOTION_TOKENS.duration.slow (500ms)
Easing:     exit (easeIn)
```

**Rule**: Must feel like the SAME physical element traveling through space — not a replacement appearing at the destination.

**Use Cases**
- Form card → full form detail screen  
- Asset thumbnail → full asset view  
- Profile photo → expanded profile

---

**Entry (Bounce In From Bottom)**
```
Slide:       TranslateY 100px → 0
Scale:       0.8 → 1.0
Duration:    MOTION_TOKENS.duration.base (300ms)
Spring:      MOTION_TOKENS.spring.playful (bouncy, celebratory)
```

**Hold**
```
Duration:    MOTION_TOKENS.duration.toast (3000ms for info, 4000ms for success/error)
```

**Exit (Slide Down + Fade)**
```
Slide:       TranslateY 0 → 50px
Opacity:     1.0 → 0
Duration:    MOTION_TOKENS.duration.fast (150ms, quick disappear)
```

---

## 6. Accessibility: Reduced Motion (Nice-to-Have)

### Implementation

Reduced motion support is included but not critical. If user has enabled "Reduce Motion" in system settings, animations gracefully degrade to instant.

```javascript
// In useMotion hook (Phase 3)
export function useMotion({ componentType = 'default' } = {}) {
  const { reduceMotion } = useAccessibility(); // System setting, optional
  
  if (reduceMotion) {
    return {
      duration: 0,           // No animation
      easing: 'linear',
      spring: null,
      shouldAnimate: false,
    };
  }
  
  return {
    duration: MOTION_TOKENS.duration[componentType] || MOTION_TOKENS.duration.base,
    easing: MOTION_TOKENS.easing.standard,
    spring: MOTION_TOKENS.spring.smooth,
    shouldAnimate: true,
  };
}
```

### Testing Pattern (Optional)

Include reduced-motion tests in your test suite for completeness:
```javascript
describe('AnimatedButton', () => {
  it('responds with no animation when reduceMotion enabled', () => {
    const { getByTestId } = render(
      <AccessibilityProvider reduceMotion={true}>
        <Button testID="btn" onPress={...} />
      </AccessibilityProvider>
    );
    
    const btn = getByTestId('btn');
    fireEvent.press(btn);
    
    // Verify: No animated styles applied, instant response
    expect(getAnimatedStyles(btn)).toEqual({ /* no transforms */ });
  });
});
```

**Note**: Since accessibility is not critical for your app, you can implement this after the core motion system is solid.

---

## 7. Performance Constraints

### Validation Rules

These are checked via `animationRules.js` helpers (Phase 2):

| Rule | Check | Fail If |
|------|-------|---------|
| GPU Only | `canAnimate(props)` | Tries to animate width, height, top, left, etc. |
| Native Driver | `useNativeDriver: true` | Missing or false |
| Duration Valid | Within MOTION_TOKENS | Hardcoded value or > 7000ms |
| Easing Valid | From MOTION_TOKENS | Custom easing functions (platform-specific) |
| Spring Config | From MOTION_TOKENS.spring | Custom damping/stiffness values |
| No Layout Thrash | No animation on layout props | Detects padding/margin/border animations |
| Overshoot Guard | Not applied to all components | `spring.playful` used on secondary buttons |

### Runtime Validation (CI/Pre-commit)

```bash
npm run lint:animations
```

This scans all components and verifies:
- ✅ All durations from `MOTION_TOKENS`
- ✅ All easing from `MOTION_TOKENS`
- ✅ All spring configs from `MOTION_TOKENS`
- ✅ No hardcoded animation values
- ✅ `useNativeDriver: true` everywhere
- ✅ GPU properties only (transform + opacity)

---

## 8. Copilot Execution Contract

### 12-Task Implementation Plan (Phases 2-8)

When Copilot encounters animation work, provide it with this spec and the execution order:

#### Phase 2: Token System
1. ➕ Enhance `modules/utils/animations.js` with `MOTION_HIERARCHY`, `ANIMATION_RULES` objects
2. ➕ Create `modules/utils/animationRules.js` with validation helpers
3. 🔄 Replace hardcoded values (4000, 3000, 1000) with token imports

#### Phase 3: Global Motion Control
4. ➕ Create `useMotion()` hook in `modules/utils/animations.js`
5. ➕ Create `modules/theme/useAccessibility.js` with reduced-motion support
6. 🔄 Integrate into `useMotion()` for single control point

#### Phase 4: Navigation Upgrade
7. 🔄 Update `SCREEN_TRANSITIONS` in `modules/utils/animations.js` with scale + depth effects

#### Phase 5: Component Motion Hierarchy
8. 🔄 Refactor `impacto-design-system/Base/Button/index.js` — remove rotation, add elevation, gate spring to CTA
9. 🔄 Refactor `impacto-design-system/Extensions/FormikFields/FormInput/index.js` — add focus lift, reduce error shake
10. 🔄 Refactor `impacto-design-system/Cards/SmallCardsCarousel/index.js` — modern scale+fade+translateY entrance
11. 🔄 Refactor `domains/DataCollection/FormsHorizontalView/index.js` — same pattern as carousel
12. 🔄 Audit spring intensity across components — map each to correct hierarchy level (`tight`/`snappy`/`smooth`/`playful`)

#### Phase 6: Premium Features (Future)
- Shared element transitions — spec defined in Section 5.8
- State morphing (loading → success spinner morph)
- "Calm mode" toggle for reduced spring intensity in clinical flows

#### Phase 7: Validation & Testing
- Add animation performance validator
- Add reduced-motion tests to all animated components

### Code Templates (Copilot Reference)

**Token Import Pattern:**
```javascript
import { MOTION_TOKENS, ANIMATION_RULES } from '@modules/utils/animations';

// Use immediately
const duration = MOTION_TOKENS.duration.base;
const spring = MOTION_TOKENS.spring.playful;
```

**Spring Guard Pattern:**
```javascript
import { canUseSpring } from '@modules/utils/animationRules';

const componentType = 'CTA_BUTTON';
const useSpring = canUseSpring(componentType);

return (
  <Animated.View style={[
    animatedStyle,
    {
      transform: [{ scale: scaleValue }],
    },
  ]} />
);
```

**useMotion Hook Pattern:**
```javascript
import { useMotion } from '@modules/utils/animations';

function MyButton({ onPress }) {
  const { duration, shouldAnimate, spring } = useMotion({ componentType: 'button' });
  const animatedStyle = useSharedValue(1);
  
  if (!shouldAnimate) {
    return <Pressable onPress={onPress}>{/* content */}</Pressable>;
  }
  
  const onPressIn = () => {
    animatedStyle.value = withSpring(0.95, spring);
  };
  
  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable onPressIn={onPressIn}>{/* content */}</Pressable>
    </Animated.View>
  );
}
```

**Validation Pattern (Component Linting):**
```javascript
// animationRules.js exports:
export const canUseSpring = (componentType) => {
  const allowed = ['CTA_BUTTON', 'SUCCESS_STATE', 'EMPTY_STATE'];
  return allowed.includes(componentType);
};

export const getMotionHierarchy = (componentType) => {
  const hierarchy = {
    NAVIGATION: 'HIGH',
    MODAL: 'HIGH',
    CTA_BUTTON: 'HIGH',
    CARD_PRESS: 'MEDIUM',
    FORM_FOCUS: 'MEDIUM',
    ICON_FEEDBACK: 'LOW',
  };
  return hierarchy[componentType] || 'LOW';
};
```

---

## 9. Known Good Practices

### ✅ DO

1. **Test animations on device** — Simulator ≠ real device performance
2. **Use transform + opacity only** — Predictable, GPU-accelerated
3. **Gesture feedback must be instant** — Perceivable < 100ms
4. **Reduce motion first** — Build animations as enhancements, not requirements
5. **Stagger thoughtfully** — 50ms between list items, not random
6. **Spring intensity matches hierarchy** — `tight` for micro, `snappy` for standard, `smooth` for navigation, `playful` for celebration
7. **Reference tokens always** — No magic numbers

### ❌ DON'T

1. **Animate layout properties** — width, height, padding, margin = jank
2. **Mix animation frameworks** — Use Reanimated consistently, not Animated + Reanimated
3. **Forget reduced motion** — Test every animation with motion disabled
4. **Bloat duration** — 800ms+ for routine interactions feels broken
5. **Mismatched spring intensity** — Using `spring.playful` on secondary buttons, or `spring.tight` on navigation feels incoherent
6. **Cache animations** — Let Reanimated manage lifecycle
7. **Animate off-screen** — Only animate visible content

---

## 10. Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Animation jank/lag on older devices | Layout thrashing or too many concurrent animations | Use GPU-only properties, reduce stagger count, profile with `react-devtools` |
| Animation doesn't play | Duration = 0 (accessibility mode) or useNativeDriver missing | Check `reduceMotion` flag; ensure `useNativeDriver: true` on all Animateds |
| Button feels laggy | Animation duration too long or blocking interaction | Ensure button responds immediately (async animation in background) |
| Form shake looks wrong | Amplitude too high or bounce count wrong | Use `MOTION_TOKENS.duration.fast` (150ms) + ±3px amplitude max |
| Staggered list looks wrong | Stagger delay too high or items enter from wrong direction | Max 50ms between items; all must start from same direction (e.g., all from bottom) |
| Spring feels weak or too bouncy | Wrong spring config | Use `MOTION_TOKENS.spring.snappy` (bouncy) or `.smooth` (elegant) — don't custom-tune |
| Reduced motion test fails | Animations still playing when `reduceMotion=true` | Wrap all animations in `shouldAnimate` guard from `useMotion()` |

---

## 11. Specification References

### Motion Design Principles (Industry Standard)
- **Material Design 3** — Google's motion guidelines (timing, easing, spring physics)
- **iOS Human Interface Guidelines** — Apple's interaction principles
- **Web Animation Best Practices** — Performance-first animation design

### Technologies
- **React Native Reanimated v4** — GPU-accelerated animations, non-blocking
- **Expo** — Consistent mobile runtime

### Tokens Version History
- **v1.0** (Apr 2026) — Initial specification, 3 core principles, 5 duration tiers, 3 spring presets
- **v1.1** (Apr 2026) — Resolved spring philosophy contradiction; 4-tier hierarchy-calibrated spring system (`tight`/`snappy`/`smooth`/`playful`); updated navigation values (scale 0.94, opacity 0.5); added Motion Layering Rules (§3.5); added Shared Element Transitions spec (§5.8); fixed DO/DON'T list and anti-patterns

---

## 12. Philosophy Summary

**Your Motion Design Philosophy:**

✅ **Aesthetic**: Playful & Bouncy (spring physics everywhere)  
✅ **Aggression Level**: High (generous durations, 300-700ms common)  
✅ **Spring Usage**: Everywhere, calibrated by hierarchy (`tight` → `snappy` → `smooth` → `playful`)  
✅ **Device Focus**: Modern devices (iOS 14+, Android 11+)  
✅ **User Base**: Both healthcare workers and residents/patients  
✅ **Brand Integration**: Motion reflects theme tokens  
✅ **Accessibility**: Reduced motion as nice-to-have (not critical)  

**Motion Principle**: Every interaction should feel celebratory, responsive, and alive. Layout should feel spatial (previous screens persist, items move through space). User responsiveness always takes priority over animation completion.

## Next Steps: Phase 2 Implementation

When ready to proceed with Phase 2 (Token System Formalization):

1. **Enhance** `modules/utils/animations.js` — Map existing constants to MOTION_TOKENS + MOTION_HIERARCHY objects
2. **Create** `modules/utils/animationRules.js` — Validation helpers (canUseSpring, getMotionHierarchy, etc.)
3. **Ensure** tokens align with theme system (brand motion integration)
4. **Verify** all animations still pass with new token imports

**Owner**: Copilot (motion design mode)  
**Estimated Duration**: 1-2 hours for Phase 2  
**Success Criteria**: All tokens centralized, no hardcoded animation values, all tests green, visual consistency with playful aesthetic

---

**Last Updated**: April 14, 2026  
**Spec Status**: Active — Ready for Copilot implementation  
**Philosophy Lock**: ✅ Confirmed with user
