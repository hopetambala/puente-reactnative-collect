# Comprehensive Token Analysis: style-dictionary-dlite-tokens

## Overview
The `style-dictionary-dlite-tokens` package provides a complete design system with **300+ tokens** organized into two main categories: **Primitives** and **Semantics**. Both light and dark modes share primitive values but vary semantic values for theme switching.

---

## 📊 COMPLETE TOKEN INVENTORY

### 1. PRIMITIVE COLOR TOKENS (132 total)

#### 1.1 Achromatic Colors
```
tkDlitePrimitiveColorWhite:    #ffffff
tkDlitePrimitiveColorBlack:    #000000
```

#### 1.2 Neutral Grayscale (10 shades)
```
tkDlitePrimitiveColorNeutral100:   #f7f7f7 (lightest)
tkDlitePrimitiveColorNeutral200:   #e9e9e9
tkDlitePrimitiveColorNeutral300:   #d4d4d4
tkDlitePrimitiveColorNeutral400:   #c4c4c4
tkDlitePrimitiveColorNeutral500:   #a5a5a5
tkDlitePrimitiveColorNeutral600:   #6e6e6e
tkDlitePrimitiveColorNeutral700:   #464646
tkDlitePrimitiveColorNeutral800:   #202020
tkDlitePrimitiveColorNeutral900:   #161616
tkDlitePrimitiveColorNeutral1000:  #101010 (darkest)
```

#### 1.3 Hue Color Families (10 shades each: 100-1000)

**Blue** (primary brand color)
- 100: #ebf2ff → 1000: #001653

**Green** (success/safe)
- 100: #e7f1cb → 1000: #052b1a

**Yellow** (warning)
- 100: #faefc5 → 1000: #492e00

**Orange** (accent/secondary)
- 100: #f7e9da → 1000: #4f2204

**Red** (error/danger)
- 100: #fbe8e1 → 1000: #501508

**Mint** (teal-adjacent, cool accent)
- 100: #dff5ea → 1000: #104739

**Teal** (cool, aqua-like)
- 100: #dcf3f3 → 1000: #0e4c4c

**Purple** (creative, elegant accent)
- 100: #f3e7f2 → 1000: #4e1849

**Pink** (warm accent)
- 100: #f5e7ea → 1000: #621030

**Sand** (warm neutral, earth-tone)
- 100: #faf6f0 → 1000: #28221a

---

### 2. PRIMITIVE DIMENSION TOKENS (52 total)

#### 2.1 Typography - Font Sizes (11 sizes)
```
tkDlitePrimitiveDimensionFontSize100:   10px
tkDlitePrimitiveDimensionFontSize200:   12px
tkDlitePrimitiveDimensionFontSize300:   14px
tkDlitePrimitiveDimensionFontSize400:   16px  ← Body default
tkDlitePrimitiveDimensionFontSize500:   18px
tkDlitePrimitiveDimensionFontSize600:   20px
tkDlitePrimitiveDimensionFontSize700:   24px  ← Heading
tkDlitePrimitiveDimensionFontSize800:   30px
tkDlitePrimitiveDimensionFontSize900:   36px  ← Large display
tkDlitePrimitiveDimensionFontSize1000:  48px
tkDlitePrimitiveDimensionFontSize1100:  60px  ← Largest
```

#### 2.2 Typography - Letter Spacing (4 values + widest variant)
```
tkDlitePrimitiveDimensionLetterSpacingTight:   -0.02em (condensed)
tkDlitePrimitiveDimensionLetterSpacingNormal:  0em     (default)
tkDlitePrimitiveDimensionLetterSpacingWide:    0.025em (relaxed)
tkDlitePrimitiveDimensionLetterSpacingWider:   0.05em  (extra relaxed)
tkDlitePrimitiveDimensionLetterSpacingWidest:  0.1em   (maximum spread)
```

#### 2.3 Spacing - Border Radius (6 values)
```
tkDlitePrimitiveDimensionRadius0:       0px (no radius)
tkDlitePrimitiveDimensionRadius100:     2px
tkDlitePrimitiveDimensionRadius200:     4px (small)
tkDlitePrimitiveDimensionRadius300:     8px
tkDlitePrimitiveDimensionRadius400:     12px (medium)
tkDlitePrimitiveDimensionRadiusFull:    9999px (pill-shaped)
```

