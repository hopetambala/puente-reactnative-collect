# Maestro UI Flows

End-to-end UI automation flows for Puente Collect, driven by [Maestro](https://maestro.mobile.dev/).

## Prerequisites

1. Install Maestro CLI (one-time):
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
2. Start the app on the iOS simulator. Most flows require the **staging** backend:
   ```bash
   EXPO_PUBLIC_APP_ENV=staging APP_ENV=staging yarn ios
   ```
   Wait for the app to fully load before running any flow.

## Flows

| File | What it does | Auth required |
|---|---|---|
| `visual-qa.yaml` | Screenshots onboarding and sign-in screens | No |
| `authenticated.yaml` | Logs in and screenshots every tab (Home, Data Collection, Find Records, Assets, Settings) | Yes |
| `find-records-history.yaml` | Logs in, opens Find Records, selects a resident, opens their record history, and taps into the Identification record | Yes |
| `resident-id-form.yaml` | Logs in, opens the Resident ID form, fills required fields, and submits | Yes |

## Running flows

**Unauthenticated flow** (no credentials needed):
```bash
maestro test .maestro/visual-qa.yaml
```

**Authenticated flows** (pass staging credentials as env vars):
```bash
maestro test -e PARSE_USERNAME=Test -e PARSE_PASSWORD=test .maestro/authenticated.yaml
maestro test -e PARSE_USERNAME=Test -e PARSE_PASSWORD=test .maestro/find-records-history.yaml
maestro test -e PARSE_USERNAME=Test -e PARSE_PASSWORD=test .maestro/resident-id-form.yaml
```

**Run all flows at once:**
```bash
maestro test .maestro/
```

**Live interactive mode** (browser UI with device mirror):
```bash
maestro studio
```

## Screenshots

Flows write screenshots to `.claude/screenshots/`. Files are named by flow step, e.g.:
- `00-onboarding.png`, `01-sign-in.png` — visual-qa / authenticated
- `04-home.png` … `08-settings.png` — authenticated tab sweep
- `find-records-01-list.png` … `find-records-04-edit-identification.png`
- `resident-id-01-gallery.png` … `resident-id-06-form-submitted.png`

## First-run note

On a fresh install the app shows a Terms modal and onboarding coachmarks. Each flow uses `runFlow: when: visible:` guards to dismiss them automatically, so they are safe to run on both first and subsequent launches.

## App ID

All flows target `io.ionic.starter1270348` (the Expo dev-client bundle ID). If the bundle ID changes, update `appId:` in every YAML file.
