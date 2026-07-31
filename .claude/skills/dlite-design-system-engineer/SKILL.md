---
name: dlite-design-system-engineer
description: >
  Use when writing, reviewing, or refactoring any UI styling in Puente Collect —
  building a screen or domain, adding a component to `impacto-design-system/`,
  editing any `StyleSheet.create({…})` or `index.styles.js`, or touching an
  inline `style={{…}}` prop. Think like a design system engineer: every value
  comes from a dlite token in `modules/theme/tokens.js` (which wraps
  `style-dictionary-dlite-tokens/rn/puente/default`), composition beats
  invention, and a token that is wrong or missing gets worked around with other
  tokens — never with a hard-coded value, and never by blocking the work. Also
  triggers on "is this using dlite tokens?", "audit the styling", and any diff
  review touching `domains/`, `modules/`, `impacto-design-system/`, or `context/`.
---

# dlite-design-system-engineer

This skill governs the visual layer of Puente Collect.

Its job is not to make the app pretty.

Its job is to keep the cost of visual change constant.

A design system that is 95% adhered to is not a design system. It is a
suggestion, plus a list of places that will silently disagree with it later.

The rule, stated once: **style with dlite tokens. Never hard-code a value the
system already defines. If a token is wrong or missing, compose around it and
leave a breadcrumb — never quietly route around it with a literal.**

---

# Scope

| Layer | Directories | Yours? |
| --- | --- | --- |
| Screens and flows | `domains/**` | Yes |
| Shared components | `impacto-design-system/**` | Yes |
| Theme and shared UI utils | `modules/theme/**`, `modules/**` | Yes |
| Providers with styling | `context/**` | Yes |
| Motion / animation values | `modules/utils/animations.js`, `animationRules.js` | **No** — `motion-auditor` |
| Native projects, config, build | `ios/`, `android/`, `app.json`, `eas.json` | **No** |

Do not tokenize:

- values that are geometry or data, not design — map region deltas, image
  dimensions from a payload, chart coordinates
- genuinely dynamic values driven by runtime state
- throwaway scaffold UI that is about to be deleted

A number in `modules/geolocation/` or a `MapView` region is data. "Fixing" it
breaks behavior.

## The one bridge

`modules/theme/index.js`.

`createTheme(mode)` resolves dlite tokens **once** and hands react-native-paper a
flat `colors.*` palette. Ninety-five files consume it through `useTheme()`.

That file is yours to keep honest. Every entry in its `colors` map must trace to
a `tkDlite*` token.

Adding a new app-wide color means adding it **there**, sourced from a token —
never inlining it at a call site.

---

# Your Role

You are acting as a design system engineer.

Not a visual designer.

Not a React Native generalist.

Your responsibility is that a single token change propagates everywhere, and that
no screen has quietly opted out.

Every recommendation should improve one of:

- token coverage
- theme correctness in both light and dark
- accessibility of state and contrast
- legibility in the field — bright sun, cracked screens, one-handed use
- cost of the next visual change

Everything else is secondary.

**Field context is a design constraint, not flavor text.** This app is used by
promotores de salud outdoors, often offline, often on low-end Android hardware.
Low-contrast text and 2px hit-target shavings are not cosmetic here.

---

# Default Assumptions

Assume these are true unless the resolved token object proves otherwise.

1. The token exists. You have not looked hard enough.
2. If no token matches exactly, one composes.
3. A magic number is a future inconsistency, not a shortcut.
4. Static inline styles are how systems rot — one exception becomes the pattern.
5. Anything hard-coded will be wrong in dark mode.
6. Nothing is "just this once." This project has one developer and no reviewer to
   catch the second time.
7. The value you want and the value the system defines being *close* is the
   problem, not the resolution.

Never introduce a raw value because searching was inconvenient.

---

# Proven Setup

This wiring is verified against the installed package, not assumed.

Brand: **puente**. Package: `style-dictionary-dlite-tokens`, entry
`style-dictionary-dlite-tokens/rn/puente/default` (exports map strips `dist`).

```js
import { getTokens } from '@modules/theme/tokens';
```

## The API is FLAT camelCase, not nested

This is the single most common mistake in this repo. There is no
`t.semantic.color.text.primary`. That path is `undefined`, and `undefined` in a
React Native style is silently dropped — the style just does not apply, with no
error.

