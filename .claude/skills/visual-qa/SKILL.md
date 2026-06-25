---
name: visual-qa
description: >
  Use when: taking screenshots of the running Puente Collect app on the iOS
  simulator to audit visual quality, spot layout or typography regressions, or
  verify that a redesign change looks correct on device. Drives the app with
  Maestro (launch, tap through onboarding/sign-in/tabs), saves PNGs to
  .claude/screenshots/, then reads them back so issues can be diagnosed and
  fixed immediately.
---

# Visual QA — iOS simulator screenshot + fix workflow

This is an Expo React Native app. Visual QA runs against the **iOS simulator**,
not a browser. UI navigation and screenshots are driven by
[Maestro](https://maestro.mobile.dev), which taps through the real screens.

## One-time setup

- **Java** (Maestro requires a JRE 11+). If `java -version` fails:
  ```
  brew install openjdk
  export JAVA_HOME="/opt/homebrew/opt/openjdk" PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
  ```
  (use the `openjdk` formula, not the `temurin` cask — the cask needs an
  interactive sudo password.)
- **Maestro** (UI driver). If `maestro --version` fails, install it:
  ```
  curl -Ls "https://get.maestro.mobile.dev" | bash
  ```
  (adds `~/.maestro/bin` to PATH; restart the shell or `export PATH="$PATH:$HOME/.maestro/bin"`)
- **Xcode + iOS simulator** (`xcrun simctl` must be available).

## Steps

1. Boot a simulator if none is running:
   ```
   xcrun simctl list devices booted        # check
   xcrun simctl boot "iPhone 16" && open -a Simulator   # if empty
   ```
2. Start the app with the **staging** backend and keep it running. Always use
   staging — the `dev` env in a local setup may point at a local Parse server
   with no running instance, so login may fail. **The Metro bundler must stay
   running in the background while Maestro runs** — Maestro's `launchApp`
   relaunches the already-installed app, which then connects to Metro to load
   the JS bundle. If Metro isn't running the app shows
   "No script URL provided" and Maestro can't find any UI elements.
   ```
   EXPO_PUBLIC_APP_ENV=staging APP_ENV=staging yarn ios
   ```
   Run this in a separate terminal and leave it open. First run compiles the
   native dev client (can take several minutes); subsequent runs just re-bundle
   JS. Staging talks to Back4App (`https://parseapi.back4app.com/`).
3. Run a flow (in a different terminal, from the repo root):
   - Unauthenticated screens only (no backend needed):
     ```
     maestro test .maestro/visual-qa.yaml
     ```
   - Full audit incl. the tab screens — needs staging (step 2):
     ```
     maestro test -e PARSE_USERNAME=Test -e PARSE_PASSWORD=test .maestro/authenticated.yaml
     ```
4. Read each PNG from `.claude/screenshots/` using the Read tool.
5. For each screenshot, list every visual defect (spacing, typography, colour,
   alignment, overflow, broken layout).
6. Fix defects in order of severity — layout breaks first, then spacing, then
   colour/type. Any styling change must honor `dlite-design-system`; any
   behavior change must go through `red-green-tdd`.
7. Re-run step 3 and compare before/after screenshots. Repeat until clean.

---

## iPhone 16 coordinate map

All coordinates are **percentage of screen** (`x%, y%`). The active simulator
is `EC8EF83C-395B-491E-AC7F-3676B4557DFC` (iPhone 16, iOS 18.6).
These are confirmed working across multiple flows.

### Tab bar (y ≈ 94%)

The five bottom tabs sit at a fixed 94% height. Tap by x position:

| Tab | x%, y% | Notes |
|---|---|---|
| Search / Find Records | `10%, 94%` | magnifying glass |
| Data Collection | `30%, 94%` | folder / forms icon |
| Home | `50%, 94%` | house icon |
| Offline | `70%, 94%` | question mark icon |
| Settings | `90%, 94%` | gear icon |

### Sign-in screen

The sign-in form has a scrollable area. Fields are at these coordinates
**before** the keyboard appears:

| Element | x%, y% |
|---|---|
| Email or Phone Number field | `50%, 38%` |
| Password field | `50%, 48%` |

After typing both fields, `scroll` brings the Log-In button into view, then
`tapOn: "Log-In"` taps it by text. Do NOT add `waitForAnimationToEnd` between
`scroll` and `tapOn: "Log-In"` — use the exact pattern below.

### Form gallery → open a form

| Element | x%, y% | Notes |
|---|---|---|
| Surveyee checkbox row | `10%, 66%` | left-side checkbox before "Continue to Form" |

### ResidentIdSearchbar (env health form)

| Element | x%, y% | Notes |
|---|---|---|
| Searchbar input | `50%, 22%` | coordinate tap only — `tapOn: id:` crashes during navigation animation |
| First result row ("Link Test") | `50%, 34%` | coordinate tap only — `tapOn: id:` crashes during Reanimated entering animation |

### Settings — force offline toggle

Use `id:` selectors (these are stable, no animation at the time of tap):

```yaml
- tapOn:
    id: "dev-offline-toggle"
- waitForAnimationToEnd
- tapOn:
    id: "settings-close-button"
```

### AsyncStorage cleanup (between test runs)

The offline queue keys are `offlineIDForms` and `offlineSupForms` (single-p,
not double-p). Always clear before a flow that submits offline forms:

```python
# device UUID: EC8EF83C-395B-491E-AC7F-3676B4557DFC
# app data container: find via `xcrun simctl get_app_container <uuid> io.ionic.starter1270348 data`
python3 -c "
import json
with open('<manifest_path>/RCTAsyncLocalStorage_V1/manifest.json','r') as f:
    data = json.load(f)
for key in ['offlineIDForms','offlineSupForms','DEV_FORCE_OFFLINE']:
    if key in data:
        del data[key]
with open('<manifest_path>/RCTAsyncLocalStorage_V1/manifest.json','w') as f:
    json.dump(data, f)
"
```

---

## Reusable YAML fragments

Copy these blocks directly. Do not reinvent them — the coordinates and
wait patterns below are the product of extensive debugging.

### Launch + skip onboarding

```yaml
appId: io.ionic.starter1270348
---
- launchApp

- runFlow:
    when:
      visible: "Skip"
    commands:
      - tapOn: "Skip"
```

### Login (staging credentials via env vars)

```yaml
- extendedWaitUntil:
    visible: "Log-In"
    timeout: 20000

- tapOn:
    point: "50%, 38%"
- inputText: ${PARSE_USERNAME}
- tapOn:
    point: "50%, 48%"
- inputText: ${PARSE_PASSWORD}
- scroll
- tapOn: "Log-In"
- waitForAnimationToEnd

- runFlow:
    when:
      visible: "Your Impact Dashboard"
    commands:
      - tapOn: "Got it"
      - waitForAnimationToEnd

- extendedWaitUntil:
    visible: "Home"
    timeout: 30000
```

Run with: `maestro test -e PARSE_USERNAME=Test -e PARSE_PASSWORD=test <flow>.yaml`

### Navigate to Data Collection gallery

```yaml
- tapOn:
    point: "30%, 94%"
- waitForAnimationToEnd

- runFlow:
    when:
      visible: "Capture Field Data"
    commands:
      - tapOn: "Got it"
      - waitForAnimationToEnd
```

### Enable force-offline mode

```yaml
- tapOn:
    point: "90%, 94%"
- waitForAnimationToEnd
- tapOn:
    id: "dev-offline-toggle"
- waitForAnimationToEnd
- tapOn:
    id: "settings-close-button"
- waitForAnimationToEnd
- tapOn:
    point: "30%, 94%"
- waitForAnimationToEnd
```

### Disable force-offline mode

```yaml
- tapOn:
    point: "90%, 94%"
- waitForAnimationToEnd
- tapOn:
    id: "dev-offline-toggle"
- waitForAnimationToEnd
- tapOn:
    id: "settings-close-button"
- waitForAnimationToEnd
```

### Open a form from the gallery

Substitute the form name (e.g. `"Resident ID"`, `"Environmental Health"`).

```yaml
- tapOn: "Resident ID"
- waitForAnimationToEnd

- runFlow:
    when:
      visible: "OK"
    commands:
      - tapOn: "OK"
      - waitForAnimationToEnd

- tapOn:
    point: "10%, 66%"
- waitForAnimationToEnd
- tapOn: "Continue to Form"
- waitForAnimationToEnd
```

### Submit the Resident ID form offline (first+last name, gender, marital, education)

```yaml
- tapOn: "First Name"
- inputText: "Link"
- tapOn: "Last Name"
- inputText: "Test"
- waitForAnimationToEnd
- hideKeyboard
- waitForAnimationToEnd

- scroll
- tapOn: "Female"
- waitForAnimationToEnd
- tapOn: "Single"
- waitForAnimationToEnd
- scroll
- tapOn: "Highschool"
- waitForAnimationToEnd

- scroll
- scroll
- scroll

- tapOn:
    id: "formSubmit"
- waitForAnimationToEnd

- runFlow:
    when:
      visible: "Household Manager"
    commands:
      - tapOn: "<"
      - waitForAnimationToEnd

- extendedWaitUntil:
    visible: "Form successfully submitted"
    timeout: 10000
```

### Search for the offline resident in an env-health form

Use this block after the env-health form opens (after 3× `waitForAnimationToEnd`
for the navigation animation):

```yaml
# Coordinate tap — bypasses accessibility tree to avoid kAXErrorInvalidUIElement
- tapOn:
    point: "50%, 22%"
- inputText: "Link"
- waitForAnimationToEnd

- extendedWaitUntil:
    visible:
      id: "resident-result-0"
    timeout: 5000
- waitForAnimationToEnd

# Coordinate tap — Reanimated entering animation makes the XCTest frame
# invalid even after waitForAnimationToEnd; coordinate tap bypasses tree.
- tapOn:
    point: "50%, 34%"
- waitForAnimationToEnd
```

### Navigate to Offline tab + sync

```yaml
- tapOn:
    point: "70%, 94%"
- waitForAnimationToEnd
- extendedWaitUntil:
    visible: "Retry"
    timeout: 5000

# <disable force-offline here>

- tapOn: "Retry"
- waitForAnimationToEnd

- extendedWaitUntil:
    notVisible: "Retry"
    timeout: 60000
```

---

## `kAXErrorInvalidUIElement` — avoidance rules

This is Maestro's XCTest driver throwing a non-retriable exception when it
scans the accessibility tree for an element frame during or after an animation.
It manifests as a fatal crash (not a retry), and it's the most common source
of flow failures in this app.

### When it happens

| Trigger | Why |
|---|---|
| `tapOn: text:` or `tapOn: id:` immediately after a React Navigation screen transition | XCTest tree isn't rebuilt yet |
| `tapOn: id:` on a Reanimated `entering`-animated element | The element appears in the tree but its Core Animation layer frame is still invalid during the translateY/opacity transition |
| `tapOn: text:` right after a `scroll` deceleration | Scroll momentum keeps the tree in a transitional state |

### The three safe patterns

**1. Coordinate tap** — always safe, never queries the tree:
```yaml
- tapOn:
    point: "50%, 22%"   # searchbar
```
Use for any element that appears during or right after an animation.

**2. Wait, then id tap** — safe when the animation is truly complete:
```yaml
- waitForAnimationToEnd   # screenshot-based, waits for visual stability
- tapOn:
    id: "formSubmit"      # safe — formSubmit is a stable element, no animation
```
`waitForAnimationToEnd` uses screenshots, not the XCTest tree, so it's safe
to call during any state.

**3. `extendedWaitUntil visible: id:` then coordinate tap** — for Reanimated lists:
```yaml
- extendedWaitUntil:
    visible:
      id: "resident-result-0"    # confirms element is in tree
    timeout: 5000
- waitForAnimationToEnd          # waits for visual animation to finish
- tapOn:
    point: "50%, 34%"            # coordinate tap — never reads the frame
```
Even after `waitForAnimationToEnd`, XCTest frame validity can lag behind visual
completion by ~100ms. The coordinate tap sidesteps this entirely.

### What is safe vs. unsafe to use during an animation

| Operation | Safe during animation? |
|---|---|
| `tapOn: point:` | ✅ always |
| `waitForAnimationToEnd` | ✅ always (screenshot-based) |
| `takeScreenshot` | ✅ always |
| `extendedWaitUntil visible: id:` | ✅ safe (checks tree membership, not frame) |
| `tapOn: id:` | ⚠️ only safe when element has been stable for ≥1 `waitForAnimationToEnd` |
| `tapOn: text:` | ⚠️ same as above |
| `hideKeyboard` | ⚠️ only works on standard TextInput — fails on RNP Searchbar and secureTextEntry password fields |

### `hideKeyboard` limitations

- Works: standard `TextInput` (First Name, Last Name, etc.)
- Fails: `react-native-paper` `Searchbar` component (custom keyboard config)
- Fails: `secureTextEntry` password fields on iOS

When `hideKeyboard` is not an option, dismiss the keyboard by tapping a
non-interactive element (e.g. the PUENTE logo at `"50%, 28%"` on the sign-in
screen) or by scrolling (which dismisses on ScrollViews with default
`keyboardDismissMode`).

### `keyboardShouldPersistTaps` in FlatLists

If a `FlatList` contains tappable rows and the keyboard might be showing when
the user taps a row, the `FlatList` needs `keyboardShouldPersistTaps="handled"`.
Without it (the default `"never"`), the tap only dismisses the keyboard and
never fires `onPress`. This is already set on `ResidentIdSearchbar`'s FlatList.

---

## Screens captured

| File | Screen | Needs credentials |
|---|---|---|
| 00-onboarding | Onboarding (welcome) | no |
| 01-sign-in | Sign In | no |
| 04-home | Home tab | yes |
| 05-data-collection | Data Collection tab | yes |
| 06-find-records | Find Records tab | yes |
| 07-assets | Assets tab | yes |
| 08-settings | Settings tab | yes |

The flow lives in `.maestro/visual-qa.yaml`; the authenticated portion is in
`.maestro/authenticated.yaml`. Selectors are the on-screen English labels
(`Skip`, `Email or Phone Number`, `Password`, `Log-In`, and the tab titles), so
keep them in sync with `modules/i18n/english/en.json` if those strings change.

## Output

Screenshots are written to `.claude/screenshots/<name>.png`. Names are stable,
so a re-run overwrites the previous set — copy them aside first if you need a
true before/after diff.
```
cp -r .claude/screenshots .claude/screenshots-before   # before a fix
```
