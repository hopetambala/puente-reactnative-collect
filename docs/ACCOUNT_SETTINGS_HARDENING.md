# Account Settings — Hardening Backlog & Delivery Roadmap

**Status**: Active
**Scope**: `domains/Settings/**`, plus upstream fixes in `modules/theme/` and `context/auth.context.js`
**Source**: Read-only audit of the Settings domain, 2026-07-31
**Last updated**: 2026-07-31
**Owner**: unassigned

This is the single document for this work: the *why* (epics and acceptance criteria), the
*when* (milestones and sequencing), and the *status* (tracker and progress log).

---

## Recommendation, up front

**Do not treat this as one project.** There are 38 items below and they are not equally
urgent. Shipping all of them before shipping any of them is the failure mode to avoid —
the screen would look fixed for weeks while the one defect that can actually strand a
promotor stays live.

Ship **M1 (AS-01 → AS-12, six items) first.** All S/M, and they carry substantially all of
the user-facing risk. Everything after that is real work that makes the screen good, but
nothing after that can lose someone a day of collection.

The counter-argument, stated honestly: M1 leaves the screen still ugly, still inaccessible,
and still full of token violations. That is the trade being accepted — correctness before
consistency, because a promotor cannot see a token violation and can absolutely get locked
out of their own data.

### The standing rule affects every estimate

Every item is new behavior and lands with a test seen failing first (`red-green-tdd`). Only
`DevOfflineToggle` has a test in this entire domain today. That is not overhead to be
optimized away — it is why the effort sizes include it. **S means S including its test.**

---

## What "bullet-proof" means for this screen

Settings is not where a promotor spends their day. They open it to change a password, pick
a language, or check why search is empty. The bar is not *delightful* — it is **you cannot
hurt yourself here, and it tells you the truth.**

1. **No unconfirmed action can cost you work or access.** Today five can.
2. **Every screen states whether it needs a connection, before you try.** Today three
   silently require one.
3. **What you see is what is stored.** Today two edit screens show blank fields for values
   that exist, and a Cancel button that does not cancel.

---

## Milestones

| Milestone | Goal | Exit criteria | Items |
|---|---|---|---|
| **M1 — Cannot hurt yourself** | No unconfirmed action costs work, access, or exposes a credential | All 6 Done; suite green; verified on simulator | AS-01, AS-02, AS-04, AS-05, AS-08, AS-12 |
| **M2 — Tells the truth** | Every screen states its connectivity needs; visible defects fixed | 12 Done; contrast ≥4.5:1; no Paper v5 prop misuse | AS-03, AS-06, AS-09, AS-10, AS-13, AS-21, AS-23, AS-24, AS-25, AS-28, AS-31, AS-37 |
| **M3 — Works and is reachable** | Edit screens behave; usable one-handed and with a screen reader | 6 Done; a11y props non-zero; rows fully tappable | AS-15, AS-16, AS-19, AS-20, AS-22, AS-26 |
| **M4 — Consistent** | Token/motion/copy compliance; IA regrouped | 11 Done; dlite audit clean for `domains/Settings/**` | AS-07, AS-11, AS-17, AS-18, AS-27, AS-29, AS-30, AS-33, AS-34, AS-35, AS-38 |
| **M5 — Credential model** | Password no longer persisted in plaintext | Own epic, own design doc | AS-14 |

**M1 is the only milestone with a deadline argument.** Everything in it is live in
production today and can cost a promotor a day of work. M2–M4 are quality, not risk.

---

## Exhaustive item tracker

