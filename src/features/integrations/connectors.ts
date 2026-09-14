// Simulated connectors. Each builds a payload from live platform records; nothing leaves the platform.
import type { Snapshot } from '@/data/datasource'
import type { IntegrationSystem, IntegrationRun } from '@/domain/types'
import { personaName } from '@/domain/selectors'

export interface Connector { system: IntegrationSystem; name: string; vendorHint: string; direction: 'outbound' | 'inbound'; icon: string; purpose: string; cadence: string; owner: string; buildRun: (s: Snapshot) => Omit<IntegrationRun, 'id' | 'triggeredBy' | 'startedAt' | 'finishedAt'> }

const thb = (v: number) => Math.round(v)

export const CONNECTORS: Connector[] = [
  {
    system: 'hr_core', name: 'HR core · talent profile sync', vendorHint: 'SAP SuccessFactors (simulated)', direction: 'outbound', icon: 'user-square', cadence: 'Nightly', owner: 'CHR HRIS team',
    purpose: 'Mints outcome-verified badges into the employee talent profile so staffing, promotion and succession read skills, not titles.',
    buildRun: (s) => {
      const last = s.integrationRuns.filter((r) => r.system === 'hr_core' && r.status === 'succeeded').sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0]
      const rows = s.passportEntries.filter((p) => p.tier === 'outcome_verified' && (!last || p.mintedAt > last.finishedAt)).map((p) => ({ employee: personaName(s, p.personaId), badge: p.badgeCode, skill: s.skills.find((k) => k.id === p.skillId)?.name, level: p.level, mintedAt: p.mintedAt.slice(0, 10) }))
      return { system: 'hr_core', direction: 'outbound', status: 'succeeded', records: rows.length, payload: rows, summary: rows.length ? `Talent profile sync: ${rows.length} new outcome-verified badge${rows.length === 1 ? '' : 's'} pushed for ${new Set(rows.map((r) => r.employee)).size} people.` : 'Talent profile sync: no new badges since the last run.' }
    },
  },
  {
    system: 'payroll_rewards', name: 'Payroll & rewards · merit-cycle export', vendorHint: 'Payroll / compensation system (simulated)', direction: 'outbound', icon: 'coins-hand', cadence: 'Quarterly, before the merit cycle', owner: 'Rewards & Career',
    purpose: 'Exports skill-premium eligibility (verified critical skills) and value-linked incentive inputs (sponsor-validated THB impact) for the People Committee policy pack.',
    buildRun: (s) => {
      const rows: Record<string, unknown>[] = []
      for (const p of s.personas) {
        const prem = s.passportEntries.filter((x) => x.personaId === p.id && x.tier === 'outcome_verified' && s.skills.find((k) => k.id === x.skillId)?.premiumEligible)
        const impact = s.ledgerEntries.filter((l) => l.personaId === p.id && ['validated', 'audited'].includes(l.status)).reduce((a, l) => a + (l.validatedValueThb ?? 0), 0)
        const enr = s.enrollments.filter((e) => e.personaId === p.id)
        if (!prem.length && !impact && !enr.some((e) => e.impactRating)) continue
        rows.push({ employee: p.fullName, employeeId: p.code.toUpperCase(), businessUnit: s.businessUnits.find((b) => b.id === p.buId)?.code, skillPremiumEligible: prem.map((x) => s.skills.find((k) => k.id === x.skillId)?.code).join(', ') || 'none', validatedImpactThb: thb(impact), impactRating: enr.find((e) => e.impactRating)?.impactRating ?? 'none', topDecile: enr.some((e) => e.topDecile), recognition: impact ? 'CEO showcase recognition' : 'none' })
      }
      return { system: 'payroll_rewards', direction: 'outbound', status: 'succeeded', records: rows.length, payload: rows, summary: `Merit-cycle export: ${rows.length} employees with premium eligibility, validated impact or an impact rating. Pay decisions stay with the People Committee.` }
    },
  },
  {
    system: 'notifications', name: 'Notifications · email and LINE', vendorHint: 'Microsoft 365 mail + LINE Official Account (simulated)', direction: 'outbound', icon: 'send-01', cadence: 'Real time (batched every 15 min)', owner: 'CHR digital',
    purpose: 'Delivers platform updates (approvals, reminders, gate results) to email and LINE so people act without logging in.',
    buildRun: (s) => {
      const last = s.integrationRuns.filter((r) => r.system === 'notifications').sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0]
      const pending = s.notifications.filter((n) => !last || n.createdAt > last.finishedAt)
      const rows = pending.slice(0, 50).map((n) => ({ to: personaName(s, n.personaId), title: n.title, email: 'delivered', line: 'delivered' }))
      return { system: 'notifications', direction: 'outbound', status: 'succeeded', records: pending.length, payload: rows, summary: `${pending.length} update${pending.length === 1 ? '' : 's'} delivered by email and LINE.` }
    },
  },
  {
    system: 'finance_actuals', name: 'Finance · P&L actuals match', vendorHint: 'SAP FI/CO (simulated)', direction: 'inbound', icon: 'bank', cadence: 'Monthly close + annual audit', owner: 'BU finance',
    purpose: 'Imports P&L actuals for validated ledger entries so the audited ledger stays honest (variance flagged above 10%).',
    buildRun: (s) => {
      const rows = s.ledgerEntries.filter((l) => ['validated', 'audited'].includes(l.status) && l.validatedValueThb).map((l, i) => { const factor = [0.96, 0.99, 1.03, 0.87, 1.01][i % 5]; const actual = thb((l.validatedValueThb ?? 0) * factor); const variance = Math.round((factor - 1) * 1000) / 10; return { entry: l.title, employee: personaName(s, l.personaId), validatedThb: l.validatedValueThb, actualThb: actual, variance: `${variance > 0 ? '+' : ''}${variance}%`, flag: Math.abs(variance) > 10 ? 'Review at audit' : 'Within tolerance' } })
      const flagged = rows.filter((r) => r.flag !== 'Within tolerance').length
      return { system: 'finance_actuals', direction: 'inbound', status: 'succeeded', records: rows.length, payload: rows, summary: `P&L actuals matched against ${rows.length} validated entries; ${flagged} flagged for the annual sample audit.` }
    },
  },
  {
    system: 'start_the_dot', name: 'SCG Start the Dot · venture hand-off', vendorHint: 'Start the Dot venture registry (simulated)', direction: 'outbound', icon: 'rocket-01', cadence: 'On Gate 3 scale decision', owner: 'Start the Dot PMO',
    purpose: 'Hands Gate-3 winners to the venture studio with team, sponsor, validated value and the concept case.',
    buildRun: (s) => {
      const rows = s.concepts.filter((c) => c.stage === 'scaled').map((c) => ({ concept: c.title, route: c.scaleRoute === 'start_the_dot' ? 'Start the Dot' : 'Internal high impact', validatedThb: c.validatedValueThb, team: s.enrollments.filter((e) => e.teamId === c.teamId).map((e) => personaName(s, e.personaId)).join(', '), sponsor: personaName(s, s.challengeBriefs.find((b) => b.id === c.briefId)?.sponsorId ?? null) }))
      return { system: 'start_the_dot', direction: 'outbound', status: 'succeeded', records: rows.length, payload: rows, summary: rows.length ? `${rows.length} scaled concept${rows.length === 1 ? '' : 's'} registered with the venture studio.` : 'No Gate-3 winners waiting for hand-off.' }
    },
  },
]

export const lastRun = (s: Snapshot, system: IntegrationSystem) => s.integrationRuns.filter((r) => r.system === system).sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0] ?? null
export const lastSuccess = (s: Snapshot, system: IntegrationSystem) => s.integrationRuns.filter((r) => r.system === system && r.status === 'succeeded').sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0] ?? null
