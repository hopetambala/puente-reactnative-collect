# Puente Collect — agent guide

Community health data collection app for field workers (promotores de salud).
Built with Expo / React Native. Talks to a Parse/Back4App backend. Offline-first:
data entered without a connection is saved locally and syncs when reconnected.

This file is read by every coding agent on the repo: Claude Code reads
`CLAUDE.md`, and Codex and Cursor read `AGENTS.md`, which is a symlink to it.
**Edit `CLAUDE.md`**; never replace the symlink with a copy, or the two drift.
The "Skills and agents" section is Claude Code–specific; other agents can read
`.claude/skills/*/SKILL.md` as plain instructions.

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
yarn release-patch                # bump the version; MERGING that PR is the iOS release (CI builds it)
yarn build-submit-ios             # what CI runs; run it locally when Actions can't (billing, outage)
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
yarn start:prod-clear      # or start:staging-clear

# 2. Then a flow (credentials are already in the yarn script):
yarn maestro .maestro/authenticated.yaml
```

Flows live in `.maestro/`. `authenticated.yaml` signs in and walks Home → Data
Collection → Find Records → Offline Sync → Settings, asserting each arrival and
screenshotting into `.claude/screenshots/`. `organization-scope.yaml` is the
regression flow for organization scoping. There are also five `offline-*` flows,
`find-records-history.yaml`, `resident-id-form.yaml`,
`signup-organization-picker.yaml` and `visual-qa.yaml`.

**There is no Assets tab.** The bottom navigator is Find Records, Data
Collection, Home, Offline, Settings; `domains/Assets` is deep-link only. A flow
that tapped `"70%, 94%"` called it Assets and screenshotted Offline Sync as
`07-assets.png` for the life of the flow, staying green throughout — a
coordinate tap cannot fail and a screenshot never fails.

**Write flows against ids, and assert every arrival.** Sign-in and tab
navigation are in `.maestro/subflows/`; reuse them rather than pasting a fourth
copy of the login preamble:

```yaml
- runFlow: subflows/login.yaml
- runFlow:
    file: subflows/open-tab.yaml
    env:
      TAB_ID: "tab-offline"     # tab-{find-records,data-collection,home,offline,settings}
      EXPECT: "Offline Sync"
```

`yarn lint:maestro` (also in `yarn lint:all`) rejects tab-bar coordinate taps,
flows that never assert, and dangling subflow references. Before trusting a new
flow, run it five times — a flow that passed once has been shown to pass once:

```bash
yarn maestro:stability .maestro/authenticated.yaml 5
```

See `.maestro/README.md` for the tab table and the full rationale.

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

## Use the package.json scripts. Always.

Every routine operation here has a script: `start:prod-clear`,
`start:staging-clear`, `maestro`, `test:unit`, `test:integration`,
`release-patch|minor|major`, `build-submit-ios`. **Run the script, never the raw
command it wraps.** The scripts carry env vars, credentials and flags that are
easy to get subtly wrong and hard to notice when you do — a hand-rolled
`expo start` without `APP_ENV` silently points the app at the wrong backend, and
a hand-edited version file silently ships stale store metadata.

**If a script is missing something, fix the script and add a test**, so the next
person inherits the fix instead of repeating the workaround. That is how
`ios/Collect/Info.plist` got into the version bump.

### Test organizations — use them, do not invent names

There are real test organizations in production for exercising functionality.
`internal-test` is the junk bucket, and it carries deliberately broad aliases —
`testORG`, `Test`, `Xyz`, `Abc`, `Orgs`. Two consequences worth knowing before
you test anything organization-related:

- **`testOrg1`, `testOrg2` and friends will be REFUSED at signup.** Normalised,
  they contain `testorg`, so the near-duplicate guard routes them to staff. That
  is the guard working, not a bug.
- Because `Test` is only four characters, **any organization name containing
  "test" is refused** the same way. Pick a clearly distinct name when you need a
  create to succeed.

The Maestro credentials (`PARSE_USERNAME=Test`, `PARSE_PASSWORD=test`) are
already in the `maestro` script — that account belongs to the `internal-test`
bucket, which is why the org-scope flow asserts against its alias set.

---

### The release gate — run the Maestro harness BEFORE every release, always

**Run it before you merge the version-bump PR** — that merge starts the build
(see "How a release runs" below), so there is no later moment to run it.

**No release is cut without an E2E pass on the harness. Ever.** Unit tests
green, lint clean and CI green are not a release gate on a mobile app: none of
them execute the screen a surveyor actually touches, and the cost of being wrong
is a store round-trip measured in days, not a revert measured in minutes.

It is two steps, and skipping the first is the usual mistake — without Metro the
app has no JS bundle, every assertion fails, and the run looks like a
regression:

```bash
# 1. Metro FIRST, in the environment you want to exercise
yarn start:prod-clear      # or start:staging-clear

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