| ID | Item | Epic | P | Effort | M | Status | Primary file:line |
|---|---|---|---|---|---|---|---|
| AS-01 | Confirm before logout (offline-aware) | E1 | P0 | M | 1 | ☑ | `SettingsHome/index.js:260` |
| AS-02 | Demote Log out, promote Back | E1 | P0 | S | 1 | ☑ | `SettingsHome/index.js:260` |
| AS-03 | Surface unsynced count | E1 | P1 | M | 2 | ☑ | new; reuse `Offline/index.js:36-38` |
| AS-04 | Confirm Clear Cached ID Forms | E2 | P0 | S | 1 | ☑ | `OfflineData/index.js:91-96` |
| AS-05 | Confirm Reset Onboarding | E2 | P1 | S | 1 | ☑ | `SettingsHome/index.js:240-248` |
| AS-06 | Confirm Delete user + destructive style | E2 | P1 | S | 2 | ☑ | `SupportHome/index.js:145-151` |
| AS-07 | Warn on Populate all ID Forms | E2 | P2 | S | 4 | ☐ | `OfflineData/index.js:57-62` |
| AS-08 | Fix `null.length` crash | E3 | P0 | S | 1 | ☑ | `FindRecords/index.js:24` |
| AS-09 | Offline detection on Password/Profile | E3 | P1 | M | 2 | ☑ | `Password/index.js:52`, `NamePhoneEmail/index.js:104` |
| AS-10 | Rewrite shared error copy | E3 | P1 | S | 2 | ☑ | `en.json` `passwordSettings`, `namePhoneEmailSettings` |
| AS-11 | Fix `currentReccordsStored` key | E3 | P2 | S | 4 | ☐ | `en.json` `findRecordSettings` |
| AS-12 | `secureTextEntry` on Change Password | E4 | P0 | S | 1 | ☑ | `Password/index.js:96,105` |
| AS-13 | Confirm-password + length validation | E4 | P1 | S | 2 | ☑ | `Password/index.js` |
| AS-14 | Plaintext password at rest | E4 | P1 | L | 5 | ⊘ | `Password/index.js:48`, `auth.context.js` |
| AS-15 | Cancel actually reverts | E5 | P1 | M | 3 | ☑ | `NamePhoneEmail/index.js:174-191`, `FindRecords/index.js:138-155` |
| AS-16 | Edit fields show current value | E5 | P1 | M | 3 | ☑ | `NamePhoneEmail/index.js:35-57,169` |
| AS-17 | Stop mutating state objects | E5 | P2 | S | 4 | ☑ | `NamePhoneEmail/index.js:69-73`, `FindRecords/index.js:93-97` |
| AS-18 | Numeric keyboard + coercion | E5 | P2 | S | 4 | ☑ | `FindRecords/index.js:135` |
| AS-19 | Whole rows tappable | E6 | P1 | M | 3 | ☑ | `SettingsHome/index.js:179-194`, `SupportHome/index.js:108-125` |
| AS-20 | Accessibility props across domain | E6 | P1 | M | 3 | ☑ | all of `domains/Settings/**` |
| AS-21 | Primary-action contrast ≥4.5:1 | E6 | P1 | M | 2 | ☑ | `modules/theme/index.js` (upstream) |
| AS-22 | Language selection second channel | E6 | P2 | S | 4 | ☑ | `Language/index.js:35-77`, `SettingsHome/index.js:226` |
| AS-23 | `color` → `iconColor` (Paper v5) | E7 | P1 | S | 2 | ☑ | 6 call sites, see E7 |
| AS-24 | `color` → `textColor` on Delete user | E7 | P1 | S | 2 | ☑ | `SupportHome/index.js:146` |
| AS-25 | Map `secondaryContainer` in theme | E7 | P1 | S | 2 | ☑ | `modules/theme/index.js:29-99` |
| AS-26 | Migrate `index.styles.js` off legacy scale | E7 | P2 | M | 3 | ☑ | `Settings/index.styles.js:2` |
| AS-27 | Token violations (10 rows) | E7 | P2 | S ea | 4 | ☐ | see E7 table |
| AS-28 | Honor Calm Mode on this screen | E8 | P1 | S | 2 | ☑ | `SettingsHome/index.js:149-153,201-204,234-237` |
| AS-29 | Stagger token not `i*40` | E8 | P2 | S | 4 | ☑ | `SettingsHome/index.js:152` |
| AS-30 | Haptics on toggles + destructive | E8 | P2 | S | 4 | ☐ | `domains/Settings/**` |
| AS-31 | `PopupSuccess` hardcoded English | E9 | P1 | S | 2 | ☑ | `Base/PopupSuccess/index.js:54` |
| AS-32 | Dev toggle label i18n | E9 | P3 | S | def | ⊘ | `DevOfflineToggle/index.js:50` |
| AS-33 | `"Delete user?"` → verb label | E9 | P2 | S | 4 | ☐ | `en.json` `accountSettings.deleteUser` |
| AS-34 | Group into sections | E10 | P2 | M | 4 | ☐ | `SettingsHome/index.js` |
| AS-35 | Rename Settings "Find Records" | E10 | P2 | S | 4 | ☐ | `en.json` `accountSettings.findRecords` |
| AS-36 | Relocate dev toggle | E10 | P3 | S | def | ⊘ | `SettingsHome/index.js:145` |
| AS-37 | Show app version / build | E11 | P1 | S | 2 | ☑ | new; `expo-application` already a dep |
| AS-38 | Show session identity + org | E11 | P2 | S | 4 | ☐ | new; `UserContext` |
| **AS-01b** | **Confirm logout in the Support tab too** | **E1** | **P0** | **S** | **2** | ☑ | `SupportHome/index.js:157` |

