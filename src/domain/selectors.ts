// Pure selectors over the snapshot. Badges, page summaries and drill-down lists all derive from these.
import type { Snapshot } from '@/data/datasource'
import type { Persona, Task, Role, ImpactContract, ChallengeBrief, Concept, GateReview, LedgerEntry, Enrollment, Skill, PassportEntry, MarketplaceRole } from '@/domain/types'
import { CONTRACT_STATUS_LABEL, BRIEF_STATUS_LABEL } from '@/domain/types'
import { daysUntil } from '@/lib/format'
import { addDays, formatISO, parseISO } from 'date-fns'

export const byId = <T extends { id: string }>(rows: T[]) => new Map(rows.map((r) => [r.id, r]))

export function lookups(s: Snapshot) {
  return {
    persona: byId(s.personas), bu: byId(s.businessUnits), skill: byId(s.skills), domain: byId(s.skillDomains), module: byId(s.learningModules),
    cohort: byId(s.cohorts), enrollment: byId(s.enrollments), team: byId(s.teams), concept: byId(s.concepts), brief: byId(s.challengeBriefs), theme: byId(s.challengeThemes),
  }
}
export const personaName = (s: Snapshot, id: string | null | undefined) => (id ? s.personas.find((p) => p.id === id)?.fullName ?? 'Unknown person' : 'Not assigned')

const urgency = (iso: string | null): Task['urgency'] => {
  const n = daysUntil(iso)
  if (n == null) return 'normal'
  if (n < 0) return 'overdue'
  if (n <= 7) return 'due_soon'
  return 'normal'
}
const iso = (d: Date) => formatISO(d, { representation: 'date' })

function cohortDate(s: Snapshot, cohortId: string, label: string): string | null {
  const c = s.cohorts.find((x) => x.id === cohortId)
  return c?.keyDates.find((k) => k.label.toLowerCase().startsWith(label.toLowerCase()))?.date ?? null
}

