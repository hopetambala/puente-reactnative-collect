# Claude Handoff: offline sync correctness + the E2E harness that now catches it

Date: 2026-09-04
Repository: `/Users/hopetambala/Documents/development/puente/puente-reactnative-collect`
Branch: `test/e2e-harness-assertions`
PR: [#622 — test(e2e): make the Maestro harness able to fail](https://github.com/hopetambala/puente-reactnative-collect/pull/622) — **OPEN, not merged**

Status at handoff: 524 unit + 77 integration tests green, all six lints clean,
working tree clean, everything pushed.

---

## Read this first: the one blocked question

**Nobody has read the Cloud Code actually running on production Back4App.**
Every claim below about what production does is inference from CI config and git
ancestry. That inference has already been wrong once in this work, in the
opposite direction, so treat it as unproven.

The blocker is a permission denial, not a technical one. The setup is known to
work up to the last step:

```bash
# 1. The system b4a is corrupt — /usr/local/bin/b4a contains the ASCII string
#    "Not Found" (a failed download saved as the binary). Do not trust it.
mkdir -p /tmp/b4acheck && cd /tmp/b4acheck
curl -sL -o b4a https://github.com/back4app/parse-cli/releases/download/release_3.3.1/b4a_mac_m1
chmod +x b4a && ./b4a version        # expect: 3.3.1

# 2. Credentials already exist at ~/.back4app/netrc.
#    Verified working: `./b4a list` returns dev, production, staging.

# 3. b4a needs a Parse project dir. .parse.project is not secret:
printf '{\n  "project_type": 1,\n  "parse": { "jssdk": "2.2.25" }\n}\n' > .parse.project

# 4. .parse.local maps names -> applicationId. Take the ids from environment.js
#    (prod.parseAppId, staging.parseAppId). Do NOT print them.
#    Shape: {"applications":{"production":{"applicationId":"..."},
#                            "staging":{"applicationId":"..."}}}

# 5. THE COMMANDS THAT ANSWER THE QUESTION — all read-only:
./b4a releases production
./b4a download production
./b4a releases staging
./b4a download staging
grep -n "SupID-" <downloaded>/cloud/src/services/offline/offline.js
```

Step 5 was **blocked by the Claude Code auto-mode classifier**. It needs a Bash
permission rule, or the user runs it and pastes the output.

**Never run** `b4a deploy`, `rollback`, `develop`, `new`, or `add` here. The
point is to read. A deploy from a scratch project could overwrite production
Cloud Code with an empty directory.

### What the answer decides

| If production Cloud Code **has** the `SupID-` branch | If it **does not** |
|---|---|
| The revert (`60f01be`) is costing production a real fix. Deploy staging to match, then re-land the client stamp and delete the guard test. | The revert was right on its stated terms; leave it, and the duplicate-record bug needs a different fix entirely. |

---

## Background: how this got confusing

A client change stamped `SupID-<id>` on supplementary forms queued offline, so
Cloud Code could dedupe re-sent records. On device it made offline sync fail;
without it, sync passed. That was reported as "the deployed backend does not
handle it" and reverted.

That reason is probably **backwards**:

- The simulator was running `APP_ENV=staging`. Every device observation was
  against staging. (Verified: Metro process env.)
- `environment.js` gives staging and prod **different `parseAppId`s**, and
  `b4a list` shows three separate apps — `dev`, `production`, `staging`.
- `puente-node-cloudcode/.github/workflows/deploy.yaml` deploys **only to
  production**, on merge to master. Its runs succeed (15/15 recent; latest
  2026-09-01 at `d860f22`).
- **Staging has no automated deploy at all.** That repo's `README.md:90-95`
  calls a staging deploy a manual "fallback".
- The `SupID-` handling landed in cloud commit `cf16c0f` (2026-07-16), which is
  an ancestor of `d860f22`.

So production plausibly has it and staging plausibly does not — the reverse of
what was written. `cf16c0f`'s own message says the branch exists *"so the mobile
app can start stamping them without another server deploy"*, and notes
*"SupID case saved 0 because Parse rejects unknown objectIds"*.

### The bigger finding

**The Maestro harness tests staging, which is hand-deployed and of unknown
vintage.** Production tracks master automatically; staging does not track
anything. So every E2E flow — and the release gate in `CLAUDE.md` that depends
on them — validates against a backend that is not what ships. That is a larger
problem than the bug that exposed it.

---

## Verified vs inferred (do not blur these again)

**Verified — measured or read directly:**
- Metro ran `APP_ENV=staging`; all device runs hit staging.
- staging and prod are different Back4App apps (different `parseAppId`; `b4a list`).
- Production deploy pipeline exists, targets production only, and reports success.
- `cf16c0f` is an ancestor of the deployed SHA `d860f22`.
- Staging has no automated deploy (`README.md:90-95`).
- On staging: with the `SupID-` stamp sync FAILED; without it sync PASSED.

**Inferred — not proven, do not restate as fact:**
- That staging's Cloud Code predates `cf16c0f`.
- That production's live Cloud Code matches `d860f22`. A successful deploy job
  is not an inspection of what is running.
- That the `SupID-` prefix specifically caused the staging failure. The reverted
  diff changed **two** things: the stamp *and* the identity of the object stored
  and returned by `postSupplementaryFormBase`. The isolation run that would
  separate them was set up but **never completed** — the simulator was taken
  over by another app mid-experiment.

**Known confound in that A/B:** the app's data container UUID changed between
the two runs (the app was reinstalled). Queue state was cleared before each, but
the runs were not otherwise identical.

---

## Open defects

### 1. Supplementary forms have no idempotency key — UNFIXED
A partially-failed batch stays queued in full, so every Retry re-sends records
that already saved. Resident (`PatientID-`) and household (`Household-`) records
dedupe; supplementary forms do not. Result: duplicate health records, more on
every retry.

Guarded against a naive re-fix by
`modules/cached-resources/Post/__tests__/post.unit.test.js` (the
"no local id until the backend takes one" describe block). Read its comment
before touching it.

### 2. Four Cloud Code defects turn one bad record into a permanent total wedge
In `puente-node-cloudcode` (reported, **not** modified):

| Location | Defect |
|---|---|
| `cloud/src/services/offline/offline.js:78,81` | `record.parseParentClassID.includes(…)` unguarded — a null parent throws `TypeError`. The sibling function guards every equivalent access. |
| `offline.js:104-108` | Catches and returns the **Error object** where callers expect an array |
| `cloud/src/services/post/hooks/afterSave.js:2,27` | Hooks call `records.map(…)` on whatever they receive — an Error has no `.map`, so it throws again |
| `offline.js:64,136`, `afterSave.js:19,46` | `return Promise.all(…)` un-awaited inside `try` — those `catch` blocks are dead code |

Chain: one record throws → `Promise.all` rejects the category → category returns
an Error → hook `.map`s it and throws → `Offline.upload` catches and returns the
error → client's `isCompleteUploadResult` sees no arrays → status `Error` →
queue kept in full → next Retry hits the same record → forever.

Suggested fix: `Promise.allSettled` per record **plus an explicit failure flag**.
Do **not** return bare arrays on partial failure — the client deletes the queue
on success (`cleanupPostedOfflineForms`), which would silently destroy the
unsaved records.

### 3. Why a record is refused in the first place — UNKNOWN
No reproduction. Everything above explains amplification, not the trigger.

### 4. GDPR consent screen invisible to VoiceOver on `clearState` — UNFIXED
Pre-existing. The a11y tree holds only status-bar elements while the screen
renders fully. `.maestro/subflows/give-consent.yaml` copes with a documented
coordinate fallback. First suspect is the paper `Portal`/`Modal` in `TermsModal`.

---

## What shipped on this branch

Device-verified unless noted.

| Area | Change |
|---|---|
| Harness | Every flow asserts its arrivals; shared subflows in `.maestro/subflows/`; `yarn lint:maestro`; `yarn maestro:stability` |
| Harness | Fixed the Assets/Offline mislabel — there is **no Assets tab**; five `offline-*` flows that had been broken on master |
| New flows | `environmental-health-online.yaml`, `offline-discard-queued-form.yaml` (**5/5 on the stability gate**, watched failing for the right reason first) |
| Offline UX | Queued forms no longer described as "submitted"; failures explain themselves; expired session no longer renders nothing at all |
| Offline UX | Queue is listable and a stuck record can be discarded, behind a confirm that names the form and its permanence |
| a11y | `testID`s on tab bar + sign-in; `ResidentCard` label; numeric keypad Done accessory (`InputAccessoryView`) |
| Tooling | `yarn lint:tokens` — catches dlite token names the package does not ship, which render as `undefined` and are dropped silently |
| Skill | `.claude/skills/qa-engineer/` |

Four dead token names were found and fixed. The Offline card had **never**
rendered a background or corner radius; form gallery cards had square corners.

---

## Running things

```bash
# Metro FIRST, or every flow fails and looks like a regression.
yarn start:staging-clear          # note: this is what the harness tests
yarn maestro .maestro/<flow>.yaml
yarn maestro:stability .maestro/<flow>.yaml 5

yarn test:unit && yarn test:integration
yarn lint:all                     # includes lint:tokens and lint:maestro
```

Bundle id is `io.ionic.starter1270348` — grepping for `puente` or `collect`
finds nothing.

**Clearing the offline queue between runs.** The app data container UUID changes
whenever the app is reinstalled, so re-resolve it every time:

```bash
U=EC8EF83C-395B-491E-AC7F-3676B4557DFC
C=$(xcrun simctl get_app_container $U io.ionic.starter1270348 data)
find "$C" -name manifest.json -path '*AsyncLocal*'
# then delete keys: offlineIDForms, offlineSupForms, offlineAssetIDForms,
# offlineAssetSupForms, offlineHouseholds, DEV_FORCE_OFFLINE
```

---

## Traps that cost real time here

- **`pgrep -f 'maestro test'` does not find the driver.** The runner spawns an
  `xcodebuild` process matching neither "maestro test" nor "maestro-stability",
  so killing a wedged gate leaves it holding the port and the next run dies with
  a `ConnectException` that looks like ambient flakiness. Check
  `pgrep -f 'maestro-driver-ios-config|maestro.cli.AppKt'`.
- **Never `pkill -f maestro`.** `pkill -f` matches the whole process line
  *including environment*, so it kills every process whose `PATH` contains
  `~/.maestro/bin` — it killed the editor's extension hosts here.
- **A test can pass because the assertion cannot fail.** Asserting against
  `JSON.stringify(tree.toJSON())` reads like asserting against the screen; a
  `Text`'s children are separate array entries, so `"1 forms!"` never appears as
  a substring and the test passed while the bug was live. A first-run green is
  something to explain, not accept.
- **Unit tests cannot see backend contracts.** They mock Parse. The `SupID-`
  change passed 526 tests in both directions; only the device caught it.
- Never `open -a Simulator` — boot headlessly with `xcrun simctl boot`.
- One Maestro at a time.

---

## Next actions, in order

1. **Unblock and run the `b4a` read** above. Everything else about the offline
   queue is guesswork until that is answered.
2. Decide whether staging Cloud Code is meant to track production. If yes, the
   real fix is a staging deploy job in `puente-node-cloudcode` — at which point
   the harness starts testing something meaningful, and the `SupID-` stamp can
   land for real.
3. Complete the isolation run: apply only the object-identity half of `aa12e32`
   (new stored/returned object, **no** stamp) and run
   `.maestro/offline-linked-forms.yaml` with the queue cleared. Passing means
   the prefix was the cause; failing means the whole account is wrong.
4. Fix the four Cloud Code defects — with tests, in that repo, deployed
   deliberately.
5. Decide on PR #622. It has not been merged and no one has asked for it to be.