**Totals**: 39 items · 6 in M1 · 13 in M2 · 6 in M3 · 11 in M4 · 1 separate · 2 deferred.
**Status legend**: ☐ Not started · ◐ In progress · ☑ Done · ⊘ Deferred · ⊗ Blocked

---

## Dependency graph

Most items are independent. These are not:

```
AS-08 (null.length crash)  ──blocks──▶  AS-04 (clear-cache confirm)
      └─ fixing the confirm without the crash still leaves a blank screen

AS-01 (logout confirm)     ──uses────▶  AS-03 (unsynced count)
      └─ AS-01 ships with an inline count; AS-03 promotes it to a row
      └─ do NOT block AS-01 on AS-03

AS-25 (secondaryContainer) ──blocks──▶  AS-34 (IA regroup)
      └─ regrouping adds SegmentedButtons; fix the purple fallback first

AS-21 (contrast, upstream) ──affects─▶  every text-mode button in the domain

AS-26 (legacy scale)       ──touches─▶  AS-27 (token violations)
      └─ do AS-26 first; it is the shared style factory

Open Decision #2 (offlineLogin intent) ──re-ranks──▶ AS-01
      └─ if offline login returns, AS-01 drops P0 → P2
```

---

## Epic E1 — Don't strand the promotor

The only genuinely safety-critical epic. Constraint #2 of the product (losing or blocking a
promotor's work is the worst outcome) meeting a missing dialog.

### AS-01 — Confirm before logging out · P0 · M

**Symptom.** `SettingsHome/index.js:260` renders Log out as `mode="contained"`, full-width,
~10pt above the floating tab bar, calling `logOut` directly. No confirmation.

**Consequence.** `context/auth.context.js:75-82` disables offline login outright
(`setError("signIn.offlineLoginError"); return false;`). Logout succeeds offline and deletes
`currentUser`. A promotor who taps this offline — deliberately, or by mis-reaching for the
tab bar beneath it — cannot log back in until they find a connection. Queued records survive
under `offlineIDForms` / `offlineSupForms` but are unreachable and cannot sync. The rest of
the day's collection is blocked.

**Acceptance criteria**
- Online, empty queue → confirm dialog, plain wording, proceeds on confirm.
- **Offline path** → dialog states they cannot log back in without internet, and names the
  unsynced count. Default action is Cancel.
- Online, queue non-empty → dialog names the count, offers to sync first.
- **Reconnect path** → n/a; terminal by design.
- Cancel leaves session and queue untouched.
- i18n: new `accountSettings.logoutConfirm*` in `en` / `es` / `hk`.

### AS-02 — Demote Log out, promote Back · P0 · S

The most destructive control has the highest visual emphasis and sits in the thumb path of
the tab bar. Swap to `mode="outlined"`; give Back the contained treatment; add bottom
spacing.

### AS-03 — Surface unsynced count · P1 · M

Settings is where people go before logging out or handing off a phone, and it says nothing
about pending work. `domains/Offline/index.js:36-38` already computes this correctly with
`?? 0` — reuse it.

**Acceptance criteria**
- Shows "N records waiting to sync" when N > 0; nothing when N = 0.
- **Offline path** → reads AsyncStorage, no network call.
- **Reconnect path** → refreshes on focus, decrements as the queue drains.
- Tapping navigates to the Offline tab.
- Copy distinguishes *saved on this device* from *saved to the server*.

---

## Epic E2 — Destructive actions need brakes

Five destructive actions, **zero confirmation dialogs** — despite `Alert.alert` already
imported and used for *results* in three of these files.

