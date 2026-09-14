# Verification log · SCG Capability Suite prototype

Date: 14 September 2026 · Environment: local Vite dev server, macOS, Chromium (Claude in-app browser) · Backend: **local fixtures** (Supabase schema not yet installed, see README) · Tester: Claude (automated + manual)

## Automated checks

| Check | Result |
| --- | --- |
| `pnpm typecheck` (tsc strict) | Pass |
| `pnpm build` (Vite 8 production) | Pass · 1.09 MB JS before gzip (307 kB gzip); code-splitting recommended before production |
| `npx oxlint src` | 0 errors, 12 warnings (fast-refresh export hints, one set-state-in-effect in the tour) |
| `npx tsx scripts/test-sql.ts` (PGlite in-process Postgres) | Pass: schema + seed apply; 22 personas, 8 contracts; 12 workflow functions exercised; 11 role/status rejections confirmed; `reset_demo()` restores 8 contracts / 24 events |

## Manual walkthrough (desktop 1280 × 720 unless stated)

| Role · screen | Test | Expected | Actual |
| --- | --- | --- | --- |
| Login | Persona list, intro button, backend badge | Renders with verified icons; amber "Local demo fixtures" badge | Pass |
| Learner Nara · Home | Task count matches list; updates separate | 3 tasks, 2 unread | Pass |
| Learner Nara · Contract detail | Log week-5 evidence | Saved, latest value updated to 33.8 (week 5), toast, task cleared, count 3 → 2 after reload | Pass (persisted) |
| Manager Somsak · Home / Team | Only own reports, one task | 1 task: mid-gate decision for Tanawat | Pass |
| Manager Somsak · Contract ic-tanawat | Record mid-sprint gate: scale + note | Status active, decision recorded in history, badges cleared, footer "Waiting for learner" | Pass |
| Committee Chatchai · Brief cb-logistics | Available actions | Approve / Return / Reject only | Pass |
| Sponsor Prasert · New brief, Ledger | Form renders; 2 pending validations visible | Pass |
| Learner Nok · Journey | Pending diagnostic shows run action | Pass |
| Coach Anong · Coaching workspace | Clinics, learners, flags, scorecard | Pass |
| Program office Supattra · all 16 routes | No error state, no overflow, no missing icons | Pass |
| Guards | Office → /journey, /coaching; manager → /briefs; coach → /marketplace; learner → /governance | "Not available for your role" | Pass |
| Record scope | Learner Nara → /contracts/ic-pim | "Not connected to this impact contract" | Pass |
| Explain this page | Contract detail | Panel opens right, header fixed, stages with icons, Escape closes | Pass |
| Guided introduction | Steps 3 (home) and 10 (Gate 2) | Full-border highlight, card placed beside target, Back/Next, persona switched | Pass (after fix) |
| Phone 390 × 844 | Home, contracts, brief detail, concept detail, ledger, tasks, governance | No horizontal overflow | Pass (governance fixed after first run) |
| Narrow 320 × 700 | Home, login | No document overflow | Pass |
| Console | All roles / routes | Only the expected Supabase probe 404 (schema not installed) | Pass |

## Defects found and fixed during QA

1. Task rows collapsed to zero width inside the two-column home layout (fixed-width grid columns exceeded container). Fixed with a compact row variant and a wide variant for the tasks page.
2. Floating "Explain this page" button overlapped sticky action buttons. Fixed with right clearance on sticky bars.
3. Guided tour overlay did not activate on a full page load (listener registered after the step event). Fixed with a layout-effect listener plus route-change re-read.
4. Tour highlight targets missing on contract, ledger and brief steps. Fixed.
5. Seed data had duplicate passport ids for one persona (caught by PGlite). Fixed id scheme.
6. Grid children lacked `min-width: 0`, so truncated rows widened cards on phones. Fixed globally.
7. Governance BU table truncated names at 1280 and overflowed at 390. Fixed with responsive columns.
8. `usePagination` was a plain function named like a hook and called after early returns. Renamed to `paginate`.

