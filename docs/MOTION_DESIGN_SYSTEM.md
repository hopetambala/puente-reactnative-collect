# Motion Design System Specification

**Version**: 1.0  
**Status**: Active Specification  
**Framework**: React Native Reanimated v4+  
**Target**: Copilot-driven consistent, high-quality animations

---

## 0. Motion Philosophy

All animations in this application follow **3 core principles**. Every animation must align with at least one; motion that violates these principles should be removed.

### Principle 1: Meaningful Motion
- **Every animation communicates something**: state changes, hierarchy, feedback, or continuity
- **No decorative-only motion**: Animations that purely look good but don't serve a functional purpose are forbidden
- **Examples**:
  - ✅ Button scale on press → communicates interaction readiness
  - ✅ Form label float on focus → communicates input active state
  - ✅ Success checkmark entrance → communicates form submission complete
  - ❌ Spinning icon while loading with no visual signal change → purely decorative
  - ❌ Rotating buttons on secondary actions → doesn't communicate state

### Principle 2: Continuity
- **Elements feel like they persist between states**, not teleport or swap
- **Prefer transform transitions over enter/exit replacements**
- **Spatial logic matters**: If a card is at position X, it should appear to move to position Y, not fade out and fade in at the new location
- **Examples**:
  - ✅ List item slides in from bottom, scales up as it settles → feels like it's being placed
  - ✅ Navigation: previous screen scales away as new screen scales in → depth effect
  - ✅ Modal slides from bottom, backdrop progressively darkens → feels grounded
  - ❌ List item appears instantly (no entrance animation) → breaks continuity
  - ❌ Card fade-out then fade-in at new position → feels like replacement, not movement

### Principle 3: Responsiveness > Flashiness
- **Input latency must feel instant**: < 100ms perceived delay between gesture and response
- **Motion should never block interaction**: User can always interact again immediately
- **Faster is better than fancier**: Button responds instantly; animation follows
- **Examples**:
  - ✅ Button responds to press within 16ms; animation plays in background
  - ✅ Form field focuses immediately; label animates smoothly after
  - ✅ Navigation transition starts instantly; screen content loads while animating
  - ❌ Button waits for animation to complete before responding → feels broken
  - ❌ 800ms animation for a secondary action → unnecessarily slow

---

## 1. Motion Hierarchy: Priority System

Not all animations are equal. This hierarchy ensures motion is intentional and doesn't overwhelm.

| Priority | Tier | Scope | Animation Budget | Examples | Rules |
|----------|------|-------|------------------|----------|-------|
| **HIGH** | 🔴 User Focus | 1 per screen max | Full motion allowed (300-700ms, spring/easing) | Navigation transitions, modals, primary CTA response, error alerts | Spring bounce allowed; can use all transform properties; easing curves complex |
| **MEDIUM** | 🟡 Secondary Action | Multiple allowed | Subtle motion (150-300ms, smooth easing) | Card press, form field focus, list item entrance, tab indicator | No spring overshoot; use smooth easing only; limited scale (0.98-1.0) |
| **LOW** | 🟢 Micro Interaction | Unlimited (in reason) | Fast & minimal (80-150ms, linear/ease) | Icon feedback, checkbox check, badge pulse, micro-transitions | Linear easing preferred; scale ±5% max; opacity only or combined with scale |

### Application Rules

**Only 1 high-motion animation per screen at a time.**
- Example: Don't animate modal entrance AND show a success toast simultaneously
- If multiple high-priority events occur, queue them or reduce one to medium

**Medium & low can overlap freely.**
- Example: Card press (medium) + icon pulse (low) = fine
- Example: Tab switch (medium) + spinner pulse (low) = fine

**No animation should run for > 700ms** unless user-initiated (e.g., dragging, long-press).
- Sustained animations feel stuck
- Exception: Continuous spinner (loading indicator) — use 1000ms loop, not 700ms+

---

## 2. Motion Token System

All animation values must come from this centralized token system. **No hardcoded values in components.**