### How a release runs — merging the version bump IS the iOS release

iOS releases run in GitHub Actions (`.github/workflows/release-ios.yml`).
Merging a PR into `master` that changes `package.json`'s `version` starts one;
other `package.json` edits do not. The whole flow:

1. **Before merging the bump:** the Maestro release gate above has passed, and
   `store/testflight/<version>.txt` holds focused "What to Test" notes for
   testers. The release refuses to start without that file.
2. **Bump and merge:** `yarn release-patch|minor|major` on a branch, open a PR,
   merge it. That merge is the release. Do not also build locally unless CI
   could not run (see below).
3. **CI runs `yarn build-submit-ios`** (`scripts/release/buildSubmitIos.js`) on
   a fresh checkout of master:
   - preflight: clean merged master, every version file agrees, and the version
     is newer than the live App Store version;
   - `eas metadata:lint`, then the EAS build;
   - submit that exact build ID (never `--latest`);
   - write the build number Apple accepted into `app.json` and `Info.plist`;
   - set TestFlight "What to Test" through the App Store Connect API;
   - `eas metadata:push`.
4. **Merge the record-build PR.** CI then opens
   `chore(release): record iOS build <N> for <version>`, changing only
   `app.json` and `Info.plist`. Until it merges, master is one build behind App
   Store Connect, and the next build of that train reuses a number Apple has
   already consumed. It is pushed and opened with the `RELEASE_PR_TOKEN` secret
   so CI runs on it. If CI does not run, suspect that token first: it is a
   fine-grained token (Contents and Pull requests read/write) that expires, and
   the workflow silently falls back to `GITHUB_TOKEN`, which triggers no CI.

**One release, one builder.** Never run `yarn build-submit-ios` locally while
the CI release for that merge is running or has already submitted. Both start
from the same `app.json` build number, produce the same next number, and Apple
refuses whichever uploads second.

**Check whether CI actually ran** before deciding:

```bash
gh run list --workflow release-ios.yml --commit <merge-sha>
```

**When Actions cannot run, release locally — that is a supported path, not a
hack.** GitHub Actions billing breaks sometimes (a failed payment locks the
account) and Actions has outages. The run then never starts: it shows up as
failed with a billing or "not started" annotation, or not at all. In that case:

1. Confirm the run did not get as far as "Submitted your app" (or did not run
   at all).
2. From a clean `master` that matches `origin/master` (the preflight refuses
   anything else), with Node >= 22, run `yarn build-submit-ios`. It needs:
   - the production `environment.js` on disk (CI writes it from the
     `ENVIRONMENT_JS` secret; locally it is your own copy);
   - the App Store Connect key env vars `EXPO_ASC_API_KEY_PATH` (the `.p8`),
     `EXPO_ASC_KEY_ID` and `EXPO_ASC_ISSUER_ID`. Without them the script stops
     before building, because it cannot set the TestFlight notes.
3. It leaves the build-number change in `app.json` and `Info.plist`. No
   record-build PR is opened locally: commit those two files on their own
   branch (`record-build-<N>-<version>`) and merge that PR yourself.
4. When Actions comes back, **do not re-run the workflow for that merge.** The
   version is already on TestFlight, and a re-run just uploads a second build.

**When the CI release ran and failed,** read the run log before doing anything:

- **Failed before "Submitted your app":** nothing reached Apple. Re-run it from
  GitHub Actions (`Release iOS` → Run workflow; a manual run skips the
  version-change gate). If Actions itself is the problem, release locally as
  above.
- **Failed after the submit** (notes or metadata): the binary is on TestFlight
  and the record-build PR is still opened. Merge that PR first, then fix
  forward; re-running before it merges rebuilds a consumed number.

