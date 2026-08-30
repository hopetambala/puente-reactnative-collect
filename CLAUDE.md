# Puente Collect — CLAUDE.md

Community health data collection app for field workers (promotores de salud).
Built with Expo / React Native. Talks to a Parse/Back4App backend. Offline-first:
data entered without a connection is saved locally and syncs when reconnected.

---

## Commands

```bash
yarn ios                          # run on iOS simulator (dev env)
EXPO_PUBLIC_APP_ENV=staging APP_ENV=staging yarn ios  # staging backend (needed for login)
yarn android                      # run on Android emulator
yarn test                         # jest watch mode
yarn test-run                     # one-shot Jest run (unit + snapshot; integration excluded by global jest config)
yarn test-all:parallel            # full suite — unit + integration + snapshot in parallel
yarn test:unit                    # unit tests only (excludes *.integration.test.js)
yarn test:integration             # integration tests only
yarn lint-fix                     # ESLint auto-fix
yarn lint:animations              # animation system lint (checks for token violations)
yarn lint:theme-imports           # design token import lint
yarn build-submit-ios             # create expo build, then submit that latest build to testflight
```

## Directory structure

```
domains/          # Feature domains — one folder per screen/flow
  Auth/
  DataCollection/ # Forms and survey data entry (the core workflow)
  FindRecords/    # Search and retrieve saved records
  Assets/
  HomeScreen/
  Onboarding/
  Settings/
modules/          # Shared utilities and systems
  theme/          # Design tokens (dlite) — tokens.js, colors/, spacing.js, typography.js
  utils/          # Animation system — animations.js, animationRules.js
  offline/        # Offline queue and sync logic
  i18n/           # Translations — english/en.json is the source
  settings/
  geolocation/
impacto-design-system/  # Local component library (Base/, Cards/, Extensions/, etc.)
context/          # React contexts — auth, offline, alert, theme, accessibility
services/         # Backend integrations — parse/, aws/, tasky/
__mocks__/        # Global jest mocks
```

## Path aliases

Defined in `babel.config.js` (`module-resolver`, runtime), mirrored in `jsconfig.json` (editor) and `package.json` (Jest `moduleNameMapper`):

| Alias | Resolves to |
|---|---|
| `@modules/*` | `modules/*` |
| `@context/*` | `context/*` |
| `@assets/*` | `assets/*` |
| `@impacto-design-system/*` | `impacto-design-system/*` |
| `@app` | `.` (repo root — use as `@app/some/path`) |

## Environment

Three environments: `dev` (default), `staging` (Back4App — use this for anything requiring a real login), `prod`.

Config lives in `environment.js` (git-ignored, copy from `environment-example.js`).
The example config points all three environments at `https://parseapi.back4app.com/`;
a local dev setup may override `dev` to point at a local Parse server.

The mobile Parse SDK cannot use the Master Key — never use `masterKey` in app code.
Use `equalTo`, `limit`, `find` on queries; never `distinct`.

### Scoping a query by organization: `containedIn`, never `equalTo`

Records carry the `surveyingOrganization` string that was **collected**, and one
organization's records are spread across every string it has ever been called.
Measured in production 2026-08-29:

| Organization | Rows under one string | Rows that exist |
|---|---:|---:|
| `dr-missions` | 11 under `DR Missions` | 633 (611 are `DRMT`) |
| `rayjon` | 185 under `Rayjon` | 1569 (1196 are `Rayjon Eye Clinic`) |

`equalTo` on a single string showed those surveyors 1% and 11% of their own
organization's data, with no error. It also hid custom forms — and **a surveyor
cannot fill in a form they cannot see**, so this blocks collection, not just
viewing.

Resolve the set first, then use `containedIn`:

```js
import { loadOrganizationScope } from "@modules/organization";

const organizationValues = await loadOrganizationScope(user.organization);
query.containedIn("surveyingOrganization", organizationValues);
```