## Supabase mode (added after schema install, 14 Sep 2026)

| Test | Result |
| --- | --- |
| Apply `0001_schema.sql` + `0002_seed.sql` via session pooler | Pass · 22 personas, 8 contracts, 24 events |
| Anonymous REST read of `personas` with publishable key | Pass |
| Direct `PATCH impact_contracts` with publishable key | Blocked by RLS (0 rows changed) |
| RPC `transition_impact_contract` with wrong actor | Rejected: "You are not the responsible person for this action." · status unchanged |
| App header badge | "Connected to Supabase" |
| Log week-5 evidence as Nara through the UI | Row present in `sprint_evidence`; manager notification "Nara Wongsuwan logged week 5 evidence" created by the function |

## Assessment and Expert Guidance (added 14 Sep 2026, Supabase mode)

| Test | Result |
| --- | --- |
| `POST /api/guidance` unknown kind (dev middleware) | 400 `Unknown guidance kind` |
| Coach question via `runGuidance` script | Grounded reply citing CHG-01.2, ~500 tokens |
| Nok completes assessment (12 self-ratings, 11 questions, role context) | Assessment row stored; Expert Guidance returned 12 items, 6 priorities, 12-module path with rationale tied to her answers and sprint dates (~70 s) |
| Accept result | Diagnostic completed; 6 priority items; 12 plan items; enrollment diagnosed; guidance note saved |
| Weekly guidance on journey | 3 priorities with module codes and actions; saved with `claude-opus-5` and requester |
| Capability agenda decision as program office | Bot + funded recorded; row updated |
| Production `POST /api/guidance` on iris-scg.vercel.app | 400 for unknown kind; Thai coach question answered by `claude-opus-5` (after fixing an ESM import that crashed the first deploy) |

## Journey operations (added 14 Sep 2026)

| Test | Result |
| --- | --- |
| Learner lab check-in with takeaway (Nara, Day 1) | Saved; shown on the lab card |
| Learner opens module, answers check, marks completed | Plan progress increments |
| Program office creates cohort from playbook | Cohort appears with generated key dates and clinics |
| Program office enrols learner and forms team on assigned brief | Enrollment invited with pending diagnostic; concept created in Stage 1 with Gate 1 and 2 |
| Team member advances concept stage | frame → build recorded in history |
| Sponsor sets BU theme; publishes marketplace posting; shortlists candidate | Recorded and candidate notified |
| Sponsor records program outcome (impact rating, top 10%, fast-track) | Saved; learner notified; triggers appear on dashboard |
| Expert Guidance flag from coach chat | Coaching note with AI flag created for the coach |

## Dashboard, integrations, content (added 14 Sep 2026)

| Test | Result |
| --- | --- |
| Performance dashboard as manager Somsak | Health 73%, rank 2 of 4 manager teams, 6 of 10 measures ahead; 11 comparison rows; no overflow |
| Company view leaderboard | Ranked; viewer's row highlighted; office can switch unit kind (BU leaderboard: SCGC, CBM, CAFI) |
| Integrations: HR core sync and payroll export runs | Runs logged with payloads (9 badges; 5 employees in merit export); passport shows "last synced" |
| Chart palette validator | `#C8102E` + `#3B7DDD` pass all six checks (light mode) |
| Dashboard AI summary, 3 runs on one scorecard | Identical measures, numbers and order every run; wording varies only |
| Dashboard AI summary, team view | "6 of 10" matches the "Better than company on" tile exactly |
| Dashboard AI summary, company view | Reports company health score, leading and trailing unit, two weakest company measures; stable across two refreshes |
| Expert Guidance reply format | "Where you are / Next step / three bullets" under 120 words, module cited |

## Deck closure sweep (14 Sep 2026, live Supabase)

