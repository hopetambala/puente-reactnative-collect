# CI/CD: Linter Checks

This document describes the automated checks for the Motion Design System and i18n translation coverage.

## Overview

Linters run as **independent checks**:

1. **GitHub Actions CI** — Runs on every push and pull request
2. **Local Pre-commit Hook** — Runs before commits (optional, but recommended)

## GitHub Actions Workflows

### Animation Linter (`.github/workflows/lint-animations.yml`)

✅ **Runs on:** Every push to `master`, `develop` + all PRs  
✅ **Check:** `yarn lint:animations`  
✅ **Fails if:** Any animation violations detected

**What it validates:**
- No hardcoded animation durations
- No inline spring configurations
- No layout properties being animated
- No misuse of `spring.playful` token

**View results:** GitHub Actions tab on PR page

### i18n Linter (`.github/workflows/lint-i18n.yml`)

✅ **Runs on:** Every push to `master`, `develop` + all PRs  
✅ **Check:** `yarn lint:i18n`  
✅ **Fails if:** Any hardcoded user-facing string detected (exit code 1 on errors, warnings-only exits 0)

**What it validates:**
- No `<Text>` elements with raw string children (not wrapped in `I18n.t()`)
- No `title=`, `placeholder=`, `label=`, `accessibilityLabel=` props with string literals
- Screen components that render JSX but never import `@modules/i18n` (warning)

**Suppress a line** (use sparingly):
```jsx
{/* lint-i18n-ignore */}
<Text>Internal debug string</Text>
```

**View results:** GitHub Actions tab on PR page

### Tests (`.github/workflows/tests.yml`)

✅ **Runs on:** Every push to `master`, `develop` + all PRs  
✅ **Checks:**
  - Unit tests: `yarn test:unit`
  - Integration tests: `yarn test:integration`
  - Snapshot tests: `yarn test:snapshot`
  - Coverage report uploaded to Codecov

---

## Local Development

### Run Animation Linter Locally

```bash
# Check for violations
yarn lint:animations

# Get hints for fixes
yarn lint:animations:hints
```

### Run i18n Linter Locally

```bash
# Check for hardcoded strings (CI mode — errors only block)
yarn lint:i18n

# Summary view (per-file counts)
yarn lint:i18n:summary
```

### Check Locale Sync Locally

```bash
# Check all locale files are in sync with en.json
yarn lint:locale-sync

# Also show orphaned keys (in locale but not in en.json)
yarn lint:locale-sync:orphans

# Check for verbatim English strings in localized files (runs in CI)
yarn lint:locale-sync:verbatim
```

### Setup Pre-commit Hook (Optional)

Install a local Git hook that runs the animation linter before every commit:

```bash
bash scripts/setup-hooks.sh
```

This prevents commits with animation violations. To bypass:

```bash
git commit --no-verify
```

---

## Adding New Animations

When adding animations to components:

1. ✅ Use only tokens from `MOTION_TOKENS` (no hardcoded values)
2. ✅ Use GPU-only properties (transform, opacity) — no layout animations
3. ✅ For CTA buttons use `spring.snappy`, secondary use `spring.tight`
4. ✅ Avoid `spring.playful` except for celebration moments

### Example ✅ Correct

```javascript
import { MOTION_TOKENS } from "@modules/utils/animations";
import Animated, { Keyframe } from "react-native-reanimated";

const CardEntrance = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.95 }] },
  100: { opacity: 1, transform: [{ scale: 1 } ]}
});

export function MyCard() {
  return (
    <Animated.View 
      entering={CardEntrance.duration(MOTION_TOKENS.duration.base)}
    >
      {children}
    </Animated.View>
  );
}
```

### Example ❌ Incorrect

```javascript
// ❌ Hardcoded duration
entering={ZoomIn.duration(300)}

// ❌ Inline spring
withSpring(scale, { damping: 10, stiffness: 100 })

// ❌ Animating layout property
{ height: withTiming(newHeight) }

// ❌ Misusing playful spring
usePressAnimation({ releaseSpring: MOTION_TOKENS.spring.playful })
```

---

## CI Workflow

### On Pull Requests

1. **Animation Linter** runs first (independent check)
2. **Tests** run in parallel (unit, integration, snapshots)
3. PR is blocked if any check fails
4. All checks must pass before merge

### On Commits to Main

Same checks run. Failed checks block deployment.

### Bypassing Checks (Emergency Only)

```bash
# Skip both checks (use only for hotfixes)
git push --force-with-lease

# OR locally bypass pre-commit for a single commit
git commit --no-verify
```

---

## Troubleshooting

### "Property 'MOTION_TOKENS' doesn't exist"

**Fix:** Add the missing import:
```javascript
import { MOTION_TOKENS } from "@modules/utils/animations";
```

### Animation violations fail CI

**Fix:** Run locally to see details:
```bash
yarn lint:animations
```

Then update animations to use `MOTION_TOKENS` and GPU-safe properties.

### Pre-commit hook not running?

**Reinstall:**
```bash
bash scripts/setup-hooks.sh
```

### Need to skip pre-commit temporarily?

```bash
git commit --no-verify
git push
```

(But fix the violations before the next commit!)

---

## Updating the Linter

The animation linter is in `scripts/lint-animations.js`. To modify validation rules:

1. Edit `scripts/lint-animations.js`
2. Test locally: `yarn lint:animations`
3. Update this doc if rules change
4. Commit and push — CI will use the new rules

---

## Contact

For questions about Motion Design System checks, see:
- [Motion Design System Spec](../docs/MOTION_DESIGN_SYSTEM.md)
- [Animation Rules](../modules/utils/animationRules.js)
- [Animation Modules](../modules/utils/animations.js)
