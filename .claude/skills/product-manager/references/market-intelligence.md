# Market and Competitive Intelligence

Stop doing competitive research like a term paper. The intelligence community solved this decades ago: don't collect "data" — run **collection disciplines**, independent channels each with its own sources, tradecraft, and blind spots, and then **fuse** them.

Everything here runs under the **investigation protocol** in `SKILL.md` (question budget, search-plan gate, Fact/Inference/Assumption labels, do-not-invent list, Just Enough Mode, stable schema, Final Step block). That protocol is not optional decoration — it's what makes this output trustworthy and re-runnable.

---

## The eight collection disciplines

| Discipline | Plain English | Primary PM artifact |
|---|---|---|
| **1. OSINT** — Open Source | Press, social, periodicals, analyst notes | Battle cards, positioning |
| **2. FININT** — Financial | Filings, earnings calls, procurement records | Battle cards, SOM capture rates |
| **3. GEOINT/DEMOINT** — Geospatial & Demographic | Census, labor, trade, economic statistics | TAM/SAM/SOM, ICPs, personas |
| **4. TECHINT** — Technical | Patents, technographics, changelogs, repos | Roadmap bets |
| **5. HUMINT** — Human | Talent moves, employee chatter, win/loss interviews | Roadmap bets, battle cards |
| **6. SIGINT** — Signals | Web diffs, pricing-page changes, job posts | Battle cards, pricing strategy |
| **7. MASINT** — Measurement & Signature | Supply chain, operational indicators | Threat assessment |
| **8. All-Source Fusion** | Cross-validation and confidence stacking | Everything above |

**Independence is the entire design.** These disciplines matter because they *fail differently*. A press release can lie. A customs record, a patent filing, and thirty job posts are three separate bureaucracies that would all have to lie in the same direction.

**Signal → inference chains** are the tradecraft. Each observable maps to a bounded interpretation, labeled:
- *Thirty backend job posts mentioning a specific technology* → **Inference:** a platform rewrite is underway → **Assumption:** it ships within two quarters
- *A pricing tier disappears* → **Inference:** a move upmarket → validate against the next pricing change
- *A CPO departs and isn't replaced for six months* → **Inference:** product isn't the current center of gravity

**This is not espionage.** Every source is published, filed, posted, or publicly observable. See the guardrails in `SKILL.md`.

---

## Triage: which disciplines does this question need? (interactive)

Running all eight on every question is the failure mode; scoping to the decision is the craft.

1. **What's on your desk?** — the actual decision the research supports.
2. **Adaptive follow-up** — what have you already noticed? *A signal already seen is a head start:* if they've spotted a hiring surge, HUMINT has flagged once, so you're at "1 channel" on the confidence-stacking ladder and the job is naming which *independent* channels would corroborate.
3. **Constraints** — hours available, and can this be sustained on a cadence?

Then recommend: 2–3 disciplines, a cadence that matches evidence speed (pricing pages change monthly; government statistics annually), the artifact it feeds, and the skill that executes it.

**Cadence must match human capacity.** A watch nobody can sustain is worse than none — it produces false confidence that someone is looking.

**The honest off-ramp.** Some questions don't need an investigation. "Why do customers churn" is answered by win/loss interviews and discovery, not a patent sweep. Say so.

---

## The investigation chain

Each link consumes the prior link's stable schema. That's what turns research from a one-off deck into a cadence.

```
market-landscape-scan  →  competitive-research-snapshot  →  competitive-intel-watch  →  battle-card-builder
   (who plays where)         (depth on the few that matter)     (what changed)            (what a rep says)
```

### 1. Market landscape scan

Maps **structure, not magnitude** — who plays where and why, not how big the prize is.

Schema (do not reorder): **1. Scope · 2. How this market segments · 3. Player map** (direct players / adjacent players who could enter / substitutes and non-consumption / emerging entrants) **· 4. Dynamics · 5. Whitespace and dead zones · 6. So what?**

**Include non-consumption.** In most categories the largest competitor is "nobody does this yet, they live with the problem." Omitting it produces a map where every share point must be taken from a named rival, which is usually false.

*Pitfalls:* adopting an analyst's map wholesale (their segmentation serves their business); omitting non-consumption; whitespace romanticism (empty space is often empty for a reason — say which); player-map sprawl; scope drift between re-scans, which destroys comparability.

### 2. Competitive research snapshot

Depth on the few competitors that matter. Schema: **1. Scope · 2. Competitor snapshots · 3. Quick comparison · 4. So what?**

*Pitfalls:* the market-report trap (writing for completeness rather than a decision); marketing-page credulity (a feature listed on a website is a claim, not a capability); coverage over depth; an unlabeled "So what" that reads as fact; regenerating instead of diffing.

### 3. Competitive intel watch

Scheduled delta monitoring. Reports **change, not state**. Schema: **1. Run header · 2. Changelog (material shifts only) · 3. Update flags** (which downstream artifacts now need revising) **· 4. Watchlist for next run.**

**"No material shifts this cycle" is a valid and useful result.** Regenerating the same report weekly is theater.

*Pitfalls:* regeneration theater; materiality inflation (promoting a blog post to a strategic shift); fear of the empty changelog; undated evidence; diffing against a stale scope; orphaned intelligence — findings that update no artifact and inform no decision.

### 4. Battle card builder

The artifact a rep opens **mid-deal**, not a research report. It must fit thirty seconds, and every claim must survive being said out loud to a hostile audience — which is why every claim carries a source URL, a date, and a label.

