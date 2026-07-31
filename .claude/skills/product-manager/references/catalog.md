# Catalog: all 70 source skills

The complete library this skill was distilled from — [deanpeters/Product-Manager-Skills](https://github.com/deanpeters/Product-Manager-Skills) v0.83, CC BY-NC-SA 4.0.

Use this file to find a framework by name, to check whether a play exists for a situation, or to point someone at the original source when they want the full treatment. The depth for the frameworks in active use lives in the other reference files; this is the index.

---

## The three skill types

The library's own taxonomy, and it's worth knowing because it tells you how to *run* a play, not just what it contains:

- **Component** — a single deliverable or artifact. Self-contained building blocks with a template and quality criteria. "How to create X well." Referenced by workflows.
- **Interactive** — a multi-turn conversational flow. Asks 3–5 adaptive questions, then offers enumerated, context-aware options. Runs under the **facilitation protocol**.
- **Workflow** — a multi-step process that orchestrates other skills, with decision points and branching. "How to complete process Y." Investigation workflows run under the **investigation protocol**.

When you're unsure which mode a request wants: if they need an artifact, run it like a component. If the information lives in their head, run it like an interactive. If it spans days and multiple artifacts, run it like a workflow and announce the phases.

---

## Chained workflows (the library's `/commands`)

| Chain | Sequence | Produces |
|---|---|---|
| **discover** | problem-framing-canvas → discovery-interview-prep → opportunity-solution-tree → pol-probe-advisor → discovery-process | Discovery plan, prioritized assumptions, validation backlog |
| **strategy** | product-strategy-session → positioning-workshop → problem-statement → opportunity-solution-tree → roadmap-planning | Strategy narrative, core choices, sequenced direction |
| **write-prd** | prd-development → problem-statement → proto-persona → user-story → user-story-splitting | Structured PRD, personas, implementation-ready stories |
| **prioritize** | prioritization-advisor → feature-investment-advisor → acquisition-channel-advisor → finance-based-pricing-advisor → recommendation-canvas | Ranked options, decision rationale, explicit tradeoffs |
| **plan-roadmap** | roadmap-planning → epic-hypothesis → prioritization-advisor → user-story-mapping → epic-breakdown-advisor | Prioritized roadmap, epic hypotheses, release slices |
| **leadership-transition** | altitude-horizon-framework → director-readiness-advisor → vp-cpo-readiness-advisor → executive-onboarding-playbook | Transition diagnosis, readiness plan, 30-60-90 actions |

---

## The full library

### Component (24)

| Skill | Theme | What it does |
|---|---|---|
| `altitude-horizon-framework` | career-leadership | Understand the PM-to-Director transition through altitude and horizon thinking. Use when diagnosing scope, time-horizon, or leadership-level gaps. |
| `company-research` | — | Create a company research brief with executive quotes, product strategy, and org context. Use when preparing for interviews, competitive analysis, partnerships, or market-entry work. |
| `customer-journey-map` | workshops-facilitation | Create a customer journey map across stages, touchpoints, actions, emotions, and metrics. Use when diagnosing a broken experience or aligning a team on the full customer flow. |
| `eol-message` | — | Write a clear, empathetic EOL announcement with rationale, customer impact, and next steps. Use when retiring a product, feature, or plan without creating avoidable confusion. |
| `epic-hypothesis` | — | Frame an epic as a testable hypothesis with target user, expected outcome, and validation method. Use when defining a major initiative before roadmap, discovery, or delivery planning. |
| `finance-metrics-quickref` | — | Look up SaaS finance metrics, formulas, and benchmarks fast. Use when you need a quick metric definition, formula, or benchmark during analysis. |
| `intelligence-collection-disciplines` | market-intelligence | Run competitive research like an intelligence agency: eight collection disciplines (OSINT to MASINT), signal-to-inference chains, and fusion. Use when one-source research isn't enough. |
| `jobs-to-be-done` | — | Uncover customer jobs, pains, and gains in a structured JTBD format. Use when clarifying unmet needs, repositioning a product, or improving discovery and messaging. |
| `pestel-analysis` | — | Analyze political, economic, social, technological, environmental, and legal forces. Use when external market shifts could materially affect a product, roadmap, or strategy. |
| `pol-probe` | — | Define a Proof of Life probe to test a risky hypothesis cheaply. Use when you need harsh truth before building real product. |
| `positioning-statement` | strategy-positioning | Create a Geoffrey Moore-style positioning statement. Use when clarifying who you serve, what problem you solve, your category, and why you're different from alternatives. |
| `press-release` | — | Write an Amazon-style press release that defines customer value before building. Use when aligning stakeholders on a new product, feature, or strategic bet. |
| `problem-statement` | — | Write a user-centered problem statement with who is blocked, what they are trying to do, why it matters, and how it feels. Use when framing discovery, prioritization, or a PRD. |
| `product-sense-interview-answer` | career-leadership | Structure a spoken PM product-sense answer with assumptions, segmentation, pain-point prioritization, and MVP tradeoffs. Use when practicing design, improve, or build-next interview questions. |
| `proto-persona` | — | Create a proto-persona from current research, market signals, and team knowledge. Use when you need a working customer profile before deeper validation. |
| `recommendation-canvas` | — | Evaluate an AI product idea across outcomes, hypotheses, risks, and positioning. Use when deciding whether an AI solution deserves investment or recommendation. |
| `saas-economics-efficiency-metrics` | — | Evaluate SaaS unit economics and capital efficiency. Use when deciding whether the business can scale efficiently or needs correction. |
| `saas-revenue-growth-metrics` | finance-metrics | Calculate SaaS revenue, retention, and growth metrics. Use when diagnosing momentum, churn, expansion, or product-market-fit signals. |
| `stakeholder-identification` | — | Map every stakeholder before engaging anyone. Use when launching an initiative, scoping discovery, or building an engagement plan from scratch. |
| `stakeholder-mapping` | — | Prioritize stakeholders using two complementary grids. Use when setting engagement strategy and surfacing whose voice needs elevating after stakeholder identification. |
| `storyboard` | — | Create a six-frame storyboard that shows a user's journey from problem to solution. Use when you need a fast narrative for alignment, concept reviews, or demos. |
| `user-story-mapping` | — | Create a user story map that lays out activities, steps, tasks, and release slices. Use when planning a workflow, backlog, or MVP around the user journey. |
| `user-story-splitting` | — | Break a large story or epic into smaller deliverable stories using proven split patterns. Use when backlog items are too big for estimation, sequencing, or independent release. |
| `user-story` | pm-artifacts | Create user stories with Mike Cohn format and Gherkin acceptance criteria. Use when turning user needs into development-ready work with clear outcomes and testable conditions. |

### Interactive (27)

| Skill | Theme | What it does |
|---|---|---|
| `acquisition-channel-advisor` | — | Evaluate acquisition channels using unit economics, customer quality, and scalability. Use when deciding whether to scale, test, or kill a growth channel. |
| `agent-orchestration-advisor` | ai-agents | Design multi-agent AI workflows with clear boundaries, handoffs, and monitoring. Use when a complex PM task should run as parallel specialized agents instead of one linear process. |
| `ai-shaped-readiness-advisor` | ai-agents | Assess whether your product work is AI-first or AI-shaped. Use when evaluating AI maturity and choosing the next team capability to build. |
| `business-health-diagnostic` | finance-metrics | Diagnose SaaS business health across growth, retention, efficiency, and capital. Use when preparing a business review or prioritizing urgent fixes. |
| `context-engineering-advisor` | ai-agents | Diagnose context stuffing vs. context engineering. Use when an AI workflow feels bloated, brittle, or hard to steer reliably. |
| `customer-journey-mapping-workshop` | — | Run a customer journey mapping workshop with adaptive questions and outputs. Use when you need to map stages, actions, emotions, pain points, and opportunities for a persona and scenario. |
| `derisk-measurement-advisor` | — | Identify what to measure, test, or track to de-risk a product or AI idea. Use when stress-testing an idea across internal (DUFV) and external (PESTEL) dimensions. |
| `director-readiness-advisor` | career-leadership | Guide the PM-to-Director transition across preparing, interviewing, landing, and recalibrating. Use when leadership scope is changing and you need practical coaching. |
| `discovery-interview-prep` | discovery-research | Plan customer discovery interviews with the right goal, segment, constraints, and method. Use when preparing interviews for problem validation, churn research, or new product ideas. |
| `epic-breakdown-advisor` | — | Break down epics into user stories with Humanizing Work split patterns. Use when a backlog item is too large to estimate, sequence, or deliver safely. |
| `feature-investment-advisor` | — | Evaluate feature investments using revenue impact, cost structure, ROI, and strategy. Use when deciding whether a feature deserves investment. |
| `finance-based-pricing-advisor` | — | Evaluate pricing changes using ARPU, conversion, churn risk, NRR, and payback. Use when deciding whether a pricing move should ship. |
| `incoming-request-advisor` | stakeholder-comms | Decode an incoming message into a structured breakdown that separates the literal ask from the job-to-be-done. Use before replying to a loaded Slack ping, email, mandate, or escalation. |
| `intel-discipline-advisor` | market-intelligence | Triage a competitive or market question into the right intelligence disciplines, cadence, and executing skill. Use when you know something needs researching but not which channel to run. |
| `lean-ux-canvas` | — | Guide teams through Lean UX Canvas v2. Use when framing a business problem, surfacing assumptions, and defining what to learn next. |
| `opportunity-solution-tree` | — | Build an Opportunity Solution Tree from outcomes to opportunities, solutions, and tests. Use when a stakeholder request needs problem framing before you decide what to build. |
| `organic-growth-advisor` | — | Identify which organic growth path to pursue — new segments, geographies, channels, or products. Use when diagnosing where a growth constraint lives and which McKinsey growth level to act on next. |
| `pm-skill-creator` | meta-authoring | Design a new PM skill through guided conversation. Use when you have raw content or an idea and want to shape it into a compliant skill. |
| `pol-probe-advisor` | — | Select the right Proof of Life (PoL) probe based on hypothesis, risk, and resources. Use this to match the validation method to the real learning goal, not tooling comfort. |
| `positioning-workshop` | — | Run a positioning workshop that surfaces target customer, unmet need, category, benefits, and differentiation. Use when your product messaging feels fuzzy, generic, or misaligned. |
| `prioritization-advisor` | — | Choose a prioritization framework based on stage, team context, and stakeholder needs. Use when deciding between RICE, ICE, value/effort, or another scoring approach. |
| `problem-framing-canvas` | — | Guide teams through MITRE's Problem Framing Canvas. Use when you need a clearer problem statement before jumping to solutions. |
| `stakeholder-engagement-advisor` | — | Plan engagement for a specific stakeholder. Use when preparing an outreach, navigating resistance, or aligning a critical relationship before a key milestone. |
| `tam-sam-som-calculator` | — | Calculate TAM, SAM, and SOM with explicit assumptions, methods, and caveats. Use when sizing a market for a product idea, business case, or executive review. |
| `user-story-mapping-workshop` | — | Run a user story mapping workshop with adaptive questions and a structured map output. Use when you need backbone activities, tasks, and release slices for a workflow. |
| `vp-cpo-readiness-advisor` | career-leadership | Guide the transition to VP or CPO across preparing, interviewing, landing, and recalibrating. Use when executive product scope is changing fast. |
| `workshop-facilitation` | workshops-facilitation | Facilitate workshop sessions in a one-step, multi-turn flow. Use when an interactive skill needs consistent pacing, options, and progress tracking. |

### Workflow (19)

| Skill | Theme | What it does |
|---|---|---|
| `ansoff-matrix` | market-intelligence | Map evidence-backed growth options across the Ansoff Matrix with risk-rated sequencing. Use when the question is where the next tranche of growth comes from, and at what risk. |
| `autonomous-investigation` | market-intelligence | The protocol behind every investigation skill. Use when AI research must proceed without you: search-plan gate, Fact/Inference/Assumption labels, confidence stacking, diffable outputs. |
| `battle-card-builder` | market-intelligence | Research and draft a competitive battle card from public evidence — every claim labeled and sourced. Use when a rep needs a field-action card, not a research report. |
| `company-intel` | — | Research a company, industry, or competitor set using web search and seven analytical lenses. Use when you need structured intel that feeds downstream PM skills. |
| `competitive-analysis-process` | market-intelligence | Orchestrate a complete competitive analysis across six steps, from landscape to strategic direction. Use when you need the full picture, not a single scan or card. |
| `competitive-intel-watch` | market-intelligence | Scheduled delta monitoring against a prior competitive snapshot. Use when tracking competitors on a cadence: material shifts only, cited evidence, battle-card update flags, runs unattended. |
| `competitive-research-snapshot` | market-intelligence | Research a competitive landscape with cited snapshots, a comparison matrix, and so-what implications. Use when a product decision needs competitive grounding, not a market report. |
| `discovery-process` | discovery-research | Run a full discovery cycle from problem hypothesis to validated solution. Use when a team needs a structured path through framing, interviews, synthesis, and experiments. |
| `executive-onboarding-playbook` | career-leadership | Plan a VP or CPO 30-60-90 day diagnostic onboarding path. Use when entering a new executive product role and avoiding premature change. |
| `market-landscape-scan` | market-intelligence | Map a market's segments, players, substitutes, and whitespace with cited evidence. Use when entering or re-evaluating a market before sizing, positioning, or picking competitors to study. |
| `pestel-delta-monitor` | market-intelligence | Quarterly re-scan of a prior PESTEL analysis. Use when checking which macro factors moved, which assumptions broke, and what's new — turning PESTEL from a workshop artifact into a radar. |
| `porters-five-forces` | market-intelligence | Read an industry's structure through Porter's Five Forces with documented signals per rating, ending at the profit pool. Use when weighing market entry or when margins erode and nobody can say why. |
| `prd-development` | pm-artifacts | Build a structured PRD that connects problem, users, solution, and success criteria. Use when turning discovery notes into an engineering-ready document for a major initiative. |
| `pricing-packaging-tracker` | market-intelligence | Track competitor pricing and packaging as a diffable time series. Use when monitoring tiers, gates, limits, and price moves on a monthly or quarterly cadence. |
| `product-strategy-session` | — | Run an end-to-end product strategy session across positioning, discovery, and roadmap planning. Use when a team needs validated direction before committing to execution. |
| `roadmap-planning` | strategy-positioning | Plan a strategic roadmap across prioritization, epic definition, stakeholder alignment, and sequencing. Use when turning strategy into a release plan that teams can execute. |
| `skill-authoring-workflow` | — | Turn raw PM content into a compliant, publish-ready skill. Use when creating or updating a repo skill without breaking standards. |
| `swot-analysis` | market-intelligence | Build an evidence-cited SWOT of one company — yours or a competitor's — from public sources, ending with the S-O/W-T crossings. Use for strategy reviews, board prep, or competitor depth. |
| `voice-of-customer-miner` | market-intelligence | Mine public reviews, app stores, and forums for unmet needs, competitor weaknesses, and switching triggers — with quoted evidence. Use when you want customer voice without waiting on interviews. |

---

## Themes

`ai-agents` · `career-leadership` · `discovery-research` · `finance-metrics` · `market-intelligence` · `meta-authoring` · `pm-artifacts` · `stakeholder-comms` · `strategy-positioning` · `workshops-facilitation`

---

## The two governing protocol skills

Two skills in the library aren't frameworks — they're contracts every other skill honors. Both are reproduced in full in `SKILL.md`:

- **`workshop-facilitation`** — the canonical pattern for interactive skills: entry modes, one question per turn, progress labels, numbered recommendations at decision points, interruption handling.
- **`autonomous-investigation`** — the canonical contract for research skills: question budget, search-plan gate, Fact/Inference/Assumption labels, do-not-invent lists, Just Enough Mode, stable diffable schemas, confidence stacking, SCIP guardrails.

The split between them is worth internalizing: **facilitation** is for when the user holds the context; **investigation** is for when the world does.

---

## Meta-authoring skills

`pm-skill-creator` (interactive) and `skill-authoring-workflow` (workflow) exist to build *new* skills for that library. If someone wants to extend this skill with a play it doesn't cover, the anatomy those skills enforce is a good template:

**Purpose → Input → Key Concepts → Application → Examples → Common Pitfalls → References**

with an `Input` section that names what to bring, treats inline context as answers already given, and frames arriving empty-handed as an invitation rather than a gate.

---

## Provenance and attribution

Source: **Product-Manager-Skills** by Dean Peters, v0.83 (July 2026), 70 skills, licensed **CC BY-NC-SA 4.0**. Non-commercial use, attribution required, share-alike.

Frameworks referenced throughout stand on published work by their original authors — Geoffrey Moore (positioning), Clayton Christensen (JTBD), Jeff Patton (story mapping), Mike Cohn (user stories), Richard Lawrence and Peter Green (story splitting), Teresa Torres (Opportunity Solution Trees, continuous discovery), Marty Cagan (the four risks, prototype flavors), Jeff Gothelf (Lean UX Canvas), Michael Porter (Five Forces), Igor Ansoff (growth matrix), MITRE (Problem Framing Canvas), Amazon (working backwards), NN/g (journey mapping), McKinsey (growth pyramid), SCIP (competitive-intelligence ethics). Proof of Life probes and the Recommendation Canvas are Dean Peters / Productside originals.
