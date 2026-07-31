# Finance and Growth

The money side. A PM who can't connect a feature to revenue can't defend a roadmap. These metrics are SaaS-shaped; adapt the framing for other models, but the discipline transfers — know what a customer costs, what they're worth, and how long you wait to break even.

---

## Revenue and retention metrics

**Revenue** — top line before expenses. Growth rate matters more than the absolute number.

**ARPU (Average Revenue Per User)** = `Total revenue / Total users`. Measures per-seat monetization.

**ARPA (Average Revenue Per Account)** = `MRR / Active accounts`. Measures deal size. Benchmarks: SMB $100–1K/mo, mid-market $1K–10K, enterprise $10K+.

**ARPA + ARPU together** prevent packaging mistakes. $10K ARPA across 100 seats = $100 ARPU (reasonable). $10K ARPA across 1,000 seats = $10 ARPU (money left on the table).

**ACV (Annual Contract Value)** — annualized recurring revenue per contract, excluding setup fees and services.

**MRR / ARR** — the heartbeat of a subscription business. Track the components separately: new, expansion, contraction, churn. A flat MRR line can hide violent churn offset by violent new sales.

**Churn rate** — distinguish **logo churn** (customers lost) from **revenue churn** (dollars lost). Losing ten small accounts and one large one are very different events that look identical in a logo number.

**NRR (Net Revenue Retention)** = `(starting MRR + expansion − contraction − churn) / starting MRR`. Above 100% means you grow without acquiring anyone. Benchmarks: >120% excellent, 100–110% healthy, <90% a leaking bucket.

**Expansion revenue** — upsell, cross-sell, seat growth. The cheapest revenue you'll ever get.

**Quick Ratio** = `(new + expansion MRR) / (churned + contraction MRR)`. Above 4 is strong growth; near 1 means you're running to stand still.

**Cohort analysis** — track each signup cohort's retention over time. Blended metrics hide cohort degradation: if recent cohorts retain worse than older ones, something about the product or the acquisition channel changed, and the average won't tell you.

**Pitfalls:** confusing revenue with profit; celebrating ARPU growth that's really a mix shift toward enterprise; ignoring cohort degradation; logo/revenue churn confusion; treating all churn as equal (a churned free trial ≠ a churned enterprise account); forgetting churn compounds; celebrating gross revenue while net contracts; NRR above 100% that comes from low churn rather than real expansion, which caps out; revenue concentration risk; averaging across segments.

---

## Unit economics and capital efficiency

**Gross margin** = `(Revenue − COGS) / Revenue`. COGS includes hosting, infrastructure, payment processing, and onboarding. Benchmark: 70–85% healthy SaaS, <60% concerning. *A feature generating $1M at 80% margin is worth far more than $1M at 30% — margin should drive prioritization, and usually doesn't.*

**CAC** = `Total S&M spend / New customers acquired`. Include salaries, tools, commissions — not just ad spend.

**LTV** — simple: `ARPU × average lifetime (months)`. Better: `ARPU × gross margin % / churn rate`. The gross-margin term is the one people drop, and dropping it inflates LTV by whatever your COGS is.

**LTV:CAC** — 3:1 healthy; <1:1 unsustainable; >5:1 may mean you're underinvesting in growth.

**Payback period** = `CAC / (Monthly ARPU × Gross margin %)`. <12 months great, 12–18 acceptable, >24 concerning. **Good LTV:CAC with bad payback is a cash trap** — the economics work eventually, but you run out of money before "eventually" arrives.

**Contribution margin** — revenue minus all variable costs per customer. Not the same as gross margin; it includes variable sales and support.

**Burn rate / runway** — `Cash / net monthly burn`. Everything else is theoretical if runway is short.

**Rule of 40** — `Growth rate % + profit margin % ≥ 40`. Above 40 with negative cash flow still needs financing; the rule is a health signal, not a solvency test.

**Magic Number** = `(Current quarter revenue − prior quarter revenue) × 4 / prior quarter S&M spend`. Above 0.75 means scale sales and marketing; below 0.5 means fix the motion before adding fuel.

**Operating leverage** — do costs grow slower than revenue? If not, scaling makes things worse, not better.

**Pitfalls:** celebrating LTV without checking payback; LTV without gross margin; scaling S&M with a low Magic Number; simplistic LTV formulas; ignoring time value of money; comparing CAC across channels with different payback periods; Rule of 40 above 40 with negative cash flow; ignoring segment-specific unit economics; confusing gross with contribution margin; forgetting working-capital timing.

---

## Feature investment decision (interactive)

Four steps to a build / don't-build recommendation with the math attached.

1. **Revenue connection** — direct (new tier, add-on, usage) or indirect (retention, conversion, expansion enablement). If neither, say so plainly; it may still be worth building, but not on financial grounds.
2. **Cost structure** — development (one-time), COGS impact (ongoing infrastructure), OpEx impact (support, maintenance). The third is the one nobody estimates and everybody pays.
3. **ROI** — direct: `revenue impact / dev cost`. Retention features: `LTV impact across the affected base / dev cost`. **Use gross margin, not revenue.**
4. **Strategic value** — the override: competitive moat, platform enabler, enterprise deal unblocker, compliance risk reduction.

