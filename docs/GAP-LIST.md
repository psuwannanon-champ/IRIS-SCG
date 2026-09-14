# Deck gap list · tracked to closure

Source: *People Strategic Plan Formulation for MTP 2027 — Modernize SCG Capability Development* (IRIS, 2 Aug 2026, 14 pages).
Status set 14 Sep 2026, re-checked in the browser against the live Supabase backend. `[x]` = implemented and verified end to end.

**24 of 25 closed.** Item 20 stays open: it needs promotion events from the HR core, which the demo dataset does not contain. Item 25 was found in a second full read of the deck after the first sweep, and is now closed.

## Tier 1 · Features the deck sells that the platform could not show

| # | Deck claim (page) | Status |
| --- | --- | --- |
| 1 | Self-funding: ROI measured on everything; capability pays for itself (p4, p5, p13) | [x] Governance · self-funding ROI section: cost THB 13.2M, validated impact, ROI ×, cost per learner, cost by category. Cohort page shows programme economics. |
| 2 | The AI platform reads CBM's new roles and generates capability plans, no lengthy co-design (p4) | [x] Role blueprints page: describe a role, Claude returns skills, levels, supply/demand, THB at risk, build/buy/borrow/bot and a cohort plan. Adopt writes rows into the capability agenda. |
| 3 | Dashboard tracks mobility and retention (p5); retention of critical talent, faster time-to-proficiency (p13) | [x] Performance dashboard computes mobility rate, retention rate and time to proficiency; all three also appear on Governance. |
| 4 | Best practices captured once, scaled everywhere: proven improvements packaged as micro-modules (p4) | [x] Success cases · Package as micro-module publishes an authored module into the catalogue with a "proven at" origin label. |
| 5 | Policy pack approved in one People Committee resolution (p5, p12) | [x] Strategy roadmap · policy pack with a per-item decision dialog (status, effective date, resolution reference). |
| 6 | From → TO transformation (p6, p8); Scalable / Simple / Self-funding (p4) | [x] Strategy roadmap · "Why this fits SCG's turnaround" plus From→TO tables for ABC and BCD. |

## Tier 2 · Workflow steps thinner than the deck describes

| # | Deck claim (page) | Status |
| --- | --- | --- |
| 7 | Gate evidence packs, pre-reads, recorded pitches, pricing and best / worst case (p9) | [x] Structured gate pack dialog: summary, field evidence, business case (pricing, payback, base/best/worst, the ask) and pre-read / recorded-pitch attachments. Gate 2 refuses a pack without the business case. |
| 8 | Selection board curates the portfolio to a THB pipeline target (p5, p9) | [x] Cohorts · portfolio total against the pipeline target. |
| 9 | Peer pods support the sprint (p6) | [x] Cohorts · peer pods with coach and learner assignment. |
| 10 | Progress Mirror briefs the human coach **and manager** before each clinic (p11) | [x] Clinic briefing now notifies each learner's line manager as well as the coach. |
| 11 | Practice Partner: instant feedback against program rubrics (p11) | [x] Expert Guidance · Practice partner tab: four scenarios, in-character replies, per-turn rubric scores, sessions below 3/5 flagged to the certified coach. |
| 12 | Program Navigator nudges learners ahead of deadlines and gates (p11) | [x] Send deadline nudges on Assessments and the coaching workspace. |
| 13 | Talent-review packs; L2 / L3 succession pools; incubation leadership within 6 months (p9, p12) | [x] Passport · AI talent-review pack, L2/L3 succession pools with fulfilment. |
| 14 | CEO recognition at showcases and Gate 2; recognition award (p7, p12) | [x] Passport · recognition records (CEO showcase, Gate 2, impact award, skill premium). |
| 15 | Taxonomy refreshed quarterly; critical-skill list annually; agenda annually (p5, p12) | [x] Skills taxonomy · quarterly and annual review cycles, each recordable. |

## Tier 3 · KPIs named in the deck that dashboards did not compute

| # | Measure (page) | Status |
| --- | --- | --- |
| 16 | % completing the sprint (p3, KPI 1.2) | [x] sprintCompletion on the performance dashboard and Governance. |
| 17 | % critical roles skill-ready, leaders first, critical mass ~25% (p5) | [x] Leaders-first and critical-mass tiles on Governance. |
| 18 | AI-ready workforce: leaders able to redesign work with AI (p13) | [x] aiReadyRate on both dashboards. |
| 19 | Sponsor validation ageing (p12 loop) | [x] validationAgeingDays on both dashboards. |
| 20 | % promotions citing verified skills (p3, KPI 1.4) | [ ] Needs HR core promotion data; the simulated HR connector carries the field but no promotion events exist in the demo dataset. |

## Tier 4 · Engine inputs and details

| # | Item (page) | Status |
| --- | --- | --- |
| 21 | Learner profile KPIs as an engine input (p10) | [x] Persona KPIs shown on the passport and fed into the talent-review context. |
| 22 | Teams align with management before validation (p8, p9) | [x] Concepts · management alignment section records the alignment before validation. |
| 23 | Milestones Q1–Q4 with owners carry a status (p3) | [x] Strategy roadmap · Q1–Q4 milestones with owners and an editable status. |
| 24 | Thai interface for learner-facing surfaces (adoption risk) | [x] Thai/English switch in the shell; navigation, Home, My journey, Learning, Labs and Assessment translated. Governance and admin screens stay English by design. |

## Tier 5 · Found in the re-audit (second full read of the deck)

| # | Deck claim (page) | Status |
| --- | --- | --- |
| 25 | "Launchable SCG org-wide: mass assessment and personalized learning for every employee"; "Baseline the organization in waves; Passport from day one" (p4, p5, p10) | [x] Assessment and the passport were cohort-only: every diagnostic hung off an enrolment, so a non-enrolled employee had no passport and could not be read by the marketplace or a talent review. Migration `0015_org_wide_baseline.sql` makes the diagnostic belong to the person; any employee can baseline themselves and mint AI-inferred levels. The program office sees population coverage on the Assessments page. |