```js
const t = getTokens('light');

t.tkDliteSemanticColorTextPrimary   // ✅ '#161616'
t.semantic.color.text.primary       // ❌ TypeError / undefined
```

Verified resolved values (light):

| Token | Light |
| --- | --- |
| `tkDliteSemanticColorSurfaceBase` | `#ffffff` |
| `tkDliteSemanticColorTextPrimary` | `#161616` |
| `tkDliteSemanticColorActionPrimary` | `#3d80fc` |
| `tkDliteSemanticSpacing400` | `16` |
| `tkDliteSemanticBorderRadiusMd` | `8` |

Facts worth not rediscovering:

- Spacing has **both** a numeric scale (`Spacing100`–`Spacing1000`, 4px steps)
  and named aliases (`SpacingXxxs`–`SpacingXxxl`). They are **not the same
  values** — `SpacingMd` is 16, `Spacing400` is 16, but `SpacingLg` is 24 while
  `Spacing600` is 24 and `Spacing500` is 20. **Prefer numeric**; existing code
  uses it and it interpolates predictably.
- Typography sizes are numeric only (`TypographySize100`–`1100`). There are **no**
  named size aliases. Do not invent `TypographySizeMd`.
- Border radius uses short aliases: `None`, `Sm`, `Md`, `Lg`, `Full`. **Not**
  `Small` / `Medium` / `Large`.
- Elevation tokens are CSS box-shadow **strings** (`"0px 2px 4px -1px #0000001a"`).
  They do not drop into a React Native style. Use `modules/theme/shadows.js`,
  which is the RN-shaped equivalent.
- `tkDliteSemanticDuration*` exists but belongs to `motion-auditor`. Leave it.

## Known drift: the mock and the package disagree

`__mocks__/styleDictionaryTokens.js` defines token names the real package does
**not** ship. Code using them passes tests and renders nothing on device.

Confirmed non-existent in the real package but present in the mock or in code:

| Used in code | Real token |
| --- | --- |
| `tkDliteSemanticBorderRadiusMedium` | `tkDliteSemanticBorderRadiusMd` |
| `tkDliteSemanticColorSurface` | `tkDliteSemanticColorSurfaceBase` |
| `tkDliteSemanticColorFeedbackDangerContainer` | *(none — compose it)* |

Before trusting any token name, resolve it against the real package:

```bash
node -e "const t=require('./node_modules/style-dictionary-dlite-tokens/dist/rn/puente/default/index.js'); console.log(Object.keys(t.light).filter(k=>/Radius|Surface/i.test(k)).join('\n'))"
```

A green test is not proof a token exists. The mock is not the source of truth.

---

# Token Reference

| Category | Token |
| --- | --- |
| Text | `tkDliteSemanticColorText{Primary,Secondary,Tertiary,OnPrimary,OnBrand}` |
| Surface | `tkDliteSemanticColorSurface{Base,Raised,Sunken,Overlay}` |
| Background / foreground | `tkDliteSemanticColor{Background,Foreground}` |
| Action | `tkDliteSemanticColorAction{Primary,PrimaryActive,Secondary,SecondaryActive}` |
| Feedback | `tkDliteSemanticColorFeedback{Success,SuccessActive,Warning,Danger,DangerActive,Info}` |
| Brand / muted / border | `tkDliteSemanticColor{Brand,Muted,Border}` |
| Spacing (prefer) | `tkDliteSemanticSpacing{100..1000}` |
| Spacing (aliases) | `tkDliteSemanticSpacing{Xxxs,Xxs,Xs,Sm,Md,Lg,Xl,Xxl,Xxxl}` |
| Radius | `tkDliteSemanticBorderRadius{None,Sm,Md,Lg,Full}` |
| Typography size | `tkDliteSemanticTypographySize{100..1100}` |
| Typography family | `tkDliteSemanticTypographyFont{Heading,Body,Mono}` |
| Type ramp | `tkDliteSemanticTypographyType{DisplayL,HeadingM,BodyDefault,LabelS,MonoM}{Size,Weight,LineHeight,LetterSpacing}` |
| Elevation | `tkDliteSemanticElevation{Low,Medium,High}` — **web shadow strings, use `shadows.js` in RN** |

Use **semantic** tokens by default. They carry intent and adapt across themes.

Drop to `tkDlitePrimitive*` (`ColorNeutral100`–`1000`, `ColorBlue*`, `ColorRed*`,
`ColorGreen*`, …) only when no semantic token fits.

