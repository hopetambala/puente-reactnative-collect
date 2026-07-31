# Stakeholders and Communication

Most product failures that get called "execution problems" are alignment problems that were visible early. This is the sequence: find everyone → prioritize them → plan the specific conversation.

---

## Stakeholder identification (component)

Map every stakeholder **before engaging anyone**. The goal here is a *complete* list, not a prioritized one.

**Allies, Audiences, Influencers** — three different engagement jobs:
- **Allies** actively support the initiative → recruit them
- **Audiences** are impacted by it → inform them
- **Influencers** shape opinion or decisions without being directly affected → persuade them

**R/P/D marking** — tag each person as a source of:
- **R**esources (budget, headcount, access)
- **P**ermission (approval to proceed, regulatory or security clearance)
- **D**ecision authority (final say)

One person can hold several tags. This immediately separates who can fund, block, or green-light from who is merely interested — and "merely interested" people consume enormous PM bandwidth if you don't sort them.

**Equity lens** — deliberately stretch the list to include people usually excluded: frontline staff whose workflow changes, marginalized user populations, downstream communities, anyone who bears the consequences without organizational power to influence the design. Without this step, teams optimize for loud, well-resourced voices and build products that fail the quieter majority.

**Primary / secondary / tertiary effects** — trace the ripple. A change to how support agents work (primary) changes how customers experience service (secondary), which changes churn and reputation (tertiary). Single-level thinking misses two-thirds of the stakeholders.

**Notice bias and assumptions** — an explicit check: who did we default to naming? Who is absent? Whose perspective are we treating as universal? Name the blind spots before they become requirements gaps.

