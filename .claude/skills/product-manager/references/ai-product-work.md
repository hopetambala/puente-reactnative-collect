# AI Product Work

For features that involve models or agents, and for how the product team itself works with AI. Two different questions that get conflated constantly — keep them separate.

---

## AI-first vs. AI-shaped

| Dimension | AI-first (cute) | AI-shaped (survival) |
|---|---|---|
| **Mindset** | Automate existing tasks | Redesign how the work gets done |
| **Goal** | Speed up artifact creation | Compress learning cycles |
| **AI's role** | Task assistant | Strategic co-intelligence |
| **Advantage** | Temporary efficiency | Defensible moat |
| **Example** | "AI writes our PRDs twice as fast" | "We validate a hypothesis in 48 hours instead of 3 weeks" |

**The test:** *if a competitor can replicate it by throwing bodies at it, it's not differentiation — it's efficiency, and efficiency becomes table stakes within months.*

This applies to the product too. An AI feature that does something a user could have done manually, slightly faster, is a nice feature. An AI feature that lets them do something they genuinely could not do before is a product.

---

## The 5 PM competencies

Assess maturity on each, then build the weakest one that's blocking you — not all five.

### 1. Context design
Building a durable **reality layer** both humans and AI can trust. Treat model attention as a scarce resource and allocate it deliberately.

Includes: documenting what's true vs. assumed; immutable constraints (technical, regulatory, strategic); an operational glossary; evidence standards; **context boundaries** (persist vs. retrieve); **memory architecture**; retrieval strategy.

*"If you can't point to evidence, constraints, and definitions, you don't have context. You have vibes."*

### 2. Agent orchestration
Repeatable, traceable workflows rather than one-off prompts. Defined loops (research → synthesis → critique → decision → log rationale), each step showing its work, version-controlled prompts and agent definitions.

### 3. Outcome acceleration
Compressing **learning cycles**, not just tasks. Eliminating validation lag, pre-validating against constraints, replacing status meetings with async synthesis. *AI should remove bottlenecks, not generate more work* — writing user stories faster isn't valuable if stories weren't the bottleneck.

