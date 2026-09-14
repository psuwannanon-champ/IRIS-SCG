# SCG Capability Suite · product blueprint (prototype)

Version 0.1 · 14 September 2026 · derived from `CLAUDE-NEW-PLATFORM-MASTER-BRIEF.md` and the IRIS deck *People Strategic Plan Formulation for MTP 2027 – Modernize SCG Capability Development* (2 Aug 2026, 14 pages).

All people, business units, values and outcomes in the prototype are **fictional**. Where the source deck states a mechanism but not a platform rule, the rule below is marked **Proposed**.

## 1. Product definition

| Item | Value |
| --- | --- |
| Product name | SCG Capability Suite (working name; the deck calls it "One AI-Powered Platform Suite") |
| Client | SCG · Corporate HR (CHR) · Capability Development; source material by IRIS Consulting |
| Purpose | One platform where capability transformation (gap mapping, prioritised plans), the career and talent marketplace, and personalisation and coaching run on one skills data model, with before / after uplift validation. |
| Business problem | Programs were content marathons: same agenda for all, learning ended on day 4, attendance certificates. Capability spend was not linked to P&L, careers or rewards. |
| Desired outcome | Skills-first, project-based, AI-powered capability development that is scalable across SCG, simple to run, and wired to careers, rewards and P&L impact. Top KPI: THB value of validated business impact and % graduates with verified skill uplift. |
| Target | Prototype for client walkthrough (not production). First deployments: CBM (turnaround) and CAFI (shared services) lighthouses, then Batch 1/2027 enterprise-wide. |
| Languages | English UI; Thai-capable typeface (IBM Plex Sans Thai); AI coach demonstrates Thai and English. Full Thai UI is not in scope. |
| Brand | **Placeholder tokens pending approved SCG assets**: primary red `#C8102E`, accent navy `#1B3A6B`. No SCG logo is used; a neutral wordmark is shown. |

## 2. Roles and permissions

| Role | Main goal | Sees | Creates / edits | Decides |
| --- | --- | --- | --- | --- |
| Learner | Close prioritised gaps and deliver measured impact | Own journey, diagnostic, plan, contract, passport, ledger entries, marketplace, AI coach; own team's concept | Impact contract (draft/returned), sprint evidence, plan status, showcase claim, gate evidence pack (team member), marketplace interest | Submit / withdraw own records |
| Line manager | Approve and steer reports' sprints | Direct reports' contracts, evidence, passports; own contracts | Review notes | Approve or return contract; mid-sprint gate: scale / pivot / reset |
| BU sponsor (also BU-head delegate for themes) | Convert capability spend into BU P&L | Contracts and ledger in own BU; own briefs; concepts; governance | Challenge brief; validation notes | Approve or return contract; validate or reject ledger value; mid-sprint gate (with manager) |
| Certified coach | Frequent, high-quality feedback | Own learners' contracts, evidence, AI flags; own teams' concepts; cohorts | Coaching notes; clinic briefing ready | — |
| Capability Investment Committee | Curate portfolio and run Gates 1–3 | All briefs, concepts, ledger, governance, taxonomy, cohorts | Decision notes | Approve / return / reject brief; gate decisions |
| Program office (CHR Capability Development) | Run the operating system | Everything | Cohort assignment of briefs; audit notes | Assign brief to cohort; record sample audit |

Server-side enforcement in the prototype: every write is a Postgres function that checks the acting persona's role and relationship to the record. **Limitation:** identity is a persona switch (no Supabase Auth), so the actor is trusted from the client. Read scope is applied in the client selectors; RLS allows demo reads.

## 3. Main records and status flows

| Record | Created by | Statuses | Reviewed by | Outcome |
| --- | --- | --- | --- | --- |
| Impact contract | Learner (Lab Day 4) | draft → manager_review → sponsor_review → active → mid_gate_review → active (scale/pivot) or reset → showcase_review → validated; returned; withdrawn | Line manager, BU sponsor | Validated THB in ledger, outcome-verified badges, enrollment graduated |
| Sprint evidence | Learner (weekly) | — | Manager, sponsor, coach read | Trend against baseline and target |
| Challenge brief | BU sponsor | draft → committee_review → approved → assigned; returned; rejected; withdrawn | Committee; program office assigns | Concept team formed in a BCD cohort |
| Concept + gate reviews | From assigned brief (fixture) | frame → build → validate → gate1 → build_case → gate2 → incubating → gate3 → scaled; pivot; stopped | Committee | Gate 3 scale writes validated value to ledger for each team member |
| Ledger entry | Showcase claim; Gate 3 | pending_validation → validated → audited; rejected | Sponsor; program office audits | Reported to People Committee |
| Passport entry | Diagnostic (AI-inferred); validation / gate (outcome-verified) | tiers: self_declared, ai_inferred, outcome_verified | — | Marketplace matching, promotion evidence |
| Diagnostic + items | Learner runs (simulated) | pending → completed | — | Priority gaps, learning plan |
| Learning plan item | Engine (simulated) | planned → in_progress → completed; skipped | — | — |
| Coaching clinic / note | Program office / coach | briefing_ready flag | — | Learner sees notes |
| Marketplace role / interest | Posting owner (fixture) / employee | expressed → shortlisted / declined (fixture) | Owner | — |
| Notification | System on every workflow action | unread → read | — | Informational only |