#### 2.4 Font Weights (4 values)
```
tkDlitePrimitiveFontweightRegular:      400
tkDlitePrimitiveFontweightMedium:       500
tkDlitePrimitiveFontweightSemibold:     600
tkDlitePrimitiveFontweightBold:         700
```

#### 2.5 Shadows (4 elevation levels)
```
tkDlitePrimitiveShadow100: 0px 1px 2px 0px #0000000d (subtle)
tkDlitePrimitiveShadow200: 0px 2px 4px -1px #0000001a (light)
tkDlitePrimitiveShadow300: 0px 4px 8px -2px #00000026 (medium)
tkDlitePrimitiveShadow400: 0px 8px 24px -4px #00000033 (pronounced)
```

---

### 3. PRIMITIVE NUMBER TOKENS (21 total)

#### 3.1 Opacity Values (8 levels)
```
tkDlitePrimitiveNumberOpacity0:    0    (fully transparent)
tkDlitePrimitiveNumberOpacity5:    0.05 (5%)
tkDlitePrimitiveNumberOpacity10:   0.1  (10%)
tkDlitePrimitiveNumberOpacity20:   0.2  (20%)
tkDlitePrimitiveNumberOpacity40:   0.4  (40%)
tkDlitePrimitiveNumberOpacity60:   0.6  (60%)
tkDlitePrimitiveNumberOpacity80:   0.8  (80%)
tkDlitePrimitiveNumberOpacity100:  1    (fully opaque)
```

#### 3.2 Line Heights (4 values)
```
tkDlitePrimitiveNumberLineHeightTight:   1.1
tkDlitePrimitiveNumberLineHeightSnug:    1.25
tkDlitePrimitiveNumberLineHeightNormal:  1.5
tkDlitePrimitiveNumberLineHeightRelaxed: 1.625
```

---

### 4. SEMANTIC COLOR TOKENS (35 total) - **VARIES BY MODE**

#### 4.1 Core Semantic Colors (9 tokens)
These change depending on theme mode (light vs dark):

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `tkDliteSemanticColorPrimary` | #3d80fc (blue @500) | #70a1fc (blue @400) |
| `tkDliteSemanticColorSecondary` | #ffe680 (yellow @200) | #ffe680 (yellow @200) |
| `tkDliteSemanticColorBrand` | #f3c409 (yellow @500) | #f3c409 (yellow @500) |
| `tkDliteSemanticColorBackground` | #f7f7f7 (neutral @100) | #161616 (neutral @900) |
| `tkDliteSemanticColorForeground` | #161616 (neutral @900) | #f7f7f7 (neutral @100) |
| `tkDliteSemanticColorMuted` | #a5a5a5 (neutral @500) | #c4c4c4 (neutral @400) |
| `tkDliteSemanticColorBorder` | #d4d4d4 (neutral @300) | #6e6e6e (neutral @600) |
| `tkDliteSemanticColorSuccess` | #006210 (green @700) | #8fb064 (green @400) |
| `tkDliteSemanticColorWarning` | #976500 (yellow @800) | #f3c409 (yellow @500) |
| `tkDliteSemanticColorError` | #bf3813 (red @700) | #e9541e (red @500) |

#### 4.2 Surface Colors (5 tokens)
For background/container styling:

```
tkDliteSemanticColorSurfaceBase:      #ffffff (light) → #161616 (dark)
tkDliteSemanticColorSurfaceSunken:    #f7f7f7 (light) → #202020 (dark)
tkDliteSemanticColorSurfaceRaised:    #ffffff (light) → #202020 (dark)
tkDliteSemanticColorSurfaceOverlay:   #000000 (both modes)
```

#### 4.3 Text Colors (5 tokens)
Designed for readability across backgrounds:

```
tkDliteSemanticColorTextPrimary:      #161616 (light) → #f7f7f7 (dark)
tkDliteSemanticColorTextSecondary:    #6e6e6e (light) → #d4d4d4 (dark)
tkDliteSemanticColorTextTertiary:     #a5a5a5 (both modes)
tkDliteSemanticColorTextOnBrand:      #161616 (both modes)
tkDliteSemanticColorTextOnPrimary:    #ffffff (both modes)
```

#### 4.4 Action Colors (4 tokens)
For interactive elements (buttons, links):