### 4. Team-AI facilitation
Redesigning team systems so AI is co-intelligence rather than an accountability shield. Review norms (who checks outputs, when, how), evidence standards (cite, don't hallucinate), decision authority (AI recommends, humans decide), and enough psychological safety that people challenge AI output without feeling slow.

**The failure mode is "I used AI" as an excuse for a bad output.** AI amplifies judgment; it doesn't relocate accountability.

### 5. Strategic differentiation
New customer capabilities, workflow rewiring competitors can't replicate without full redesign, economics they can't match.

---

## Context engineering vs. context stuffing

The single most useful diagnostic when an AI workflow feels bloated, brittle, or unsteerable.

| | Context stuffing | Context engineering |
|---|---|---|
| **Mindset** | Volume = quality | Structure = quality |
| **Approach** | "Add everything just in case" | "What decision am I making?" |
| **Persistence** | Persist all | Retrieve with intent |
| **Agent chains** | Share everything downstream | Bounded context per agent |
| **Failure response** | Retry until it works | Fix the structure |
| **Economic model** | Context as storage | Context as attention — a scarce resource |

*Context stuffing is bringing your entire file cabinet to a meeting. Context engineering is bringing the three documents relevant to today's decision.*

### Five markers of stuffing

1. Reflexively expanding the context window
2. Persisting everything "just in case," with no retention criteria
3. Chaining agents with no boundaries — A passes everything to B to C
4. Adding evaluations to mask inconsistency instead of fixing it
5. Normalized retries — "it works if you run it three times" becomes acceptable

### Why it fails

- **Reasoning noise** — irrelevant material competes for attention and degrades multi-hop logic
- **Context rot** — dead ends, past errors, and stale data accumulate; the goal drifts
- **Lost in the middle** — models weight the beginning and end; the middle gets skimmed
- **Economic waste** — every query costs more with no accuracy gain

### The 5 diagnostic questions

1. **What specific decision does this support?** If you can't answer, you don't need it.
2. **Can retrieval replace persistence?** Just-in-time beats always-available.
3. **Who owns this context boundary?** If nobody, it grows forever.
4. **What fails if we exclude this?** If nothing breaks, delete it.
5. **Are we fixing structure or avoiding it?** Stuffing often masks bad information architecture.

### Memory architecture (two layers)

- **Short-term / conversational** — immediate history for follow-ups; managed by summarization and truncation; single session.
- **Long-term / persistent** — facts and preferences across sessions, retrieved semantically. Two kinds: **declarative** (facts — "we don't support IE") and **procedural** (patterns — "this team debugs by reading logs first").

### Research → Plan → Reset → Implement

The cure for context rot:

1. **Research** — gather; the window gets large and noisy
2. **Plan** — synthesize into a high-density plan document; that becomes the source of truth
3. **Reset** — clear the context window entirely
4. **Implement** — fresh session using *only* the compressed plan

**Pitfalls:** believing "infinite context" marketing; retrying instead of restructuring; no context-boundary owner; mixing always-needed with episodic context; skipping the reset — which is the step that actually does the work.

---

## Agent orchestration: the four dimensions

### 1. Coordination of multi-agent workflows
Decompose a complex task into specialized agents running in parallel rather than one linear process. Shift from manual selection to **hypothesis orchestration** — agents generate hypotheses, the human validates and decides.

### 2. Leadership of cross-functional AI pods
Governing data science, engineering, compliance, and design together. The PM is the guardian of governance: risk management up front, not as an afterthought.

### 3. Launch control tower
Real-time monitoring of readiness across functions — support (docs, training, escalation), marketing (messaging, assets), operations (infrastructure, scaling, monitoring). Agentic systems as early warning, flagging gaps before they become blockers.

### 4. Strategic intent alignment
Feeding agents the right mix of mission, constraints, and priorities so automated decisions reflect actual company values. This is context engineering at the orchestration layer — which is why **orchestrating before you've done context design produces fast, confident, well-coordinated garbage.**

### Designing it

1. Is the task actually AI-shaped? (Repetitive, high-volume, judgment-assisted — not judgment-replaced.)
2. Decompose into agent-specific subtasks.
3. Decide parallel vs. sequential — parallelize what's independent.
4. Define boundaries and handoffs explicitly. Handoff failures are the most common breakage.
5. Feed each agent bounded context, not everything.
6. Set up monitoring.
7. **Write the evaluation plan before you run it.** How will you know the output is good?
8. Keep the human review step. Always.

**Pitfalls:** orchestrating before context engineering; over-orchestrating simple tasks (three agents for something one prompt handles); no evaluation plan; ignoring handoff failures; dropping the human review step because it feels like a bottleneck.

---

## PM questions specific to shipping an AI feature

Beyond the normal DUFV risks, AI features carry extras. Work these before committing:

- **What happens when it's wrong?** Not *if*. Design the failure path first — it's the actual product surface. Users experience wrongness far more memorably than correctness.
- **Can the user tell it's AI, and can they override it?** Silent AI that can't be corrected erodes trust faster than visible AI that occasionally errs.
- **What's the evaluation set?** If there's no way to measure quality regressions, you can't ship changes safely. This is the AI equivalent of shipping without tests.
- **What does it cost per interaction, and how does that scale?** Inference cost is COGS. It goes straight into gross margin — see `finance-and-growth.md`.
- **What's the latency budget, and what's the experience while waiting?**
- **What data does it need, do you have the right to use it, and where does it go?**
- **Is the model the product or a component?** If a provider's next release makes your feature redundant, you built a wrapper. Find the part that's yours.
- **What's the fallback when the provider has an outage or changes terms?**

**Validate AI features with probes, not builds.** A feasibility check on real data — does the model actually do this well enough on *your* inputs? — costs a day or two and kills more bad AI features than any other single activity. See `validation-and-experiments.md`.

---

## Cross-references

- Structuring an AI recommendation for stakeholders → recommendation canvas in `strategy-and-positioning.md`
- Probing an AI hypothesis cheaply → `validation-and-experiments.md`
- Inference cost as COGS and margin → `finance-and-growth.md`
- Whether the AI angle is actually differentiating → `strategy-and-positioning.md`