/** Actionable tasks for the acting persona: only actions this person can perform now. */
export function selectTasks(s: Snapshot, actor: Persona): Task[] {
  const tasks: Task[] = []
  const push = (t: Omit<Task, 'urgency'>) => tasks.push({ ...t, urgency: urgency(t.dueDate) })
  const role = actor.role

  // Learner tasks
  const myEnrollments = s.enrollments.filter((e) => e.personaId === actor.id && !['withdrawn', 'graduated'].includes(e.status))
  for (const e of myEnrollments) {
    const cohort = s.cohorts.find((c) => c.id === e.cohortId)
    const dx = s.diagnostics.find((d) => d.enrollmentId === e.id)
    if (dx && dx.status === 'pending') {
      push({ key: `dx-${e.id}`, recordType: 'diagnostic', recordId: e.id, title: `Complete your AI skill diagnostic · ${cohort?.code ?? ''}`, nextAction: 'Start assessment', responsibleRole: 'learner', status: 'Pending', dueDate: cohortDate(s, e.cohortId, 'Applied capability labs'), link: '/assessment' })
    }
    const planOpen = s.learningPlanItems.filter((i) => i.enrollmentId === e.id && ['planned', 'in_progress'].includes(i.status))
    if (planOpen.length && cohort?.program === 'ABC' && cohort.status !== 'completed') {
      push({ key: `plan-${e.id}`, recordType: 'learning_plan', recordId: e.id, title: `${planOpen.length} micro-learning module${planOpen.length === 1 ? '' : 's'} open in your personal path`, nextAction: 'Continue learning plan', responsibleRole: 'learner', status: `${planOpen.length} open`, dueDate: cohortDate(s, e.cohortId, 'Impact showcase'), link: '/learning' })
    }
    if (e.teamId) {
      const concept = s.concepts.find((c) => c.teamId === e.teamId)
      const pendingGate = concept && s.gateReviews.find((g) => g.conceptId === concept.id && g.decision === 'pending' && !g.submittedAt)
      if (concept && pendingGate) {
        push({ key: `gate-submit-${pendingGate.id}`, recordType: 'gate_review', recordId: pendingGate.id, title: `Submit Gate ${pendingGate.gateNo} evidence pack · ${concept.title}`, nextAction: 'Submit evidence pack', responsibleRole: 'learner', status: 'Evidence pack not submitted', dueDate: iso(addDays(parseISO(pendingGate.scheduledDate), -14)), link: `/concepts/${concept.id}` })
      }
    }
  }
  for (const c of s.impactContracts.filter((c) => c.learnerId === actor.id)) {
    const sprintStart = cohortDate(s, s.enrollments.find((e) => e.id === c.enrollmentId)?.cohortId ?? '', 'Impact sprint')
    const midGate = cohortDate(s, s.enrollments.find((e) => e.id === c.enrollmentId)?.cohortId ?? '', 'Mid-sprint gate')
    const showcase = cohortDate(s, s.enrollments.find((e) => e.id === c.enrollmentId)?.cohortId ?? '', 'Impact showcase')
    if (c.status === 'draft') push({ key: `ic-draft-${c.id}`, recordType: 'impact_contract', recordId: c.id, title: `Finish and submit your impact contract · ${c.title}`, nextAction: 'Submit for manager review', responsibleRole: 'learner', status: CONTRACT_STATUS_LABEL[c.status], dueDate: sprintStart, link: `/contracts/${c.id}` })
    if (c.status === 'returned') push({ key: `ic-ret-${c.id}`, recordType: 'impact_contract', recordId: c.id, title: `Revise returned impact contract · ${c.title}`, nextAction: 'Edit and resubmit', responsibleRole: 'learner', status: CONTRACT_STATUS_LABEL[c.status], dueDate: sprintStart, link: `/contracts/${c.id}` })
    if (c.status === 'reset') push({ key: `ic-reset-${c.id}`, recordType: 'impact_contract', recordId: c.id, title: `Sprint was reset · agree a new scope with your manager · ${c.title}`, nextAction: 'Create a new impact contract', responsibleRole: 'learner', status: CONTRACT_STATUS_LABEL[c.status], dueDate: null, link: `/contracts/${c.id}` })
    if (c.status === 'active') {
      const weekNo = currentSprintWeek(sprintStart)
      const logged = s.sprintEvidence.some((ev) => ev.contractId === c.id && ev.weekNo === weekNo)
      if (weekNo >= 1 && weekNo <= 12 && !logged) push({ key: `ic-ev-${c.id}`, recordType: 'sprint_evidence', recordId: c.id, title: `Log week ${weekNo} sprint evidence · ${c.title}`, nextAction: 'Log evidence', responsibleRole: 'learner', status: 'Sprint active', dueDate: sprintStart ? iso(addDays(parseISO(sprintStart), weekNo * 7 - 3)) : null, link: `/contracts/${c.id}` })
      if (!c.midGateDecision && midGate && (daysUntil(midGate) ?? 99) <= 14) push({ key: `ic-mid-${c.id}`, recordType: 'impact_contract', recordId: c.id, title: `Submit mid-sprint evidence pack · ${c.title}`, nextAction: 'Submit evidence pack', responsibleRole: 'learner', status: 'Mid-sprint gate approaching', dueDate: iso(addDays(parseISO(midGate), -2)), link: `/contracts/${c.id}` })
      if (c.midGateDecision && showcase && (daysUntil(showcase) ?? 99) <= 14) push({ key: `ic-show-${c.id}`, recordType: 'impact_contract', recordId: c.id, title: `Submit showcase for validation · ${c.title}`, nextAction: 'Submit showcase', responsibleRole: 'learner', status: 'Showcase approaching', dueDate: showcase, link: `/contracts/${c.id}` })
    }
  }

  // Line manager tasks
  if (role === 'line_manager' || true) {
    for (const c of s.impactContracts.filter((c) => c.managerId === actor.id)) {
      if (c.status === 'manager_review') push({ key: `mgr-${c.id}`, recordType: 'impact_contract', recordId: c.id, title: `Review impact contract · ${personaName(s, c.learnerId)} · ${c.title}`, nextAction: 'Approve or return', responsibleRole: 'line_manager', status: CONTRACT_STATUS_LABEL[c.status], dueDate: iso(addDays(parseISO(c.updatedAt), 5)), link: `/contracts/${c.id}` })
      if (c.status === 'mid_gate_review') push({ key: `mgr-mid-${c.id}`, recordType: 'impact_contract', recordId: c.id, title: `Mid-sprint gate decision · ${personaName(s, c.learnerId)} · ${c.title}`, nextAction: 'Record scale / pivot / reset', responsibleRole: 'line_manager', status: CONTRACT_STATUS_LABEL[c.status], dueDate: cohortDate(s, s.enrollments.find((e) => e.id === c.enrollmentId)?.cohortId ?? '', 'Mid-sprint gate'), link: `/contracts/${c.id}` })
    }
  }
  // Sponsor tasks
  for (const c of s.impactContracts.filter((c) => c.sponsorId === actor.id)) {
    if (c.status === 'sponsor_review') push({ key: `spo-${c.id}`, recordType: 'impact_contract', recordId: c.id, title: `Approve impact contract · ${personaName(s, c.learnerId)} · ${c.title}`, nextAction: 'Approve or return', responsibleRole: 'bu_sponsor', status: CONTRACT_STATUS_LABEL[c.status], dueDate: iso(addDays(parseISO(c.updatedAt), 5)), link: `/contracts/${c.id}` })
    if (c.status === 'showcase_review') push({ key: `spo-show-${c.id}`, recordType: 'impact_contract', recordId: c.id, title: `Validate showcase impact · ${personaName(s, c.learnerId)} · ${c.title}`, nextAction: 'Validate THB value', responsibleRole: 'bu_sponsor', status: CONTRACT_STATUS_LABEL[c.status], dueDate: iso(addDays(parseISO(c.updatedAt), 10)), link: `/contracts/${c.id}` })
  }
  for (const l of s.ledgerEntries.filter((l) => l.sponsorId === actor.id && l.status === 'pending_validation' && l.sourceType !== 'impact_contract')) {
    push({ key: `lg-${l.id}`, recordType: 'ledger_entry', recordId: l.id, title: `Validate ledger entry · ${l.title}`, nextAction: 'Validate or reject value', responsibleRole: 'bu_sponsor', status: 'Pending validation', dueDate: iso(addDays(parseISO(l.createdAt), 10)), link: '/ledger' })
  }
  for (const b of s.challengeBriefs.filter((b) => b.sponsorId === actor.id)) {
    const deadline = '2026-10-30'
    if (b.status === 'draft') push({ key: `cb-draft-${b.id}`, recordType: 'challenge_brief', recordId: b.id, title: `Submit challenge brief · ${b.title}`, nextAction: 'Submit to committee', responsibleRole: 'bu_sponsor', status: BRIEF_STATUS_LABEL[b.status], dueDate: deadline, link: `/briefs/${b.id}` })
    if (b.status === 'returned') push({ key: `cb-ret-${b.id}`, recordType: 'challenge_brief', recordId: b.id, title: `Revise returned brief · ${b.title}`, nextAction: 'Edit and resubmit', responsibleRole: 'bu_sponsor', status: BRIEF_STATUS_LABEL[b.status], dueDate: deadline, link: `/briefs/${b.id}` })
  }
  // Committee tasks
  if (role === 'committee') {
    for (const b of s.challengeBriefs.filter((b) => b.status === 'committee_review')) {
      push({ key: `cic-${b.id}`, recordType: 'challenge_brief', recordId: b.id, title: `Review challenge brief · ${b.title}`, nextAction: 'Approve, return or reject', responsibleRole: 'committee', status: BRIEF_STATUS_LABEL[b.status], dueDate: iso(addDays(parseISO(b.updatedAt), 10)), link: `/briefs/${b.id}` })
    }
    for (const g of s.gateReviews.filter((g) => g.decision === 'pending' && g.submittedAt)) {
      const cp = s.concepts.find((c) => c.id === g.conceptId)!
      push({ key: `gate-${g.id}`, recordType: 'gate_review', recordId: g.id, title: `Gate ${g.gateNo} decision · ${cp.title}`, nextAction: 'Record gate decision', responsibleRole: 'committee', status: 'Evidence pack submitted', dueDate: g.scheduledDate, link: `/concepts/${cp.id}` })
    }
  }
  // Program office tasks
  if (role === 'program_office') {
    for (const b of s.challengeBriefs.filter((b) => b.status === 'approved')) {
      push({ key: `assign-${b.id}`, recordType: 'challenge_brief', recordId: b.id, title: `Assign approved brief to a BCD cohort · ${b.title}`, nextAction: 'Assign to cohort', responsibleRole: 'program_office', status: BRIEF_STATUS_LABEL[b.status], dueDate: '2026-11-13', link: `/briefs/${b.id}` })
    }
    for (const l of s.ledgerEntries.filter((l) => l.status === 'validated' && (daysUntil(l.trackingUntil) ?? 99) <= 60)) {
      push({ key: `audit-${l.id}`, recordType: 'ledger_entry', recordId: l.id, title: `Sample audit due · ${l.title}`, nextAction: 'Record audit finding', responsibleRole: 'program_office', status: 'Validated, tracking ends soon', dueDate: l.trackingUntil, link: '/ledger' })
    }
  }
  // Coach tasks
  if (role === 'coach') {
    for (const cl of s.coachingClinics.filter((c) => c.coachId === actor.id && !c.briefingReady && (daysUntil(dateOf(c.scheduledAt)) ?? 99) <= 21)) {
      const cohort = s.cohorts.find((c) => c.id === cl.cohortId)
      push({ key: `clinic-${cl.id}`, recordType: 'coaching', recordId: cl.id, title: `Prepare clinic ${cl.clinicNo} briefing · ${cohort?.code ?? ''}`, nextAction: 'Review AI flags and mark briefing ready', responsibleRole: 'coach', status: 'Briefing not ready', dueDate: iso(addDays(parseISO(cl.scheduledAt), -2)), link: '/coaching' })
    }
  }
  const order = { overdue: 0, due_soon: 1, normal: 2 }
  return tasks.sort((a, b) => order[a.urgency] - order[b.urgency] || (a.dueDate ?? '9').localeCompare(b.dueDate ?? '9'))
}
const dateOf = (isoTs: string) => isoTs.slice(0, 10)