**Four recommendation shapes:** strong financial case → build; weak financial case but strategic → build anyway, *with the strategic justification written down and a review date*; poor ROI → don't build, and say what you'd build instead; insufficient data → the answer is a probe, not a build.

**Pitfalls:** confusing revenue with profit; ignoring payback; overestimating adoption (the single most common error — halve your first estimate); building without validation; ignoring opportunity cost; "strategic value" as an excuse for a case you can't make; margin-dilution blindness; vanity metrics; forgetting time value of money; building for a loud minority.

---

## Pricing change evaluation (interactive)

Five lenses on any pricing move (increase, new tier, add-on, usage-based, discount, repackaging):

1. **Revenue impact** — ARPU/ARPA lift, minus losses from reduced conversion and increased churn. Net it out.
2. **Conversion impact** — higher price usually lowers conversion; better packaging can raise it.
3. **Churn risk** — by segment. Decide the grandfathering strategy *before* announcing, not after the backlash.
4. **Expansion impact** — does the change create an upsell path or close one?
5. **CAC payback impact** — higher ARPU shortens payback; lower conversion raises effective CAC.

**Recommendation shapes:** implement broadly · test first (A/B with actual statistical power) · modify the approach · don't change pricing.

**Pitfalls:** ignoring churn impact; not grandfathering; testing without statistical power; changing price without changing perceived value; ignoring CAC payback; annual discounts that quietly destroy margin; copycat pricing based on a competitor whose costs you don't know; premature optimization before PMF; forgetting expansion revenue; no communication plan — most pricing backlash is a communication failure, not a price failure.

---

## Acquisition channel evaluation (interactive)

1. **Unit economics** — CAC, LTV, LTV:CAC, payback **by channel**
2. **Customer quality** — retention, churn, NRR, expansion by channel. A cheap channel that delivers customers who churn in three months is expensive.
3. **Scalability** — Magic Number, addressable volume, saturation risk, CAC trend
4. **Strategic fit** — segment match, sales-motion compatibility (PLG vs. sales-led), brand alignment

**Four verdicts:** scale aggressively · test and optimize · kill or pause · invest to learn (a strategic channel, *with an explicit spend limit and a review date* — otherwise "strategic" becomes a permanent excuse).

**Pitfalls:** scaling a broken channel; ignoring customer quality; vanity metrics (impressions, MQLs); averaging across channels so a good one subsidizes a bad one invisibly; short-term CAC optimization that starves long-payback channels; ignoring payback; killing channels before they've had time to compound (content and SEO especially); over-relying on one channel; forgetting incrementality (would they have converted anyway?); strategic channels with no limit.

---

## Business health diagnostic (interactive)

Four dimensions read together — single metrics lie:

1. **Growth & retention** — revenue growth, NRR, churn, Quick Ratio
2. **Unit economics** — CAC, LTV, LTV:CAC, payback, gross margin
3. **Capital efficiency** — burn, runway, Rule of 40, Magic Number
4. **Strategic position** — pricing power, competitive moat, revenue concentration, operating leverage

Benchmark against **stage**, not against the best company you've read about. Output a scorecard, the red flags ranked by urgency, a root-cause read, a prioritized action plan, and what *not* to do.

**Pitfalls:** celebrating a single metric; ignoring stage-specific benchmarks; lagging indicators only; identifying red flags and acting on none; trying to fix everything at once.

---

## TAM / SAM / SOM (interactive)

- **TAM** — total demand if you captured 100% of the market. No constraints.
- **SAM** — the slice you can realistically target given geography, segment, and product constraints.
- **SOM** — what you can capture in 1–3 years, accounting for competition and go-to-market capacity.

**Three entry modes:** you bring the numbers · guided interview · autonomous bottom-up research (population data → qualification filters → pricing assumption → SAM; then capture-rate assumption → SOM).

**Show the assumption chain, not the answer.** A defensible sizing is one a skeptical CFO can attack *one assumption at a time*. Every number gets a source and a date. Prefer bottom-up: a top-down "1% of a $50B market" is the oldest tell in the deck.

**Pitfalls:** TAM with no citations; SOM equal to SAM (you will not capture your whole serviceable market); no population estimates behind the funnel; static assumptions in a market that's moving; ignoring go-to-market constraints — SOM is limited by your ability to sell, not just by demand.

---

## Growth paths

For choosing *which* growth lane before you build hypotheses, use the McKinsey Growth Path Matrix (L2 new segments / L3 new geographies / L4 new channels / L5 new products) in `strategy-and-positioning.md`, and the Ansoff Matrix when the question is the full option set with a risk gradient.

---

## Cross-references

- Prioritizing among funded options → `prioritization-and-roadmap.md`
- Competitor pricing as an input → pricing-packaging tracker in `market-intelligence.md`
- Validating an adoption assumption before you model it → `validation-and-experiments.md`
- Where growth comes from, strategically → `strategy-and-positioning.md`
