# Delivery Artifacts

The documents engineering, design, and customers actually consume. Every one of these is a communication tool, not a compliance ritual — if nobody's behavior changes because it exists, it shouldn't.

---

## PRD (workflow, 2–4 days of real work)

Moves a team from scattered Slack threads to one source of truth. Ten sections; the phases below are how you get there without staring at a blank page.

### Structure

1. **Executive summary** — what, for whom, why now, in a paragraph. Written last.
2. **Problem statement** — who has it, what it is, why it's painful, and the **evidence**.
3. **Target users & personas** — primary and secondary. Secondary matters: it's how you catch the group the design quietly breaks.
4. **Strategic context** — how this connects to company/product strategy. If you can't write this section, that's the finding.
5. **Solution overview** — the approach, not the implementation. Describe capability and behavior; leave mechanism to engineering unless a constraint genuinely forces it.
6. **Success metrics** — primary, secondary, and **guardrail** metrics (what must *not* get worse).
7. **User stories & requirements** — the epic hypothesis plus stories with acceptance criteria.
8. **Out of scope** — explicit. This section prevents more scope creep than every other section combined.
9. **Dependencies & risks** — with mitigations and owners.
10. **Open questions** — with owners and decision-by dates. An open question with neither is a wish.

### Phases

| Phase | Time | Produces |
|---|---|---|
| 1. Executive summary (draft) | 30 min | A one-paragraph framing to react to |
| 2. Problem statement | 60 min | Problem + evidence |
| 3. Target users & personas | 30 min | Primary + secondary personas |
| 4. Strategic context | 45 min | The connection to strategy |
| 5. Solution overview | 60 min | Approach and rationale |
| 6. Success metrics | 30 min | Primary, secondary, guardrail |
| 7. Stories & requirements | 90–120 min | Epic hypothesis + stories |
| 8. Out of scope, dependencies, risks, open questions | 30 min | The boundary conditions |

**In a codebase:** ground sections 3, 5, and 9 in what's actually there. Real personas can often be inferred from the surfaces the product exposes; real dependencies are visible in the module graph and the package manifest; real risks frequently live in the code the team is nervous about touching. A PRD that names actual modules and constraints gets read; a generic one gets skimmed.

**Pitfalls:** written in isolation and presented as alignment; a problem statement with no evidence; a solution section so prescriptive it hands engineering an implementation and calls it a requirement; no success metrics; out-of-scope left undocumented because "it's obvious."

---

## User story (component)

Mike Cohn format + Gherkin acceptance criteria.

**Use case:**
```
As a        [user persona/role]
I want to   [action to achieve an outcome]
so that     [desired outcome]
```

**Acceptance criteria:**
```
Scenario:   [brief description]
Given:      [initial context / preconditions]
and Given:  [additional preconditions]
When:       [triggering event]
Then:       [expected outcome]
```

**Why it works.** "So that" is the whole point — it's what lets engineering propose a cheaper way to get the same outcome. Gherkin makes the criteria testable, so "done" isn't a negotiation. And the story is the *opening* of a conversation, not the transcript of one.

**Pitfalls**

- **Technical task in story clothing.** *Symptom:* "As a developer, I want to refactor the data layer." *Fix:* that's an engineering task. Use one. Not everything needs the costume.
- **"As a user."** *Symptom:* the generic persona. *Consequence:* nobody can judge whether the acceptance criteria are right. *Fix:* name the persona from your research.
- **"So that" restating "I want to."** *Symptom:* "…so that I can export the data." *Fix:* go one level up — why do they want it exported?
- **Multiple When/Thens crammed in.** *Consequence:* untestable, and usually a signal the story needs splitting. *Fix:* one scenario per behavior; add scenarios rather than clauses.
- **Untestable criteria.** *Symptom:* "Then the page loads quickly." *Fix:* quantify or drop it.

---

## Story splitting patterns (component)

The eight-pattern version, for when you're splitting a story rather than decomposing an epic (for epics, use the nine-pattern flow in `prioritization-and-roadmap.md`):

1. **Workflow steps** — sequential steps in the user's journey
2. **Business rule variations** — permissions, calculations, edge rules
3. **Data variations** — different types or inputs
4. **Acceptance criteria complexity** — when several When/Then pairs pile up, each is often its own story
5. **Major effort** — technical milestones or phases
6. **External dependencies** — split at the dependency boundary so you're not blocked
7. **DevOps steps** — deployment or infrastructure requirements
8. **Tiny Acts of Discovery** — when none of the above fit, the story contains an unknown; run a small experiment to unpack it

**Pitfalls:** horizontal slicing by technical layer; over-splitting into stories too small to carry value; meaningless splits ("part 1 / part 2"); creating hard dependencies between splits so they must ship together anyway; dropping the "so that" from the split stories, which strands them from their purpose.

---

## Storyboard (component)

Six frames, the classic narrative arc. The fastest way to make an abstract concept concrete for a room that isn't reading your PRD.

1. **Main character** — the persona and their context
2. **The problem emerges** — the obstacle
3. **The "oh crap" moment** — escalation; why it matters *now*
4. **The solution appears** — your product enters
5. **The "aha" moment** — the breakthrough, from the user's point of view
6. **Life after** — the improved state, concretely

**Frame 3 is the one people skip and the one that does the work.** Without escalation, the problem reads as mild inconvenience and the solution reads as unnecessary.

**Pitfalls:** a generic persona; a weak problem nobody would pay to solve; the solution appearing by magic rather than through a plausible discovery moment; a feature-centric "aha" (the aha is what the user achieves, not what the product does); a vague "after" state.

---

## EOL / deprecation message (component)

Killing something is a product decision that lives or dies on the communication. Nine parts:

1. **Company context** — who you are, your commitment to customers
2. **The announcement** — what's being discontinued, what replaces it
3. **The rationale** — **customer-benefit-focused.** "We're consolidating to invest in the workflow you use most" beats "this product line no longer meets our strategic objectives," which tells customers they're the line item.
4. **Current product context** — what it was and who it served. Acknowledging it mattered costs nothing and buys a lot.
5. **Customer impact** — how this affects them, stated plainly. Don't soften it; they'll discover the truth on migration day and remember the softening.
6. **Transition solution** — the replacement, and honestly how it differs
7. **Support measures** — migration help, tooling, contacts
8. **Timeline** — specific dates, including the last day it works
9. **Call to action** — what to do next, and who to talk to

**Pitfalls:** business-centric rationale; a vague timeline ("later this year"); no support plan; ignoring customer impact entirely; a terse or defensive tone, which reads as a company bracing rather than a company helping.

---

## Cross-references

- No validated problem yet → `discovery-and-framing.md`
- Epic too large to write stories for → `prioritization-and-roadmap.md`
- Launch announcement written *before* building → press release in `strategy-and-positioning.md`
- Success metrics that need a financial spine → `finance-and-growth.md`
- Who needs to review and approve → `stakeholders-and-comms.md`