| ID | Action | Location | Today | P | Effort |
|---|---|---|---|---|---|
| AS-04 | Clear Cached ID Forms | `OfflineData/index.js:91-96` | instant, no confirm, no feedback | P0 | S |
| AS-05 | Reset Onboarding | `SettingsHome/index.js:240-248` | no confirm; clears data, navigates away | P1 | S |
| AS-06 | Delete user? | `SupportHome/index.js:145-151` | no confirm; renders un-red (AS-24) | P1 | S |
| AS-07 | Populate all ID Forms | `OfflineData/index.js:57-62` | loading + snackbar, but no size/metered warning | P2 | S |

**AS-04 detail.** `onPress={() => deleteData("residentData")}` — instant, un-awaited, silent.
Rebuilding requires `populateResidentDataCache()` (`OfflineData/index.js:35-39`), a network
call. Tap it in the field and offline resident search is empty for the day. Confirm must name
the record count and state that rebuilding needs internet.

**AS-06 note.** "Delete user?" is a button label with a question mark, and it lives under
**Support**, not Account Settings. Account deletion for a vulnerable-population dataset is a
data-retention decision — see Open Decision #4.

---

## Epic E3 — Tell the truth about offline

### AS-08 — Fix the `null.length` crash · P0 · S

`FindRecords/index.js:23-24`:

```js
const residentData = await getData("residentData");
const residentDataCount = residentData.length;
```

`getData` returns `null` for a missing key (`modules/async-storage/index.js:9-12`). This
throws inside an async function whose `.then()` at line 31 never runs — `inputs` stays `[]`
and the screen renders a title and a Submit button over empty space. Triggered by AS-04,
**and on every fresh install.** Fix: `residentData?.length ?? 0`, matching
`domains/Offline/index.js:36-38`.

### AS-09 — Password and profile screens must detect offline · P1 · M

`Password/index.js:52-55` and `NamePhoneEmail/index.js:104-107` both call
`Parse.User.logIn(...)` — a full round trip — before saving. Neither reads `OfflineContext`,
though it exists and `OfflineData/index.js:29` uses it.

**Acceptance criteria**
- **Offline path** → the screen says so *before* the user types; Submit explains why it is
  disabled. No silent failure.
- **Reconnect path** → form still populated; no retyping.
- Server rejection distinguished from no-connection in the copy.
- Input preserved on every failure (currently true — this is regression protection).

### AS-10 — Rewrite the shared error copy · P1 · S

Both `passwordSettings.errorMessage` and `namePhoneEmailSettings.errorMessage` end:

> "...contact your supervisor if the issue persits."

Three defects in one string: a typo (**persits**), cause-guessing instead of detection, and
no local-vs-server distinction. Fix across `en` / `es` / `hk`; split into distinct offline /
wrong-password / server-error strings.

### AS-11 — Fix `currentReccordsStored` key · P2 · S

Misspelled key that will propagate to `es` and `hk`. Rename while there are three call sites.

---

## Epic E4 — Credential handling

### AS-12 — Add `secureTextEntry` to Change Password · P0 · S

`Password/index.js:96` and `:105` — two `TextInput`s, **neither masked**, while the app's own
`SignIn/index.js:261` and `SignUp/index.js:216,223` both use `secureTextEntry`. The only
screen in the app that renders a password in the clear. On a shared phone in a community
setting that is a real exposure.

### AS-13 — Confirm-password field and length validation · P1 · S

No confirmation field, no minimum length. A typo locks the user out on next login — and per
AS-01 that is unrecoverable offline. **No strength meter** (see What Not To Do).

### AS-14 — Plaintext password at rest · P1 · L · separate epic

`Password/index.js:48` compares against `currentUser.password` from AsyncStorage;
`NamePhoneEmail/index.js:104-107` re-authenticates with it. The cause is that `currentUser`
is stored *with* `password` and re-login depends on it — this reaches into Auth and the
offline session model. **File on its own.** Bundling it stalls M1.

---

## Epic E5 — Edit screens that actually work

### AS-15 — Cancel doesn't cancel · P1 · M

`NamePhoneEmail/index.js:174-191` and `FindRecords/index.js:138-155` — ✓ and ✗ both execute
exactly `setEdit("")`. No revert path. **The ✗ is a lie.** Fix with local draft state.

### AS-16 — Edit fields show no current value · P1 · M

`NamePhoneEmail/index.js:35-57` builds `inputs` inside `.then()` reading `userObject` from the
previous render's closure. On first mount every `value` is `undefined`, so
`placeholder={result.value}` (line 169) renders empty. The user cannot see their current name
or phone number. Fix with controlled `value` and correct effect dependencies.

