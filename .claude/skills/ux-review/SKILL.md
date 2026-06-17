---
name: ux-review
description: >
  Use when any UI screen, component, or game interaction is complete or needs a
  quality pass. Orchestrates three narrow agents in parallel — dlite-auditor
  (token compliance), motion-auditor (animation system), and mobile-delight-auditor
  (haptics, empty states, celebrations, copy) — then synthesizes their reports into
  a unified fix plan before each agent applies its own fixes sequentially.
---

# UX Review Orchestration

## Core Principle

Every touchpoint in Loiter Maxx must satisfy three design layers simultaneously.
No layer can be fixed in isolation — a cohesive fix plan prevents agents from
working against each other (e.g., fixing a color while breaking an animation).

**Three layers, one review:**

| Agent | Layer | Owns |
|---|---|---|
| `dlite-auditor` | Visual tokens | Colors, spacing, borderRadius |
| `motion-auditor` | Animation system | Springs, durations, scale, library choice |
| `mobile-delight-auditor` | UX delight | Haptics, empty states, celebrations, copy, transitions |

---

## Three-Phase Pipeline

### Phase 1 — PARALLEL AUDIT

Launch all three agents simultaneously. Each audits the target file(s) independently
and returns a structured violation report. Do NOT let agents fix anything yet.

Instruct each agent:
> "Audit only — do not fix. Report all violations in the format: `<file:line> — <rule> — fix: <what>`"

Collect all three reports before proceeding.

**Gate:** Cannot advance to SYNTHESIZE until all three agents have returned their reports.

---

### Phase 2 — SYNTHESIZE

Read all three reports together. Your job is to produce a single, cohesive fix plan
that resolves all violations without conflicts. Consider:

- **Order dependencies** — a color fix might need to happen before a celebration
  animation references the same element
- **Cross-cutting fixes** — a button that needs a haptic, a token fix, AND a copy
  change should be described as one atomic edit, not three separate ones
- **Priority** — violations that affect game correctness (missing haptic on pick,
  broken empty state in lobby) outrank cosmetic ones (placeholder copy)

Output the unified plan in this format:

```
=== UNIFIED FIX PLAN ===

PRIORITY 1 — [file]
  [dlite] line N: replace #hex with t.semantic.color.*
  [motion] line N: replace hardcoded spring with getSpringForComponent('CARD')
  [delight] line N: add Haptics.impactAsync(Medium) to onPress

PRIORITY 2 — [file]
  ...

SEQUENTIAL FIX ORDER:
1. dlite-auditor fixes tokens first (color/spacing changes may affect layout)
2. motion-auditor fixes animations second (springs reference the same elements)
3. mobile-delight-auditor fixes delight layer last (haptics + copy sit on top)
```

**Gate:** Cannot advance to FIX until the unified plan is complete and coherent.
If two agents' fixes would conflict, resolve the conflict in the plan before proceeding.

---

### Phase 3 — SEQUENTIAL FIX

Invoke each agent in order, passing it the relevant section of the unified fix plan.
Each agent applies ONLY its fixes and confirms clean.

1. `dlite-auditor` — fixes token violations → must confirm `dlite-auditor: DONE`
2. `motion-auditor` — fixes animation violations → must confirm `motion-auditor: DONE`
3. `mobile-delight-auditor` — fixes delight gaps → must confirm `mobile-delight-auditor: DONE`

**Gate:** Cannot mark the review complete until all three agents confirm DONE.

---

## Critical Rules

- Agents must not be skipped even if their report is "clean" — a clean report is a gate pass
- Never weaken a fix to avoid conflict — resolve the conflict properly in the synthesis step
- If an agent finds a violation it cannot fix (requires new component, upstream token change),
  it documents it; the review still completes but the gap is surfaced for follow-up
- The delight layer is not optional — "it works" is not the same as "it feels good"

---

## When to invoke

**Automatically:** After completing any screen, component, or significant UI feature.

**Manually:** `/ux-review` — runs the full pipeline on the files you specify or,
if no files specified, on all recently modified files in `app/`, `components/`,
`modules/`, and `games/`.

---

## Definition of Done

A UI touchpoint is done when:

1. `dlite-auditor` reports zero violations — no hardcoded colors, spacing, or radius
2. `motion-auditor` reports zero violations — no forbidden libraries, hardcoded springs, or scale breaches
3. `mobile-delight-auditor` reports zero critical gaps — haptics on key interactions, personality in empty states, celebration on game moments, human copy
4. All three agents have confirmed `DONE` in this session