`loadOrganizationScope` caches to AsyncStorage so it still resolves offline, and
falls back to `[organization]` on any failure — it narrows, never blanks. The
matcher is deliberately identical to the resolvers in `puente-node-cloudcode`
and `puente-react-nextjs-platform`; if the three diverge, the three systems
disagree about who owns a record.

---

## Testing

### Standing rule: test first, always

No production behavior changes without a test that was seen failing first.
This applies to new features and bug fixes equally. Use the `red-green-tdd` skill.

### Test location

Tests live adjacent to their source in a `__tests__/` folder:
```
domains/DataCollection/index.js
domains/DataCollection/__tests__/DataCollection.unit.test.js
```

Integration tests use `.integration.test.js` and are excluded from `yarn test:unit`.

### Running the app end to end — use Maestro, do not hand-drive the simulator

**There is already an E2E harness. Look for it before building anything.**

```bash
# 1. Metro, in the environment you want to exercise:
APP_ENV=prod EXPO_PUBLIC_APP_ENV=prod ./node_modules/.bin/expo start --clear

# 2. Then a flow (credentials are already in the yarn script):
yarn maestro .maestro/authenticated.yaml
```

Flows live in `.maestro/`. `authenticated.yaml` signs in and walks Home → Data
Collection → Find Records → Assets → Settings, screenshotting each into
`.claude/screenshots/`. `organization-scope.yaml` is the regression flow for
organization scoping. There are also five `offline-*` flows,
`find-records-history.yaml`, `resident-id-form.yaml` and `visual-qa.yaml`.

Prerequisites: a booted simulator with the app installed. The bundle id is
`io.ionic.starter1270348` — **not** a puente-prefixed one.

**Never symlink `node_modules` into a git worktree.** `.gitignore` used
`node_modules/`, and a trailing slash matches a directory but **not a symlink** —
so `git add -A` committed one, and checking that branch out replaced a real
`node_modules` with a self-referential link and destroyed the install. The
pattern is fixed, but do not recreate the shape.

### Global mocks (already in `jest.setup.js` — do not re-mock these)

These are set up globally and available in every test file:
- `@react-native-async-storage/async-storage` — in-memory store
- `react-native-reanimated` — stubbed (animations are no-ops)
- `react-native-gesture-handler` — passthrough wrappers
- `react-native-safe-area-context` — zero insets
- `@app/context/alert.context` — jest.fn() stubs
- `@impacto-design-system/Base` — renders children; Button renders a TouchableOpacity
- `@impacto-design-system/Extensions` — PaperInputPicker renders a real TextInput
- `expo-camera` — stubbed CameraView

### Per-test mock conventions (match neighboring tests exactly)

```js
// Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

// Parse
jest.mock('parse/react-native', () => ({
  Query: jest.fn().mockImplementation(() => ({
    equalTo: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  })),
  Object: { extend: jest.fn(() => class { save() { return Promise.resolve(this); } }) },
  User: { current: jest.fn() },
}));

// react-native-paper (flat colors, no theme provider needed)
jest.mock('react-native-paper', () => {
  const mockColors = { primary: '#000', background: '#fff', text: '#000' };
  return {
    useTheme: () => ({ colors: mockColors }),
    Provider: ({ children }) => children,
    // add specific components as needed
  };
});

// UserContext (wrap components that read auth state)
import { UserContext } from '@app/context/auth.context';
const mockUser = { objectId: 'test-user', organization: 'test-org' };
render(<UserContext.Provider value={mockUser}><ComponentUnderTest /></UserContext.Provider>);
```

---

## Releases and EAS

### The release gate — run the Maestro harness BEFORE every release, always

**No release is cut without an E2E pass on the harness. Ever.** Unit tests
green, lint clean and CI green are not a release gate on a mobile app: none of
them execute the screen a surveyor actually touches, and the cost of being wrong
is a store round-trip measured in days, not a revert measured in minutes.

