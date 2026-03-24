# Semantic Background & Text Color Overhaul

## Overview
Complete restructuring of how backgrounds and text colors are applied throughout the app using semantic tokens with proper surface hierarchy.

## Semantic Token Architecture

### Background Colors (Surface Hierarchy)

| Token | Purpose | Usage | Light Mode | Dark Mode |
|---|---|---|---|---|
| `background` | Full screen/base background | Screen containers, app root | #FFFFFF | #121212 |
| `surface` | Interactive surfaces | Cards, containers, default surfaces | #FFFFFF | #1E1E1E |
| `surfaceRaised` | Elevated surfaces | Modals, popovers, floating elements | #F5F5F5 | #2A2A2A |
| `surfaceSunken` | Depressed surfaces | Input fields, wells, recessed areas | #F9F9F9 | #0D0D0D |
| `surfaceOverlay` | Overlay surfaces | Overlays, semi-transparent surfaces | rgba(0,0,0,0.5) | rgba(0,0,0,0.7) |

### Text Colors (Semantic Hierarchy)

| Token | Purpose | Contrast | Usage |
|---|---|---|---|
| `textPrimary` | Primary text | AA | Body text, main content, labels |
| `textSecondary` | Secondary text | AA- | Secondary content, subtext, timestamps |
| `textTertiary` | Tertiary text | A | Disabled text, hints, very subtle text |
| `foreground` | Foreground elements | AAA | Critical text, headings, interactive elements |
| `onSurface` | Text on surface | AA | Alternative to textPrimary for surface backgrounds |
| `onPrimary` | Text on primary | AAA | Text on primary-colored backgrounds |

### Status/Interactive Colors (Don't change - semantic already correct)

- `primary` - Primary brand interaction
- `secondary` - Secondary interaction  
- `accent` - Accent/highlight color
- `error` / `warning` / `success` / `info` - Status indicators
- Use for: Buttons, headers, status indicators, interactive elements

## Current Issues Identified

### ❌ Auth Screens
- **Problem:** SignIn/SignUp use `backgroundColor: theme.colors.accent` for full screen
- **Fix:** Should use `backgroundColor: theme.colors.background`
- **Files:** `domains/Auth/SignIn/index.js`, `domains/Auth/SignUp/index.js`

### ❌ Form Inputs
- **Problem:** Using `theme.colors.surface` when should use surfaceSunken
- **Fix:** Change to `backgroundColor: theme.colors.surfaceSunken`
- **Files:** Form input components, field collections

### ❌ Modals & Elevated Surfaces
- **Problem:** Not distinguishing between `surface` and `surfaceRaised`
- **Fix:** Modals should use `surfaceRaised` for elevation distinction
- **Files:** `TermsModal`, `PeopleModal`, floating elements

### ❌ Text Colors
- **Problem:** Mixing `onSurface`, `onSurfaceVariant`, `primary` for text
- **Fix:** Standardize to `textPrimary`, `textSecondary`, `textTertiary`, `foreground`
- **Files:** Throughout app - needs systematic replacement

### ❌ Static Backgrounds
- **Problem:** Some StyleSheet.create() calls use theme at module level
- **Fix:** Convert to useMemo factories or move theme reference inside
- **Status:** Already Fixed in dark mode migration but verify all are converting

## Migration Strategy

### Phase 1: Define Surface Type Usage
For each component, determine correct surface type:
- **background** - Full screen stacks, root containers
- **surface** - Default cards, standard containers, dropdown menus
- **surfaceRaised** - Modals, popovers, floating overlays, elevated cards
- **surfaceSunken** - Text inputs, form fields, search boxes, recessed areas
- **surfaceOverlay** - Loading overlays, semi-transparent overlays

### Phase 2: Define Text Color Usage
For each text element, determine hierarchy:
- **foreground** - Headings, critical content, call-to-action text (AAA contrast)
- **textPrimary** - Body text, default text, main content (AA contrast)
- **textSecondary** - Supporting text, timestamps, metadata (AA- contrast)
- **textTertiary** - Disabled text, hints, very subtle content (A contrast)

### Phase 3: Implementation
1. Update auth screens to use correct background
2. Update form inputs to use surfaceSunken
3. Update modals to use surfaceRaised
4. Standardize text colors throughout
5. Convert remaining static styles to dynamic factories
6. Verify all backgrounds are theme-aware

## Recommended Changes

### Auth Screens (SignIn, SignUp)
```javascript
// BEFORE
style={{ backgroundColor: theme.colors.accent, flex: 1 }}

// AFTER
style={{ backgroundColor: theme.colors.background, flex: 1 }}
```

### Form Inputs
```javascript
// BEFORE
backgroundColor: theme.colors.surface

// AFTER
backgroundColor: theme.colors.surfaceSunken
```

### Modals
```javascript
// BEFORE
backgroundColor: theme.colors.surface

// AFTER
backgroundColor: theme.colors.surfaceRaised
```

### Text Colors - Primary
```javascript
// BEFORE
color: theme.colors.onSurface

// AFTER
color: theme.colors.textPrimary
```

### Text Colors - Secondary
```javascript
// BEFORE
color: theme.colors.onSurfaceVariant

// AFTER
color: theme.colors.textSecondary
```

## Files to Update (Priority Order)

### High Priority (Core App)
1. `domains/Auth/SignIn/index.js` - Auth screen background
2. `domains/Auth/SignUp/index.js` - Auth screen background
3. `modules/theme/layout/index.js` - Layout system defaults
4. `impacto-design-system/Extensions/FormikFields/PaperInputPicker/` - All form variants
5. `impacto-design-system/Extensions/TermsModal/index.js` - Modal surface

### Medium Priority (Components)
6. `domains/DataCollection/Assets/NewAssets/AssetSupplementary/index.js`
7. `domains/DataCollection/GdprCompliance/index.js`
8. `domains/Settings/SettingsHome/AccountSettings/` - All sub-screens
9. `impacto-design-system/Extensions/Header/` - Header styling

### Low Priority (Status Display)
10. `impacto-design-system/Base/PopupError/index.js` - Status backgrounds OK
11. `impacto-design-system/Base/PopupSuccess/index.js` - Status backgrounds OK
12. `impacto-design-system/Base/Toast/index.js` - Status backgrounds OK

## Implementation Checklist

- [ ] Auth screens: accent → background
- [ ] Form inputs: surface → surfaceSunken
- [ ] Modals: surface → surfaceRaised
- [ ] Text: onSurface → textPrimary
- [ ] Text: onSurfaceVariant → textSecondary
- [ ] All StyleSheets dynamic (useMemo factories)
- [ ] All backgrounds use theme colors
- [ ] All text colors use semantic tokens
- [ ] ESLint passes on all files
- [ ] Dark/light mode tested

---

**Status**: Planning phase - Ready to implement