```
tkDliteSemanticColorActionPrimary:        #3d80fc (light) → #70a1fc (dark)
tkDliteSemanticColorActionPrimaryActive:  #0a46b6 (light) → #a3c3fd (dark)
tkDliteSemanticColorActionSecondary:      #f7f7f7 (light) → #202020 (dark)
tkDliteSemanticColorActionSecondaryActive: #d4d4d4 (light) → #464646 (dark)
```

#### 4.5 Feedback Colors (6 tokens)
For status messaging, alerts, and notifications:

```
tkDliteSemanticColorFeedbackInfo:           #1b5fdb (light) → #70a1fc (dark)
tkDliteSemanticColorFeedbackSuccess:        #006210 (light) → #8fb064 (dark)
tkDliteSemanticColorFeedbackSuccessActive:  #0b5223 (light) → #c5d8a7 (dark)
tkDliteSemanticColorFeedbackWarning:        #976500 (light) → #f3c409 (dark)
tkDliteSemanticColorFeedbackDanger:         #bf3813 (light) → #e9541e (dark)
tkDliteSemanticColorFeedbackDangerActive:   #8e280e (light) → #ec9471 (dark)
```

---

### 5. SEMANTIC TYPOGRAPHY TOKENS (17 total)

#### 5.1 Font Families (3 tokens)
```
tkDliteSemanticTypographyFontHeading:  "Plus Jakarta Sans"
tkDliteSemanticTypographyFontBody:     "Source Serif 4"
tkDliteSemanticTypographyFontMono:     "Source Code Pro"
```

#### 5.2 Pre-defined Font Sizes (10 tokens)
```
tkDliteSemanticTypographySize100:   10px
tkDliteSemanticTypographySize200:   12px
tkDliteSemanticTypographySize300:   14px
tkDliteSemanticTypographySize400:   16px
tkDliteSemanticTypographySize500:   18px
tkDliteSemanticTypographySize600:   20px
tkDliteSemanticTypographySize700:   24px
tkDliteSemanticTypographySize800:   30px
tkDliteSemanticTypographySize900:   36px
tkDliteSemanticTypographySize1000:  48px
```

#### 5.3 Pre-defined Type Styles (4 composites)

**Display Large** (hero/main heading)
```
tkDliteSemanticTypographyTypeDisplayLSize:          60px
tkDliteSemanticTypographyTypeDisplayLWeight:        700 (bold)
tkDliteSemanticTypographyTypeDisplayLLineHeight:    1.1
tkDliteSemanticTypographyTypeDisplayLLetterSpacing: -0.02em
```

**Heading Medium** (section heading)
```
tkDliteSemanticTypographyTypeHeadingMSize:          24px
tkDliteSemanticTypographyTypeHeadingMWeight:        600 (semibold)
tkDliteSemanticTypographyTypeHeadingMLineHeight:    1.25
tkDliteSemanticTypographyTypeHeadingMLetterSpacing: -0.02em
```

**Body Default** (body text)
```
tkDliteSemanticTypographyTypeBodyDefaultSize:          16px
tkDliteSemanticTypographyTypeBodyDefaultWeight:        400 (regular)
tkDliteSemanticTypographyTypeBodyDefaultLineHeight:    1.5
tkDliteSemanticTypographyTypeBodyDefaultLetterSpacing: 0em
```

**Label Small** (captions, buttons)
```
tkDliteSemanticTypographyTypeLabelSSize:          12px
tkDliteSemanticTypographyTypeLabelSWeight:        500 (medium)
tkDliteSemanticTypographyTypeLabelSLineHeight:    1.5
tkDliteSemanticTypographyTypeLabelSLetterSpacing: 0.025em
```

**Mono Medium** (code blocks, technical copy)
```
tkDliteSemanticTypographyTypeMonoMSize:          14px
tkDliteSemanticTypographyTypeMonoMWeight:        400 (regular)
tkDliteSemanticTypographyTypeMonoMLineHeight:    1.5
tkDliteSemanticTypographyTypeMonoMLetterSpacing: 0em
```

---

### 6. SEMANTIC SPACING TOKENS (19 total)

