# Validation and Experiments

How to find out you're wrong before it costs a quarter. The governing line, from Jeff Patton: *"The most expensive way to test your idea is to build production-quality software."*

---

## Proof of Life (PoL) probes (component)

Coined by Dean Peters, building on Marty Cagan's prototype flavors. A **PoL probe** is a deliberate, disposable validation artifact that answers one specific question as cheaply as possible. Reconnaissance, not a product.

### The 5 essential characteristics

| Characteristic | What it means | Why it matters |
|---|---|---|
| **Lightweight** | Hours or days, not weeks | If it's expensive, you won't kill it when the data says to |
| **Disposable** | Explicitly planned for deletion | Prevents sunk-cost fallacy and scope creep |
| **Narrow scope** | One hypothesis, one risk | Broad experiments yield ambiguous results |
| **Brutally honest** | Surfaces harsh truths, not vanity metrics | Polite data is useless data |
| **Tiny & focused** | Never an MVP | Small surface area = faster learning |

**Anti-pattern:** if your prototype feels too polished to delete, it's not a probe — it's **prototype theater**.

### PoL probe vs. MVP

| | PoL probe | MVP |
|---|---|---|
| **Purpose** | De-risk a decision | Ship the smallest real increment |
| **Scope** | One question, one risk | Smallest shippable product |
| **Lifespan** | Hours to days, then deleted | Weeks to months, then iterated |
| **Audience** | Internal team + narrow sample | Real customers in production |
| **Fidelity** | Just enough illusion to catch signal | Production quality |
| **Outcome** | Learn what *doesn't* work | Learn what *does*, and ship it |

Probes are **pre-MVP reconnaissance**: you run them to decide *whether* to build an MVP.

### The 5 probe flavors

Match the probe to the hypothesis, **not to your tooling comfort**.

| Flavor | Core question | Timeline | Typical methods | Use when |
|---|---|---|---|---|
| **1. Feasibility check** | "Can we build this?" | 1–2 days | API tests, spike-and-delete code, data-integrity sweeps, prompt chains | Technical risk unknown; third-party dependencies unclear |
| **2. Task-focused test** | "Can users complete this job without friction?" | 2–5 days | Task flows, usability tests, tree tests, first-click tests | Critical moments — decision points, drop-off zones — need validation |
| **3. Narrative prototype** | "Does this workflow earn buy-in?" | 1–3 days | Loom walkthrough, storyboard, video, slideware | You need to *tell* rather than test — share the story, measure interest |
| **4. Synthetic data simulation** | "Can we model this without production risk?" | 2–4 days | Generated datasets, simulated users, logic harnesses | Edge cases and unknown-unknowns |
| **5. Vibe-coded probe** | "Will this survive real user contact?" | 2–3 days | Throwaway app stitched together from whatever is fastest | You need feedback on workflow/UX, not production code |

**Golden rule:** *use the cheapest prototype that tells the harshest truth. If it doesn't sting, it's probably theater.*

### Probe template

```
Hypothesis:              [the falsifiable claim]
Risk being eliminated:   [the specific risk]
Prototype type:          [1-5 above]
Target users/audience:   [who sees it]
Success criteria:        [the harsh truth — what result would kill the idea]
Tools/stack:             [what you'll use]
Timeline:                [hours or days]
Disposal plan:           [how and when this gets deleted]
Owner:                   [name]
Status:                  [planned / running / concluded]
```

**Write the success criteria before you build.** If you can't state in advance what result would make you abandon the idea, you're not testing — you're building a demo and hoping.

### Selecting a probe (interactive)

Ask what the core question actually is, then route:

- "Can we build this?" → **feasibility check**
- "Can users complete this job?" → **task-focused test**
- "Will stakeholders back this?" → **narrative prototype**
- "Can we model this safely?" → **synthetic data simulation**
- "Will it survive real users?" → **vibe-coded probe**

**Pitfalls:** choosing by tooling comfort (an engineer builds a feasibility check when the risk is desirability); defaulting to code; confusing a vibe-coded probe with an MVP and shipping it; testing multiple things at once so no result is interpretable; skipping success criteria; using the probe to defer a decision you already have enough information to make.

---

## Tiny Acts of Discovery (TADs)

The lightest weight in the family: small experiments that unpack an unknown inside an epic or a story. Where a PoL probe tests a product hypothesis, a TAD answers "we don't know enough to even split this." A half-day of API reading, five support tickets read end to end, one customer call, a query against production data. Time-boxed, and the output is a decision, not a document.

---

## De-risk measurement: what to measure, test, or track (interactive)

Ten risk dimensions — four internal, six external — then a triage. The output is a prioritized risk register that says what to do first, not a list of everything that could go wrong.

### Internal: DUFV (Marty Cagan's four risks)

| Category | Dimension | Core question |
|---|---|---|
| **Product outcome metrics** | **D**esirability | Will customers value it enough to buy/adopt it? |
| **Product outcome metrics** | **U**sability | Will they figure out how to use it? |
| **Business outcome metrics** | **F**easibility | Can we build it — and sustain it at scale? |
| **Business outcome metrics** | **V**iability | Will it work as a business? |

**Product outcome metrics** answer *what's in it for the customer.* **Business outcome metrics** answer *what's in it for us.* Both are required; teams that measure only one ship things that are loved and unaffordable, or profitable and unused.

### External: PESTEL

Political, Economic, Social, Technological, Environmental, Legal — the forces you don't control. For a software product the ones that most often bite: legal (privacy, accessibility, data residency), technological (a platform or model-provider change under you), and economic (budget cycles that determine whether anyone can buy).

### The Act / Watch triage

Every identified risk lands in exactly one bucket:

- **Act on immediately** — high likelihood × high impact, or cheap to resolve now. Each gets an owner, a specific action, and a date.
- **Start tracking** — real but not urgent. Each gets a **signal** (what would tell you it's moving), a **source**, and a **check cadence**.

A risk with no owner and no signal isn't managed; it's acknowledged, which is different.

**Pitfalls:** generic risk lists that would apply to any product; everything marked Act, so nothing is; internal-only or external-only scans; analysis with no next steps.

---

## Reading the result honestly

The whole apparatus fails at one specific moment: when the probe comes back negative and the team reinterprets it. Guard against that in advance.

- **Pre-register the kill criterion.** Write down what result ends the idea, before you run it.
- **A "no" is the cheapest outcome you can buy.** Say so out loud when it happens. Teams that punish negative results stop running honest experiments within two cycles.
- **Distinguish "wrong idea" from "wrong probe."** A failed task-focused test on a confusing prototype may mean the prototype was confusing. Ask whether the probe actually tested the hypothesis before you conclude anything about the idea.
- **One learning, one decision.** End every experiment with what you now believe and what you're doing differently. If the answer is "nothing," the experiment wasn't worth running.

---

## Cross-references

- Framing the hypothesis to test → `discovery-and-framing.md`, epic hypothesis in `prioritization-and-roadmap.md`
- Deciding whether a validated feature earns the investment → `finance-and-growth.md`
- AI features carry extra evaluation burden → `ai-product-work.md`
- External risk signals worth researching properly → `market-intelligence.md`
