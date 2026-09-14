// Performance metrics per unit (manager team, BU, coach group, cohort) and for the company. All derived from the same records.
import type { Snapshot } from '@/data/datasource'
import type { Persona, Role } from '@/domain/types'

export type UnitKind = 'manager' | 'bu' | 'coach' | 'cohort'
export interface Unit { kind: UnitKind; id: string; name: string; ownerId: string | null; personaIds: string[] }

export interface MetricDef { key: keyof UnitMetrics; label: string; unit: '%' | 'thb' | 'n' | 'days'; higherIsBetter: boolean; explain: string; program?: 'ABC' | 'BCD' }
export interface UnitMetrics {
  learners: number
  sprintCompletion: number | null
  timeToProficiencyDays: number | null
  mobilityRate: number | null
  retentionRate: number | null
  aiReadyRate: number | null
  validationAgeingDays: number | null
  costThb: number
  costPerLearner: number | null
  roiRatio: number | null
  diagnosticCompletion: number | null
  learningProgress: number | null
  labAttendance: number | null
  contractActivation: number | null
  evidenceCadence: number | null
  midGateScaleRate: number | null
  validatedThb: number
  validatedPerLearner: number | null
  verifiedUplift: number | null
  badgesPerLearner: number | null
  decisionDays: number | null
  gatePassRate: number | null
  healthScore: number | null
}

export const METRICS: MetricDef[] = [
  { key: 'sprintCompletion', label: 'Sprint completion', unit: '%', higherIsBetter: true, explain: 'Learners who finished the 90-day sprint (graduated) out of those who reached showcase or ended.', program: 'ABC' },
  { key: 'timeToProficiencyDays', label: 'Time to proficiency', unit: 'days', higherIsBetter: false, explain: 'Average days from completing the diagnostic to the first outcome-verified badge at target level.' },
  { key: 'mobilityRate', label: 'Internal mobility', unit: '%', higherIsBetter: true, explain: 'Learners placed into a marketplace role, project or gig on verified skills.' },
  { key: 'retentionRate', label: 'Retention', unit: '%', higherIsBetter: true, explain: 'Learners in these programmes still employed at SCG.' },
  { key: 'aiReadyRate', label: 'AI-ready', unit: '%', higherIsBetter: true, explain: 'Learners with a verified AI skill at Level 2 or above, able to redesign work with AI.' },
  { key: 'validationAgeingDays', label: 'Sponsor validation ageing', unit: 'days', higherIsBetter: false, explain: 'Average days a claimed impact has waited for sponsor validation.' },
  { key: 'costPerLearner', label: 'Cost per learner', unit: 'thb', higherIsBetter: false, explain: 'Programme cost for these learners\' cohorts divided by their learners.' },
  { key: 'roiRatio', label: 'Return on capability spend', unit: 'n', higherIsBetter: true, explain: 'Validated THB impact divided by programme cost. Above 1.0 means capability pays for itself.' },
  { key: 'diagnosticCompletion', label: 'Diagnostic completion', unit: '%', higherIsBetter: true, explain: 'Enrolled learners whose AI skill diagnostic is complete.' },
  { key: 'learningProgress', label: 'Micro-learning progress', unit: '%', higherIsBetter: true, explain: 'Completed modules as a share of modules in learners\' paths (skipped modules excluded).' },
  { key: 'labAttendance', label: 'Lab attendance', unit: '%', higherIsBetter: true, explain: 'Lab days checked in as a share of four days per ABC learner past the labs date.', program: 'ABC' },
  { key: 'contractActivation', label: 'Impact contracts active', unit: '%', higherIsBetter: true, explain: 'ABC learners whose impact contract is approved (active, at a gate, in showcase or validated).', program: 'ABC' },
  { key: 'evidenceCadence', label: 'Evidence per active sprint', unit: 'n', higherIsBetter: true, explain: 'Average weekly evidence entries logged per active or completed contract.', program: 'ABC' },
  { key: 'midGateScaleRate', label: 'Mid-gate scale rate', unit: '%', higherIsBetter: true, explain: 'Mid-sprint gates decided as scale, out of all decided gates.', program: 'ABC' },
  { key: 'decisionDays', label: 'Manager decision time', unit: 'days', higherIsBetter: false, explain: 'Average days from a learner\'s submission to the manager\'s approve or return decision.', program: 'ABC' },
  { key: 'validatedThb', label: 'Validated impact', unit: 'thb', higherIsBetter: true, explain: 'Sponsor-validated THB in the impact ledger for these learners (annualised).' },
  { key: 'verifiedUplift', label: 'Verified skill uplift', unit: '%', higherIsBetter: true, explain: 'Priority gaps of graduates closed with an outcome-verified badge at target level.' },
  { key: 'badgesPerLearner', label: 'Verified badges per learner', unit: 'n', higherIsBetter: true, explain: 'Outcome-verified passport badges divided by learners.' },
  { key: 'gatePassRate', label: 'Gate 1 pass rate', unit: '%', higherIsBetter: true, explain: 'Concepts with a Gate 1 "go" out of all decided Gate 1 reviews for these learners\' teams.', program: 'BCD' },
  { key: 'healthScore', label: 'Program health score', unit: '%', higherIsBetter: true, explain: 'Average of diagnostic completion, micro-learning progress, lab attendance, contract activation and verified uplift where available. 0–100.' },
]

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : null)
const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null)