It is two steps, and skipping the first is the usual mistake — without Metro the
app has no JS bundle, every assertion fails, and the run looks like a
regression:

```bash
# 1. Metro FIRST, in the environment you want to exercise
APP_ENV=prod EXPO_PUBLIC_APP_ENV=prod ./node_modules/.bin/expo start --clear

# 2. Then the flows (credentials are already in the yarn script)
yarn maestro .maestro/authenticated.yaml
yarn maestro .maestro/organization-scope.yaml
```

Before running, confirm the simulator actually has the build under test:

```bash
xcrun simctl listapps <device-udid> | grep io.ionic.starter1270348
```

**The bundle id is `io.ionic.starter1270348`** — grepping for `puente` or
`collect` finds nothing and will convince you the app is missing when it is not.
If the build predates your change, `npx expo run:ios` first; a green flow
against a stale binary proves nothing.

Run the flows that cover what you touched, plus `authenticated.yaml` as the
smoke test. If a flow for your change does not exist, **write one** — the signup
organization picker was broken for four and a half years partly because
`.maestro/` had no registration flow and no test referenced `AutoFill`.

### Releases are cut LOCALLY, not from CI

**Use `yarn build-submit-ios`** — it is in the Commands block at the top of this
file, and it is the whole release. It expands to
`eas build --platform ios --non-interactive && eas submit -p ios --latest
--non-interactive`. Siblings: `build-submit-android`, `build-submit-all`, and
`submit-apps` (submits an already-built artifact without rebuilding).

Do not reconstruct these from raw `eas` flags. They exist so nobody has to.

The GitHub `EAS Build` workflow has **never** succeeded. Do not reach for it as
"the" release path and do not conclude the pipeline is broken when a local build
works fine — those are different paths.

### `.easignore` is why gitignored files still reach the build

`environment.js` and `app.json` are **deliberately** gitignored — credentials do
not belong in git. They still reach EAS because **`.easignore` exists, and when
it does EAS uses it INSTEAD of `.gitignore`** to decide what to upload. It does
not exclude them, so a local `eas build` ships them.

This is the single most misread thing about this repo's release setup:

- **Local build** — `environment.js` is on disk, `.easignore` lets it through. Works.
- **CI build** — the runner checks out from git, so the file never exists on
  disk at all. `.easignore` cannot include what is not there, and the build dies
  in the `Bundle JavaScript` phase with
  `Unable to resolve module ../../../environment`.

If you ever do fix CI, the fix is to generate `environment.js` on the runner —
and it must use PRODUCTION Parse credentials. The existing `PARSE_APP_ID` /
`PARSE_JAVASCRIPT_KEY` secrets are the TEST app: `preview.yaml` builds its
config from them with `TEST_MODE: true` and `puente-test-logs`. Shipping a
TestFlight build pointed at staging means surveyors collecting into the wrong
database.

### Node version

`eas-cli@latest` requires Node >= 22; `.nvmrc` pins 20.19.6. Run `nvm use 22` (or
newer) before any `eas` command, or yarn aborts with
`@oclif/plugin-autocomplete ... Expected version ">=22.0.0"`.

### Version bumping — use the scripts, never edit versions by hand

```bash
yarn release-patch   # or release-minor / release-major
```

That is the whole bump. `standard-version` bumps `package.json`, and its
`postbump` hook (`scripts/update-version/versionNumber.js`, wired in
`.versionrc.js`) propagates the version to **every** file that has to agree:

| File | What it gets |
|---|---|
| `app.json` → `version` | the version string — **the TRAIN Apple gates on** |
| `app.json` → `ios.buildNumber` | the same string |
| `app.json` → `android.versionCode` | `490` + zero-padded major/minor/patch, monotonic |
| `ios/Collect/Info.plist` | both `CFBundleShortVersionString` and `CFBundleVersion` |