export function currentSprintWeek(sprintStart: string | null) {
  if (!sprintStart) return 0
  const n = daysUntil(sprintStart)
  if (n == null) return 0
  return Math.floor(-n / 7) + 1
}

/** Which navigation group each task belongs to (for sidebar badges). */
export function taskNavKey(t: Task): string {
  switch (t.recordType) {
    case 'impact_contract': case 'sprint_evidence': return 'contracts'
    case 'challenge_brief': return 'briefs'
    case 'gate_review': return 'concepts'
    case 'ledger_entry': return 'ledger'
    case 'diagnostic': return 'journey'
    case 'learning_plan': return 'learning'
    case 'coaching': return 'coaching'
  }
}

export function unreadNotifications(s: Snapshot, personaId: string) {
  return s.notifications.filter((n) => n.personaId === personaId && !n.readAt)
}

/** Scope of records a persona may see (mirrors read scope the backend would enforce). */
export function visibleContracts(s: Snapshot, actor: Persona): ImpactContract[] {
  switch (actor.role) {
    case 'learner': return s.impactContracts.filter((c) => c.learnerId === actor.id)
    case 'line_manager': return s.impactContracts.filter((c) => c.managerId === actor.id || c.learnerId === actor.id)
    case 'bu_sponsor': return s.impactContracts.filter((c) => c.sponsorId === actor.id || s.personas.find((p) => p.id === c.learnerId)?.buId === actor.buId)
    case 'coach': { const my = new Set(s.enrollments.filter((e) => e.coachId === actor.id).map((e) => e.id)); return s.impactContracts.filter((c) => my.has(c.enrollmentId)) }
    default: return s.impactContracts
  }
}
export function visibleBriefs(s: Snapshot, actor: Persona): ChallengeBrief[] {
  switch (actor.role) {
    case 'bu_sponsor': return s.challengeBriefs.filter((b) => b.sponsorId === actor.id || b.buId === actor.buId)
    case 'learner': case 'line_manager': return s.challengeBriefs.filter((b) => b.status === 'assigned' || b.status === 'approved')
    default: return s.challengeBriefs
  }
}
export function visibleConcepts(s: Snapshot, actor: Persona): Concept[] {
  if (actor.role === 'learner') {
    const myTeams = new Set(s.enrollments.filter((e) => e.personaId === actor.id && e.teamId).map((e) => e.teamId))
    return s.concepts.filter((c) => myTeams.has(c.teamId) || ['scaled', 'incubating'].includes(c.stage))
  }
  if (actor.role === 'coach') { const myTeams = new Set(s.teams.filter((t) => t.coachId === actor.id).map((t) => t.id)); return s.concepts.filter((c) => myTeams.has(c.teamId) || ['scaled'].includes(c.stage)) }
  return s.concepts
}
export function visibleLedger(s: Snapshot, actor: Persona): LedgerEntry[] {
  switch (actor.role) {
    case 'learner': return s.ledgerEntries.filter((l) => l.personaId === actor.id)
    case 'line_manager': { const reports = new Set(s.personas.filter((p) => p.managerId === actor.id).map((p) => p.id)); return s.ledgerEntries.filter((l) => reports.has(l.personaId)) }
    case 'bu_sponsor': return s.ledgerEntries.filter((l) => l.sponsorId === actor.id || l.buId === actor.buId)
    case 'coach': return []
    default: return s.ledgerEntries
  }
}

