# Maestro UI Flows

End-to-end UI automation for Puente Collect, driven by [Maestro](https://maestro.mobile.dev/).

## Prerequisites

1. Install Maestro CLI (one-time):
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
2. Start Metro in the environment you want to exercise — **first**, before any
   flow. Without it the app has no JS bundle, every step fails, and the run
   looks like a regression:
   ```bash
   yarn start:prod-clear      # or start:staging-clear
   ```
3. Confirm the simulator has the build under test:
   ```bash
   xcrun simctl listapps <device-udid> | grep io.ionic.starter1270348
   ```
   The bundle id is `io.ionic.starter1270348` — grepping for `puente` or
   `collect` finds nothing and will convince you the app is missing when it is
   not. If the build predates your change, `npx expo run:ios` first; a green
   flow against a stale binary proves nothing.

## How a flow should be written

Three rules, learned the hard way. See "What went wrong before" below.

**1. Every navigation asserts where it landed.** Tapping is not evidence. A step
that moves the app must be followed by a check that the destination actually
rendered — `assertVisible` for state that should already be there,
`extendedWaitUntil` for anything that loads.

**2. Target by id, never by coordinate.** `tapOn: { id: "tab-offline" }` fails
loudly when the tab is gone. `tapOn: { point: "70%, 94%" }` cannot fail — it
dispatches at that point whether or not anything is there — and it breaks on any
device that is not 393x852. `yarn lint:maestro` rejects new tab-bar coordinate
taps.

**3. Reuse the subflows.** Sign-in and tab navigation live in `subflows/`. Don't
paste a fourth copy.

## Subflows

| File | What it does | Params |
|---|---|---|
| `subflows/login.yaml` | Skips onboarding, signs in by testID, dismisses coachmarks, asserts Home rendered | uses `PARSE_USERNAME` / `PARSE_PASSWORD` |
| `subflows/open-tab.yaml` | Clears coachmarks, taps a tab by testID, asserts the destination | `TAB_ID`, `EXPECT` |
| `subflows/dismiss-coachmarks.yaml` | Dismisses any first-run coachmark on screen | — |

```yaml
- runFlow: subflows/login.yaml

- runFlow:
    file: subflows/open-tab.yaml
    env:
      TAB_ID: "tab-offline"
      EXPECT: "Offline Sync"
```

### The five tabs

Declared in `impacto-design-system/MainNavigation/BottomTabNavigator/index.js`.
**There is no Assets tab** — `domains/Assets` is reachable only by deep link.

| Tab | `TAB_ID` | `EXPECT` |
|---|---|---|
| Find Records | `tab-find-records` | `Search Individual` |
| Data Collection | `tab-data-collection` | `Puente Forms` |
| Home | `tab-home` | `Last 7 Days` |
| Offline Sync | `tab-offline` | `Offline Sync` |
| Settings | `tab-settings` | `Name, Phone, Email` |

The testIDs come from `tabBarTestID` on each screen; `AnimatedTabBar` forwards
them to each tab button. The `accessibilityLabel` stays human-readable and
localized for VoiceOver — the testID is the automation handle, deliberately
separate so translating the app cannot break the suite.

## Flows

### Functional

| File | What it does | Auth |
|---|---|---|
| `visual-qa.yaml` | Screenshots onboarding and sign-in | No |
| `signup-organization-picker.yaml` | Signup organization autocomplete is selectable | No — needs a backend with organizations. Staging now has 59, "Puente" among them (measured 2026-09-11); it was empty when this said "prod only" on 2026-09-02 |
| `authenticated.yaml` | Signs in, visits all five tabs, asserts each | Yes |
| `organization-scope.yaml` | Regression flow for organization alias-set scoping | Yes |
| `find-records-history.yaml` | Resident → record history → Identification record | Yes |
| `resident-id-form.yaml` | Formik validation errors, then a successful submit | Yes |
| `environmental-health-online.yaml` | Collects an Environmental Health form ONLINE against an existing resident, and asserts the record reached the server rather than the offline queue | Yes — needs the resident "Rararo Long" |

### Offline data collection

Forms saved without a connection are queued in AsyncStorage and synced via the
"Retry" button. **Airplane mode must be OFF at the start** — the flows toggle
offline mode internally via the dev toggle in Settings.

| File | What it tests | Auth |
|---|---|---|
| `offline-resident-id.yaml` | Submit offline → queued → success page → "Retry" badge | Yes |
| `offline-sync.yaml` | Submit offline → reconnect → "Retry" → queue empties | Yes |
| `offline-multiple-forms.yaml` | Two forms offline → badge accumulates → sync clears both | Yes |
| `offline-badge-persistence.yaml` | Submit offline → force-kill → cold relaunch → badge survives | Yes |
| `offline-linked-forms.yaml` | Linked forms queue and sync together | Yes |
| `offline-discard-queued-form.yaml` | Queue is listed by form name → discard asks first → cancel keeps it → confirm removes it | Yes |

Each of these now ends on a positive assertion — `No forms queued. You are all
caught up!` — rather than only `notVisible: "Retry"`, which also passes on a
blank or crashed screen.

The sync button carries `testID="offline-retry-button"`. Prefer it to the
English word "Retry": the surrounding copy is translated, and the button is the
one thing on the screen that a Spanish or Kreyòl run still has to find. The
readiness gate in `environmental-health-online.yaml` stays on text only because
it has to match either the queued or the empty state in a single wait.

Two ids worth knowing when a form has a number field:
`numberInput-<formikKey>` is the field, and
`numberInput-done-<formikKey>` is the Done button on its keypad accessory bar.
Tap the latter to close the numeric keypad — `hideKeyboard` fails outright on
it, and while it is up the ScrollView's `keyboardShouldPersistTaps="never"`
eats the first tap on submit while Maestro reports that tap as COMPLETED.

### Documentation captures

These take the screenshots in the public guides at
<https://puente-dr.github.io/guides/>. They are CAPTURE flows: they assert only
enough to be sure each image shows the state it claims to, because nobody
re-checks a picture. Anything needing a real assertion belongs in a flow above.

| File | Feeds | Auth |
|---|---|---|
| `capture-find-records-docs.yaml` | /guides/finding-someone-you-already-surveyed/ | Yes |
| `capture-offline-docs.yaml` | /guides/collecting-without-a-signal/ | Yes |
| `capture-org-signup-docs.yaml` | /guides/how-to-create-and-manage-orgs/ | No |

```bash
yarn start:staging-clear                  # Metro FIRST
./.maestro/capture-guide-docs.sh both     # English and Spanish
```

**Every person in a published image must be invented, and every organization
must be one we may show.** Resident search returns REAL residents and the signup
picker returns REAL organizations, so both search terms are chosen to narrow to
what is publishable and were verified before capturing:

    "Ejemplo", "00167"  ->  only synthetic staging residents
    "Pu"                ->  exactly one organization: "Puente", our own

Do not broaden either. A single letter returns real people, and a shorter
organization prefix returns real partners. Staging has carried production
organization names since 2026-09-08.

### Running a flow in Spanish

Collect renders in the DEVICE language — `modules/i18n` reads the locale once at
module load — so the simulator's language has to change and the simulator has to
REBOOT. `capture-guide-docs.sh` does both. Every flow here already works in
either language: the text selectors are regex alternations
(`"Search Individual|Buscar individuo"`), including the ones in
`subflows/login.yaml` and `subflows/dismiss-coachmarks.yaml`.

**Do not turn an alternation into an `env:` variable.** In this version of
Maestro a flow-file `env:` default **overrides** `-e` on the command line, so
the flow silently keeps the English string and fails a minute later at the
sign-in gate — which reads as a broken login. Verified, not assumed:

```yaml
env: { VAR: "parent-default" }        # run with -e VAR="cli-override"
- assertTrue: ${VAR == "cli-override"}   # -> Assertion is false
```

The one variable that survives is the screenshot directory, and it is read with
a `typeof OUT === 'undefined'` guard in `evalScript` rather than an `env:`
default, for exactly that reason.

## Running

```bash
yarn maestro .maestro/authenticated.yaml          # credentials are in the script
yarn maestro .maestro/organization-scope.yaml
maestro test .maestro/                            # everything
maestro studio                                    # interactive, with device mirror
```

### Before trusting a new flow — the stability gate

A flow that passed once has been shown to pass once, not to be stable.

```bash
yarn maestro:stability .maestro/authenticated.yaml 5
```

Runs it five times and reports a stability percentage, with per-run logs in
`.maestro/.stability/`. Anything under 100% is flaky — find out why before
relying on it, because a flow that fails one run in five will eventually fail
the run that matters and be waved through as noise.

### Linting the flows

```bash
yarn lint:maestro     # also part of yarn lint:all
```

Rejects tab-bar coordinate taps, flows that never assert (directly or through a
subflow), dangling `runFlow` references, and a wrong `appId`.

## Screenshots

Flows write to `.claude/screenshots/`. These are **artifacts for humans**, not
assertions — nothing diffs them against a baseline, so a screenshot alone proves
only that the app did not crash before it was taken. Put the real check in an
`assertVisible` next to it.

## What went wrong before

Worth keeping, because the failure was silent and lasted the life of the flow.

`authenticated.yaml` tapped `"70%, 94%"` believing it was an Assets tab, landed
on Offline Sync, and saved the result as `07-assets.png`. The README documented
it as Assets. There is no Assets tab in the bottom navigator and never was.

Nothing caught it because nothing could: the suite had 731 steps and 2
assertions, a coordinate tap cannot fail, and a screenshot never fails. The flow
was green on every run it ever made.

Two more of the same shape, both from 2026-09-11, both now guarded:

**Metro was down and the failure named the login screen.** The dev client
launches to a red "No script URL provided" screen. The app IS up, so Maestro
sees no crash, carries on, and dies sixty seconds later on
`Assert that "Skip|Log-In|Last 7 Days" is visible... FAILED` — which reads as
bad credentials or a slow backend. `scripts/maestro-preflight.js` now probes
`localhost:8081/status` and refuses to start, naming the packager. Like the
conflicting-run check beside it, a failure of the CHECK ITSELF never blocks a
run.

**A Spanish device failed at the same line for a different reason.** Every text
selector was English-only, so nothing on screen ever matched. Same symptom,
same misleading message. The selectors are alternations now — see "Running a
flow in Spanish" above.

## First-run note

On a fresh install the app shows a Terms modal and onboarding coachmarks.
`subflows/dismiss-coachmarks.yaml` handles the coachmarks, and it runs both
before and after every tab tap — they render at the bottom of the screen and
cover the tab bar, so a tap aimed at a tab hits the coachmark instead.
