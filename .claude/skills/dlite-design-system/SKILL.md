---
name: dlite-design-system
description: >
  Use when writing, reviewing, or refactoring any UI styling in Puente Collect —
  building a screen/domain, adding a component, or editing any StyleSheet.
  Enforces use of the dlite design tokens from `modules/theme/tokens.js`
  (which wraps `style-dictionary-dlite-tokens/rn/puente/default`) instead of
  hard-coded color, spacing, or radius values. Also flags when a dlite token is
  wrong, missing, or degrading the experience so it gets fixed in the token
  source, not worked around.
---

# dlite tokens — use them in StyleSheet, don't hard-code values

This skill is about the **dlite design tokens** for React Native, exposed through
`modules/theme/tokens.js`. They come from
`style-dictionary-dlite-tokens/rn/puente/default` (light/dark variants).

The rule: **style with dlite tokens. Don't hard-code values the system already
defines. If a token is missing or broken, flag it — don't quietly route around it.**

---

## How to use tokens in this project

```js
import { getTokens } from '@modules/theme/tokens';

// Inside a component or StyleSheet factory:
const t = getTokens('light'); // or use the theme context / useTheme()

const styles = StyleSheet.create({
  container: {
    backgroundColor: t.semantic.color.surface.base,
    padding: t.semantic.spacing.md,
    borderRadius: t.semantic.borderRadius.md,
  },
  title: {
    color: t.semantic.color.text.primary,
  },
});
```

Use **semantic** tokens by default — they carry intent and adapt correctly to
light/dark mode. Drop to **primitive** tokens only when no semantic token fits.

---

## When to apply this skill

- Writing or editing a `StyleSheet.create({…})` block.
- Adding inline `style={{…}}` props in JSX (static values only — keep dynamic
  values like `{ width: pct }` inline; everything else moves to `StyleSheet`).
- Reviewing a diff that touches `domains/`, `modules/`, or
  `impacto-design-system/`.
- A user asks "is this using dlite tokens?", "audit the styling", etc.

### Audit approach

To find hard-coded styling violations, grep the touched files for:

```
# Hard-coded hex colors
grep -n "#[0-9a-fA-F]\{3,8\}" domains/

# Hard-coded rgba/rgb colors
grep -n "rgba\?\s*(" domains/

# Likely magic spacing — px values inside StyleSheet objects
grep -n ":\s*[0-9]\+," domains/
```

For each hit, check whether `modules/theme/tokens.js` already exposes an
equivalent token. If yes, replace; if no, flag it (see "Flagging" below).

---

## Token categories (semantic — prefer these)

| Category | Path on token object |
|---|---|
| Text color | `semantic.color.text.{primary,secondary,tertiary,onPrimary,onBrand}` |
| Surface/background | `semantic.color.surface.{base,raised,sunken,overlay}` |
| Action color | `semantic.color.action.{primary,secondary}` |
| Feedback | `semantic.color.feedback.{success,danger,warning,info}` |
| Border / muted | `semantic.color.{border,muted}` |
| Spacing | `semantic.spacing.{xxxs,xxs,xs,sm,md,lg,xl,xxl,xxxl}` |
| Border radius | `semantic.borderRadius.{sm,md,lg,full}` |
| Elevation / shadow | `semantic.elevation.{low,medium,high}` |
| Typography size | `semantic.typography.size.*` |

Primitive tokens (fallback only) follow the same JS structure under `primitive.*`.

```js
// ❌ hard-coded
color: '#1e1d1a',
padding: 16,
borderRadius: 8,

// ✅ dlite tokens
color: t.semantic.color.text.primary,
padding: t.semantic.spacing.md,
borderRadius: t.semantic.borderRadius.md,
```

---

## Anti-patterns — what counts as "custom"

1. **Raw hex / rgb colors** in `StyleSheet` → a `semantic.color.*` or
   `primitive.color.*` token.
2. **Magic numeric spacing** (`padding`, `margin`, `gap`) → `semantic.spacing.*`.
3. **Hard-coded `borderRadius`** → `semantic.borderRadius.*`.
4. **Static inline `style={{…}}`** with fixed values → move to `StyleSheet` using
   tokens. (Genuinely dynamic values like `{ width: pct }` are the only
   legitimate inline styles — keep them to the dynamic property only.)

---

## Flagging a broken or missing token

Using dlite tokens is the goal — **but not blindly**. If a token resolves to the
wrong value, a needed token is missing, or applying one visibly degrades the UI,
the right move is to **flag it**, not to hard-code a workaround.

Surface it when:
- A token's value looks wrong — confirm by checking `__mocks__/styleDictionaryTokens.js`
  or the installed package values.
- The design needs a value the token set doesn't cover (a missing shade, spacing
  step, etc.).
- Applying a token breaks layout or produces the wrong visual result.

**How to flag:**
1. Name the exact token path and the file where it's used.
2. Describe the defect concretely (expected vs. actual).
3. State the impact (which screen/domain degrades, how badly).
4. Recommend the fix at the **token source** (`style-dictionary-dlite-tokens`)
   so every consumer benefits — not a local hard-coded override.
5. Only if an upstream fix is out of scope right now: add a
   `// TODO(dlite): <issue>` at the call site with the smallest local workaround,
   and report it to the user. Never let a silent hard-coded value become the norm.

---

## Output when auditing

Lead with a one-line verdict (`clean` / `N violations` / `dlite token bug found`).
Then, per finding:

```
<file:line> — <rule> — <dlite token to use, or escalation>
```

Group "use a dlite token instead" violations separately from "the dlite token
itself is broken" findings — they get fixed in opposite places (the call site vs.
the `style-dictionary-dlite-tokens` package).