### AS-17 — State mutation defeats re-render · P2 · S

`updateUserObject` (`NamePhoneEmail/index.js:69-73`) and `updateCurrentData`
(`FindRecords/index.js:93-97`) mutate and pass the same reference back, so React can bail out
of re-rendering. Copy before setting.

### AS-18 — Numeric field, alphabetic keyboard · P2 · S

`FindRecords/index.js:135` saves the raw string as the record storage limit with no
`keyboardType`. Add `keyboardType="number-pad"`, `Number()` coercion, sane clamp.

---

## Epic E6 — Accessibility and field legibility

Constraint #6: bright sun, one-handed, sometimes gloved. Correctness here, not polish.

### AS-19 — Make whole rows tappable · P1 · M

`SettingsHome/index.js:179-194` and `SupportHome/index.js:108-125` — a `<Text>` beside an
`IconButton` pushed right with `marginLeft:"auto"`; **only the IconButton has `onPress`.** The
row looks tappable and is not, forcing a one-handed user to hit a ~48pt target at the far
right edge. Wrap in `TouchableOpacity` or Paper `List.Item`.

### AS-20 — Add accessibility props · P1 · M

`grep -rn "accessibilityLabel\|accessibilityRole\|accessibilityState" domains/Settings/`
returns **0**. Both Switches (`DevOfflineToggle/index.js:52-56`, `SettingsHome/index.js:226-229`)
are unlabelled to a screen reader.

### AS-21 — Fix primary-action contrast · P1 · M · upstream

`tkDliteSemanticColorActionPrimary` `#3d80fc` on `#f7f7f7` computes to **3.44:1**, below the
4.5:1 minimum. Affects every text-mode button (Support, Back, Reset Onboarding, Edit, Submit).
In direct sun this is readable vs. not. **Token defect — fix in `modules/theme/index.js` or
the token source so all consumers benefit.** Do not work around locally.

### AS-22 — Language selection signals with color alone · P2 · S

`Language/index.js:35-77` signals selection purely via Paper button `mode`. No check icon, no
`accessibilityState={{selected:true}}`. Same for the Calm Mode switch
(`SettingsHome/index.js:226`), which lacks the ON/OFF text `DevOfflineToggle` correctly pairs
with its switch.

---

## Epic E7 — Design system compliance

### AS-23 — `IconButton color=` is not a Paper v5 prop · P1 · S

Paper v5 (confirmed 5.15.1) uses `iconColor`. Affected: `SettingsHome/index.js:184`,
`NamePhoneEmail/index.js:176,186`, `FindRecords/index.js:140,150`,
`SupportHome/index.js:94,117`. Chevrons render grey instead of primary — visible in
`.claude/screenshots/08-settings.png`.

### AS-24 — Delete-user button has no destructive color · P1 · S

`SupportHome/index.js:146` — `<Button color={theme.colors.error}>`. Paper v5 wants
`textColor`. The account-deletion button has **no destructive styling at all**.

### AS-25 — Map `secondaryContainer` in the theme · P1 · S · upstream

`modules/theme/index.js:29-99` does not map `secondaryContainer` / `onSecondaryContainer`, so
Paper's `SegmentedButtons` falls back to MD3 baseline lavender `#E8DEF8`. Visible in
`08-settings.png`: the Theme selector's active segment is purple while every other action is
`#3d80fc`.

### AS-26 — Migrate `index.styles.js` off the legacy scale · P2 · M

`index.styles.js:2` imports the legacy `spacing`/`typography` scales, which *shadow* dlite
with different values (`spacing.md` = 12 vs `SpacingMd` = 16). Shared style factory for the
whole domain — **the single highest-leverage migration here.** `SettingsHome/index.js:5` and
`SupportHome/index.js:4` are new importers.

### AS-27 — Token violations · P2 · S each

