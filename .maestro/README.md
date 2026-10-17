# Maestro UI Flows

End-to-end UI automation for Puente Collect, driven by [Maestro](https://maestro.mobile.dev/).

## Prerequisites

1. Install Maestro CLI (one-time):
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
2. For a development client, start Metro in the environment you want to
   exercise — **first**, before any flow. Without it the development client has
   no JS bundle. A standalone Android release includes its own bundle and does
   not need Metro:
   ```bash
   yarn start:prod-clear      # or start:staging-clear
   ```
3. Confirm the simulator has the build under test:
   ```bash
   xcrun simctl listapps <device-udid> | grep io.ionic.starter1270348
   ```
   Android flows resolve the package to `puente.collect`; confirm with
   `adb shell dumpsys package puente.collect` and compare `versionCode` with
   the exact EAS/Play bundle. iOS's bundle id is `io.ionic.starter1270348` — grepping for `puente` or
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
| `subflows/set-offline-mode.yaml` | Android: real airplane mode and app network assertion; iOS: asserted DEV switch | `STATE`: `ON` or `OFF` |
| `subflows/give-consent.yaml` | Accepts consent and asserts the form destination | — |

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
| `orientation-diagnostic.yaml` | Phone/tablet diagnostic: requests portrait and both landscape orientations, asserts tab destinations and accessibility, captures screenshots for human layout/orientation inspection | Yes — preserves the session and queue |
| `terms-visual-diagnostic.yaml` | Requires an online empty queue, logs out through confirmation, opens the sign-in policy sheet, captures top/bottom for opacity/readability inspection, closes it and signs back in | Yes — no state clearing; diagnostic until its stability gate passes |

### Offline data collection

Forms saved without a connection are queued in AsyncStorage and synced via the
"Retry" button. **Airplane mode must be OFF at the start**. Android's shared
offline subflow enables real airplane mode and asserts the app's offline banner,
so it works against a standalone production bundle without a dev menu. iOS
uses the dev toggle in Settings. Restore connectivity after any failed flow
before running another sign-in test. Use only the documented internal-test
account for production-backend QA; never collect synthetic records into a real
partner organization.

| File | What it tests | Auth |
|---|---|---|
| `offline-resident-id.yaml` | Submit offline → queued → success page → "Retry" badge | Yes |
| `offline-sync.yaml` | Submit offline → reconnect → "Retry" → queue empties | Yes |
| `release-save-restart-sync.yaml` | Shared iOS/Android: save offline → cold restart with restored session → unique queued record persists → reconnect and sync → same unique named record read back from server | Yes — internal-test account only |
| `android-release.yaml` | Compatibility entrypoint that calls the shared release journey | Yes — internal-test account only |
| `offline-multiple-forms.yaml` | Two forms offline → badge accumulates → sync clears both | Yes |
| `offline-badge-persistence.yaml` | Submit offline → force-kill → cold relaunch → badge survives | Yes |
| `offline-linked-forms.yaml` | Linked forms queue and sync together | Yes |
| `offline-discard-queued-form.yaml` | Queue is listed by form name → discard asks first → cancel keeps it → confirm removes it | Yes |

Each of these now ends on a positive assertion — `No forms queued. You are all
caught up!` — rather than only `notVisible: "Retry"`, which also passes on a
blank or crashed screen.

The shared release journey restores online mode before its queue preflight,
syncs any existing synthetic QA records, and requires an empty queue before
collecting. It never clears application data or discards records. Every run
creates a timestamped `AndroidQA`/`IOSQA` resident and checks that exact name in
the queue, after process death, and in server search results. The restart check
waits for authenticated Home directly: logging in again would hide session loss.
Its screenshot names include the unique resident, so repeated runs retain their
own evidence. Run only against the documented synthetic account.

On iOS, screen-wide accessibility visibility is not proof that a form control
lies inside its clipped ScrollView. Two repeated October 14 runs reported Save
Record at y=737–782 while the tab bar occupied y=752–808; the taps landed on
Home. A before-tap screenshot showed the form viewport ending above the bar.
The shared journey now scrolls the final footer fully into view after discovering
Save, checks its position above the Home tab, retains the ID tap and success
assertion, and captures the hit target before tapping. The positional selector
compares top edges, not full occlusion; inspect the captures too. `centerElement`
failed even with Save fully visible at the bottom because this final item cannot
reach its top-70%-of-screen threshold. The scroll corrects the harness's visibility
assumption; it does not repair native accessibility clipping or replace visual proof.

Android exercises real airplane mode through the shared offline helper. iOS
Simulator has no airplane mode: the iOS journey requires a development build
with **Force Offline Mode** in Settings, plus Metro if using a development
client. That proves the application queue path, not physical network loss on a
production iOS binary. Restore connectivity after a failure and preserve its
queue for the next sync attempt.

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

The shared Button's `testID` must belong to Paper's actionable button, not an
outer decorative Pressable. Android exposed that old wrapper as an unnamed
accessible control, and its bounds could be clipped/inverted after scrolling
even while **Save Record** was visible. The Button regression tests use
`userEvent.press` to verify enabled/disabled behavior at the supplied ID and
reject the extra accessible wrapper. Keep the release flow targeting
`formSubmit`; do not replace this regression with an unverified coordinate tap.

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

Select one exact device and run the shared journey five times on each platform,
serially; the runner accepts and forwards Maestro arguments:

```bash
yarn maestro .maestro/release-save-restart-sync.yaml --device <ios-udid>
yarn maestro:stability .maestro/release-save-restart-sync.yaml 5 --device <ios-udid>
yarn maestro .maestro/release-save-restart-sync.yaml --device <android-serial>
yarn maestro:stability .maestro/release-save-restart-sync.yaml 5 --device <android-serial>
```

Before trusting an edited flow, temporarily point its unique queued-resident
assertion at a nonexistent name and watch it fail at that assertion. Restore
the assertion, then require five consecutive passes per platform. A failed
intentional-RED run can leave its synthetic record queued; the normal journey's
online preflight syncs it without wiping data. Use one Maestro runner at a time.

For phone/tablet orientation diagnostics, select each installed device explicitly:

```bash
yarn maestro .maestro/orientation-diagnostic.yaml --device <device-id>
```

Review every timestamped orientation screenshot for actual rotation, clipping,
tab reachability, readable text and usable controls. The flow uses
[`setOrientation`](https://docs.maestro.dev/reference/commands-available/setorientation)
and asserts screen contents; a passing command cannot prove the app respected
rotation or that the layout looks correct. Record device model, OS and exact
build identity with the captures. Restore portrait manually if a failure exits
before the final rotation step. This diagnostic has its own intentional-RED and
five-pass gate before it is trusted as regression coverage.

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

On Android, the search keyboard covers the bottom tab bar. The release flow
closes it with `hideKeyboard` after asserting server read-back and before
targeting `tab-home`. Without that step, build 490150709 correctly saved,
persisted and synced the record, but the final tab lookup failed because Home
was behind the keyboard. Keep the ID/destination assertions; do not replace
the tab tap with coordinates.

On a fresh install the app shows a Terms modal and onboarding coachmarks.
`subflows/dismiss-coachmarks.yaml` handles the coachmarks, and it runs both
before and after every tab tap — they render at the bottom of the screen and
cover the tab bar, so a tap aimed at a tab hits the coachmark instead.
