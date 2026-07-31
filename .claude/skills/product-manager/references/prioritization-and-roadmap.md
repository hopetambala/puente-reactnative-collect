# Prioritization and Roadmap

Choosing what's next, and sequencing it so a team can execute. The recurring failure is treating a scoring formula as a decision-maker — frameworks execute strategy, they don't create it.

---

## Choosing a prioritization framework (interactive)

There is no best framework. There's a fit between framework, product stage, data availability, and stakeholder dynamics. Ask 3–5 questions — product stage, team context, decision-making needs, data availability — then recommend one, explain how to implement it, and name the second choice.

**Scoring frameworks**
- **RICE** (Reach × Impact × Confidence ÷ Effort) — data-driven; needs real reach numbers. Wrong for pre-PMF, where you don't have reach data and would be multiplying guesses.
- **ICE** (Impact, Confidence, Ease) — lightweight gut-check; good for early stage and fast cycles; degrades into opinion at scale.
- **Value vs. Effort (2×2)** — fastest; good for a mixed backlog; hides strategic bets that are high-effort and high-value.
- **Weighted scoring** — custom criteria with stakeholder-agreed weights; good when multiple orgs must buy in; heavy to maintain.

**Strategic frameworks**
- **Kano** — classify by customer response: basic (expected, invisible when present, fatal when absent), performance (more is better), delight (unexpected). Prevents polishing delighters while a basic is broken.
- **Opportunity scoring** — importance vs. satisfaction gap; finds underserved needs.
- **Buy-a-feature** — customers allocate a budget; excellent for a stakeholder deadlock.
- **MoSCoW** (Must/Should/Could/Won't) — a forcing function for scope conversations; degrades when everything is a Must.

**Contextual frameworks**
- **Cost of Delay** — urgency-weighted; the right tool when timing dominates (compliance deadline, seasonal window, competitive response).
- **Impact mapping** — goal → actor → impact → deliverable; ties features to outcomes.
- **Story mapping** — journey-based sequencing; see below.

**Pitfalls**

- **Wrong framework for the stage.** *Symptom:* RICE pre-PMF. *Consequence:* precise-looking scores built on invented reach. *Fix:* ICE or value/effort until you have data.
- **Framework whiplash.** *Symptom:* a new method each quarter. *Consequence:* nothing is comparable across quarters and the team stops trusting any of it. *Fix:* commit for at least two cycles; reassess deliberately, not reactively.
- **Scores as gospel.** *Symptom:* "RICE says 4.2 so we're building it." *Fix:* the score starts the argument; judgment ends it.
- **Solo PM scoring.** *Fix:* score with engineering (effort) and design/research (impact) in the room, or the numbers are one person's opinion with decimals.
- **No framework at all.** *Symptom:* HiPPO prioritization — whoever spoke last. *Consequence:* the roadmap can't be defended and shifts under pressure.

---

## Epic hypothesis (component)

Frame a major initiative as something falsifiable *before* it consumes a quarter. Tim Herbig's Lean UX hypothesis format:

```
If we          [action or solution]
for            [target persona]
Then we will   [desirable outcome or job-to-be-done attained]
```

**Tiny Acts of Discovery** — the experiments that test it:
```
We will test our assumption by:
  - [experiment 1]
  - [experiment 2]
```

**Validation measures:**
```
We know our hypothesis is valid if within [timeframe] we observe:
  - [quantitative outcome]
  - [qualitative outcome]
```

**Why it works.** "Then we will" forces an outcome, not a shipping event. The timeframe makes the hypothesis falsifiable — without one, a failed bet stays alive indefinitely on the theory that adoption is still coming.

**Pitfalls:** a hypothesis that is a feature ("If we build a dashboard, then we will have a dashboard"); skipping experiments; validation measures like "users like it"; unrealistic timeframes chosen to match a planning cycle; treating epics as commitments rather than bets, which makes killing one a political act.

---

## Epic breakdown: the 9 splitting patterns (interactive)

Richard Lawrence / Humanizing Work. Three steps, applied in order.

**Step 1 — Pre-split validation (INVEST, minus "Small")**
Independent · Negotiable · Valuable · Estimable · ~~Small~~ · Testable. If a story fails *Valuable* or *Testable*, splitting won't fix it — it's mis-framed.

**Step 2 — Work the patterns in order until one fits**

1. **Workflow steps** — a *thin end-to-end slice* first, then thicken. Not "build step 1, then step 2."
2. **Operations (CRUD)** — Create, Read, Update, Delete as separate stories.
3. **Business rule variations** — different rules, different stories.
4. **Data variations** — different data types or structures.
5. **Data entry methods** — simple input first, rich UI later.
6. **Major effort** — "implement one, then add the remaining."
7. **Simple/complex** — the core simplest version, variations after.
8. **Defer performance** — make it work, then make it fast.
9. **Break out a spike** — time-boxed investigation when uncertainty blocks splitting.

**The meta-pattern behind all nine:** identify the core complexity → list all variations → reduce to **one complete slice** → each remaining variation becomes its own story.

**Step 3 — Evaluate the split.** The best split is the one that *reveals low-value work you can now drop*, or produces roughly equal-sized stories. If a split surfaces three variations and two of them serve nobody, the split just saved you two-thirds of the epic. That's the actual payoff.

**Vertical, always.** A slice touches every layer and delivers observable user value. "Front-end story" + "back-end story" is horizontal slicing: nothing is demoable until both land, and the team loses the ability to stop.

**Pitfalls:** skipping INVEST validation; step-by-step workflow splitting (pattern 1 done wrong — the classic); horizontal slicing; forcing a pattern that doesn't fit rather than moving down the list; not re-splitting stories that are still too big; skipping step 3, which is where the value is.

---

## User story mapping (component + workshop)

Jeff Patton. Two dimensions — a flat backlog is "context-free mulch."

```
Segment → Persona → Narrative (the user's goal)
═══════════════════════════════════════════════
[Activity 1] → [Activity 2] → [Activity 3] → [Activity 4]      ← backbone, left to right = time
     ↓              ↓              ↓              ↓
  [Step 1.1]     [Step 2.1]     [Step 3.1]     [Step 4.1]      ← ↓ = priority
  [Step 1.2]     [Step 2.2]     [Step 3.2]     [Step 4.2]
  ─────────────────────── Release 1: walking skeleton ─────────
  [Step 1.3]     [Step 2.3]     [Step 3.3]     [Step 4.3]
  ─────────────────────── Release 2 ───────────────────────────
```

**Horizontal = narrative flow. Vertical = priority.** Release slices cut horizontally across the whole map, so release 1 is a thin path through every activity — a walking skeleton the user can actually complete — not activity 1 built perfectly.

**Workshop flow:** define scope → identify users → generate backbone activities → generate tasks under each → cut release slices.

**Pitfalls:** a flat backlog with a map's formatting; technical architecture as the backbone (if the top row is "auth, API, database," it's not a user's journey); feature-complete waterfall where release 1 is everything under activity 1; too much detail too soon; the map living in a tool where nobody looks at it.

---

## Roadmap planning (workflow, 1–2 weeks)

**Phase 1 — Gather inputs** (day 1–2): strategy, validated opportunities, tech debt, commitments, capacity.
**Phase 2 — Define initiatives as epics** (day 3–4): each as an epic hypothesis, not a feature name.
**Phase 3 — Prioritize** (day 5): apply the chosen framework, with engineering in the room.
**Phase 4 — Sequence** (day 6–7): dependencies, capacity, risk-first ordering. Put the highest-uncertainty item early enough that a "no" still leaves room to change plans.
**Phase 5 — Communicate** (week 2): audience-specific versions.

**Roadmap types**

- **Now / Next / Later** — Now is committed, Next is high-confidence, Later is exploration. Best for agile teams under real uncertainty; it makes confidence explicit instead of implying false precision.
- **Theme-based** — organized by strategic themes ("Retention," "Enterprise readiness"). Best for executives; shows intent rather than parts.
- **Timeline / quarters** — best for resource planning and cross-team dependencies; carries the risk of being read as a contract.
- **Feature-based** — *anti-pattern.* A list of features with no strategic narrative and no customer problem framed. It survives because it's easy to build and impossible to argue with, which is exactly the problem.

**Pitfalls:** a feature-driven roadmap with no outcomes; HiPPO prioritization; the roadmap treated as a commitment (waterfall in agile clothing); no dependencies mapped, so sequencing collapses at execution; a solo PM roadmap presented as consensus.

---

## Cross-references

- Financial case for a specific item → `finance-and-growth.md`
- Turning a prioritized epic into a spec and stories → `delivery-artifacts.md`
- Validating a risky roadmap bet before committing the quarter → `validation-and-experiments.md`
- Getting the roadmap through stakeholders → `stakeholders-and-comms.md`
