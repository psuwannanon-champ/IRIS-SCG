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

## Not verified / remaining limitations

- Only the evidence-logging path was exercised against the real Supabase project; the other transitions were validated in PGlite with the same SQL.
- No automated accessibility audit; keyboard focus trap, Escape and restoration were exercised manually on dialogs and panels only.
- Long-title and large-count stress cases were covered by fixtures (60-character titles, THB 120M) but not exhaustively.
- Thai UI text is limited to the AI coach demo; the typeface renders Thai tone marks correctly there.
- 1440 × 900 was not separately captured; layout uses the same breakpoints as 1280.