The workflow's secrets: `EXPO_TOKEN`; `ENVIRONMENT_JS` (production
`environment.js`, see below); `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY`;
`EXPO_APPLE_EMAIL_ADDRESS`, `EXPO_APPLE_APP_SPECIFIC_PASSWORD`; and
`RELEASE_PR_TOKEN`.

**Android is not automated.** `yarn build-submit-android` runs locally and does
not record its `versionCode`; reconcile it by hand as described under "Version
bumping" below.

Use the scripts and do not reconstruct them from raw `eas` flags. They exist so
nobody has to.

### `.easignore` is why gitignored files still reach the build

`environment.js` is **deliberately** gitignored — credentials do not belong in
git. It still reaches EAS because **`.easignore` exists, and when it does EAS
uses it INSTEAD of `.gitignore`** to decide what to upload. It does not exclude
the file, so a local `eas build` ships it.

**`app.json` is NOT gitignored, and must not be.** It was listed in
`.gitignore` until 2026-09-11 while being tracked — 233 commits of it — so the
line changed nothing for git and this paragraph claimed a credential risk that
was not there: the only credential-shaped value in the file is
`$GOOGLE_MAPS_API_KEY`, a placeholder EAS substitutes at build time. What the
stale line DID do was make `standard-version` skip the file when bumping
versions, silently, because it reads `.gitignore` literally. That is why three
releases needed a follow-up "record the version files" commit. Putting it back
would reintroduce that.

This is the single most misread thing about this repo's release setup:

- **Local build** — `environment.js` is on disk, `.easignore` lets it through. Works.
- **CI build** — the runner checks out from git, so the file is not on disk.
  `release-ios.yml` writes it from the `ENVIRONMENT_JS` secret (PRODUCTION
  credentials) before building. Any other workflow that builds needs the same
  step, or it dies in the `Bundle JavaScript` phase with
  `Unable to resolve module ../../../environment`.

Never build a release `environment.js` from the `PARSE_APP_ID` /
`PARSE_JAVASCRIPT_KEY` secrets: those are the TEST app, and `preview.yaml`
builds its config from them with `TEST_MODE: true` and `puente-test-logs`.
Shipping a TestFlight build pointed at staging means surveyors collecting into
the wrong database.

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
| `app.json` → `ios.buildNumber` | a plain counter, one higher than whatever is there |
| `app.json` → `android.versionCode` | `490` + zero-padded major/minor/patch, **floored** at one above the current code |
| `ios/Collect/Info.plist` | `CFBundleShortVersionString` (train) and `CFBundleVersion` (counter) |

**The build number is NOT the version.** It used to be, and EAS
`autoIncrement` then moved it, so App Store Connect read "Version 15.7.2 /
Build 15.7.4" — three numbers that look like versions, none of them the
version. `CFBundleVersion` only has to be unique inside its
`CFBundleShortVersionString` train, so it is now a plain counter that restarts
on a version bump.

**Both numbers are FLOORS, not answers.** `eas.json` sets `autoIncrement` on
both platforms, so EAS moves them too — it takes `490150702` to `490150703` on
a rebuild. Deriving the same number again at the next release hands Play a code
it has already seen, and Play refuses the upload with "You've already submitted
this version of the app." That happened on 2026-09-11, when only iOS had
`autoIncrement` and two Android builds of 15.7.2 both carried `490150702`.

**Do not hand-edit any of these.** Five files that must agree is exactly the
shape that drifts. If the script is missing something, fix the script and add a
test — `scripts/update-version/__tests__/` — so the next release inherits the
fix. That is what happened for `Info.plist`, which was hand-edited every release
until 15.7.0 and was therefore occasionally stale.

**Pick the right bump.** The version string is the train Apple gates
submissions on: a higher *build number* does not help if the train is closed.
That is what got build `90186` rejected. A new capability is a **minor**.

**After a build, CHECK the build number — sometimes EAS commits the bump to
your tree and sometimes it does not.** `eas.json` sets `appVersionSource:
"local"` with `autoIncrement: true` on iOS, so EAS reads `ios.buildNumber` out
of the local `app.json` and increments it for the build. Whether that lands in
your working tree is not dependable: on the `15.7.1` build the tree was left at
`15.7.0` with `git status` clean, and on the `15.7.2` build the bump was written
to `app.json` and `Info.plist` and had to be committed.