| File:line | Rule | Fix |
|---|---|---|
| `SettingsHome/index.js:221` | hardcoded `fontSize: 14` | `t.tkDliteSemanticTypographySize300` |
| `SettingsHome/index.js:185-189` | inline style; negative margins shave the hit target | StyleSheet; drop negatives |
| `SettingsHome/index.js:124,128-132,179,210-216` | inline objects reallocated every render | StyleSheet factory |
| `index.styles.js:42-43` | `marginTop:-3, marginBottom:-5` | remove |
| `index.styles.js:14,20` | `borderBottomWidth: 1` | `t.tkDliteSemanticSpacingXxxs` |
| `SupportHome/index.js:70,75` | `paddingRight/Left: "5%"` | `t.tkDliteSemanticSpacing400` |
| `SupportHome/index.js:141,148` | `marginTop: 20` + `"5%"` | `Spacing500` / `Spacing400` |
| `SupportHome/index.js:96-100,114-118` | negative-margin inline styles | StyleSheet |
| `Base/PopupSuccess/index.js:45` | `tintColor="rgba(34,197,94,0.3)"` | compose from `tkDliteSemanticColorFeedbackSuccess` |
| `Base/PopupSuccess/index.js:23,30` | legacy `spacing.radiusMedium` | `t.tkDliteSemanticBorderRadiusMd` |

---

## Epic E8 — Motion and delight

### AS-28 — The Calm Mode screen ignores Calm Mode · P1 · S

`SettingsHome/index.js:149-153, 201-204, 234-237` — `RowEntrance` runs unconditionally and
never calls `useMotion()` (`modules/utils/animations.js:589`). The screen that *hosts* the
Calm Mode toggle does not honor it. For a user who enabled it because motion is a problem for
them, that is the worst possible screen to get wrong.

### AS-29 — Hardcoded stagger · P2 · S

`SettingsHome/index.js:152` — `i * 40`. Use `MOTION_TOKENS.STAGGER_DELAY` (50,
`animations.js:271`).

### AS-30 — No haptics anywhere in Settings · P2 · S

Zero `Haptics` calls in `domains/Settings/**`, while established in DataCollection forms,
Onboarding, and `AnimatedTabBar`. On a destructive confirm, haptic feedback is a second
channel that survives bright sun.

---

## Epic E9 — i18n and copy

### AS-31 — `PopupSuccess` ships hardcoded English · P1 · S

`Base/PopupSuccess/index.js:54` — `{submittedForms} Records Successfully Stored!` is not an
i18n key. A Kreyòl-speaking promotor gets English on the Populate success path. Constraint #5:
**Kreyòl is the one most likely to be silently skipped.**

### AS-32 — Dev toggle label hardcoded · P3 · S · deferred

`DevOfflineToggle/index.js:50`. `__DEV__`-gated; no promotor sees it.

### AS-33 — `"Delete user?"` as a button label · P2 · S

A question mark in a button label reads as uncertainty about what the button does. Make the
button a verb; put the question in the confirm dialog (AS-06).

---

## Epic E10 — Information architecture

### AS-34 — Group the sections · P2 · M

Flat is not the core problem; **interleaving** is. A dev toggle, five nav rows, a theme
control, an accessibility toggle, a state-destroying dev action, and Log out are all siblings
in one scroll.

Proposed: **Your account** (Name/Phone/Email, Change Password) · **Display** (Language, Theme,
Calm Mode) · **Offline data** (record limit, Offline Data Query, unsynced count from AS-03) ·
**Developer** (`__DEV__` only) · then Log out, visually separated.

**Do not do this before M1.** Most visible change, least valuable; it would make the screen
*look* fixed while AS-01 is still live.

### AS-35 — Rename "Find Records" in Settings · P2 · S

`accountSettings.findRecords` opens a screen containing `currentReccordsStored` and
`recordStorageLimit` — offline cache sizing, not search. The label collides with the Find
Records tab. **Check with partner orgs first** — Open Decision #3.

### AS-36 — Relocate the dev toggle · P3 · S · deferred

`SettingsHome/index.js:145` mounts `DevOfflineToggle` above the account rows, so it heads the
screen in every dev build and screenshot. `__DEV__`-gated; developer ergonomics only.

---

## Epic E11 — Production-readiness additions

The only items that are *features* rather than fixes.

### AS-37 — Show app version and build number · P1 · S

Confirmed absent: `grep -rn "version" domains/Settings/` returns nothing. When a promotor
reports a problem over WhatsApp, the first question is "which version?" and there is no way
for them to answer. `expo-application` is already a dependency. Show version, build, and
environment at the bottom; long-press to copy.

### AS-38 — Session identity · P2 · S

The screen never says who is logged in or which `surveyingOrganization` is active. Records are
scoped by organization; on a shared or handed-off phone, "am I still logged in as the last
person?" is a real question with data-integrity consequences.