Never read the resolved value and paste it in. That is hard-coding with extra
steps, and it silently breaks dark mode.

---

# Two Legitimate Consumption Paths

Both are correct. Pick by what the component already does.

## 1. `useTheme()` — the default for components

Ninety-five files use this. It is theme-reactive: dark mode works for free.

```js
import { useTheme } from 'react-native-paper';

const { colors } = useTheme();

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
});
```

`colors.*` is the mapped palette from `modules/theme/index.js` — every key traces
to a `tkDlite*` token. Prefer it inside components.

## 2. `getTokens(mode)` — for spacing, radius, and type

Paper's `colors` map covers color only. Spacing, radius, and font size come from
the token object directly.

```js
import { getTokens } from '@modules/theme/tokens';

const t = getTokens(isDark ? 'dark' : 'light');

const styles = StyleSheet.create({
  container: {
    padding: t.tkDliteSemanticSpacing400,
    borderRadius: t.tkDliteSemanticBorderRadiusMd,
  },
});
```

## The module-scope trap

```js
// ❌ Module scope — resolves once, at import, forever light.
const t = getTokens('light');
const styles = StyleSheet.create({ … });
```

This appears in eight files today (`domains/DataCollection/index.styles.js`,
`FormGallery/`, `Forms/`, and others). It is safe **only** for non-color values —
spacing and radius are identical in both themes.

The moment a module-scope `getTokens('light')` block sets a `color`,
`backgroundColor`, or `borderColor`, it is a dark-mode bug. Move it into a
`StyleSheet` factory called from the component, or take the color from
`useTheme()`.

Fix that when you touch such a file. Do not add new ones.

## The legacy shadow layer

`modules/theme/spacing.js`, `modules/theme/typography.js`, and
`modules/theme/colors/index.js` are hand-rolled scales that predate dlite and
**shadow it with different values** (`spacing.md` is 12; `SpacingMd` is 16).
`colors/index.js` says "Legacy" in its own first line.

They still have ~9 importers. Do not add importers. When you are already editing
a file that imports them, migrate that file to dlite tokens. Do not open a
migration campaign as a side quest.

---

# Reasoning Order

Before writing any value, in this order.

1. Is there a semantic token for this?
2. Is there a semantic token for the *intent*, even if the value differs slightly?
3. Can existing tokens compose to it — arithmetic on a spacing token, a nested
   reference, an opacity applied to a token color?
4. Is there a primitive token?
5. Is this value genuinely dynamic — driven by runtime state or by data?
6. Only then: work around it, per the rule below.

Never reverse this order.

Never skip to 6 because 1–4 required resolving the token object.

---

# When a Token Is Wrong or Missing

**Do not block. Do not escalate as a precondition. Do not hard-code.**

Work around it, in this repo, using tokens.

In order of preference:

1. **Compose from semantic tokens** — `t.tkDliteSemanticSpacing400 / 2`,
   or a token color at reduced opacity
2. **Compose from primitives** — `tkDlitePrimitiveColorNeutral*` and the
   colour ramps are finer-grained
3. **Use the nearest semantic token** and accept the small visual difference

Then leave a breadcrumb so the knowledge is not lost:

```js
// TODO(dlite): no 7px step; using Spacing200 (8px), the nearest token.
marginHorizontal: t.tkDliteSemanticSpacing200,
```

This is the established pattern in this repo — `domains/DataCollection/index.styles.js`
already does exactly this. Follow it.

And name it in your report.

The breadcrumb is not a blocker. It costs one line and stops the same problem
being re-solved differently in six months. Recording is not escalating.

**The one thing you may never do is write a raw value.** Not a hex, not an rgba,
not a bare pixel number, not "just for now." A hard-coded value is invisible to
every future token change — precisely the failure this skill exists to prevent.

## Escalating a genuinely broken token

Composing handles a *missing* token. A token whose **value is wrong** — bad
contrast, wrong hue, a spacing step that breaks layout everywhere — is a
different problem, and the fix belongs upstream in
`style-dictionary-dlite-tokens` so every consumer benefits.

Compose a local workaround so the work ships, **and** report it with:

1. The exact token name and the file where it is used.
2. The defect concretely — expected vs. actual resolved value.
3. The impact — which screen degrades, how badly, in which theme.
4. The recommended fix at the token source.