export function computeMetrics(s: Snapshot, personaIds: string[]): UnitMetrics {
  const ids = new Set(personaIds)
  const enr = s.enrollments.filter((e) => ids.has(e.personaId) && e.status !== 'withdrawn')
  const abc = enr.filter((e) => s.cohorts.find((c) => c.id === e.cohortId)?.program === 'ABC')
  const today = new Date().toISOString().slice(0, 10)
  const dxDone = enr.filter((e) => s.diagnostics.find((d) => d.enrollmentId === e.id)?.status === 'completed').length
  const plan = s.learningPlanItems.filter((p) => enr.some((e) => e.id === p.enrollmentId) && p.status !== 'skipped')
  const labEligible = abc.filter((e) => (s.cohorts.find((c) => c.id === e.cohortId)?.keyDates.find((k) => /labs/i.test(k.label))?.date ?? '9999') <= today)
  const labDays = s.labAttendance.filter((l) => labEligible.some((e) => e.id === l.enrollmentId)).length
  const contracts = s.impactContracts.filter((c) => enr.some((e) => e.id === c.enrollmentId) && c.status !== 'withdrawn')
  const activeStates = ['active', 'mid_gate_review', 'showcase_review', 'validated']
  const activeContracts = contracts.filter((c) => activeStates.includes(c.status))
  const evidence = s.sprintEvidence.filter((ev) => activeContracts.some((c) => c.id === ev.contractId)).length
  const midDecided = contracts.filter((c) => c.midGateDecision)
  const ledger = s.ledgerEntries.filter((l) => ids.has(l.personaId) && ['validated', 'audited'].includes(l.status))
  const validatedThb = ledger.reduce((a, l) => a + (l.validatedValueThb ?? 0), 0)
  const grads = enr.filter((e) => e.status === 'graduated')
  const gaps = grads.flatMap((e) => { const dx = s.diagnostics.find((d) => d.enrollmentId === e.id); return dx ? s.diagnosticItems.filter((i) => i.diagnosticId === dx.id && i.priorityRank != null).map((i) => ({ e, i })) : [] })
  const gapsClosed = gaps.filter(({ e, i }) => s.passportEntries.some((p) => p.personaId === e.personaId && p.skillId === i.skillId && p.tier === 'outcome_verified' && p.level >= i.targetLevel)).length
  const badges = s.passportEntries.filter((p) => ids.has(p.personaId) && p.tier === 'outcome_verified').length
  const decisionDays: number[] = []
  for (const c of contracts) {
    const ev = s.recordEvents.filter((x) => x.recordType === 'impact_contract' && x.recordId === c.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    for (let i = 0; i < ev.length; i++) if (ev[i].action === 'submit') { const dec = ev.slice(i + 1).find((x) => ['manager_approve', 'return'].includes(x.action)); if (dec) decisionDays.push((new Date(dec.createdAt).getTime() - new Date(ev[i].createdAt).getTime()) / 86400000) }
  }
  const teams = new Set(enr.map((e) => e.teamId).filter(Boolean))
  const gate1 = s.gateReviews.filter((g) => g.gateNo === 1 && g.decision !== 'pending' && teams.has(s.concepts.find((c) => c.id === g.conceptId)?.teamId ?? ''))
  // outcomes
  const ended = enr.filter((e) => ['showcase', 'graduated'].includes(e.status) || contracts.some((c) => c.enrollmentId === e.id && ['validated', 'reset'].includes(c.status)))
  const completed = ended.filter((e) => e.status === 'graduated')
  const ttp: number[] = []
  for (const e of enr) {
    const dx = s.diagnostics.find((d) => d.enrollmentId === e.id && d.completedAt)
    if (!dx?.completedAt) continue
    const first = s.passportEntries.filter((p) => p.personaId === e.personaId && p.tier === 'outcome_verified').sort((a, b) => a.mintedAt.localeCompare(b.mintedAt))[0]
    if (first) ttp.push((new Date(first.mintedAt).getTime() - new Date(dx.completedAt).getTime()) / 86400000)
  }
  const placed = s.marketplaceInterests.filter((i) => ids.has(i.personaId) && i.status === 'placed')
  const people = s.personas.filter((p) => ids.has(p.id))
  const aiSkillIds = new Set(s.skills.filter((k) => s.skillDomains.find((d) => d.id === k.domainId)?.code === 'AI' || k.code.startsWith('AIS')).map((k) => k.id))
  const aiReady = people.filter((p) => s.passportEntries.some((x) => x.personaId === p.id && aiSkillIds.has(x.skillId) && x.tier === 'outcome_verified' && x.level >= 2))
  const pending = s.ledgerEntries.filter((l) => ids.has(l.personaId) && l.status === 'pending_validation')
  const ageing = pending.map((l) => (Date.now() - new Date(l.createdAt).getTime()) / 86400000)
  // economics: a cohort's cost is shared across its learners; a unit carries its learners' share
  const cohortIds = Array.from(new Set(enr.map((e) => e.cohortId)))
  let costThb = 0
  for (const cid of cohortIds) {
    const lines = s.costLines.filter((l) => l.cohortId === cid).reduce((a, l) => a + l.amountThb, 0)
    const total = lines || (s.cohorts.find((c) => c.id === cid)?.budgetThb ?? 0)
    const cohortLearners = s.enrollments.filter((e) => e.cohortId === cid && e.status !== 'withdrawn').length
    const mine = enr.filter((e) => e.cohortId === cid).length
    if (cohortLearners > 0) costThb += (total * mine) / cohortLearners
  }
  costThb = Math.round(costThb)

  const parts = [pct(dxDone, enr.length), pct(plan.filter((p) => p.status === 'completed').length, plan.length), pct(labDays, labEligible.length * 4), pct(activeContracts.length, abc.length), pct(gapsClosed, gaps.length)].filter((x): x is number => x != null)
  return {
    learners: enr.length,
    sprintCompletion: pct(completed.length, ended.length),
    timeToProficiencyDays: avg(ttp),
    mobilityRate: pct(placed.length, enr.length),
    retentionRate: pct(people.filter((p) => p.employmentStatus === 'active').length, people.length),
    aiReadyRate: pct(aiReady.length, people.length),
    validationAgeingDays: avg(ageing),
    costThb,
    costPerLearner: enr.length ? Math.round(costThb / enr.length) : null,
    roiRatio: costThb > 0 ? Math.round((validatedThb / costThb) * 10) / 10 : null,
    diagnosticCompletion: pct(dxDone, enr.length),
    learningProgress: pct(plan.filter((p) => p.status === 'completed').length, plan.length),
    labAttendance: pct(labDays, labEligible.length * 4),
    contractActivation: pct(activeContracts.length, abc.length),
    evidenceCadence: activeContracts.length ? Math.round((evidence / activeContracts.length) * 10) / 10 : null,
    midGateScaleRate: pct(midDecided.filter((c) => c.midGateDecision === 'scale').length, midDecided.length),
    validatedThb,
    validatedPerLearner: enr.length ? Math.round(validatedThb / enr.length) : null,
    verifiedUplift: pct(gapsClosed, gaps.length),
    badgesPerLearner: enr.length ? Math.round((badges / enr.length) * 10) / 10 : null,
    decisionDays: avg(decisionDays),
    gatePassRate: pct(gate1.filter((g) => g.decision === 'go').length, gate1.length),
    healthScore: parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null,
  }
}

export function unitsOf(s: Snapshot, kind: UnitKind): Unit[] {
  const learners = s.personas.filter((p) => s.enrollments.some((e) => e.personaId === p.id))
  if (kind === 'manager') return s.personas.filter((p) => p.role === 'line_manager' || learners.some((l) => l.managerId === p.id)).map((m) => ({ kind, id: m.id, name: `${m.fullName}'s team`, ownerId: m.id, personaIds: learners.filter((l) => l.managerId === m.id).map((l) => l.id) })).filter((u) => u.personaIds.length)
  if (kind === 'bu') return s.businessUnits.filter((b) => b.id !== 'bu-corp').map((b) => ({ kind, id: b.id, name: b.code, ownerId: s.personas.find((p) => p.role === 'bu_sponsor' && p.buId === b.id)?.id ?? null, personaIds: learners.filter((l) => l.buId === b.id).map((l) => l.id) })).filter((u) => u.personaIds.length)
  if (kind === 'coach') return s.personas.filter((p) => p.role === 'coach').map((c) => ({ kind, id: c.id, name: `Coached by ${c.fullName.split(' ')[0]}`, ownerId: c.id, personaIds: Array.from(new Set(s.enrollments.filter((e) => e.coachId === c.id).map((e) => e.personaId))) })).filter((u) => u.personaIds.length)
  return s.cohorts.map((c) => ({ kind, id: c.id, name: c.code, ownerId: null, personaIds: Array.from(new Set(s.enrollments.filter((e) => e.cohortId === c.id).map((e) => e.personaId))) })).filter((u) => u.personaIds.length)
}

export function companyUnit(s: Snapshot): Unit {
  return { kind: 'bu', id: 'company', name: 'SCG (all BUs)', ownerId: null, personaIds: Array.from(new Set(s.enrollments.map((e) => e.personaId))) }
}

/** The viewer's own unit and the peer set they are compared against. */
export function myUnit(s: Snapshot, actor: Persona): { unit: Unit | null; peers: Unit[]; kind: UnitKind } {
  const role: Role = actor.role
  if (role === 'line_manager') { const peers = unitsOf(s, 'manager'); return { unit: peers.find((u) => u.ownerId === actor.id) ?? null, peers, kind: 'manager' } }
  if (role === 'bu_sponsor') { const peers = unitsOf(s, 'bu'); return { unit: peers.find((u) => u.id === actor.buId) ?? null, peers, kind: 'bu' } }
  if (role === 'coach') { const peers = unitsOf(s, 'coach'); return { unit: peers.find((u) => u.ownerId === actor.id) ?? null, peers, kind: 'coach' } }
  const peers = unitsOf(s, 'bu'); return { unit: peers[0] ?? null, peers, kind: 'bu' }
}

export function rankOf(units: { id: string; value: number | null }[], id: string, higherIsBetter: boolean) {
  const ranked = units.filter((u) => u.value != null).sort((a, b) => (higherIsBetter ? b.value! - a.value! : a.value! - b.value!))
  const idx = ranked.findIndex((u) => u.id === id)
  return idx < 0 ? null : { rank: idx + 1, of: ranked.length }
}