**Proposed rules (not stated in the deck):** mid-sprint gate may be decided by manager *or* sponsor; badges mint for the top three priority skills at target level; a returned showcase goes back to `active`; Gate 2 invest schedules Gate 3 six months later; ledger tracking window 12 months.

## 4. Information architecture

| Route | Function | Roles |
| --- | --- | --- |
| /login | Persona picker, Introduction to platform | public |
| /tour | Guided introduction (15 steps across real pages) | public |
| /home | Role home: tasks, updates, role panel | all |
| /tasks | Actionable tasks, filter by area | all |
| /journey, /learning | Journey phases, diagnostic gap map, learning path | learner |
| /team | Direct reports in programs | line manager |
| /contracts, /contracts/new, /contracts/:id | Impact contracts | all (scoped) |
| /briefs, /briefs/new, /briefs/:id | Challenge briefs | sponsor, committee, program office |
| /concepts, /concepts/:id | Concepts and gates | all (scoped) |
| /cohorts, /cohorts/:id | Cohort calendar | program office, coach, committee |
| /coaching | Coaching workspace | coach |
| /passport?persona= | Skill passport | own; managers/sponsors/office for others |
| /marketplace | Talent marketplace with requirement matching | learner, manager, sponsor, office |
| /ledger | Impact ledger | all except coach (scoped) |
| /governance | Impact dashboard | sponsor, committee, office |
| /taxonomy | Skills taxonomy (read-only) | office, committee, coach |
| /ai-coach | Simulated AI coach (TH/EN) | learner, coach |
| /notifications | Updates history | all |

## 5. Requirement matrix (deck → implementation)

| # | Source (deck page) | Requirement | Implemented as | Status |
| --- | --- | --- | --- | --- |
| R1 | p3 1.1 | Strategy and AI platform suite live; % BUs onboarded | Governance dashboard BU onboarding flags | Implemented (flags are fixtures) |
| R2 | p3 1.2, p6–7 | ABC: AI diagnostic personalises journey; flipped micro-learning; 90-day sprint; showcase; verified passport | Journey, Learning plan, Impact contracts, passport minting | Implemented; diagnostic/engine simulated |
| R3 | p3 1.3, p8–9 | BCD: sponsor briefs, three gates, Start the Dot scale-up, THB pipeline | Challenge briefs, Concepts & gates, ledger at Gate 3 | Implemented |
| R4 | p3 1.4, p12 | Passport → career; ledger → rewards; talent review inputs | Passport, Ledger, program outcomes on passport, marketplace | Implemented (policy decisions outside platform) |
| R5 | p5 03 | Capability Investment Committee approves briefs and runs gates | Committee role and actions | Implemented |
| R6 | p5 03 | Contract impact before learning; track 6–12 months | Impact contract + ledger tracking_until | Implemented |
| R7 | p5 02 | One taxonomy, four levels, verification tiers | Taxonomy page, passport tiers | Implemented (18 of ~100 skills) |
| R8 | p6, p8 | Coaching quality scorecard; async clinics | Coaching workspace, scorecards | Implemented |
| R9 | p7 wk6 | Mid-sprint gate: scale / pivot / reset | Contract action | Implemented |
| R10 | p10 | Personalisation engine inputs/outputs | Diagnostic rationale, plan reasons, BU variants | Simulated |
| R11 | p11 | AI coach TH/EN, grounded, cites module | AI coach page | Simulated script |
| R12 | p12 | Skill premiums, CEO recognition, accelerated review | Premium-eligible flag, top decile flag | Displayed only |
| R13 | p5 04 | Integrated with HR core as single source of truth | — | Not connected (proposed) |
| R14 | p5 05 | Annual sample audit of ledger | Program office audit action | Implemented |
| R15 | Brief §13–14 | Guided introduction; page explainer | Tour, Explain this page | Implemented |

## 6. Integration register

| System | Direction | Status |
| --- | --- | --- |
| Supabase Postgres (project `bczqgxqlvgbauvtkvdnu`) | Reads via publishable key; writes via RPC | Schema and seed prepared; **installation pending** (see README) |
| HR core (talent profile sync) | Passport → HR | Proposed, not connected |
| AI diagnostic / personalisation engine | Work data → gap map | Simulated |
| AI coach (LLM, retrieval-grounded) | Chat | Simulated script |
| Email / chat notifications | Out | Not connected; in-platform updates only |
| SCG Start the Dot | Gate 3 route | Recorded as a label only |

## 7. Demo scenario (fictional)

- **Nara Wongsuwan** (CBM sales lead, ABC Lighthouse 1, week 5 of sprint): active contract, weekly evidence, mid-gate in 11 days, learning plan 5/10 complete.
- **Tanawat Srisuk**: submitted mid-gate evidence → manager **Somsak** decides scale / pivot / reset.
- **Pim** (CAFI): contract in manager review → **Ratree**. **Krit**: sponsor review → **Wanida**. **Boonchu**: returned. **Nok**: draft + pending diagnostic (run simulated diagnostic).
- **Arisa**: validated THB 2.4M, outcome-verified badges, top decile, shortlisted in marketplace. **Jiraporn**: showcase pending sponsor **Prasert** validation.
- **BCD Lighthouse 2026**: Team Kiln (Gate 1 go, building case), Team Touchless (Gate 2 evidence submitted → committee **Chatchai** decides), Team Loop (pivot). **BCD 2025** Solar concept scaled, THB 120M audited.
- **Briefs 2027 intake**: two in committee review, one approved awaiting **Supattra** (program office) assignment, one returned, one draft, one rejected.
