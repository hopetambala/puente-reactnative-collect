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
   staging — the default `dev` env points Parse at `localhost:1337`, which has
   no running server, so login can't succeed. **The Metro bundler must stay
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
   - Full audit incl. the tab screens — needs staging (step 2) + a Parse user
     that actually exists in the Back4App staging database. Verify first:
     the user must be able to sign in through the app on staging; if the app
     shows an error alert the credentials are wrong. Create a test user via the
     Sign Up screen (with the staging app running) or through the Back4App
     dashboard, then:
     ```
     maestro test -e PARSE_USERNAME=you -e PARSE_PASSWORD=secret .maestro/authenticated.yaml
     ```
4. Read each PNG from `.claude/screenshots/` using the Read tool.
5. For each screenshot, list every visual defect (spacing, typography, colour,
   alignment, overflow, broken layout).
6. Fix defects in order of severity — layout breaks first, then spacing, then
   colour/type. Any styling change must honor `dlite-design-system`; any
   behavior change must go through `red-green-tdd`.
7. Re-run step 3 and compare before/after screenshots. Repeat until clean.

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