| Test | Result |
| --- | --- |
| Role blueprint end to end | Created "Shared Service Squad Lead (automation-first)" for CAFI; Claude returned 6 skills, THB 97M at risk, ABC · 5 seats · Q1 2027; adopting it took the capability agenda to 9 rows, 7 awaiting a build/buy/borrow/bot decision |
| Gate 2 evidence pack | Pack with field evidence, business case and two attachments submitted; concept moved to Gate 2; committee notified. A pack without the business case is rejected by the database function, not just the form |
| Practice partner | Gate 2 pitch scenario: in-character challenge back, 2.2/5 across five rubric criteria, "change next time" line, session saved and listed |
| Passport recognition | CEO showcase recognition recorded and attributed |
| Succession pool | L3 pool entry with basis and due date; "Mark fulfilled" appears |
| Talent-review pack | Claude pack cited the recognition and the unfulfilled pool entry created minutes earlier, plus gate and badge history |
| Employment status | "Mark as left" stamps the leaving date and reverses cleanly |
| Marketplace placement | Express interest (learner) → shortlist → record placement (posting owner); status reached `placed` in the database |
| Package a success case | Published `COMM-02.C1` with body content; visible in the catalogue with a success-case origin |
| Deadline nudges | 2 nudges sent for diagnostics, gates and showcases due within three weeks |
| Thai interface | Switch translates the whole navigation and the learner surfaces; governance screens stay English by design |
| Performance dashboard after the sweep | Mobility moved 9% → 18% from the recorded placement; AI summary picked it up as a next step |
| Tour steps | New role-blueprint and practice-partner steps land on the right page, persona and highlight |

### Re-audit finding: org-wide baseline (deck p4, p5, p10)

A second full read of the deck against the platform found one genuine gap. Assessment and the
passport were structurally cohort-only: `diagnostics.enrollment_id` and `assessments.enrollment_id`
were both NOT NULL, `submit_assessment` and `complete_diagnostic` required an enrolment the actor
owned, and the Assessment page turned a non-enrolled employee away. The deck sells the opposite.

| Test | Result |
| --- | --- |
| Baseline as Somchai Pattanakit, a planner in SCGP with no cohort seat | The diagnostic opens, rates the 16 critical skills across both programmes and runs a 14-question knowledge check |
| Expert Guidance on the baseline | Inferred levels and ranked gaps; correctly produced no learning plan, and the result screen says why |
| Accepting the baseline | 16 AI-inferred passport entries minted for a person with no enrolment; 0 outcome-verified, as expected |
| Program office view | Population covered 85%, 11 of 13; the two employees outside a cohort are listed with their baseline state |
| Guard | One baseline per person, enforced by a partial unique index and by the page |

### Bugs found and fixed during this sweep

| Bug | Fix |
| --- | --- |
| `submit_gate_pack` checked `payback_months` while the client sends `paybackMonths`, so every Gate 2 pack was rejected | Migration `0014_gate_pack_camel.sql` accepts both key styles |
| The practice partner was unreachable: the tab state existed but nothing rendered a switcher | Ask / Practice partner tablist in the page header, plus `?mode=practice` for deep links |
| `PracticePanel` was defined inside the render function, so every keystroke remounted the input and dropped focus | Rendered as a call rather than a child component; it holds no hooks of its own |
| Thai navigation was half-translated (Assessments, Challenge briefs, Cohorts and the governance pages stayed English) | Dictionary extended to cover every navigation label |

## Not verified / remaining limitations

- The deck-closure sweep above ran against the real Supabase project. Earlier transitions were validated in PGlite with the same SQL.
- No automated accessibility audit; keyboard focus trap, Escape and restoration were exercised manually on dialogs and panels only.
- Long-title and large-count stress cases were covered by fixtures (60-character titles, THB 120M) but not exhaustively.
- Thai UI covers navigation and the learner journey. Governance and admin screens stay English by design, as stated at the language switch.
- 1440 × 900 was not separately captured; layout uses the same breakpoints as 1280.