Known gaps, already worked around, for reference:

- No `FeedbackDangerContainer`. `modules/theme/index.js` composes an
  `errorContainer` fallback with a `TODO` beside it. That is the pattern.
- No canvas/map-chrome colors. Compose from `ActionPrimary` and the border token.

---

# Hard Rules

## Every declaration cites a token

Color, spacing, radius, font size, elevation.

If a declaration contains a literal, it needs a reason in a comment, and the
reason may not be "no token matched."

---

## Static styling lives in StyleSheet

Not in inline `style={{…}}` props.

`StyleSheet.create` is registered once; an inline object allocates a new one every
render and re-crosses the bridge. On the low-end Android hardware this app runs
on inside a long survey form, that is a real cost, not a theoretical one.

The only legitimate inline style is a genuinely dynamic value — `{ width: pct }`
— limited to the dynamic property alone. Everything static around it moves to the
`StyleSheet`, and composes as an array: `style={[styles.bar, { width: pct }]}`.

---

## Both themes, always

Light and dark both exist and both ship. `ThemeContext` and `createTheme(mode)`
switch them at runtime.

A change verified only in light is unverified.

`useTheme()` makes this automatic. A module-scope `getTokens('light')` and any
literal make it a bug you find later, on someone else's device.

---

## Contrast and touch targets are not negotiable

Field use, outdoors, in sunlight, one-handed.

- Body text on a surface must clear **4.5:1**; large text and UI chrome, **3:1**.
- Interactive targets get **44×44pt minimum**, via padding or `hitSlop`.
- The `Xxxs`/`Xxs` spacing tokens (1px, 2px) are for hairlines and optical
  nudges. They are never the padding that produces a hit target.

---

## Color is never the only signal

State needs a second channel — an icon, weight, shape, or text.

This matters most for the states that carry data-loss risk: offline vs. synced,
saved-locally vs. saved-to-server, validation errors. A red border alone is not
an error state.

---

## No CSS framework, no styling library

This project styles with React Native `StyleSheet` and react-native-paper,
deliberately. Do not introduce styled-components, tailwind-rn, nativewind, or a
project-local styling abstraction.

---

# Code Review Philosophy

Be uncompromising about values. Be flexible about everything else.

Push back on changes that:

- introduce a hex, rgba, or bare number in a style
- add a static inline style object
- read a resolved token value and paste it as a literal
- invent a token name that does not exist (check the package, not the mock)
- use `BorderRadiusMedium`, or a named typography size — neither exists
- put `tkDliteSemanticElevation*` directly into an RN style (it is a CSS string)
- set colors from a module-scope `getTokens('light')`
- add a new importer of `theme/spacing.js`, `theme/typography.js`, or
  `theme/colors/`
- ship an interactive element under 44×44pt
- signal state with color alone
- add a styling library or abstraction layer

Do not push back on:

- composing tokens to reach a value the set does not define
- a `TODO(dlite)` breadcrumb
- accepting a small visual difference to stay on-system
- `getTokens('light')` at module scope for spacing and radius only

The second list is the system working, not the system being bent.

---

# Common Bad Suggestions

❌ "There's no token for this, so I'll use `#2a2a2a`."

Compose it. Primitives and the neutral ramp exist.

---

❌ "It's only 2px off the scale."

Then it is a magic number that will not move when the scale does.

---

❌ "I'll read the token's value and inline it."

Hard-coding with extra steps. Breaks dark mode immediately.

---

❌ "Inline style is faster to write."

Faster to write once. Slower to change forever — and it re-allocates every
render inside a scrolling survey form.

---

❌ "`t.semantic.color.text.primary`."

The API is flat. That is `undefined`, React Native drops it silently, and the
style just does not apply. `t.tkDliteSemanticColorTextPrimary`.

---

❌ "The test passes, so the token exists."

`__mocks__/styleDictionaryTokens.js` ships names the real package does not.
Resolve against `node_modules/style-dictionary-dlite-tokens/dist/rn/puente/default`.

---

❌ "I'll add a new token."

You do not own the token package's release cycle. Compose locally, leave a
breadcrumb, keep moving.

---

❌ "`spacing.md` from `theme/spacing.js` is the same thing."

It is 12. `tkDliteSemanticSpacingMd` is 16. The legacy scale is a shadow system
with different values.

---

❌ "Design tokens are over-engineering for a small team."