/** Governance metrics for the impact dashboard. All derived from the same records shown in the drill-downs. */
export function selectGovernance(s: Snapshot) {
  const validated = s.ledgerEntries.filter((l) => ['validated', 'audited'].includes(l.status))
  const validatedThb = validated.reduce((a, l) => a + (l.validatedValueThb ?? 0), 0)
  const pendingThb = s.ledgerEntries.filter((l) => l.status === 'pending_validation').reduce((a, l) => a + l.claimedValueThb, 0)
  const pipelineThb = s.concepts.filter((c) => !['stopped', 'scaled'].includes(c.stage)).reduce((a, c) => a + (c.pipelineValueThb ?? 0), 0)
  const graduates = s.enrollments.filter((e) => e.status === 'graduated')
  const graduatesVerified = graduates.filter((e) => s.passportEntries.some((p) => p.personaId === e.personaId && p.tier === 'outcome_verified'))
  const bus = s.businessUnits.filter((b) => b.id !== 'bu-corp')
  const busOnboarded = bus.filter((b) => b.strategyOnboarded && b.platformOnboarded)
  const gate1 = s.gateReviews.filter((g) => g.gateNo === 1 && g.decision !== 'pending')
  const gate1Pass = gate1.filter((g) => g.decision === 'go')
  const activeLearners = s.enrollments.filter((e) => ['in_sprint', 'showcase', 'in_labs', 'diagnosed'].includes(e.status))
  const closingGaps = s.diagnosticItems.filter((i) => i.priorityRank != null)
  const gapsClosed = closingGaps.filter((i) => s.passportEntries.some((p) => p.skillId === i.skillId && p.tier === 'outcome_verified' && s.enrollments.find((e) => e.id === s.diagnostics.find((d) => d.id === i.diagnosticId)?.enrollmentId)?.personaId === p.personaId && p.level >= i.targetLevel))
  return { validated, validatedThb, pendingThb, pipelineThb, graduates, graduatesVerified, bus, busOnboarded, gate1, gate1Pass, activeLearners, closingGaps, gapsClosed }
}