**Do not hand-edit any of these.** Five files that must agree is exactly the
shape that drifts. If the script is missing something, fix the script and add a
test — `scripts/update-version/__tests__/` — so the next release inherits the
fix. That is what happened for `Info.plist`, which was hand-edited every release
until 15.7.0 and was therefore occasionally stale.

**Pick the right bump.** The version string is the train Apple gates
submissions on: a higher *build number* does not help if the train is closed.
That is what got build `90186` rejected. A new capability is a **minor**.
---

## Design system

Design tokens live in `modules/theme/tokens.js`, wrapping
`style-dictionary-dlite-tokens/rn/puente/default`.

```js
import { getTokens } from '@modules/theme/tokens';
const t = getTokens('light');

// The token object is FLAT camelCase — there is no nested `t.semantic.*` path.
t.tkDliteSemanticColorTextPrimary   // '#161616'
t.tkDliteSemanticColorSurfaceBase   // '#ffffff'
t.tkDliteSemanticSpacing400         // 16  (numeric scale preferred)
t.tkDliteSemanticBorderRadiusMd     // 8   (Sm/Md/Lg/Full — not Medium)
```

Inside components, prefer `useTheme()` from react-native-paper for colors — its
`colors.*` palette is mapped from these tokens in `modules/theme/index.js` and is
theme-reactive. Use `getTokens()` directly for spacing, radius, and font size.

Never hard-code hex colors, numeric spacing, or borderRadius values in StyleSheets.
The `dlite-design-system-engineer` skill enforces this.

The mock for tests lives in `__mocks__/styleDictionaryTokens.js`. It ships some
token names the real package does not — a green test is not proof a token exists.

## Animation system

Tokens and hooks in `modules/utils/animations.js`.
Spring helpers and validation in `modules/utils/animationRules.js`.

```js
import { MOTION_TOKENS } from '@modules/utils/animations';
import { getSpringForComponent } from '@modules/utils/animationRules';

// Always use tokens, never hardcode damping/stiffness/duration:
withSpring(1, getSpringForComponent('BUTTON'))
withTiming(1, { duration: MOTION_TOKENS.duration.base })
```

Scale must never exceed 1.2. Use `react-native-reanimated` only — never `moti`,
`framer-motion`, or the built-in `Animated` API.
The `motion-auditor` agent enforces this.

---

## Skills and agents

This project uses Claude Code skills and agents in `.claude/`:

| Skill | When to use |
|---|---|
| `red-green-tdd` | Any new function, component, hook, or bug fix — test first |
| `dlite-design-system-engineer` | Any StyleSheet or inline style change |
| `product-manager` | Scoping, PRDs, prioritization — what to build and why |
| `ux-review` | When a screen or component is complete — runs dlite-auditor, motion-auditor, mobile-delight-auditor |
| `visual-qa` | Screenshot the iOS simulator to verify visual correctness |

The `skill-eval` hook fires before every response and forces evaluation of each skill.
Do not skip it.

### Agents invoked by skills

| Agent | Role |
|---|---|
| `tdd-test-writer` | Writes one failing test (RED phase) |
| `tdd-implementer` | Writes minimum code to pass (GREEN phase) |
| `tdd-refactorer` | Cleans up without changing behavior (REFACTOR phase) |
| `dlite-auditor` | Finds and fixes token violations |
| `motion-auditor` | Finds and fixes animation violations |
| `mobile-delight-auditor` | Finds and fixes UX delight gaps (haptics, copy, empty states) |

---

## Offline capability

Offline state is managed via `context/offline.context.js`. When a user saves
a record offline it goes into an async-storage queue; `modules/offline/` handles
the sync queue.

When writing data-collection code:
- Always check offline context before deciding how to save
- Distinguish "saved offline" from "saved to server" in all user-facing copy
- Never clear form data on a sync/save error — the user's work must survive

## i18n

String source of truth: `modules/i18n/english/en.json`.
`yarn lint:locale-sync` checks for orphaned or missing keys across locales.
Maestro visual-qa flows use English on-screen labels — keep them in sync with `en.json`.