So do not assume either way — read the number EAS reports and compare it to the
files.

Left alone that is a guaranteed rejection: the next build reads `15.7.0` again,
increments to `15.7.1` a second time, and Apple refuses a duplicate
`CFBundleVersion` inside the same train.

For iOS, `yarn build-submit-ios` now does the reconcile itself: once Apple
accepts the binary, `scripts/release/buildSubmitIos.js` writes the build number
EAS returned into `app.json` and `Info.plist`'s `CFBundleVersion`. In CI the
`Release iOS` workflow then opens a `record-build-<N>-<version>` PR with just
those two files — merge it, or the next build of the train reuses the number
(build 8 of `15.7.5` sat unrecorded on master this way). The PR is pushed and
opened with the `RELEASE_PR_TOKEN` secret when it exists, so CI runs on it;
without the secret it falls back to `GITHUB_TOKEN`, and CI does not run.
Run locally, the files are left changed in your tree for you to commit.

Other `yarn build-submit-*` scripts (`-android`, `-all`) do not do this yet:
read the number off the EAS output ("Build number: Y" / "Version code: Y"),
confirm the files say Y (`ios.buildNumber` and `Info.plist`'s
`CFBundleVersion` for iOS, `android.versionCode` for Android), and commit them
if they do not. Leave
`CFBundleShortVersionString` alone — that is the train, and it only moves on a
real version bump.

Commit that reconcile **on its own**. On the `15.7.2` build the bump was swept
into an unrelated docs commit by a `git add -A`, which is how a version change
ends up somewhere nobody thinks to look for it.

**Never claim a build contains a fix without reading the COMMIT off the build
record.** `eas build:view <build-id>` prints a `Commit` field. That is the only
statement about what is in the binary. Inspecting local `git log` afterwards
proves nothing: the build was made from whatever the tree held when it started,
which may be hours and several merges behind where the branch sits now.

This has already produced a wrong claim. Build `524a405a` was reported as
carrying the autofill fix on the strength of `git log -1` showing that fix at
HEAD. The build record said `Commit cbef9492` — the commit *before* it, so the
binary submitted to Apple had the unclickable dropdown it was supposed to fix.

The check is one command and it is unambiguous:

```
npx eas build:view <build-id>            # read Commit
git merge-base --is-ancestor <fix-sha> <build-commit>   # exit 0 = fix is in
```
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
| `visual-qa` | Screenshot the iOS simulator to verify a change LOOKS right |
| `qa-engineer` | Write, extend, or repair a Maestro E2E flow — coverage for a feature, or a regression flow for a bug |

`visual-qa` and `qa-engineer` both drive Maestro, and the split is what you
want out the far end: `visual-qa` runs existing flows to LOOK at the result
(layout, spacing, type), `qa-engineer` writes the flow and proves it can fail.
Auditing a screen's appearance is the first; "we have no coverage for X" is the
second.

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

**The app renders in the DEVICE language.** `modules/i18n/index.js` reads
expo-localization once at module load; there is no runtime override except the
picker on the sign-in screen. So changing the language for a test means changing
the SIMULATOR's language and rebooting it — relaunching the app is not enough,
because the system reads the preference at boot.

**Maestro text selectors are REGEXES, so flows match English *or* Spanish** in
one selector: `"Search Individual|Buscar individuo"`. Keep both halves in sync
with the catalogs. Do not replace an alternation with an `env:` variable —
a flow-file `env:` default **overrides** `-e` on the command line in this
version of Maestro (the opposite of what the docs suggest), so a parameterised
default silently keeps the English string on a Spanish run and the failure
surfaces sixty seconds later at the sign-in gate. Verified with a two-line flow:

```yaml
env: { VAR: "parent-default" }        # run with -e VAR="cli-override"
- assertTrue: ${VAR == "cli-override"}   # -> Assertion is false
```

**A string that never entered a catalog is invisible to `lint:locale-sync`.**
Parity checks compare catalogs to each other, so a hardcoded JSX literal passes
every check while rendering English to everyone. Two shipped that way and were
found only by photographing the Spanish app.