---

## Definition of done, per milestone

A milestone is not Done when the code is written. It is Done when all of:

1. Every item's test was **seen failing first**, then passing.
2. `yarn test-run` green — full suite, no flag overrides.
3. `npx eslint` clean on every touched file.
4. Any user-visible change verified on the iOS simulator.
5. New or changed copy exists in **`en.json`, `es.json`, and `hk.json`** —
   `yarn lint:locale-sync` clean. Kreyòl gets silently skipped; check it explicitly.
6. Offline path and reconnect path both stated in the test, or explicitly N/A.
7. Committed with a message naming the AS-IDs it closes.

---

## What NOT to do

- **Don't rewrite Settings as a navigation stack.** The `useState` view-switching
  (`SettingsHome/index.js:73`, `AccountSettings/index.js:24-34`) is inelegant but functional,
  and is not what is hurting promotores. A rewrite consumes the budget and lands the same
  behavior.
- **Don't do the IA regroup first.** Most visible, least valuable. See AS-34.
- **Don't add a password-strength meter.** No decision hangs on the score, and it is a
  literacy and language barrier in three languages. Ship `secureTextEntry` and a confirm field.
- **Don't plumb Calm Mode through the whole app here.** Only `useMotion` reads it — a real gap,
  but app-wide. AS-28 fixes only this screen.
- **Don't bundle AS-14.** Plaintext credentials at rest reaches into Auth and the offline
  session model. Bundling stalls M1 behind a design question.
- **Don't add analytics to "measure settings usage."** Metrics theater. No decision changes
  based on how often someone opens Language, and telemetry on a metered connection is not free.

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Open Decision #2 answered "offline login is coming back" | Medium | Re-ranks AS-01 P0→P2; M1 loses its headline | Ask before AS-01; rest of M1 stands regardless |
| Confirm dialogs break existing Maestro flows | High | `.maestro/*.yaml` taps now hit a dialog | Update flows in the same commit; `offline-*.yaml` and `authenticated.yaml` exposed |
| Contrast fix (AS-21) changes the brand blue | Medium | Visual change across the *whole app* | Compose a darker on-light variant rather than changing `ActionPrimary` globally; verify both themes |
| `index.styles.js` migration shifts spacing domain-wide | Medium | `spacing.md`=12 → `SpacingMd`=16 is a visible 4px shift per row | Snapshot tests first; verify on device before committing |
| Scope creep into Auth via AS-14 | High | Stalls M1 behind a session-model redesign | Deferred to M5; don't touch `auth.context.js` beyond reading state for AS-01 |
| Test-first on 38 items slower than expected | High | Milestones slip | Sizes include tests; if slipping, cut M4, never M1 |

---

## Open decisions — these need a human

1. **Block offline logout outright, or hard-warn?** Blocking is safer given `offlineLogin` is
   disabled. But if promotores share or hand off devices mid-shift, blocking is wrong.
   **A field-practice question that cannot be answered from the repo.** Gates AS-01's criteria.
2. **Is `offlineLogin` disabled permanently?** (`context/auth.context.js:75-82` — a one-line
   stub with a comment.) The entire severity of AS-01 hinges on it.