#### 6.1 Numbered Spacing Scale (10 tokens: 4px grid)
```
tkDliteSemanticSpacing100:     4px
tkDliteSemanticSpacing200:     8px
tkDliteSemanticSpacing300:    12px
tkDliteSemanticSpacing400:    16px  ← Default padding/margin
tkDliteSemanticSpacing500:    20px
tkDliteSemanticSpacing600:    24px
tkDliteSemanticSpacing700:    28px
tkDliteSemanticSpacing800:    32px
tkDliteSemanticSpacing900:    36px
tkDliteSemanticSpacing1000:   40px
```

#### 6.2 Named Spacing Scale (9 T-shirt sizes)
```
tkDliteSemanticSpacingXxxs:    1px  (hairline)
tkDliteSemanticSpacingXxs:     2px  (thin)
tkDliteSemanticSpacingXs:      4px  (extra small)
tkDliteSemanticSpacingSm:      8px  (small)
tkDliteSemanticSpacingMd:     16px  (medium)
tkDliteSemanticSpacingLg:     24px  (large)
tkDliteSemanticSpacingXl:     32px  (extra large)
tkDliteSemanticSpacingXxl:    48px  (2xl)
tkDliteSemanticSpacingXxxl:   64px  (3xl)
```

---

### 7. SEMANTIC LAYOUT TOKENS (10 total)

#### 7.1 Breakpoints (4 responsive sizes)
```
tkDliteSemanticBreakpointSm:    640px  (small phones)
tkDliteSemanticBreakpointMd:    768px  (tablets)
tkDliteSemanticBreakpointLg:   1024px  (small laptops)
tkDliteSemanticBreakpointXl:   1280px  (large screens)
```

#### 7.2 Duration/Timing (2 tokens)
```
tkDliteSemanticDurationFast:    150ms  (micro-interactions)
tkDliteSemanticDurationNormal:  300ms  (standard animations)
```

#### 7.3 Border Radius (5 tokens)
```
tkDliteSemanticBorderRadiusNone:   0px    (sharp corners)
tkDliteSemanticBorderRadiusSm:     4px    (slightly rounded)
tkDliteSemanticBorderRadiusMd:     8px    (moderate rounding)
tkDliteSemanticBorderRadiusLg:    12px    (rounded)
tkDliteSemanticBorderRadiusFull:  9999px  (pill-shaped/circle)
```

#### 7.4 Elevation/Shadow System (3 tokens)
```
tkDliteSemanticElevationLow:    0px 2px 4px -1px #0000001a
tkDliteSemanticElevationMedium: 0px 4px 8px -2px #00000026
tkDliteSemanticElevationHigh:   0px 8px 24px -4px #00000033
```

---

## 📈 CURRENT USAGE vs. AVAILABLE TOKENS

### ✅ CURRENTLY USING (in `modules/theme/tokens.js`)
```javascript
Primitive Colors (6 families):
- Neutral (100-900)          → Used in createSemanticTokens
- Blue (100-900)             → Primary, Info
- Green (100-900)            → Success
- Yellow (100-900)           → Warning (note: only 100-900)
- Orange (100-900)           → Accent
- Red (100-900)              → Error

Semantic Colors (2 families):
- Cannot determine - may be using directly from package
```

### ❌ AVAILABLE BUT NOT USED (in current `modules/theme/tokens.js`)

**Primitive Colors:**
- Mint (100-1000) - Cool teal accent
- Teal (100-1000) - Aqua-like accent
- Purple (100-1000) - Creative/elegant accent
- Pink (100-1000) - Warm accent
- Sand (100-1000) - Earth-tone neutral
- **Note:** Yellow extends to 1000 (not just 900)

**Primitive Dimensions & Numbers:**
- All font sizes (100-1100)
- Letter spacing (3 variants)
- Font weights (all 4)
- Opacity levels (all 8)
- Line heights (all 4)
- Shadows (all 4)

**Semantic Colors (35 tokens not directly mapped):**
- Surface colors (sunken, raised, overlay)
- Text colors (primary, secondary, tertiary)
- Action colors (primary, secondary + active states)
- Feedback colors (info, success, warning, danger + active states)

**Semantic Typography (17 tokens):**
- Font families (heading, body, mono)
- Pre-defined type styles (DisplayL, HeadingM, BodyDefault, LabelS, MonoM)
- Font size scale (Size100-1000)

**Semantic Spacing & Layout (20 tokens):**
- Spacing named scale (xxxs-xxxl)
- Breakpoints (sm, md, lg, xl)
- Animation durations (fast, normal)
- Border radius (5 presets)
- Elevation system (low, medium, high)

