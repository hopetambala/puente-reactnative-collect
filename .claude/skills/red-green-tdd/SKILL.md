---
name: red-green-tdd
description: >
  Use for ALL new behavior in Puente Collect — adding or changing a function,
  component, screen, domain, hook, or fixing a bug. Orchestrates strict
  red-green-refactor TDD across three context-isolated subagents
  (tdd-test-writer → tdd-implementer → tdd-refactorer) with hard gates: the test
  is written and seen FAILING first (RED), then minimum code makes it pass
  (GREEN), then it is refactored with the suite staying green. A change that
  lands without a test that was seen failing first is not done. This is the
  project's standing rule (see the user memory `feedback_tdd_first.md`).
---

# Red-Green TDD — orchestrate test-first, always

In this repo, **no production behavior changes without a test that was watched
failing first.** Tests are written *before* the code, to drive it into
existence — for new features *and* bug fixes. If you're about to edit a source
file before its test exists, stop and run the pipeline.

This skill is the **orchestrator**. It runs each phase as a separate subagent so
the phases can't pollute each other's context: the test writer describes the
desired behavior without knowing the implementation, and the implementer sees
only a failing test, not your design ideas.

## The pipeline (one behavior at a time)

For each distinct, assertion-worthy behavior, run these three phases **in order,
honoring the gates between them.**

### Phase 1 — RED  →  invoke `tdd-test-writer`
Spawn the `tdd-test-writer` agent with **just the behavior requirement** (no
implementation hints). It writes one failing test and returns the test path, the
failure output, and a one-line summary.

> **GATE 1 — do NOT proceed to GREEN until RED is confirmed.** The returned
> failure must be the genuine assertion missing — not `Cannot find module`,
> `X is not a function`, or a render crash. If the failure is for the wrong
> reason, send it back to the test writer. No red, no green.

### Phase 2 — GREEN  →  invoke `tdd-implementer`
Spawn the `tdd-implementer` agent with **only the failing test path + its
failure output**. It writes the minimum code to pass and returns the modified
source files and the passing output.

> **GATE 2 — do NOT proceed to REFACTOR until the test passes.** If the
> implementer reports the test seems wrong, fix the test (re-enter Phase 1) —
> never let the implementer edit tests to force green.

### Phase 3 — REFACTOR  →  invoke `tdd-refactorer`
Spawn the `tdd-refactorer` agent with the list of changed files. It applies
behavior-preserving cleanups (dedup, naming, [dlite tokens](../dlite-design-system/SKILL.md))
or returns "No refactoring needed", and re-runs the full suite green.

Then move to the next behavior and repeat.

## Never

- Write implementation before the test.
- Proceed to Green without seeing Red fail **for the right reason**.
- Edit, skip, weaken, or delete a test to make it pass.
- Skip the Refactor evaluation (skipping is fine; *not evaluating* is not).

## When to run it inline vs. via subagents

Default to the **subagent pipeline** for any feature or multi-file work — the
context isolation is the point. For a trivial single-assertion tweak you may run
the same loop inline (write test → see it red → implement → green → refactor),
but the gates are identical and non-negotiable.

## Bug fixes are TDD too

Start with a **failing regression test** that reproduces the bug:
1. Test the *correct* behavior — its red proves you reproduced the bug.
2. Fix the code to green.
3. The test now guards against regression.

---

## Project conventions (reference for the subagents)

### Running tests
```
npx jest domains/Foo/__tests__/Foo.unit.test.js --forceExit   # one file — the red/green loop
npx jest -t "partial test name" --forceExit                   # one test by name
yarn test-run                                                  # full suite — before declaring done
yarn test:unit                                                 # unit tests only (excludes integration)
```

### Test location & setup
- Tests live in a `__tests__/` folder **inside** the domain or module folder:
  `domains/Foo/index.js` → `domains/Foo/__tests__/Foo.unit.test.js`.
- Integration tests use the `.integration.test.js` suffix and are excluded from
  `yarn test:unit`.
- No `import '@testing-library/jest-dom'` — use `@testing-library/react-native`.

### Mock boundaries (match neighboring files)
- `jest.mock('react-native-paper', …)` — flat `mockColors` object; `useTheme`
  returns `{ colors: mockColors }`; `SegmentedButtons` renders a plain `<text>`.
- `jest.mock('@app/impacto-design-system/Base/Text', …)` — wraps children in
  plain `<Text>` from react-native.
- `jest.mock('@app/impacto-design-system/Base/GlassContainer', …)` — renders
  children in a Fragment.
- `jest.mock('parse', …)` — `Parse.Query` chain methods return `this`, with
  `find`/`count`/`save`; use `equalTo`/`limit` for queries.
- `jest.mock('@react-navigation/native', …)` — `useNavigation` returns
  `{ navigate: jest.fn(), goBack: jest.fn() }`.
- Wrap components that read `UserContext` in
  `<UserContext.Provider value={mockUser}>`.

### Targeting
- **Pure functions** (completeness scoring, dedup, formatters, reducers) are
  the cheapest, highest-value targets — export and test inputs → outputs.
- **Components/Screens** — test observable behavior (what renders, what a press
  calls), one behavior per `it`.

## Definition of done

1. Every new/changed behavior has a test that was **seen failing first**.
2. `yarn test-run` — full suite green (or `yarn test:unit` for unit-only work).
3. Styling touched? Tokens from `modules/theme/tokens.js` used instead of
   hard-coded hex/spacing values (see [dlite-design-system skill](../dlite-design-system/SKILL.md)).

If you can't honestly say each test was red before it was green, the work isn't
following this skill — go back and prove the test fails.
