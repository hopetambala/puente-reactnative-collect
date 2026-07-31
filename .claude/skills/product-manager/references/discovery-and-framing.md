# Discovery and Framing

Everything here answers one question: **are we solving a problem worth solving, for someone specific?** Use these before scoping, before a PRD, before a single story is written.

Order matters. A problem statement without a real user is a solution looking for cover. An Opportunity Solution Tree built on a vague outcome branches into fog.

---

## Problem statement (component)

Articulate the problem from the user's perspective. Not a requirements doc — a human-centered narrative that forces you to admit whether the problem is real.

**The framing narrative** (empathy mapping + JTBD):

```
I am:                    [the persona experiencing this]
Trying to:               [the outcome they actually care about]
But:                     [the barrier stopping them]
Because:                 [the root cause — not the symptom]
Which makes me feel:     [the emotional impact]
```

Then:

```
Context & Constraints:   [geographic, technical, temporal, demographic factors]
Final Problem Statement: [one concise, empathetic sentence]
```

**Why this structure works.** "Trying to" separates goal from feature. "Because" forces you past the symptom. "Which makes me feel" is the part people want to cut — don't. Emotion is what makes a problem worth prioritizing over an equally logical one; a mildly annoying problem and an infuriating one get funded differently.

**Pitfalls**

- **Solution smuggling.** *Symptom:* "But: there's no bulk export button." *Consequence:* the team builds the button and the underlying job stays unsolved. *Fix:* the "But" is a barrier, never a missing feature.
- **Business problem in user clothing.** *Symptom:* "I am a user trying to increase company retention." *Consequence:* you optimize for the org and users don't show up. *Fix:* users have their own goals; write theirs.
- **Generic persona.** *Symptom:* "I am a user." *Fix:* if you can't be specific, you have a research gap, not a writing gap.
- **Symptom instead of root cause.** *Symptom:* "Because the page is slow." *Fix:* ask why three times before writing the "Because."
- **Fabricated emotions.** *Symptom:* invented frustration nobody reported. *Fix:* if you haven't heard it, label it an assumption.

---

## MITRE Problem Framing Canvas (interactive)

Use when the team is confident about a problem and you suspect they're wrong. Three phases, eight questions, run under the facilitation protocol.

**Phase 1 — Look Inward** (the phase everyone skips)
1. What is the problem? (symptoms only, no causes yet)
2. Why haven't we solved it already?
3. How are we part of the problem? (our assumptions, our incentives, our biases)

**Phase 2 — Look Outward**
4. Who experiences it — when, where, with what consequences?
5. Who else has this problem? Who *doesn't* have it? (the non-sufferers are the most informative group in the room)
6. Who's been left out of the conversation? Who benefits from the status quo?

**Phase 3 — Reframe**
7. Restate the problem given everything above.
8. Convert it to a **How Might We…** statement.

**Why it works.** Phase 1 makes the team's own contribution to the problem discussable. Question 5 finds your natural control group. Question 6 surfaces the person who will quietly block the fix.

**Pitfalls:** skipping Look Inward and assuming neutrality; a HMW so narrow it prescribes the solution ("How might we add a bulk-export button"); running it solo, which produces one person's blind spots at higher confidence.

---

## Jobs-to-be-Done (component)

Christensen + the Value Proposition Canvas. Three layers:

**1. Jobs**
- **Functional** — the task ("send an invoice")
- **Social** — how they want to be perceived ("look professional to clients")
- **Emotional** — the state they seek or avoid ("feel in control of my finances")

**2. Pains**
- **Challenges** — obstacles they hit
- **Costliness** — what's too expensive in time, money, or effort
- **Common mistakes** — errors the current solution lets them make
- **Unresolved problems** — gaps nothing addresses today

**3. Gains**
- **Expectations** — what would beat the current solution
- **Savings** — time, money, effort reductions that delight
- **Adoption factors** — what would make switching worth it
- **Life improvement** — how it makes things genuinely better

**Why it works.** It separates job from solution ("communicate with my team" ≠ "email"), surfaces competition you didn't see (spreadsheets, pen and paper, doing nothing), and prioritizes by intensity rather than frequency of request.

**Pitfalls:** confusing jobs with solutions; generic jobs ("be more productive"); ignoring social and emotional jobs, which is where switching decisions actually get made; fabricating JTBD with no research behind it; treating all pains as equally acute.

---

## Proto-persona (component)

A working hypothesis about the user, built in hours from what you already know — research, market data, team knowledge — so the team can align *now* and find out what they don't know.

| Proto-persona | Validated persona |
|---|---|
| Hours to days | Weeks to months |
| Assumptions + limited research | Extensive user research |
| Aligns teams early | Guides detailed design |
| Evolves rapidly | Stable |
| Good enough to start | High confidence |

**Contents:** name; bio and demographics; quotes (their voice); pains; what they're trying to accomplish; goals; decision-making authority; who influences them; beliefs and attitudes.

**Pitfalls:** demographics with no behavior (age and job title predict nothing); treating the proto-persona as fact once it's been in a slide deck twice; making ten of them (three is already a lot); fabricating quotes — mark inferred quotes as inferred; never validating.

---

## Discovery interview prep (interactive)

Four questions, then a generated interview plan.

1. **Research goal** — what are you trying to learn? (Not "get feedback.")
2. **Target segment** — who specifically, and how will you reach them?
3. **Constraints** — how many interviews, over what timeframe, with what access?
4. **Methodology** — problem validation, JTBD switch interviews, churn deep-dive, usability, or a blend.

**Output:** opening (5 min) → core questions (30–40 min, methodology-specific) → closing (5 min); the biases to actively avoid; success criteria; logistics.