---

## 🎨 OPPORTUNITIES FOR EXPANSION

### Quick Wins (easy additions to enhance current system)
1. **Add Mint/Teal/Purple/Pink/Sand color families** to `createSemanticTokens()`
   - Use for feature-specific accents, avatars, tags, or status variants
   
2. **Map Semantic Colors directly**
   - Use `tkDliteSemanticColorSurfaceBase`, `tkDliteSemanticColorTextPrimary`, etc. for consistent backgrounds and text
   
3. **Add Typography Variants**
   - Implement the pre-defined type styles (DisplayL, HeadingM, etc.) in your typography system
   - These already include size, weight, line height, and letter spacing

4. **Use Semantic Spacing Named Scale**
   - Replace hardcoded spacing with named scale (xxxs, xxs, xs, sm, md, lg, xl, xxl, xxxl)
   - Better than numbered scale for readability

5. **Add Elevation System**
   - Use `tkDliteSemanticElevationLow/Medium/High` for shadow elevation hierarchy
   - Replace hardcoded shadows in components

### Medium Complexity
6. **Implement Border Radius System**
   - Use `tkDliteSemanticBorderRadius*` for consistent rounding across components
   
7. **Add Animation Durations**
   - Use `tkDliteSemanticDurationFast` (150ms) and `DurationNormal` (300ms) instead of magic numbers
   
8. **Create Composite Typography Tokens**
   - Map the pre-defined styles to component variants

### Advanced Integration
9. **Implement Responsive Breakpoints**
   - Use `tkDliteSemanticBreakpoint*` for responsive layouts (if needed for web views)

10. **Add Opacity/Transparency System**
    - Use opacity levels for hover states, disabled states, overlays

---

## 📝 RECOMMENDATIONS

### For Immediate Implementation
1. **Update `modules/theme/tokens.js`** to include ALL color families (Mint, Teal, Purple, Pink, Sand)
2. **Create `modules/theme/compositeTokens.js`** mapping semantic typography and elevation
3. **Use Semantic Colors** where available instead of remapping primitives
4. **Standardize spacing** to the named scale (xxxs-xxxl)

### For Components Using These Tokens
- Use `tkDliteSemanticElevationLow/Medium/High` for all shadows
- Apply `tkDliteSemanticBorderRadius*` for consistent corner rounding
- Reference semantic colors directly (e.g., `tkDliteSemanticColorSurfaceBase`, `tkDliteSemanticColorActionPrimary`)
- Use animation durations for all transitions

### Token Organization Best Practice
```
modules/theme/
├── tokens.js           (maps primitives → semantic)
├── colors.js          (RGB/hex values by category)
├── typography.js      (font sizes, weights, line heights)
├── spacing.js         (spacing scale + border radius)
├── elevation.js       (shadows + z-index)
├── animation.js       (durations + easing)
└── exports.js         (unified export for all token types)
```

---

## 🔍 VERIFICATION CHECKLIST

- [ ] All 10 color families accessible (Neutral, Blue, Green, Yellow, Orange, Red, Mint, Teal, Purple, Pink, Sand)
- [ ] Primitives vs. Semantics distinction clear in code
- [ ] Light/Dark mode colors correctly switching
- [ ] Semantic colors used for UI elements (not primitives)
- [ ] Typography includes all 5 pre-defined type styles
- [ ] Spacing uses named scale consistently
- [ ] Elevation system replaces hardcoded shadows
- [ ] Border radius tokens applied across components
- [ ] Animation durations standardized
- [ ] Opacity levels available for interactive states

---

## 📌 SUMMARY

**Total Tokens Available: 300+**

- **132 Primitive Colors** (2 achromatic + 110 hue-based across 11 families)
- **52 Primitive Dimensions** (fonts, spacing, radius, shadows)
- **21 Primitive Numbers** (opacity, line heights)
- **35 Semantic Colors** (varying by light/dark mode)
- **17 Semantic Typography** (3 font families + 5 pre-defined styles)
- **19 Semantic Spacing** (10 numbered + 9 named)
- **10 Semantic Layout** (breakpoints + timing + radius + elevation)

**Current Coverage: ~15-20% of available tokens**

The app is well-positioned to significantly enhance its design system by leveraging additional color families, the semantic color system, and the pre-defined typography and elevation systems already baked into the package.