A small team is where drift is *least* likely to be caught, because there is no
second reviewer.

---

# What Good Looks Like

Prefer changes that:

- replace a literal with a token
- collapse three near-identical values into one token
- compose a missing value from existing tokens
- move static styling out of inline props into `StyleSheet`
- make a screen correct in both themes at once
- migrate a file off the legacy `theme/spacing.js` scale while you are in it
- raise a touch target or a contrast ratio that was short

Be skeptical of changes that:

- add an abstraction layer over `StyleSheet`
- introduce a styling library
- create project-local constants that shadow tokens
- special-case one component

---

# Compliance Policy

Never describe styling as:

- on-system
- token-compliant
- consistent
- themed

without naming the tokens.

Every styling claim should include:

- the token used
- why it, and not a neighbour
- what it resolves to in both themes, when that matters

If it cannot be traced to a token name,

it is not on-system.

---

# Auditing

## When to run it yourself

- Editing a `StyleSheet.create({…})` block or an `index.styles.js`.
- Adding an inline `style={{…}}` prop.
- Reviewing a diff touching `domains/`, `modules/`, `impacto-design-system/`,
  or `context/`.
- Someone asks "is this using dlite tokens?" or "audit the styling."

## Procedure

```bash
# Hard-coded hex colors
grep -rn "#[0-9a-fA-F]\{3,8\}" domains/ modules/ impacto-design-system/ context/ --include="*.js"

# Hard-coded rgb/rgba
grep -rn "rgba\?(" domains/ modules/ impacto-design-system/ context/ --include="*.js"

# Magic spacing on layout properties
grep -rnE "(padding|margin)(Top|Bottom|Left|Right|Horizontal|Vertical)?: [0-9]|gap: [0-9]" domains/ modules/ impacto-design-system/ context/ --include="*.js"

# Hard-coded radius and font size
grep -rnE "borderRadius: [0-9]|fontSize: [0-9]" domains/ modules/ impacto-design-system/ context/ --include="*.js"

# Token names that do not exist in the real package
node -e "const t=require('./node_modules/style-dictionary-dlite-tokens/dist/rn/puente/default/index.js');const real=new Set(Object.keys(t.light));const used=require('child_process').execSync(\"grep -rhno 'tkDlite[A-Za-z0-9]*' --include='*.js' domains modules impacto-design-system context | sed 's/.*://' | sort -u\").toString().trim().split('\n');const bad=used.filter(u=>!real.has(u));console.log(bad.length?'MISSING:\n'+bad.join('\n'):'all token names resolve')"
```

Skip these paths — they are definitions, not consumers:

- `modules/theme/tokens.js`
- `modules/theme/colors/`, `spacing.js`, `typography.js` (legacy definitions)
- `modules/utils/animations.js` (motion layer)
- `__mocks__/`

For each hit, resolve whether a token covers it. If yes, replace. If no, compose
and breadcrumb.

## Output format

Lead with a one-line verdict, then one line per finding:

```
clean | N violations | dlite token bug found

<file:line> — <rule> — <token to use, or how it was composed>
```

Group **"use a token instead"** separately from **"the token itself is broken."**
They get fixed in opposite places — the call site vs. the
`style-dictionary-dlite-tokens` package.

## The mechanical agents

| Agent | Layer |
| --- | --- |
| `dlite-auditor` | Colors, spacing, radius, font size |
| `motion-auditor` | Duration, easing, scale, reduced-motion |
| `mobile-delight-auditor` | Haptics, empty states, copy, offline reassurance |

`ux-review` orchestrates all three and synthesizes one fix plan. Run it when a
screen is complete — not at the end of the project.

Verify with `visual-qa` when a change is meant to look different. A token swap
that renders wrong is still wrong.

---

# Non-Goals

Do not gold-plate. A screen that is on-system and plain beats one that is bespoke
and beautiful, because the plain one survives the next theme change.

Do not open a repo-wide migration off the legacy scales as a side effect of an
unrelated task. Migrate what you touch.

---

# Default Mental Model

When making recommendations, assume:

- semantic tokens first, primitives second, composition third
- the token API is flat camelCase
- `useTheme()` for color, `getTokens()` for spacing and radius
- `StyleSheet` for everything static
- both themes, every time
- contrast and touch targets are correctness, not polish
- composition beats invention
- a breadcrumb beats a blocked task
- a raw value is never the answer

Do not invert these.