**Pitfalls**

- **Asking what customers want.** *Consequence:* you get feature requests, which are compressed solutions to problems you never learn. *Fix:* ask about the last time they had the problem; past behavior, not future intention.
- **Pitching instead of listening.** *Fix:* if you're talking more than 20% of the time, it's a demo.
- **Interviewing the wrong people.** *Fix:* screen for the behavior, not the demographic.
- **Stopping at one or two.** *Fix:* run until you stop hearing new things — saturation, usually 5–8 per segment.
- **Not recording insights immediately.** *Fix:* synthesize within 24 hours or it decays into vibes.

---

## Discovery process (workflow, 3–4 weeks)

The full cycle. Each phase names outputs, and decision points gate the phases so you can stop early.

**Phase 1 — Frame the problem (day 1–2)**
Problem statement, proto-personas, initial assumptions logged.
→ *Decision point:* do we have enough context to start research? If no, desk research first.

**Phase 2 — Research planning (day 3)**
Interview plan, recruiting criteria, discussion guide.

**Phase 3 — Conduct research (week 1–2)**
Interviews, support-ticket mining, analytics review, competitive input.
→ *Decision point:* have we reached saturation? Stop when new interviews stop changing your mind.

**Phase 4 — Synthesize (end of week 2)**
Themes, JTBD, opportunity list, evidence per opportunity.

**Phase 5 — Generate and validate solutions (week 3)**
Opportunity Solution Tree, PoL probes on the riskiest assumptions.
→ *Decision point:* did the experiments validate the solution? A "no" here is the cheapest possible no.

**Phase 6 — Decide and document (week 3–4)**
Recommendation, PRD or kill decision, what we learned and what we'd revisit.

**Pitfalls:** skipping interviews because "we know our users"; leading questions that confirm what you already believed; declaring saturation after three conversations; analysis paralysis in Phase 4; treating discovery as a one-time project rather than a continuous habit.

---

## Opportunity Solution Tree (interactive)

Teresa Torres. The play when a stakeholder hands you a solution and you need to get back up to the outcome without saying no.

```
              Desired Outcome
             /       |       \
    Opportunity  Opportunity  Opportunity      ← problems, needs, pain points
      /     \                    |
 Solution  Solution           Solution         ← candidate ways to address it
     |
Experiment / PoL probe                         ← how we'd know cheaply
```

**Five questions:**
1. What outcome are we actually chasing? (Must be measurable. "Improve engagement" isn't.)
2. What opportunities — problems, needs — could move that outcome?
3. For the chosen opportunity, what solutions exist? (Diverge. Three minimum. One option is a decision already made.)
4. Evaluate on feasibility, impact, market fit.
5. Define the experiment for the winner.

**Pitfalls:** opportunities that are solutions in disguise ("no mobile app" is a solution gap, not an opportunity — the opportunity is what mobile would let them do); skipping divergence; an outcome so vague every opportunity connects to it; exploring forever without committing to an experiment.

---

## Lean UX Canvas v2 (interactive)

Jeff Gothelf. Eight boxes, filled in this order. It's an insurance policy: it exposes gaps in understanding before you spend a sprint.

1. **Business Problem** — what changed in the world that made this worth solving now?
2. **Business Outcomes** — measurable *behavior change* that indicates success (retention rate, activation, time-to-value).
3. **Users** — which persona first?
4. **User Outcomes & Benefits** — why would they seek this? Goals, benefits, emotions.
5. **Solutions** — candidate features, policies, even business-model shifts. Not a backlog.
6. **Hypotheses** — "We believe [business outcome] will be achieved if [user] attains [benefit] with [solution]." One solution per hypothesis.
7. **What's most important to learn first?** — the single riskiest assumption right now.
8. **What's the least work needed to learn it?** — the smallest experiment.

**The distinction people blow:** Box 2 is metrics. Box 4 is human. "Increase 30-day retention to 45%" belongs in 2; "stop losing an hour a week to manual reconciliation" belongs in 4.

**Pitfalls:** starting at box 5; vague business outcomes; user segments so broad they're useless; only one solution in box 5; skipping box 8, which turns the canvas into a planning document instead of a learning one.

---

## Customer journey mapping (component + workshop)

**Five components** (NN/g): actor (one specific persona), scenario + expectations, journey phases, actions/mindsets/emotions per phase, opportunities.

**Structure** — stages across the top, layers down the side:

| | Awareness | Consideration | Decision | Service | Loyalty |
|---|---|---|---|---|---|
| **Customer actions** | | | | | |
| **Touchpoints** | | | | | |
| **Experience (emotion)** | | | | | |
| **KPIs** | | | | | |
| **Business goals** | | | | | |
| **Teams involved** | | | | | |

Adapt the stages to the product — a developer tool's stages might be *discover → install → first success → integrate → depend on it → advocate*. Inherited stage names from a B2C template are the first sign of a map nobody will use.

**Pitfalls:** mapping the internal process instead of the customer's experience (if your swim lanes are departments, you've mapped an org chart); generic emotions ("frustrated" everywhere); missing touchpoints, especially the ones you don't own; no KPIs, so nothing is measurable; several personas crammed into one map; produced once and never revisited.

**Prioritize the opportunities before you leave the room.** A journey map that ends without a ranked opportunity list is a poster.

---

## Cross-references

- Risky assumption surfaced here → `validation-and-experiments.md`
- Opportunity chosen and ready to scope → `delivery-artifacts.md`
- Need real customer language without an interview cycle → voice-of-customer mining in `market-intelligence.md`
- Competing opportunities, need to rank → `prioritization-and-roadmap.md`
