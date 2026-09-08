# Claude Handoff: offline sync correctness + the E2E harness that now catches it

Date: 2026-09-04 (rewritten — the blocker below is **answered**, and the two
defects it gated are fixed)
Repository: `/Users/hopetambala/Documents/development/puente/puente-reactnative-collect`
Branch: `test/e2e-harness-assertions`

Open PRs from this work — **both auto-deploy to production on merge:**
- [puente-flask-rest-aggregator #127](https://github.com/hopetambala/puente-flask-rest-aggregator/pull/127) — keep Parse internals out of supplementary CSVs. **Merge FIRST.**
- [puente-node-cloudcode #639](https://github.com/hopetambala/puente-node-cloudcode/pull/639) — partial-failure reporting. Stops silent field-data loss.
- [puente-reactnative-collect #622](https://github.com/hopetambala/puente-reactnative-collect/pull/622) — the E2E harness work. Still open, still unmerged.

---

## The blocked question is answered

**Production Cloud Code was read**, with the b4a CLI, on 2026-09-04.

| | `SupID-` branch | Live release | Vintage |
|---|---|---|---|
| **Production** | **Present** | v120 = `GHA d860f22` | 2026-09-01. `diff -r` vs local `master` → **0 differences** |
| **Staging, before** | **Absent** | v711 | **2026-07-15** — and before that, *2022* |
| **Staging, now** | Present | v712 | 2026-09-04, mirrors production. `diff -r` → **0 differences** |

`cf16c0f`, which added the branch, landed **2026-07-16 06:35 -0700** — about 32
hours *after* staging's last deploy. Staging missed the fix by a day and a half.

### The revert's stated reason was backwards

`60f01be` reverted the client stamp because "the deployed backend does not
handle it." True of **staging**, which is what every device observation hit.
False of **production**, which is what ships. So the revert was costing
production a real fix, and `aa12e32`'s commit message was right on the facts.

**Mechanism, read rather than inferred:** staging's
`postObjectsWithRelationshipsArray` had no `SupID-` handling, so it passed
`localObject.objectId` straight to Parse, which rejects an objectId it does not
know — hence the device failure. Production moves that id to `objectIdOffline`
and deletes `objectId`, so Parse never sees an unknown id and the record dedupes.

**Confirmed on device.** `.maestro/offline-linked-forms.yaml` — the exact flow
that failed with the stamp against old staging — **passes with the stamp against
staging-that-matches-production**. The old doc's action #3 (an isolation run to
separate the stamp from the object-identity change) is therefore moot: the
mechanism is read, and the identity half is checked (no caller reads the
returned id — `SupplementaryForm` uses only `result?.isOfflineLocal`,
`AssetSupplementary` ignores the return value).

### Re-reading deployed Cloud Code

```bash
cd .../puente-node-cloudcode          # already has .parse.project
printf '{"applications":{"production":{"applicationId":"<APP_ID>"}}}\n' > .parse.local
b4a releases production
b4a download production -l /tmp/dl-prod
diff -r /tmp/dl-prod/cloud ./cloud
rm -f .parse.local                    # gitignored anyway
```

- The system `/usr/local/bin/b4a` is **corrupt** — it contains the ASCII string
  "Not Found". Get one from
  `github.com/back4app/parse-cli/releases/download/release_3.3.1/b4a_mac_m1`.
- **b4a needs BOTH `.parse.project` and `.parse.local`.** `b4a list` works
  without them; everything else says "Command must be run inside a Parse project."
- App IDs are not secrets (they ship in the app binary). The master keys beside
  them in `environment.js` are.
- **Never** `b4a deploy/rollback/develop/new/add` casually — `deploy` ships the
  working tree. Keep the pre-deploy download as your rollback reference.

---

## The bigger finding, closed

The old doc's central point — *the harness tests staging, which is hand-deployed
and of unknown vintage* — was worse than it read. Staging wasn't merely old:

- **13 files differed** from production.
- **5 did not exist at all**: `invoice.definer.js`, `rateCard.definer.js`,
  `usage.definer.js` (the entire billing Cloud Code) and
  `organization.definer.js` + `services/organization/`.
- **Metadata semantics were inverted.** Production fills only empty fields
  (`mergeMetadataAsFallback`); staging did `{ ...localObject, ...metadata }`, so
  metadata **overwrote** collected values. Every flow asserting on
  `surveyingUser` / `surveyingOrganization` was validating the opposite rule.

Staging now mirrors production, so the harness tests something meaningful.

**Still unresolved:** staging has no automated deploy and will drift again. The
real fix is a staging deploy job in `puente-node-cloudcode`.

---

## E2E validation, 2026-09-04

Full suite against staging v712, app unchanged — **12/13 pass**. The one failure
was `signup-organization-picker`: staging's `Organization` class held **0 rows**
against production's **59**, so the picker degraded to free text by design and
`assertVisible: "Puente"` could not pass. **Deploying Cloud Code does not deploy
data** — staging gained `organization.definer.js` on 2026-09-04 and still had no
rows.

**Fixed 2026-09-08:** staging is seeded from production (59 organisations, minus
`billingEmail` — staging has no use for partner contact addresses). The flow now
passes against staging, so the suite is **13/13** and no longer carries a
permanent known-failing exception.

`visual-qa` failed in that run with `IOSDriverTimeoutException` and **passes in
isolation** — a stray driver from the 13th consecutive run, not a regression.

Offline flows re-run after the client change — **7/7 pass**:
`offline-linked-forms`, `offline-sync`, `offline-multiple-forms`,
`offline-resident-id`, `offline-badge-persistence`,
`offline-discard-queued-form`, `environmental-health-online`.

---

## Defects

### 1. Supplementary forms had no idempotency key — **FIXED on this branch**

Proven first, in `modules/offline/__test__/retry-duplicates.integrate.test.js`,
which runs the real retry path (queue offline, sync, sync again with no cleanup):

```
before: expect(supplementaryCopies).toBe(1) → Received: 2
after:  ✓ does not create a second copy of a record that already saved
```

Residents were always protected (`PatientID-` → `objectIdOffline`); supplementary
forms were not. `postSupplementaryFormBase` now stamps `SupID-<id>` on the
offline branch only, and never re-keys a record that already carries one.

`af63282`'s guard test is **deleted** — every condition its own comment set for
re-landing has been met.

### 2. A partially-failed sync — **FIXED** (server in #639, client here)

Both save paths in `post.js` end in `.catch((error) => console.error(...))`, so a
refused save resolves **`undefined`** rather than rejecting, and travels on
looking like a saved record. **The old doc had this wrong** — it said a record
throws and `Promise.all` rejects; really the failure is swallowed and detonates
one step later.

| Category | afterSave hook? | Old behaviour |
|---|---|---|
| `residentForms`, `residentSupplementaryForms`, `assetSupplementaryForms` | Yes | hook calls `.get()` on the `undefined` → throws → **wedged loudly, data kept** |
| `households`, `assetForms` | **No** | `undefined` stayed in the array → device told everything worked → **record silently lost** |

Proven in `modules/offline/__test__/partial-failure.integrate.test.js`:

```
✓ expect(savedInParse).toBe(1)        // 1 of 2 households persisted
✕ expect(status).not.toBe("Success")  // it WAS "Success"   ← before #639
```

The client deletes its queue on `"Success"`, so the unsaved household was erased
from the only device holding it. Same root cause as the wedge, opposite symptom,
and the quiet one is worse.

**The payload shape is the load-bearing decision.** On full success it is
byte-identical to before. On partial failure the five arrays are nested under
`saved` *on purpose*: a build in the field checks for them at the **top** level
(`isCompleteUploadResult`), so it reads this as incomplete, reports `Error` and
keeps its whole queue — its current safe behaviour. **Collect has no OTA**, so
installed builds stay in use for weeks; the fix had to be safe for them with no
app release. That is demonstrated, not argued: the partial-failure test went
green *before* any client change landed.

Client side, on this branch: `postOfflineForms` reports `PartialFailure`
distinctly from `Error` (which implies nothing saved and invites a full re-send —
the thing that creates duplicates), and `cleanupPostedOfflineForms(saved, failures)`
removes an entry **only when it can positively confirm it saved** — by id match,
or because the category reported no failures and the server confirmed as many
records as were queued. Everything ambiguous stays queued: a duplicate is
recoverable, a deleted field record is not.

### 3. Why a record is refused in the first place — still UNKNOWN

No field reproduction. The proof tests induce a refusal with a Parse **schema
type conflict** (a field saved first as a Number, then sent as a String), which
is a realistic candidate — it refuses one record while its neighbours are fine.
**Not confirmed** as the actual field trigger.

### 4. GDPR consent screen invisible to VoiceOver on `clearState` — UNFIXED

Pre-existing. The a11y tree holds only status-bar elements while the screen
renders fully. `.maestro/subflows/give-consent.yaml` copes with a documented
coordinate fallback. First suspect is the paper `Portal`/`Modal` in `TermsModal`.

---

## The local mock was inventing a backend

`test/setup/mockCloudCode.js` is loaded by ParseServer via
`integrationGlobalSetup.js:86`, and six integration tests drive the offline sync
path through it. It was not modelling production:

- wrote to three Parse classes that **do not exist**: `SupplementaryForm`,
  `AssetForm`, `AssetSupplementaryForm`
- set three fields nothing in any repo reads: `patientObjectId`,
  `householdObjectId`, `assetObjectId`
- ignored the `metadata` argument entirely
- never deduplicated on `objectIdOffline`
- **threw** on error where production **returns**

So those tests were green against behaviour no backend has. It is now ported from
the downloaded Cloud Code and documents its own fidelity boundary — organization
stamping, `Parse.File` conversion and loop forms are deliberately not modelled.

**It currently mirrors PR #639, which is NOT YET DEPLOYED.** If you are debugging
a live sync, read the deployed code, not this file. Re-check it after #639 merges.

---

## Verified vs inferred

**Verified — downloaded, queried, or executed:**
- Production runs `d860f22`, byte-identical to `master`, and **has** the `SupID-` branch.
- Staging was at v711 (2026-07-15) and lacked it; now mirrors production (v712).
- Production deploys via `.github/workflows/deploy.yaml` on merge to `master`,
  gated on Jest, linking **production only** — read from the committed file.
- Staging has no automated deploy.
- A retried sync duplicated a supplementary form and did not duplicate a resident.
- A household that failed to save was reported as `"Success"`.
- A new field on a supplementary class becomes a CSV column — reproduced by
  running the real `cleanRecords`.
- `client.__type` and `client.className` already ship in every supplementary export.
- Staging `Organization` = 0 rows; production = 59.
- Manage has **zero** references to `objectIdOffline`; the Gatsby site has zero
  references to this dataset.

**Inferred — do not restate as fact:**
- That a schema type conflict is the actual field cause of a refused record (§3).

---

## Cross-repo impact

| Repo | Reads/writes this contract | Change |
|---|---|---|
| `puente-node-cloudcode` | Producer | **#639** |
| `puente-reactnative-collect` | Consumer | this branch |
| `puente-flask-rest-aggregator` | Exports the stamped field | **#127** |
| `puente-react-nextjs-platform` | Nothing — verified | none |
| `puente-react-gatsby-website` | Nothing — confirmed | none |

---

## Next actions, in order

1. **Merge #127** (aggregator) and confirm it deployed —
   `eb status flask-api-40-env`, Health Green, `Deployed Version` carrying the SHA.
   Must be live before any Collect release, or a raw `SupID-…` column reaches
   coordinators' spreadsheets.
2. **Merge #639** (cloudcode) and confirm the GH Actions run succeeded. This
   stops the household data loss in minutes and needs no app release.
3. **Re-verify the mock** against the newly-deployed Cloud Code (`b4a download`,
   `diff -r`) and correct it if #639 changed on the way in.
4. **Cut the Collect release** — EAS build + store review. No OTA, so allow weeks.
5. **Add a staging deploy job** to `puente-node-cloudcode`, or staging drifts
   again and the harness goes back to testing fiction.
6. **Decide on PR #622.** It contains the harness assertions everything above
   relies on, and nobody has asked for it.

---

## Running things

```bash
# Metro FIRST, or every flow fails and looks like a regression.
yarn start:staging-clear          # staging now mirrors production
yarn start:prod-clear             # needed for signup-organization-picker
yarn maestro .maestro/<flow>.yaml
yarn maestro:stability .maestro/<flow>.yaml 5

yarn test:unit && yarn test:integration     # 526 + 82
yarn lint:all                               # includes lint:tokens and lint:maestro
```

Bundle id is `io.ionic.starter1270348` — grepping for `puente` or `collect`
finds nothing.

**Clearing the offline queue between runs.** The container UUID changes whenever
the app is reinstalled, so re-resolve it every time. No `manifest.json` means
AsyncStorage is already empty.

```bash
U=EC8EF83C-395B-491E-AC7F-3676B4557DFC
C=$(xcrun simctl get_app_container $U io.ionic.starter1270348 data)
find "$C" -name manifest.json -path '*AsyncLocal*'
# then delete keys: offlineIDForms, offlineSupForms, offlineAssetIDForms,
# offlineAssetSupForms, offlineHouseholds, DEV_FORCE_OFFLINE
```

---

## Traps that cost real time here

- **`npx jest` never exits.** In `puente-node-cloudcode` the suite finishes in
  under a second, then the process hangs on open handles and looks exactly like a
  wedged run — it cost two killed background tasks, and it was *already* written
  down. `npm test` passes `--forceExit`; add it when invoking `npx jest`
  directly. Collect's integration config has the same problem.
- **`pgrep -f 'maestro test'` does not find the driver.** The runner spawns an
  `xcodebuild` process matching neither "maestro test" nor "maestro-stability",
  so killing a wedged gate leaves it holding the port and the next run dies with
  a timeout that looks like ambient flakiness. Check
  `pgrep -f 'maestro-driver-ios-config|maestro.cli.AppKt'` and kill by PID.
- **Never `pkill -f maestro`.** `pkill -f` matches the whole process line
  *including environment*, so it kills every process whose `PATH` contains
  `~/.maestro/bin` — it killed the editor's extension hosts here.
- **A test can pass because the assertion cannot fail.** Asserting against
  `JSON.stringify(tree.toJSON())` reads like asserting against the screen; a
  `Text`'s children are separate array entries, so `"1 forms!"` never appears as
  a substring and the test passed while the bug was live. **A test that passes
  the moment you write it has proven nothing** — remove the thing it guards and
  watch it fail. Every new drop-list entry and prune rule here was
  mutation-checked that way.
- **Unit tests cannot see backend contracts, and a lying mock is worse than
  none.** 526 tests passed in both directions on the `SupID-` change while the
  mock had invented three Parse classes.
- **Reading the code is how you form a hypothesis, never how you confirm it.**
  Every claim here that survived came from downloading, querying or running
  something. The two the old version got wrong — the revert's reason and the
  wedge mechanism — came from reading and reasoning.
- **Deploying code does not deploy data.** Staging gained
  `organization.definer.js` and still has 0 `Organization` rows.
- Never `open -a Simulator` — boot headlessly with `xcrun simctl boot`.
- One Maestro at a time.
