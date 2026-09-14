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
| /assessment | AI skill diagnostic questionnaire → Expert Guidance | learner |
| /assessments | Assessment waves, completion, reminders | manager, sponsor, coach, committee, office |
| /labs | Lab days: agenda, pre-work, check-in, takeaway | learner |
| /success-cases | Validated improvements and funded concepts | all |
| /ai-coach | Expert Guidance chat (TH/EN, Claude) | learner, coach |
| /strategy | Strategy roadmap (sub-plans, components, enablers, live KPIs) | sponsor, committee, office |
| /performance | Performance dashboard, team and company views | all except learner |
| /integrations | Simulated connectors and run log | office, committee |
| /agenda | Capability agenda (value-to-skills cascade, build/buy/borrow/bot) | sponsor, committee, office |
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
| R16 | p6–7, p10 | AI skill diagnostic (Phase 0 assessment) mapping the six domains and picking priority skills | Assessment page → Expert Guidance diagnostic → gap map, passport levels, learning path | Implemented (Claude) |
| R17 | p10 | Personalisation engine outputs: micro-learning plan, coaching points, application to role, application to project; re-personalised after every activity | Expert Guidance on journey and contract; refreshable; saved notes | Implemented (Claude) |
| R18 | p11 | AI coach: navigator, activity guide, content expert, practice partner, progress mirror; TH/EN; grounded; briefs the human coach | Expert Guidance chat with module citations and human-coach flag; clinic briefing in coaching workspace | Implemented (Claude) |
| R19 | p5 01 | Value-to-skills cascade; 3-year supply vs demand; THB at stake; build / buy / borrow / bot; fund biggest gaps first | Capability agenda page with decision + funding action | Implemented (fixtures + action) |
| R20 | p3, p4, p5, p12 | Strategic plan, five components, applications, enablers timeline | Strategy roadmap page with live KPI values | Implemented |
| R21 | p5 02, p12 | Role-level skill requirements published; promotion cases cite passport | Role requirements for next level on the passport | Implemented (proposed ladders) |
| R22 | p5 04, p5 05 | Before / after uplift dashboards; talent review inputs; premiums; fast-track; incubation roles | Impact dashboard: skill uplift and career & rewards triggers | Implemented |
| R23 | p7 step 2 | Flipped micro-learning: core concepts learned before class through short modules | Learning plan module viewer (objective, key points, how to study, check question) with pre-work per lab day | Implemented (content generated from taxonomy) |
| R24 | p7 steps 3–6 | Four applied capability labs on live SCG cases with real AI tools; Lab Day 4 agrees the impact contract | Lab days page: agenda, live case, tools, deliverable, pre-work, check-in, takeaway; Day 4 hands off to the contract | Implemented |
| R25 | p7 step 8, p11 | AI coach flags who needs what and briefs the human coach | Expert Guidance flags persist as coaching notes and notify the coach; clinic briefing | Implemented |
| R26 | p7 step 10, p5 05 | Success cases logged on the platform, 100% tracked; visible proof stories | Success cases gallery | Implemented |
| R27 | p7 step 11, p12 | Week-14 trigger: impact rating → review; top ~10% → BCD fast-track | Record program outcome on the passport (manager, sponsor, program office) | Implemented |
| R28 | p8–9 steps 1–5 | BU heads set themes; teams form around briefs; frame → build → validate stages | Set BU theme; Form team (creates concept and Gates 1–2); advance stage by the team | Implemented |
| R29 | p5 02, p5 03 | Assessment waves; cohort calendar and playbook; coach certification | Assessments overview with reminders; New cohort from playbook; Enrol learner; coach scorecard recording | Implemented |
| R30 | p12 | Marketplace allocates key talent by verified skills | Owner postings with skill requirements; shortlist / decline with notification | Implemented |
| R31 | p5 01 action 3, p5 05 | Capability OKRs on leader scorecards; quarterly review; dashboard tracks uplift, ledger, mobility | Performance dashboard: team vs company on twelve measures, health score, rank, leaderboard | Implemented |
| R32 | p5 04, p12 | Integrated with HR core; rewards linked to impact; notifications; P&L actuals; Start the Dot | Integrations page with five simulated connectors, run log and payloads; sync indicators on passport and ledger | Simulated |
| R34 | p5 05, p12 | Dashboard read by leaders quarterly | AI summary on the performance dashboard (Claude Sonnet, deterministic inputs, 2 lines + 2 next steps) | Implemented |
| R33 | p6, p10 | Modular micro-learning aligned to SCG business, split by BU variant | Authored module content per module (Claude-generated at build time) with quick check | Implemented (content illustrative) |

## 6. Integration register

| System | Direction | Status |
| --- | --- | --- |
| Supabase Postgres (project `bczqgxqlvgbauvtkvdnu`) | Reads via publishable key; writes via RPC | Schema and seed prepared; **installation pending** (see README) |
| HR core (talent profile sync) | Passport → HR | Proposed, not connected |
| Expert Guidance (Claude `claude-opus-5` via server-side function) | Assessment, journey, contract, coach chat, clinic briefing | Connected; key server-side; scripted fallback when unavailable |
| Email / chat notifications | Out | Not connected; in-platform updates only |
| SCG Start the Dot | Gate 3 route | Recorded as a label only |

## 7. Demo scenario (fictional)

- **Nara Wongsuwan** (CBM sales lead, ABC Lighthouse 1, week 5 of sprint): active contract, weekly evidence, mid-gate in 11 days, learning plan 5/10 complete.
- **Tanawat Srisuk**: submitted mid-gate evidence → manager **Somsak** decides scale / pivot / reset.
- **Pim** (CAFI): contract in manager review → **Ratree**. **Krit**: sponsor review → **Wanida**. **Boonchu**: returned. **Nok**: draft + pending diagnostic (run simulated diagnostic).
- **Arisa**: validated THB 2.4M, outcome-verified badges, top decile, shortlisted in marketplace. **Jiraporn**: showcase pending sponsor **Prasert** validation.
- **BCD Lighthouse 2026**: Team Kiln (Gate 1 go, building case), Team Touchless (Gate 2 evidence submitted → committee **Chatchai** decides), Team Loop (pivot). **BCD 2025** Solar concept scaled, THB 120M audited.
- **Briefs 2027 intake**: two in committee review, one approved awaiting **Supattra** (program office) assignment, one returned, one draft, one rejected.