export type MatchState = 'meets' | 'needs_development' | 'not_assessed' | 'not_configured'
export function matchRole(s: Snapshot, role: MarketplaceRole, personaId: string) {
  const passport = s.passportEntries.filter((p) => p.personaId === personaId)
  const rows = role.requirements.map((r) => {
    const skill = s.skills.find((k) => k.id === r.skillId)
    const best = bestEntry(passport, r.skillId)
    let state: MatchState = 'not_assessed'
    if (!skill) state = 'not_configured'
    else if (best && best.level >= r.minLevel) state = 'meets'
    else if (best) state = 'needs_development'
    return { requirement: r, skill, best, state }
  })
  const assessed = rows.filter((r) => r.state !== 'not_assessed' && r.state !== 'not_configured')
  const meets = rows.filter((r) => r.state === 'meets')
  return { rows, meets: meets.length, assessed: assessed.length, total: rows.length, percent: rows.length ? Math.round((meets.length / rows.length) * 100) : 0 }
}
export function bestEntry(passport: PassportEntry[], skillId: string) {
  const tierRank = { outcome_verified: 3, ai_inferred: 2, self_declared: 1 }
  return passport.filter((p) => p.skillId === skillId).sort((a, b) => b.level - a.level || tierRank[b.tier] - tierRank[a.tier])[0] ?? null
}
export function skillsForProgram(s: Snapshot, program: 'ABC' | 'BCD'): Skill[] {
  const doms = new Set(s.skillDomains.filter((d) => d.program === program).map((d) => d.id))
  return s.skills.filter((k) => doms.has(k.domainId))
}
export const rolesWithAccess: Record<string, Role[]> = {}
export type { Enrollment, GateReview }