**Pitfalls:** treating the first brainstorm as final; listing roles or org units instead of people (you can't have a conversation with "Marketing"); conflating identification with prioritization and cutting people you haven't understood yet; skipping the bias check; running it solo; producing a complete list with no next steps attached.

---

## Stakeholder mapping (component)

Prioritize the identified set. **Run both grids** — each shows something the other cannot.

### Grid 1 — Power × Interest (engagement strategy)

| | High interest | Low interest |
|---|---|---|
| **High power** | **Manage closely** — co-design, frequent touchpoints | **Keep satisfied** — executive briefings, strategic framing |
| **Low power** | **Keep informed** — demos, newsletters, transparency | **Monitor** — light touch |

### Grid 2 — Impact × Power (whose voice to elevate)

| | High power | Low power |
|---|---|---|
| **High impact** | **Q2** — impacted and empowered; manage closely | **Q1** — impacted but marginalized; **elevate deliberately** |
| **Low impact** | **Q4** — gatekeepers; manage the relationship, lower depth | **Q3** — monitor, minimal investment |

**Impact ≠ power, and conflating them is the most common mapping error.** A frontline support agent has high impact (their whole day changes) and low power (no seat at the roadmap table). A VP of Finance has high power (budget) and low impact (the product doesn't change their work). Treating them the same produces a plan that fails both.

**Elevating Q1 voices** is not only equitable — it's risk reduction. High-impact/low-power people are the ones most likely to experience your failure modes and least likely to appear in your feedback loops. Give them named roles in research recruitment, usability testing, and requirements review.

**Quadrant migration** turns the map from a snapshot into a plan. A skeptical executive currently in "monitor" who needs to become a sponsor requires a different set of actions than one already in "manage closely." Make the intended move explicit.

**Pitfalls:** running only one grid; conflating org seniority with power (the staff engineer everyone defers to may outrank the VP on your initiative); treating placement as permanent; stopping at placement without engagement actions; ranking within quadrants at placement time (premature precision); letting Q1 stakeholders stay decorative — named in the map, absent from every decision.

---

## Stakeholder engagement planning (interactive)

Generic engagement fails because it gives every stakeholder the same message, medium, and cadence. Plan the **specific conversation**.

**Two phases, and skipping the first is the usual error:**

**Diagnosis** — who is this person, what drives them, what's the relationship history, what's the context (first contact / conflict recovery / pre-launch buy-in / maintaining alignment)?

**Planning** — what you'll say, through which medium, with what desired outcome.

**Map both sides.** The most common failure is planning only your half. What does the stakeholder need, want, and fear — separately from what you need from them? Where those overlap, you have an alignment path. Where they diverge, you have a negotiation to prepare for, and pretending otherwise means walking into it unprepared.

**Proxies** — when a stakeholder is hard to reach or represents a group, name the proxy explicitly and verify they're representative. A *validated* proxy understands and can speak for the people they represent. A *convenient* proxy is whoever shows up to meetings, and they frequently cannot.

**Medium signals importance.** A Slack message and a scheduled 30-minute conversation communicate different things about how much you value someone's input, independent of content.

**Every plan ends with a named next action:** who does what, by when, through which medium, with what key message and desired outcome. Without it, it's an intention.

**Pitfalls:** planning only your side; running it on every stakeholder regardless of priority; treating the plan as permanent; substituting a convenient proxy for a credible one; ending with no named next action; using the same medium for everyone.

---

## Incoming request breakdown (interactive)

For a loaded Slack ping, email, mandate, escalation, or FYI — decode it **before** you respond.

### The two ideas that make this work

**The ask vs. the job-to-be-done.** The literal ask is what the words request. The job is the outcome the sender is actually chasing. *"Can we get the dashboard redesign into next sprint?"* is the ask; *"I need something concrete to show the board that we're responsive"* may be the job. **Responding to the ask when the job is different is how PMs build the wrong thing fast** — and quickly.

**Success criteria vs. must-haves.** These are not the same, and PMs blur them constantly:
- **Success criteria** = how the sender will *judge* whether it worked (the pass/fail bar)
- **Must-haves** = what has to go *into* the deliverable (the hard requirements)

A deliverable can hit every must-have and still fail the success criteria.

**Read the sender:** who sent it, their role relative to your work, and whether they're upstream (they set your priorities), a peer (they need your cooperation), or downstream (they depend on your output). Power and stake change the correct response even when the words are identical. A "quick question" from the CEO is not a quick question.

### The 12-section breakdown

1. **Classify** — ping / mandate / escalation / FYI / request
2. **Sender read** — role, power, stake
3. **Literal ask** — what the words say
4. **Underlying problem space** — the job-to-be-done
5. **Sentiment and subtext**
6. **Must-haves vs. nice-to-haves**
7. **Hard negatives** — what must not happen
8. **Success criteria** — how they'll judge it
9. **Hard constraints** — deadlines, budget, policy
10. **Gaps and ambiguities**
11. **Risks**
12. **Recommended next steps**

Then an **Assumptions to Validate** list.

**Two rules that keep it honest:**

- **Infer, do not invent.** Reason from evidence in the message; mark every guess as an inference; never present a guess as a stated fact.
- **Scale depth to the message.** A one-line FYI does not need twelve dense sections. Collapse or mark empty sections "none stated." Over-filling a trivial message is a failure mode, not thoroughness.

**The sticky-note rule:** every bullet is 4–8 words, short and scannable. Direct quotes are verbatim and exempt.

**Pitfalls:** breaking it down like a spec; blurring success criteria and must-haves; inventing instead of inferring; over-filling a one-liner.

---

## Communicating a roadmap or decision

Same content, three shapes:

- **Executives** — theme-based, outcome-framed, one page, the decision at the top. They want to know what you're betting on and what you're giving up.
- **Engineering** — sequenced, dependency-aware, with the "why now" for each item. They want to know what's real and what's exploratory.
- **Customers and field teams** — benefit-framed, no internal jargon, honest about confidence levels. Never promise a Later item.

**Confidence should be visible.** Now/Next/Later works because it stops people from reading a Later item as a commitment. If you use a timeline roadmap, label confidence explicitly or it will be read as a contract.

---

## Cross-references

- The artifact you're seeking approval for → `delivery-artifacts.md`
- Deprecation and EOL messaging → `delivery-artifacts.md`
- Facilitation protocol for running any of these live → `SKILL.md`
- Executive-level alliance building → `career-and-leadership.md`