### Duration Tokens
```javascript
MOTION_TOKENS.duration = {
  instant:     0,      // No animation (accessibility mode)
  fast:        150,    // Micro-interactions, icon feedback
  base:        300,    // Standard transitions, button press, form focus
  slow:        500,    // Loading complete, success celebration
  xslow:       700,    // Navigation transitions, screen entrance
  dismiss:     4000,   // Popup success/error auto-dismiss
  toast:       3000,   // Toast notification hold time
  pulse:       1000,   // Loading spinner loop
};
```

### Easing Tokens
```javascript
MOTION_TOKENS.easing = {
  standard:    'easeInOut',   // Form animations, tab switches, button press-release
  entrance:    'easeOut',     // Items entering (slide in, scale up, fade in)
  exit:        'easeIn',      // Items leaving (slide out, scale down, fade out)
  linear:      'linear',      // Spinners, infinite loops (NOT for user interactions)
};
```

### Spring Physics Presets
```javascript
MOTION_TOKENS.spring = {
  snappy: {
    damping:   15,     // Quick, responsive (button press-release)
    stiffness: 200,    // Bouncy return
    mass:      1,      // Default mass
  },
  smooth: {
    damping:   20,     // Elegant, controlled (form animations)
    stiffness: 120,    // Less bouncy
    mass:      1,
  },
  playful: {
    damping:   10,     // Bouncy, playful (success states, CTAs)
    stiffness: 180,    // Slightly stiffer for quicker response
    mass:      1,
  },
};
```

### Scale & Opacity Tokens
```javascript
MOTION_TOKENS.scale = {
  press:       0.95,      // Button/card press feedback
  hover:       1.02,      // Subtle elevation
  overshoot:   1.05,      // Spring bounce target (never exceed 1.1)
  entrance:    0.98,      // Item entrance (scale from)
};

MOTION_TOKENS.opacity = {
  interactive: 0.8,       // Button/card press feedback
  disabled:    0.5,       // Disabled state
  entrance:    0,         // Fade in from
};
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

## 3. Animation Rules: What to Animate

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

### Restricted Animations

These are allowed **ONLY** in specific contexts:

| Animation | Allowed For | NOT Allowed For |
|-----------|-------------|-----------------|
| Spring physics + overshoot (bounce) | CTA buttons, success states, empty states | Secondary buttons, forms, navigation, list items |
| 500ms+ duration | Navigation, modals, complex multi-step sequences | Button press, tab switch, form focus |
| `rotate` transform | Icon feedback (chevron, loading spinner), empty state illustration | Button backgrounds, card orientations |
| `blur` (Reanimated Skia) | Modal backdrop, image blur effects | Common UI animations (use shadow instead) |

### Per-Component Guidelines

**Buttons:**
- High-priority CTA: Scale 0.95→1.0 spring (SNAPPY) + ripple
- Medium buttons: Scale 0.95→1.0 smooth (ease-in-out, no spring)
- Tertiary/secondary: Scale only, no color flash or ripple

**Form Inputs:**
- Focus: Label float (smooth), border color fade (smooth), background lift (subtle scale)
- Error: Shake amplitude 3px (not 5px), fade color transition
- Success: Checkmark entrance bounce (PLAYFUL spring), field highlight fade

**Lists & Cards:**
- Entrance: Scale 0.98→1.0 + Opacity 0→1 + TranslateY 10px→0 (all parallel, smooth easing)
- Stagger: 50ms delay between items max
- Press: Scale 0.95, no spring

**Navigation:**
- Forward: TranslateX 100%→0 + Scale 0.98→1.0 + Opacity 0.8→1.0 (parallel, base duration, smooth easing)
- Back: Reverse transition
- Previous screen: Subtly visible behind (depth effect, 90% scale)

**Modals:**
- Entry: Slide from bottom + backdrop fade (both spring, SMOOTH)
- Exit: Reverse
- Dismiss button: Standard button press

---

## 4. Anti-Patterns: What NOT to Do

### ❌ Decorative Motion (Violates Principle 1)
```javascript
// WRONG: Icon rotates continuously with no purpose
<Animated.View style={[styles.icon, { transform: [{ rotate: spinValue }] }]} />

// RIGHT: Icon rotates on press to give feedback
const { animatedStyle, onPressIn, onPressOut } = usePressAnimation({ type: 'rotate' });
```

### ❌ Breaking Continuity (Violates Principle 2)
```javascript
// WRONG: Item disappears then appears at new position
setItems(prev => prev.filter(i => i.id !== itemId));
setTimeout(() => setItems(prev => [...prev, updatedItem]), 300);