3. **Has any partner org trained staff on the "Find Records" settings label?** Gates AS-35.
4. **What should account deletion actually delete** for a dataset about vulnerable people —
   the account, the records, or neither? Today it opens an external web URL. A data-retention
   decision (constraint #3), not a settings row. Gates AS-06 beyond the dialog.
5. **M1 scope: all 6, or the AS-01/AS-08/AS-12 core?**

---

## Assumptions to validate

Inference or assumption, **not** established fact. Flagged because the distance between this
repo and a doorstep in the DR is the largest source of confident wrongness available here.

- **Assumption** — promotores actually encounter the offline-logout path. The code proves it
  is *possible*; nobody has proven it is *frequent*. If it has never happened, AS-01 is still
  worth one dialog but is not an emergency.
- **Assumption** — phones are shared or handed off. Drives AS-38 and Open Decision #1.
- **Assumption** — promotores read error copy rather than retrying blindly. If they retry
  blindly, AS-10 matters less and AS-09's pre-emptive banner matters more.
- **Inference** — the grey chevrons in `08-settings.png` are caused by the Paper v5
  `color`→`iconColor` rename. The prop misuse is a **Fact** (verified against 5.15.1); that it
  is the sole cause is inference.
- **Fact** — no accessibility props in the domain; no app version in the domain; no
  `secureTextEntry` in `Password/index.js`; `getData` returns `null`; `offlineLogin` returns
  `false`. All verified by direct read.
- **Not established** — how many promotores are active, which partner orgs are live, whether
  data loss has actually occurred. If these arrive, re-rank.

---

## Progress log

| Date | Milestone | Items closed | Notes |
|---|---|---|---|
| 2026-07-31 | — | — | Backlog + roadmap created from read-only audit |
| 2026-07-31 | **M1 complete** | AS-01, AS-02, AS-04, AS-05, AS-08, AS-12 | All six via red-green-tdd, each test seen failing first. Suite 52→56 suites, 369→381 tests, green. ESLint clean. All new copy in `en`/`es`/`hk`, `lint:locale-sync` reports 0 missing. Logout dialog verified on iPhone 16 simulator (`.claude/screenshots/m1-logout-confirm.png`). No Maestro flow taps these controls, so none needed updating. **Open Decision #1 resolved as hard-warn, not block** — see note below. |

### Decision taken during M1

**Open Decision #1 — hard-warn, not block.** AS-01 warns and requires confirmation when
offline; it does not prevent logout. Rationale: warning adds information without removing
capability, and if a device is genuinely shared or handed off mid-shift, blocking would be
the wrong behavior. If field practice says otherwise, converting the destructive button to
a disabled state is a small delta on top of what shipped.

**Open Decision #2 remains open** and still matters: if `offlineLogin`
(`context/auth.context.js:75-82`) is intended to come back, AS-01's severity drops and the
offline warning copy should soften.

| 2026-07-31 | **M2 complete** | AS-03, AS-06, AS-09, AS-10, AS-13, AS-21, AS-23, AS-24, AS-25, AS-28, AS-31, AS-37, AS-01b | 13 items across three commits. Suite 392→401 tests, 60 suites, green. ESLint clean, locales in sync. Verified on simulator: Theme selector blue-tinted not lavender, chevrons blue, actions high-contrast, version row present. AS-29 (stagger token) closed opportunistically with AS-28 since it was the same expression. |

| 2026-08-05 | **M3 code complete — device verification OUTSTANDING** | AS-15, AS-16, AS-17, AS-18, AS-19, AS-20, AS-22, AS-26 | Suite 401→420 tests, 62 suites, green. ESLint clean, locales in sync. **Clause 4 of the definition of done (verify on simulator) was NOT met** — the dev client hit a stale-packager `MessageQueue` runtime error and the relaunch was not completed. AS-19 (row layout), AS-22 (check icon) and AS-26 (style migration) are all visible changes and remain unverified on device. |

### AS-26 was not the risk it looked like

The risk register warned that migrating `index.styles.js` would shift spacing 4px domain-wide,
because legacy `spacing.md` (12) shadows `tkDliteSemanticSpacingMd` (16). That turned out not
to apply: this file only ever used `spacing.sm` (8), `spacing.lg` (16) and `spacing.xxl` (32),
and **all three map exactly** onto `Spacing200` / `Spacing400` / `Spacing800`. The migration is
pixel-identical, locked by `domains/Settings/__tests__/settingsStyles.unit.test.js` — a
characterization test written to pass *before* the change and still pass after. This is the
refactor phase, not red-green: behaviour does not change, so there is nothing to see fail.

Two deliberate exceptions to pixel-identity, both prescribed by the audit:
- the `svg` style's `marginTop:-3 / marginBottom:-5` magic numbers were removed (AS-27),
  which slightly *increases* the icon's effective touch height;
- `letterSpacing: 0.5` is preserved as a literal with a `TODO(dlite)`, because the body ramp
  specifies `"0em"` — a CSS string that does not drop into a React Native style. Changing it
  to 0 would be a real visual change; reconciling the token is the upstream fix.

### Found during M2: a second logout entry point (AS-01b)

`SupportHome/index.js` has its own Log out button, which AS-01 did not touch — it still
called the `logOut` prop directly, so the offline-stranding path was reachable one tap
away from a "fixed" screen. The confirmation is now extracted to
`modules/settings/confirmLogout.js` and **both** screens route through it. Any future
logout entry point must do the same.
