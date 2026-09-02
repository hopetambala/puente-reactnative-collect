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
| `signup-organization-picker.yaml` | Signup organization autocomplete is selectable | No |
| `authenticated.yaml` | Signs in, visits all five tabs, asserts each | Yes |
| `organization-scope.yaml` | Regression flow for organization alias-set scoping | Yes |
| `find-records-history.yaml` | Resident → record history → Identification record | Yes |
| `resident-id-form.yaml` | Formik validation errors, then a successful submit | Yes |

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

Each of these now ends on a positive assertion — `No forms queued. You are all
caught up!` — rather than only `notVisible: "Retry"`, which also passes on a
blank or crashed screen.

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

## First-run note

On a fresh install the app shows a Terms modal and onboarding coachmarks.
`subflows/dismiss-coachmarks.yaml` handles the coachmarks, and it runs both
before and after every tab tap — they render at the bottom of the screen and
cover the tab bar, so a tap aimed at a tab hits the coachmark instead.