// RIGHT: Item maintains spatial position while updating
setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
```

### ❌ Blocking Interaction (Violates Principle 3)
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

### ❌ Overshoot Everywhere
```javascript
// WRONG: Everything bounces (exhausting)
spring: MOTION_TOKENS.spring.playful, // On every element

// RIGHT: Spring only for high-priority moments
const isHighPriority = isCTA || isSuccess;
spring: isHighPriority ? MOTION_TOKENS.spring.playful : MOTION_TOKENS.spring.smooth;
```

### ❌ Hardcoded Values
```javascript
// WRONG: Duration spread throughout code
duration={300}
duration={3000}
duration={700}

// RIGHT: Centralized tokens
duration={MOTION_TOKENS.duration.base}
duration={MOTION_TOKENS.duration.toast}
duration={MOTION_TOKENS.duration.xslow}
```

### ❌ Missing Reduced Motion Support
```javascript
// WRONG: No fallback for accessibility
const { animatedStyle } = usePressAnimation();

// RIGHT: Graceful degradation
const { shouldAnimate } = useMotion();
const { animatedStyle } = usePressAnimation({ enabled: shouldAnimate });
```

---

## 5. Component Animation Patterns

### 5.1 Navigation Transitions

**Forward Navigation (Enter New Screen)**
```
Previous Screen: Scale 1.0 → 0.9, Opacity 1.0 → 0.3 (stays visible beneath)
New Screen:     TranslateX 100% → 0, Scale 0.98 → 1.0, Opacity 0.8 → 1.0
Duration:       MOTION_TOKENS.duration.xslow (700ms)
Easing:         entrance (easeOut)
```

**Backward Navigation (Return to Previous)**
```
Previous Screen: Scale 0.9 → 1.0, Opacity 0.3 → 1.0
Current Screen: TranslateX 0 → 100%, Scale 1.0 → 0.98, Opacity 1.0 → 0.8
Duration:       MOTION_TOKENS.duration.xslow (700ms)
Easing:         exit (easeIn)
```

**Effect**: "Depth effect" — previous screen always slightly visible, creates layered perception

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

## 6. Accessibility: Reduced Motion Support

### Implementation

All animations must gracefully degrade to zero motion when user enables "Reduce Motion" in system settings.

```javascript
// In useMotion hook (Phase 3)
export function useMotion({ componentType = 'default' } = {}) {
  const { reduceMotion } = useAccessibility(); // System setting
  
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

### Testing Pattern

Every animated component must be tested with `reduceMotion: true`:
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
12. 🔄 Audit and restrict spring/bounce to CTA buttons, success states, empty states only

#### Phase 6: Premium Features (Future)
- Shared element transitions (card → detail screen)
- State morphing (loading → success spinner morph)

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
6. **Spring physics sparingly** — Reserve for high-priority moments
7. **Reference tokens always** — No magic numbers

### ❌ DON'T

1. **Animate layout properties** — width, height, padding, margin = jank
2. **Mix animation frameworks** — Use Reanimated consistently, not Animated + Reanimated
3. **Forget reduced motion** — Test every animation with motion disabled
4. **Bloat duration** — 800ms+ for routine interactions feels broken
5. **Spring everything** — Bouncy secondary buttons feel gimmicky
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

---

## 12. Next Steps: Phase 2 Implementation

When ready to proceed with Phase 2 (Token System Formalization):

1. **Enhance** `modules/utils/animations.js` — Add `MOTION_HIERARCHY`, `ANIMATION_RULES` exports
2. **Create** `modules/utils/animationRules.js` — Validation helpers and guards
3. **Refactor** hardcoded values (4000, 3000, 1000) to token imports
4. **Verify** all 278 tests pass, ESLint clean, animations smooth on device

**Owner**: Copilot (motion design mode)  
**Estimated Duration**: 2-3 hours for Phase 2  
**Success Criteria**: All tokens centralized, no hardcoded animation values, all tests green

---

**Last Updated**: April 14, 2026  
**Spec Status**: Active — Ready for Copilot implementation