Schema: **1. Thirty-second read · 2. Say this · 3. Ask this (trap questions) · 4. Watch out for · 5. Pricing & packaging snapshot · 6. Do not say · Appendix: evidence table.**

**Section 6 is the one that saves you.** "Do not say" lists claims that are unverified, legally risky, or likely to backfire.

*Pitfalls:* the unlabeled card (inference presented as fact — and it's the rep who gets embarrassed); the research-report card nobody opens; trap questions built on hope rather than a documented weakness; quote invention; the immortal card that's never refreshed; skipping "Do not say."

---

## Six-step competitive analysis (the umbrella)

When you need the full picture rather than one artifact. Each step names the skill that does the work; this sequence holds the frameworks and decision points.

1. **Overview of the competitive landscape** → market landscape scan
2. **Product-level comparison** → competitive research snapshot; Kano for feature classification
3. **Ability to fulfill customer needs** → JTBD, voice-of-customer mining
4. **Business information baseline** → company intel, financial signals, Business Model Canvas
5. **Perception and relative positioning** → positioning work, review mining, Ries & Trout
6. **Competitors' strategic direction** → patents, hiring, leadership changes, stated intent

**Step 6 is the one teams skip, which is why they're perpetually surprised.** Steps 1–5 read where competitors *are*; step 6 reads where they're *going*.

**Four outputs the organization actually consumes:** battle cards, comparison matrices, positioning counter-moves, threat assessments. A step that feeds no output is a detour.

*Pitfalls:* running all six on autopilot when one question walked in the door; skipping step 6; framework name-dropping without applying the framework; analysis that produces no output; one-time heroics instead of a cadence.

---

## Voice-of-customer mining

Public reviews, app stores, forums, community boards — customers' exact words without waiting on an interview cycle.

Schema: **1. Scope · 2. Need themes** (solution-free, 4–8 words each) **· 3. Competitor weak points · 4. Switching triggers · 5. So what?**

**Public voice skews toward the angry and the vocal.** Every theme is a **hypothesis to validate**, never a verdict — the output's last stop is always a real conversation.

*Pitfalls:* feature-name theming ("needs better dashboards" is a solution, not a need); verbatim laundering (paraphrasing a quote until it says what you wanted); rant amplification; skew blindness — always write the source-bias note; skipping the validation handoff.

---

## Pricing and packaging tracker

Competitor pricing as a **diffable time series**, not a screenshot. Schema: **1. Run header · 2. Pricing capture per competitor** (URL + as-of date) **· 3. Changes since last capture · 4. Signals.**

**Watch structure as closely as numbers.** Packaging moves — gates, limits, tier restructures — signal strategy earlier than price moves. A tier that disappears telegraphs a move upmarket months before the price list admits it.

*Pitfalls:* screenshot thinking (a capture with no schema can't be diffed); number fixation; inventing what's opaque ("Contact us" means contact us, not "roughly $50K"); schema improvisation; tracking with no consumer for the output.

---

## Company intel: seven research lenses

For a deep read on one company, industry, or competitor set. Apply **every** lens.

1. **Financial landscape** — how it makes money; revenue streams, cost drivers, margin pressures, growth levers, capital intensity, cyclicality
2. **Market offer and business model** — target markets; buyers, users, influencers, blockers; multi-sided dynamics
3. **Product portfolio** — offers, platforms, channels; legacy vs. emerging; distinguishing business line / offer / product / feature / platform
4. **Competitive dynamics** — direct, adjacent, substitutes, emerging disruptors; where differentiation is won
5. **Rising trends and strategic concerns** — regulation, technology shifts (especially AI/automation), consolidation, commoditization
6. **How product management works there** — product-led vs. sales-led vs. service-led; centralized vs. federated; discovery, data, experimentation, and AI maturity. *Label these inferences clearly.*
7. **Strategic signals** — always check all three:
   - **Patents** — filings and grants; technology clusters; gaps between patent activity and public narrative
   - **Hiring** — roles open in volume, skills named, seniority, and the language of the postings. *Job descriptions are culture documents.*
   - **Leadership changes** — C-suite and product leadership arrivals and departures in the last 12–18 months

**Executive Signal Refresh (the rerun pattern).** Re-run against a prior baseline and report **Then / Now** diffs — including **Dropped Language**: what leaders have *stopped* saying. A phrase that vanished from three consecutive earnings calls is a signal as strong as a new one. Follow a source priority ladder (filings and transcripts over press over marketing pages) and do not sanitize awkward findings.

*Pitfalls:* surface-level description with no implications; skipping strategic signals; confusing outputs with outcomes; no citations; treating all industries as identical; one-time exercise never refreshed.

---

## Handoff

Intelligence that updates no artifact is a hobby. Every run should end by naming what it feeds:

- Landscape scan → market sizing, positioning, competitor selection
- Snapshot → battle cards, comparison matrices, roadmap bets
- VoC mining → discovery interview questions, JTBD, opportunity list
- Pricing tracker → pricing decisions, packaging strategy
- Company intel → SWOT, Five Forces, positioning, threat assessment

---

## Cross-references

- Frameworks the evidence feeds (SWOT, Five Forces, Ansoff, PESTEL) → `strategy-and-positioning.md`
- Market sizing from GEOINT/DEMOINT sources → `finance-and-growth.md`
- Turning VoC themes into validated problems → `discovery-and-framing.md`
- The full investigation contract → `SKILL.md`
