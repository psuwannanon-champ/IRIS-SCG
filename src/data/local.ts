// Local data source: same contract as Supabase, backed by fixtures persisted in localStorage.
// Used when the Supabase schema is not reachable so the walkthrough still works end to end.
import { fixtureBundle } from '@/data/fixtures'
import type { Snapshot, DataSource, ContractAction, ContractActionPayload, BriefAction, BriefActionPayload, EvidenceInput } from '@/data/datasource'
import { DomainError } from '@/data/datasource'
import { CONTRACT_TRANSITIONS, BRIEF_TRANSITIONS, contractRelation, briefRelation, GATE_DECISIONS_BY_GATE } from '@/data/rules'
import type { ChallengeBriefInput, ImpactContractInput, GateDecision, PassportEntry, Notification, RecordEvent, AssessmentResponses, DiagnosticResult, GuidanceKind, GapDecision, MarketplaceRoleInput } from '@/domain/types'

const STORAGE_KEY = 'scg-capability-suite.local-snapshot.v1'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const nowIso = () => new Date().toISOString()
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`

export class LocalDataSource implements DataSource {
  readonly mode = 'local' as const
  private snap: Snapshot

  constructor() {
    this.snap = this.read()
  }

  private read(): Snapshot {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as Snapshot
    } catch {
      /* ignore */
    }
    return clone(fixtureBundle)
  }

  private write() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snap))
    } catch {
      /* ignore */
    }
  }

  async loadSnapshot(): Promise<Snapshot> {
    await delay(120)
    return clone(this.snap)
  }

  private persona(id: string) {
    const p = this.snap.personas.find((x) => x.id === id)
    if (!p) throw new DomainError('Acting user not found.')
    return p
  }

  private event(e: Omit<RecordEvent, 'id' | 'createdAt'>) {
    this.snap.recordEvents.push({ id: uid('rev'), createdAt: nowIso(), ...e })
  }

  private notify(personaId: string, title: string, body: string, link: string | null) {
    const n: Notification = { id: uid('nt'), personaId, kind: 'update', title, body, link, readAt: null, createdAt: nowIso() }
    this.snap.notifications.push(n)
  }

  // ---------- Impact contracts ----------
  async saveContract(actorId: string, input: ImpactContractInput & { id?: string }) {
    await delay(150)
    const enrollment = this.snap.enrollments.find((e) => e.id === input.enrollmentId)
    if (!enrollment) throw new DomainError('Enrollment not found.')
    if (enrollment.personaId !== actorId) throw new DomainError('Only the learner can edit their own impact contract.')
    const learner = this.persona(actorId)
    if (input.id) {
      const c = this.snap.impactContracts.find((x) => x.id === input.id)
      if (!c) throw new DomainError('Impact contract not found.')
      if (!['draft', 'returned'].includes(c.status)) throw new DomainError('Only draft or returned contracts can be edited.')
      Object.assign(c, { ...input, updatedAt: nowIso() })
      this.write()
      return c.id
    }
    const id = uid('ic')
    this.snap.impactContracts.push({
      id, enrollmentId: input.enrollmentId, learnerId: actorId,
      managerId: enrollment.managerId ?? learner.managerId ?? '',
      sponsorId: enrollment.sponsorId ?? '',
      title: input.title, objectiveType: input.objectiveType, description: input.description,
      baselineValue: input.baselineValue, targetValue: input.targetValue, unit: input.unit, targetThb: input.targetThb, toolsApplied: input.toolsApplied,
      status: 'draft', returnReason: null, midGateDecision: null, midGateNote: null, showcaseSummary: null, validatedValueThb: null, validatedAt: null,
      createdAt: nowIso(), updatedAt: nowIso(),
    })
    this.write()
    return id
  }

  async transitionContract(actorId: string, contractId: string, action: ContractAction, payload: ContractActionPayload = {}) {
    await delay(200)
    const c = this.snap.impactContracts.find((x) => x.id === contractId)
    if (!c) throw new DomainError('Impact contract not found.')
    const rel = contractRelation(c, actorId)
    const t = CONTRACT_TRANSITIONS.find((x) => x.action === action)
    if (!t) throw new DomainError('Unknown action.')
    if (!t.from.includes(c.status)) throw new DomainError(`This action is not available while the contract is "${c.status}".`)
    if (!t.by.some((b) => rel.includes(b))) throw new DomainError('You are not the responsible person for this action.')
    if (t.requiresNote && !payload.note?.trim()) throw new DomainError('A note explaining the decision is required.')
    const from = c.status
    const learner = this.persona(c.learnerId)
    const actor = this.persona(actorId)

    switch (action) {
      case 'submit':
        c.status = 'manager_review'; c.returnReason = null
        this.notify(c.managerId, 'Impact contract waiting for your review', `${learner.fullName} submitted "${c.title}".`, `/contracts/${c.id}`)
        break
      case 'withdraw':
        c.status = 'withdrawn'
        break
      case 'manager_approve':
        c.status = 'sponsor_review'
        this.notify(c.sponsorId, 'Impact contract waiting for sponsor approval', `${learner.fullName}: "${c.title}" was approved by the line manager.`, `/contracts/${c.id}`)
        break
      case 'return':
        if (from === 'showcase_review') {
          c.status = 'active'
        } else {
          c.status = 'returned'
        }
        c.returnReason = payload.note ?? null
        this.notify(c.learnerId, 'Impact contract returned for changes', `${actor.fullName}: ${payload.note}`, `/contracts/${c.id}`)
        break
      case 'sponsor_approve': {
        c.status = 'active'
        const enr = this.snap.enrollments.find((e) => e.id === c.enrollmentId)
        if (enr && ['invited', 'diagnosed', 'in_labs'].includes(enr.status)) enr.status = 'in_sprint'
        this.notify(c.learnerId, 'Impact contract approved by sponsor', `${actor.fullName} approved "${c.title}". Your sprint is active.`, `/contracts/${c.id}`)
        this.notify(c.managerId, 'Impact contract approved by sponsor', `"${c.title}" for ${learner.fullName} is now active.`, `/contracts/${c.id}`)
        break
      }
      case 'submit_mid_gate':
        c.status = 'mid_gate_review'
        this.notify(c.managerId, 'Mid-sprint evidence pack submitted', `${learner.fullName} asks for a scale / pivot / reset decision.`, `/contracts/${c.id}`)
        this.notify(c.sponsorId, 'Mid-sprint evidence pack submitted', `${learner.fullName} asks for a scale / pivot / reset decision.`, `/contracts/${c.id}`)
        break
      case 'mid_gate_decide': {
        const dec = payload.midGateDecision
        if (!dec) throw new DomainError('Choose scale, pivot or reset.')
        if (!payload.note?.trim()) throw new DomainError('Explain the decision in a note.')
        c.midGateDecision = dec; c.midGateNote = payload.note
        c.status = dec === 'reset' ? 'reset' : 'active'
        this.notify(c.learnerId, `Mid-sprint gate decision: ${dec}`, `${actor.fullName}: ${payload.note}`, `/contracts/${c.id}`)
        break
      }
      case 'submit_showcase': {
        if (!payload.showcaseSummary?.trim()) throw new DomainError('Describe the delivered improvement.')
        if (payload.claimedValueThb == null || payload.claimedValueThb <= 0) throw new DomainError('Enter the THB value you are claiming.')
        c.status = 'showcase_review'; c.showcaseSummary = payload.showcaseSummary
        const bu = learner.buId
        this.snap.ledgerEntries.push({
          id: uid('lg'), personaId: c.learnerId, buId: bu, sourceType: 'impact_contract', sourceId: c.id, title: c.title, objectiveType: c.objectiveType,
          claimedValueThb: payload.claimedValueThb, validatedValueThb: null, sponsorId: c.sponsorId, status: 'pending_validation', validatedAt: null,
          trackingUntil: addMonths(12), auditNote: null, createdAt: nowIso(),
        })
        const enr = this.snap.enrollments.find((e) => e.id === c.enrollmentId)
        if (enr) enr.status = 'showcase'
        this.notify(c.sponsorId, 'Showcase submitted for validation', `${learner.fullName} claims THB ${payload.claimedValueThb.toLocaleString()} for "${c.title}".`, `/contracts/${c.id}`)
        break
      }
      case 'validate': {
        if (payload.validatedValueThb == null || payload.validatedValueThb < 0) throw new DomainError('Enter the validated THB value.')
        c.status = 'validated'; c.validatedValueThb = payload.validatedValueThb; c.validatedAt = nowIso()
        const lg = this.snap.ledgerEntries.find((l) => l.sourceType === 'impact_contract' && l.sourceId === c.id)
        if (lg) { lg.status = 'validated'; lg.validatedValueThb = payload.validatedValueThb; lg.validatedAt = nowIso() }
        const enr = this.snap.enrollments.find((e) => e.id === c.enrollmentId)
        if (enr) { enr.status = 'graduated'; enr.impactRating = enr.impactRating ?? 'strong' }
        this.mintFromDiagnostic(c.enrollmentId, c.learnerId, 'showcase', c.id, 'ABC')
        this.notify(c.learnerId, 'Impact validated and badges minted', `${actor.fullName} validated THB ${payload.validatedValueThb.toLocaleString()}. Outcome-verified badges were minted to your skill passport.`, '/passport')
        break
      }
    }
    c.updatedAt = nowIso()
    this.event({ recordType: 'impact_contract', recordId: c.id, actorId, action, fromStatus: from, toStatus: c.status, note: payload.note ?? payload.showcaseSummary ?? null })
    this.write()
  }

  /** Mint outcome-verified badges for the learner's priority skills at target level. */
  private mintFromDiagnostic(enrollmentId: string, personaId: string, sourceType: PassportEntry['sourceType'], sourceId: string, program: 'ABC' | 'BCD') {
    const dx = this.snap.diagnostics.find((d) => d.enrollmentId === enrollmentId)
    if (!dx) return
    const items = this.snap.diagnosticItems.filter((i) => i.diagnosticId === dx.id && i.priorityRank != null).sort((a, b) => (a.priorityRank ?? 99) - (b.priorityRank ?? 99)).slice(0, 3)
    const cohort = this.snap.cohorts.find((c) => c.id === this.snap.enrollments.find((e) => e.id === enrollmentId)?.cohortId)
    for (const it of items) {
      const skill = this.snap.skills.find((s) => s.id === it.skillId)
      if (!skill) continue
      const existing = this.snap.passportEntries.find((p) => p.personaId === personaId && p.skillId === it.skillId && p.tier === 'outcome_verified' && p.sourceId === sourceId)
      if (existing) continue
      this.snap.passportEntries.push({
        id: uid('pp'), personaId, skillId: it.skillId, level: it.targetLevel, tier: 'outcome_verified', sourceType, sourceId,
        badgeCode: `${cohort?.code ?? program}-${skill.code}-L${it.targetLevel}`, mintedAt: nowIso(),
      })
    }
  }

  async addEvidence(actorId: string, contractId: string, input: EvidenceInput) {
    await delay(150)
    const c = this.snap.impactContracts.find((x) => x.id === contractId)
    if (!c) throw new DomainError('Impact contract not found.')
    if (c.learnerId !== actorId) throw new DomainError('Only the learner can log sprint evidence.')
    if (!['active', 'mid_gate_review'].includes(c.status)) throw new DomainError('Evidence can be logged while the sprint is active.')
    if (!input.title.trim()) throw new DomainError('Give the evidence a title.')
    this.snap.sprintEvidence.push({ id: uid('ev'), contractId, weekNo: input.weekNo, title: input.title, note: input.note, metricValue: input.metricValue, createdBy: actorId, createdAt: nowIso() })
    const learner = this.persona(actorId)
    this.notify(c.managerId, `${learner.fullName} logged week ${input.weekNo} evidence`, input.title, `/contracts/${c.id}`)
    this.write()
  }

  // ---------- Challenge briefs ----------
  async saveBrief(actorId: string, input: ChallengeBriefInput & { id?: string }) {
    await delay(150)
    const actor = this.persona(actorId)
    if (actor.role !== 'bu_sponsor') throw new DomainError('Only BU sponsors can create challenge briefs.')
    if (input.id) {
      const b = this.snap.challengeBriefs.find((x) => x.id === input.id)
      if (!b) throw new DomainError('Brief not found.')
      if (b.sponsorId !== actorId) throw new DomainError('Only the sponsoring owner can edit this brief.')
      if (!['draft', 'returned'].includes(b.status)) throw new DomainError('Only draft or returned briefs can be edited.')
      Object.assign(b, { ...input, updatedAt: nowIso() })
      this.write()
      return b.id
    }
    const id = uid('cb')
    this.snap.challengeBriefs.push({
      id, themeId: input.themeId, buId: input.buId, sponsorId: actorId, title: input.title, challengeType: input.challengeType,
      problemStatement: input.problemStatement, successMetric: input.successMetric, targetValueThb: input.targetValueThb, constraints: input.constraints,
      status: 'draft', cohortId: null, committeeNote: null, reviewedById: null, reviewedAt: null, createdAt: nowIso(), updatedAt: nowIso(),
    })
    this.write()
    return id
  }

  async transitionBrief(actorId: string, briefId: string, action: BriefAction, payload: BriefActionPayload = {}) {
    await delay(200)
    const b = this.snap.challengeBriefs.find((x) => x.id === briefId)
    if (!b) throw new DomainError('Brief not found.')
    const actor = this.persona(actorId)
    const rel = briefRelation(b, actor)
    const t = BRIEF_TRANSITIONS.find((x) => x.action === action)
    if (!t) throw new DomainError('Unknown action.')
    if (!t.from.includes(b.status)) throw new DomainError(`This action is not available while the brief is "${b.status}".`)
    if (!t.by.some((x) => rel.includes(x))) throw new DomainError('You are not the responsible role for this action.')
    if (t.requiresNote && !payload.note?.trim()) throw new DomainError('A note explaining the decision is required.')
    const from = b.status
    const committee = this.snap.personas.filter((p) => p.role === 'committee')
    const office = this.snap.personas.filter((p) => p.role === 'program_office')
    switch (action) {
      case 'submit':
        b.status = 'committee_review'
        committee.forEach((m) => this.notify(m.id, 'Challenge brief submitted for review', `${actor.fullName}: "${b.title}"`, `/briefs/${b.id}`))
        break
      case 'withdraw':
        b.status = 'withdrawn'
        break
      case 'approve':
        b.status = 'approved'; b.reviewedById = actorId; b.reviewedAt = nowIso(); b.committeeNote = payload.note ?? 'Approved.'
        this.notify(b.sponsorId, 'Challenge brief approved', `The committee approved "${b.title}".`, `/briefs/${b.id}`)
        office.forEach((o) => this.notify(o.id, 'Brief approved: assign to a cohort', `"${b.title}" is ready to be assigned.`, `/briefs/${b.id}`))
        break
      case 'return':
        b.status = 'returned'; b.reviewedById = actorId; b.reviewedAt = nowIso(); b.committeeNote = payload.note ?? null
        this.notify(b.sponsorId, 'Challenge brief returned for changes', `${actor.fullName}: ${payload.note}`, `/briefs/${b.id}`)
        break
      case 'reject':
        b.status = 'rejected'; b.reviewedById = actorId; b.reviewedAt = nowIso(); b.committeeNote = payload.note ?? null
        this.notify(b.sponsorId, 'Challenge brief rejected', `${actor.fullName}: ${payload.note}`, `/briefs/${b.id}`)
        break
      case 'assign': {
        if (!payload.cohortId) throw new DomainError('Choose a cohort.')
        const cohort = this.snap.cohorts.find((c) => c.id === payload.cohortId)
        if (!cohort || cohort.program !== 'BCD') throw new DomainError('Choose a BCD cohort.')
        b.status = 'assigned'; b.cohortId = cohort.id
        this.notify(b.sponsorId, 'Brief assigned to a cohort', `"${b.title}" is assigned to ${cohort.name}.`, `/briefs/${b.id}`)
        break
      }
    }
    b.updatedAt = nowIso()
    this.event({ recordType: 'challenge_brief', recordId: b.id, actorId, action, fromStatus: from, toStatus: b.status, note: payload.note ?? null })
    this.write()
  }

  // ---------- Concepts and gates ----------
  async submitGateEvidence(actorId: string, gateId: string, evidenceSummary: string) {
    await delay(200)
    const g = this.snap.gateReviews.find((x) => x.id === gateId)
    if (!g) throw new DomainError('Gate review not found.')
    const concept = this.snap.concepts.find((c) => c.id === g.conceptId)!
    const member = this.snap.enrollments.find((e) => e.personaId === actorId && e.teamId === concept.teamId)
    if (!member) throw new DomainError('Only a member of the concept team can submit the evidence pack.')
    if (g.decision !== 'pending' || g.submittedAt) throw new DomainError('This gate already has an evidence pack.')
    if (!evidenceSummary.trim()) throw new DomainError('Summarise the evidence pack.')
    g.evidenceSummary = evidenceSummary; g.submittedAt = nowIso()
    const from = concept.stage
    concept.stage = (`gate${g.gateNo}` as typeof concept.stage); concept.updatedAt = nowIso()
    this.snap.personas.filter((p) => p.role === 'committee').forEach((m) => this.notify(m.id, `Gate ${g.gateNo} evidence pack submitted`, `${concept.title}`, `/concepts/${concept.id}`))
    this.event({ recordType: 'concept', recordId: concept.id, actorId, action: 'submit_gate_evidence', fromStatus: from, toStatus: concept.stage, note: `Gate ${g.gateNo} evidence pack submitted.` })
    this.write()
  }

  async decideGate(actorId: string, gateId: string, decision: GateDecision, note: string, validatedValueThb: number | null) {
    await delay(200)
    const actor = this.persona(actorId)
    if (actor.role !== 'committee') throw new DomainError('Only the Capability Investment Committee records gate decisions.')
    const g = this.snap.gateReviews.find((x) => x.id === gateId)
    if (!g) throw new DomainError('Gate review not found.')
    if (g.decision !== 'pending') throw new DomainError('This gate is already decided.')
    if (!g.submittedAt) throw new DomainError('The team has not submitted an evidence pack yet.')
    if (!(GATE_DECISIONS_BY_GATE[g.gateNo] as string[]).includes(decision)) throw new DomainError('That decision is not valid for this gate.')
    if (!note.trim()) throw new DomainError('Record the reasoning for the decision.')
    const concept = this.snap.concepts.find((c) => c.id === g.conceptId)!
    const from = concept.stage
    g.decision = decision; g.decidedById = actorId; g.decidedAt = nowIso(); g.note = note; g.validatedValueThb = validatedValueThb
    if (decision === 'stop') concept.stage = 'stopped'
    else if (decision === 'pivot') concept.stage = 'pivot'
    else if (decision === 'hold') concept.stage = 'incubating'
    else if (g.gateNo === 1) concept.stage = 'build_case'
    else if (g.gateNo === 2) {
      concept.stage = 'incubating'
      this.snap.gateReviews.push({ id: uid('gr'), conceptId: concept.id, gateNo: 3, scheduledDate: addMonths(6).slice(0, 10), evidenceSummary: null, submittedAt: null, decision: 'pending', decidedById: null, decidedAt: null, note: null, validatedValueThb: null })
    } else if (g.gateNo === 3) {
      concept.stage = 'scaled'; concept.validatedValueThb = validatedValueThb; concept.scaleRoute = concept.scaleRoute ?? 'internal_high_impact'
    }
    concept.updatedAt = nowIso()
    const members = this.snap.enrollments.filter((e) => e.teamId === concept.teamId)
    const brief = this.snap.challengeBriefs.find((b) => b.id === concept.briefId)
    const positive = ['go', 'invest', 'small_scale', 'scale'].includes(decision)
    for (const m of members) {
      this.notify(m.personaId, `Gate ${g.gateNo} decision: ${decision}`, `${concept.title}. ${note}`, `/concepts/${concept.id}`)
      if (positive) this.mintFromDiagnostic(m.id, m.personaId, 'gate', g.id, 'BCD')
      if (g.gateNo === 3 && decision === 'scale' && validatedValueThb && brief) {
        this.snap.ledgerEntries.push({
          id: uid('lg'), personaId: m.personaId, buId: brief.buId, sourceType: 'concept', sourceId: concept.id, title: `${concept.title} (Gate 3)`, objectiveType: null,
          claimedValueThb: validatedValueThb, validatedValueThb, sponsorId: brief.sponsorId, status: 'validated', validatedAt: nowIso(), trackingUntil: addMonths(12), auditNote: null, createdAt: nowIso(),
        })
      }
    }
    if (brief) this.notify(brief.sponsorId, `Gate ${g.gateNo} decision: ${decision}`, `${concept.title}. ${note}`, `/concepts/${concept.id}`)
    this.event({ recordType: 'concept', recordId: concept.id, actorId, action: 'gate_decision', fromStatus: from, toStatus: concept.stage, note: `Gate ${g.gateNo}: ${decision}. ${note}` })
    this.write()
  }

  // ---------- Ledger ----------
  async reviewLedgerEntry(actorId: string, entryId: string, decision: 'validate' | 'reject' | 'audit', validatedValueThb: number | null, note: string | null) {
    await delay(200)
    const actor = this.persona(actorId)
    const lg = this.snap.ledgerEntries.find((l) => l.id === entryId)
    if (!lg) throw new DomainError('Ledger entry not found.')
    const from = lg.status
    if (decision === 'audit') {
      if (actor.role !== 'program_office') throw new DomainError('Only the program office records audits.')
      if (lg.status !== 'validated') throw new DomainError('Only validated entries can be audited.')
      if (!note?.trim()) throw new DomainError('Record the audit finding.')
      lg.status = 'audited'; lg.auditNote = note
    } else {
      if (lg.sponsorId !== actorId) throw new DomainError('Only the named sponsor can validate this entry.')
      if (lg.status !== 'pending_validation') throw new DomainError('This entry is not waiting for validation.')
      if (decision === 'validate') {
        if (validatedValueThb == null || validatedValueThb < 0) throw new DomainError('Enter the validated THB value.')
        lg.status = 'validated'; lg.validatedValueThb = validatedValueThb; lg.validatedAt = nowIso()
        if (lg.sourceType === 'impact_contract') {
          const c = this.snap.impactContracts.find((x) => x.id === lg.sourceId)
          if (c && c.status === 'showcase_review') {
            c.status = 'validated'; c.validatedValueThb = validatedValueThb; c.validatedAt = nowIso(); c.updatedAt = nowIso()
            const enr = this.snap.enrollments.find((e) => e.id === c.enrollmentId)
            if (enr) enr.status = 'graduated'
            this.mintFromDiagnostic(c.enrollmentId, c.learnerId, 'showcase', c.id, 'ABC')
            this.event({ recordType: 'impact_contract', recordId: c.id, actorId, action: 'validate', fromStatus: 'showcase_review', toStatus: 'validated', note })
          }
        }
        this.notify(lg.personaId, 'Impact validated in the ledger', `${actor.fullName} validated THB ${validatedValueThb.toLocaleString()} for "${lg.title}".`, '/ledger')
      } else {
        if (!note?.trim()) throw new DomainError('Explain why the value is rejected.')
        lg.status = 'rejected'; lg.auditNote = note
        this.notify(lg.personaId, 'Claimed impact not validated', `${actor.fullName}: ${note}`, '/ledger')
      }
    }
    this.event({ recordType: 'ledger_entry', recordId: lg.id, actorId, action: decision, fromStatus: from, toStatus: lg.status, note })
    this.write()
  }

  // ---------- Learning ----------
  async updateLearningItem(actorId: string, itemId: string, status: 'planned' | 'in_progress' | 'completed' | 'skipped') {
    await delay(120)
    const it = this.snap.learningPlanItems.find((x) => x.id === itemId)
    if (!it) throw new DomainError('Plan item not found.')
    const enr = this.snap.enrollments.find((e) => e.id === it.enrollmentId)
    if (enr?.personaId !== actorId) throw new DomainError('Only the learner can update their plan.')
    it.status = status
    this.write()
  }

  async runDiagnostic(actorId: string, enrollmentId: string) {
    await delay(900)
    const enr = this.snap.enrollments.find((e) => e.id === enrollmentId)
    if (!enr || enr.personaId !== actorId) throw new DomainError('Only the learner can run their diagnostic.')
    const dx = this.snap.diagnostics.find((d) => d.enrollmentId === enrollmentId)
    if (!dx || dx.status === 'completed') throw new DomainError('The diagnostic is already completed.')
    dx.status = 'completed'; dx.completedAt = nowIso()
    dx.summary = 'Simulated AI diagnostic. Priority gaps: GenAI copilot practice, data storytelling and improvement planning, matched to payroll query turnaround.'
    const items: [string, number, number, number | null][] = [['sk-genai', 1, 3, 1], ['sk-datastory', 1, 3, 2], ['sk-changeplan', 2, 3, 3], ['sk-custneeds', 2, 3, 4], ['sk-collab', 3, 3, null], ['sk-opex', 0, 2, null]]
    for (const [skillId, cur, tgt, rank] of items) {
      this.snap.diagnosticItems.push({ id: uid('dxi'), diagnosticId: dx.id, skillId, currentLevel: cur, targetLevel: tgt, priorityRank: rank, evidenceSource: cur === 0 ? null : 'ai_inferred', rationale: cur === 0 ? 'Not assessed: no work data available for this skill.' : 'Simulated inference from knowledge test and work data.' })
      if (cur > 0) this.snap.passportEntries.push({ id: uid('pp'), personaId: actorId, skillId, level: cur, tier: 'ai_inferred', sourceType: 'diagnostic', sourceId: dx.id, badgeCode: null, mintedAt: nowIso() })
    }
    const planMods = ['mod-genai-1', 'mod-genai-2', 'mod-datastory-1', 'mod-datastory-3', 'mod-changeplan-1', 'mod-custneeds-1']
    planMods.forEach((moduleId, i) => this.snap.learningPlanItems.push({ id: uid('lp'), enrollmentId, moduleId, sequence: i + 1, status: 'planned', reason: `Priority gap ${Math.min(i / 2 + 1, 4) | 0}` }))
    if (enr.status === 'invited') enr.status = 'diagnosed'
    this.write()
  }

  // ---------- Coaching ----------
  async markClinicBriefingReady(actorId: string, clinicId: string) {
    await delay(120)
    const cl = this.snap.coachingClinics.find((c) => c.id === clinicId)
    if (!cl) throw new DomainError('Clinic not found.')
    if (cl.coachId !== actorId) throw new DomainError('Only the assigned coach can mark the briefing ready.')
    cl.briefingReady = true
    this.write()
  }

  async addCoachingNote(actorId: string, enrollmentId: string, note: string, clinicId: string | null) {
    await delay(150)
    const actor = this.persona(actorId)
    if (actor.role !== 'coach') throw new DomainError('Only coaches add coaching notes.')
    if (!note.trim()) throw new DomainError('Write the note.')
    const enr = this.snap.enrollments.find((e) => e.id === enrollmentId)
    if (!enr) throw new DomainError('Enrollment not found.')
    this.snap.coachingNotes.push({ id: uid('cn'), enrollmentId, coachId: actorId, clinicId, note, aiFlag: null, createdAt: nowIso() })
    this.notify(enr.personaId, 'New coaching note', note, '/journey')
    this.write()
  }

  // ---------- Marketplace, notifications, AI coach ----------
  async expressInterest(actorId: string, roleId: string) {
    await delay(120)
    if (this.snap.marketplaceInterests.some((i) => i.roleId === roleId && i.personaId === actorId)) throw new DomainError('You already expressed interest.')
    const role = this.snap.marketplaceRoles.find((r) => r.id === roleId)
    if (!role) throw new DomainError('Role not found.')
    this.snap.marketplaceInterests.push({ id: uid('mi'), roleId, personaId: actorId, createdAt: nowIso(), status: 'expressed' })
    const actor = this.persona(actorId)
    this.notify(role.ownerId, 'New interest in your marketplace posting', `${actor.fullName} expressed interest in "${role.title}".`, '/marketplace')
    this.write()
  }

  async markNotificationRead(actorId: string, notificationId: string) {
    const n = this.snap.notifications.find((x) => x.id === notificationId && x.personaId === actorId)
    if (n && !n.readAt) { n.readAt = nowIso(); this.write() }
  }

  async sendCoachMessage(actorId: string, content: string, lang: 'th' | 'en') {
    await delay(150)
    this.snap.coachMessages.push({ id: uid('cm'), personaId: actorId, sender: 'user', lang, content, citedModuleId: null, createdAt: nowIso() })
    await delay(700)
    const reply = simulatedCoachReply(content, lang)
    this.snap.coachMessages.push({ id: uid('cm'), personaId: actorId, sender: 'coach', lang, content: reply.content, citedModuleId: reply.moduleId, createdAt: nowIso() })
    this.write()
  }

  async appendCoachExchange(actorId: string, content: string, lang: 'th' | 'en', reply: string, citedModuleId: string | null) {
    this.persona(actorId)
    this.snap.coachMessages.push({ id: uid('cm'), personaId: actorId, sender: 'user', lang, content, citedModuleId: null, createdAt: nowIso() })
    this.snap.coachMessages.push({ id: uid('cm'), personaId: actorId, sender: 'coach', lang, content: reply, citedModuleId, createdAt: nowIso() })
    this.write()
  }

  async submitAssessment(actorId: string, enrollmentId: string, responses: AssessmentResponses) {
    await delay(150)
    const enr = this.snap.enrollments.find((e) => e.id === enrollmentId)
    if (!enr || enr.personaId !== actorId) throw new DomainError('Only the learner can submit their own assessment.')
    const id = uid('as')
    this.snap.assessments.push({ id, enrollmentId, personaId: actorId, responses, submittedAt: nowIso() })
    this.write()
    return id
  }

  async completeDiagnostic(actorId: string, enrollmentId: string, result: DiagnosticResult) {
    await delay(200)
    const enr = this.snap.enrollments.find((e) => e.id === enrollmentId)
    if (!enr || enr.personaId !== actorId) throw new DomainError('Only the learner can complete their diagnostic.')
    let dx = this.snap.diagnostics.find((d) => d.enrollmentId === enrollmentId)
    if (!dx) { dx = { id: uid('dx'), enrollmentId, status: 'pending', completedAt: null, summary: null }; this.snap.diagnostics.push(dx) }
    if (dx.status === 'completed') throw new DomainError('The diagnostic is already completed.')
    dx.status = 'completed'; dx.completedAt = nowIso(); dx.summary = result.summary
    this.snap.diagnosticItems = this.snap.diagnosticItems.filter((i) => i.diagnosticId !== dx!.id)
    for (const it of result.items) {
      if (!this.snap.skills.some((s) => s.id === it.skillId)) continue
      this.snap.diagnosticItems.push({ id: uid('dxi'), diagnosticId: dx.id, skillId: it.skillId, currentLevel: it.currentLevel, targetLevel: it.targetLevel, priorityRank: it.priorityRank, evidenceSource: it.evidenceSource, rationale: it.rationale })
      if (it.currentLevel > 0) this.snap.passportEntries.push({ id: uid('pp'), personaId: actorId, skillId: it.skillId, level: it.currentLevel, tier: it.evidenceSource === 'self_declared' ? 'self_declared' : 'ai_inferred', sourceType: 'diagnostic', sourceId: dx.id, badgeCode: null, mintedAt: nowIso() })
    }
    this.snap.learningPlanItems = this.snap.learningPlanItems.filter((p) => p.enrollmentId !== enrollmentId)
    let seq = 0
    for (const p of result.plan) if (this.snap.learningModules.some((m) => m.id === p.moduleId)) this.snap.learningPlanItems.push({ id: uid('lp'), enrollmentId, moduleId: p.moduleId, sequence: ++seq, status: 'planned', reason: p.reason })
    for (const p of result.skipped) if (this.snap.learningModules.some((m) => m.id === p.moduleId)) this.snap.learningPlanItems.push({ id: uid('lp'), enrollmentId, moduleId: p.moduleId, sequence: ++seq, status: 'skipped', reason: p.reason })
    if (enr.status === 'invited') enr.status = 'diagnosed'
    this.write()
  }

  async saveGuidance(actorId: string, personaId: string, kind: GuidanceKind, contextId: string | null, content: unknown, model: string) {
    const actor = this.persona(actorId)
    if (actorId !== personaId && !['coach', 'line_manager', 'bu_sponsor', 'program_office'].includes(actor.role)) throw new DomainError('You can only save guidance for yourself or for people you support.')
    const id = uid('gn')
    this.snap.guidanceNotes.push({ id, personaId, kind, contextId, content, model, createdBy: actorId, createdAt: nowIso() })
    this.write()
    return id
  }

  async setGapDecision(actorId: string, gapId: string, decision: GapDecision, funded: boolean) {
    await delay(150)
    const actor = this.persona(actorId)
    if (!['program_office', 'committee'].includes(actor.role)) throw new DomainError('Only the program office or the committee records build / buy / borrow / bot decisions.')
    const g = this.snap.capabilityGaps.find((x) => x.id === gapId)
    if (!g) throw new DomainError('Gap not found.')
    g.decision = decision; g.funded = funded; g.decidedById = actorId; g.decidedAt = nowIso()
    this.write()
  }

  async remindAssessment(actorId: string, enrollmentId: string) {
    await delay(150)
    const actor = this.persona(actorId)
    if (!['program_office', 'committee', 'bu_sponsor', 'line_manager', 'coach'].includes(actor.role)) throw new DomainError('Only program staff, sponsors, managers or coaches send assessment reminders.')
    const e = this.snap.enrollments.find((x) => x.id === enrollmentId)
    if (!e) throw new DomainError('Enrollment not found.')
    if (this.snap.diagnostics.some((d) => d.enrollmentId === e.id && d.status === 'completed')) throw new DomainError('This learner has already completed the assessment.')
    const c = this.snap.cohorts.find((x) => x.id === e.cohortId)!
    this.notify(e.personaId, 'Reminder: complete your AI skill diagnostic', `${actor.fullName} asks you to complete the assessment for ${c.name} so your personal path is ready before the labs.`, '/assessment')
    this.write()
  }

  async checkInLab(actorId: string, enrollmentId: string, labDay: number, reflection: string) {
    await delay(120)
    const e = this.snap.enrollments.find((x) => x.id === enrollmentId)
    if (!e || e.personaId !== actorId) throw new DomainError('Only the learner checks in to their own lab day.')
    const ex = this.snap.labAttendance.find((l) => l.enrollmentId === enrollmentId && l.labDay === labDay)
    if (ex) ex.reflection = reflection || ex.reflection
    else this.snap.labAttendance.push({ id: uid('la'), enrollmentId, labDay, attendedAt: nowIso(), reflection: reflection || null })
    if (['invited', 'diagnosed'].includes(e.status)) e.status = 'in_labs'
    this.write()
  }
  async raiseAiFlag(actorId: string, flag: string) {
    const l = this.persona(actorId)
    const e = this.snap.enrollments.find((x) => x.personaId === actorId && !['graduated', 'withdrawn'].includes(x.status) && x.coachId)
    if (!e) return
    this.snap.coachingNotes.push({ id: uid('cn'), enrollmentId: e.id, coachId: e.coachId!, clinicId: null, note: 'Flag raised by Expert Guidance during the coach chat.', aiFlag: flag, createdAt: nowIso() })
    this.notify(e.coachId!, `Expert Guidance flagged ${l.fullName}`, flag, '/coaching')
    this.write()
  }
  async setProgramOutcome(actorId: string, enrollmentId: string, rating: string | null, topDecile: boolean, fastTrack: boolean) {
    await delay(150)
    const a = this.persona(actorId)
    const e = this.snap.enrollments.find((x) => x.id === enrollmentId)
    if (!e) throw new DomainError('Enrollment not found.')
    if (!(a.role === 'program_office' || e.managerId === actorId || e.sponsorId === actorId)) throw new DomainError('Only the line manager, sponsor or program office records program outcomes.')
    e.impactRating = (rating as typeof e.impactRating) ?? null; e.topDecile = topDecile; e.fastTrackBcd = fastTrack
    this.notify(e.personaId, 'Program outcome recorded', `Impact rating: ${rating ?? 'not set'}${topDecile ? ' · top ~10%' : ''}${fastTrack ? ' · BCD fast-track' : ''}. This feeds your performance review and talent profile.`, '/passport')
    this.write()
  }
  async saveTheme(actorId: string, buId: string, title: string, description: string, year: number) {
    await delay(120)
    const a = this.persona(actorId)
    if (!['bu_sponsor', 'program_office'].includes(a.role)) throw new DomainError('Only BU sponsors or the program office set themes.')
    if (!title.trim()) throw new DomainError('Give the theme a title.')
    const id = uid('th')
    this.snap.challengeThemes.push({ id, buId, title, description, setById: actorId, year })
    this.write(); return id
  }
  async createCohort(actorId: string, i: { program: 'ABC' | 'BCD'; code: string; name: string; buId: string | null; startDate: string; seats: number; pipelineTargetThb: number | null; coachId: string | null }) {
    await delay(200)
    const a = this.persona(actorId)
    if (a.role !== 'program_office') throw new DomainError('Only the program office creates cohorts.')
    if (!i.code.trim() || !i.name.trim()) throw new DomainError('Code and name are required.')
    const add = (n: number) => { const dt = new Date(i.startDate); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10) }
    const keyDates = i.program === 'ABC'
      ? [['AI skill diagnostic', 0], ['Flipped micro-learning', 0], ['Applied capability labs (4 days)', 14], ['Impact sprint starts', 21], ['Coaching clinic 1', 49], ['Mid-sprint gate', 63], ['Coaching clinic 2', 84], ['Impact showcase', 105]]
      : [['Challenge sourcing', 0], ['Onboard, diagnose & team up', 28], ['Immersion camp (3 days)', 35], ['Concept studio sprint', 42], ['Field validation', 63], ['Gate 1 · Proof of concept', 84], ['Commercial build', 91], ['Prototype & stress-test', 119], ['Gate 2 · CEO investment pitch', 140]]
    const id = uid('coh')
    this.snap.cohorts.push({ id, program: i.program, code: i.code, name: i.name, buId: i.buId, status: 'planned', startDate: i.startDate, endDate: add(i.program === 'ABC' ? 105 : 140), keyDates: keyDates.map(([label, n]) => ({ label: label as string, date: add(n as number) })), pipelineTargetThb: i.pipelineTargetThb, seats: i.seats })
    if (i.program === 'ABC' && i.coachId) {
      this.snap.coachingClinics.push({ id: uid('cl'), cohortId: id, clinicNo: 1, scheduledAt: `${add(49)}T09:00:00+07:00`, coachId: i.coachId, topics: 'Baselines and weekly evidence', briefingReady: false })
      this.snap.coachingClinics.push({ id: uid('cl'), cohortId: id, clinicNo: 2, scheduledAt: `${add(84)}T09:00:00+07:00`, coachId: i.coachId, topics: 'Showcase preparation and sustaining change', briefingReady: false })
    }
    this.write(); return id
  }
  async enrollLearner(actorId: string, cohortId: string, personaId: string, sponsorId: string | null, coachId: string | null) {
    await delay(150)
    const a = this.persona(actorId)
    if (a.role !== 'program_office') throw new DomainError('Only the program office enrols learners.')
    const l = this.persona(personaId)
    const c = this.snap.cohorts.find((x) => x.id === cohortId)
    if (!c) throw new DomainError('Cohort not found.')
    if (this.snap.enrollments.some((e) => e.cohortId === cohortId && e.personaId === personaId)) throw new DomainError('This person is already enrolled in the cohort.')
    if (this.snap.enrollments.filter((e) => e.cohortId === cohortId).length >= c.seats) throw new DomainError('The cohort is full.')
    const id = uid('enr')
    this.snap.enrollments.push({ id, cohortId, personaId, status: 'invited', teamId: null, coachId, sponsorId, managerId: l.managerId, impactRating: null, topDecile: false, fastTrackBcd: false })
    this.snap.diagnostics.push({ id: uid('dx'), enrollmentId: id, status: 'pending', completedAt: null, summary: null })
    this.notify(personaId, `You are invited to ${c.name}`, 'Complete your AI skill diagnostic to build your personal path before the labs.', '/assessment')
    this.write(); return id
  }
  async formTeam(actorId: string, briefId: string, name: string, memberEnrollmentIds: string[], coachId: string | null) {
    await delay(200)
    const a = this.persona(actorId)
    if (a.role !== 'program_office') throw new DomainError('Only the program office forms teams.')
    const b = this.snap.challengeBriefs.find((x) => x.id === briefId)
    if (!b || b.status !== 'assigned' || !b.cohortId) throw new DomainError('The brief must be assigned to a cohort first.')
    if (this.snap.concepts.some((c) => c.briefId === b.id)) throw new DomainError('A team already works on this brief.')
    if (!memberEnrollmentIds.length) throw new DomainError('Choose at least one team member.')
    const c = this.snap.cohorts.find((x) => x.id === b.cohortId)!
    const teamId = uid('team'), conceptId = uid('cp')
    this.snap.teams.push({ id: teamId, cohortId: c.id, name, briefId: b.id, coachId })
    this.snap.concepts.push({ id: conceptId, teamId, briefId: b.id, cohortId: c.id, title: b.title, summary: `Concept framing in progress: ${b.problemStatement}`, stage: 'frame', pipelineValueThb: b.targetValueThb, validatedValueThb: null, scaleRoute: null, createdAt: nowIso(), updatedAt: nowIso() })
    const g1 = c.keyDates.find((k) => /^Gate 1/i.test(k.label))?.date ?? c.startDate, g2 = c.keyDates.find((k) => /^Gate 2/i.test(k.label))?.date ?? c.endDate
    this.snap.gateReviews.push({ id: uid('gr'), conceptId, gateNo: 1, scheduledDate: g1, evidenceSummary: null, submittedAt: null, decision: 'pending', decidedById: null, decidedAt: null, note: null, validatedValueThb: null })
    this.snap.gateReviews.push({ id: uid('gr'), conceptId, gateNo: 2, scheduledDate: g2, evidenceSummary: null, submittedAt: null, decision: 'pending', decidedById: null, decidedAt: null, note: null, validatedValueThb: null })
    for (const m of memberEnrollmentIds) {
      const e = this.snap.enrollments.find((x) => x.id === m && x.cohortId === c.id && !x.teamId)
      if (!e) throw new DomainError('Every member must be enrolled in the cohort and not already in a team.')
      e.teamId = teamId; e.sponsorId = e.sponsorId ?? b.sponsorId; e.coachId = coachId ?? e.coachId
      this.notify(e.personaId, `You joined ${name}`, `Your team works on "${b.title}". Stage 1: frame the challenge.`, `/concepts/${conceptId}`)
    }
    this.notify(b.sponsorId, 'Team formed for your brief', `${name} now works on "${b.title}".`, `/concepts/${conceptId}`)
    this.event({ recordType: 'concept', recordId: conceptId, actorId, action: 'form_team', fromStatus: null, toStatus: 'frame', note: `${name} formed with ${memberEnrollmentIds.length} members.` })
    this.write(); return conceptId
  }
  async advanceConceptStage(actorId: string, conceptId: string, note: string) {
    await delay(150)
    const cp = this.snap.concepts.find((c) => c.id === conceptId)
    if (!cp) throw new DomainError('Concept not found.')
    if (!this.snap.enrollments.some((e) => e.personaId === actorId && e.teamId === cp.teamId)) throw new DomainError('Only a team member advances the concept.')
    if (!note.trim()) throw new DomainError('Describe what the team completed in this stage.')
    const next = cp.stage === 'frame' ? 'build' : cp.stage === 'build' || cp.stage === 'pivot' ? 'validate' : null
    if (!next) throw new DomainError('This stage moves on through a gate review, not manually.')
    const from = cp.stage; cp.stage = next; cp.updatedAt = nowIso()
    this.event({ recordType: 'concept', recordId: cp.id, actorId, action: 'advance_stage', fromStatus: from, toStatus: next, note })
    this.write()
  }
  async updateCoachScorecard(actorId: string, coachId: string, cohortId: string, freq: number, quality: number, rating: number, certified: boolean, until: string | null) {
    await delay(150)
    const a = this.persona(actorId)
    if (a.role !== 'program_office') throw new DomainError('Only the program office maintains coach scorecards.')
    const ex = this.snap.coachScorecards.find((s) => s.coachId === coachId && s.cohortId === cohortId)
    if (ex) Object.assign(ex, { feedbackFrequency: freq, feedbackQuality: quality, learnerRating: rating, certified, certifiedUntil: until })
    else this.snap.coachScorecards.push({ id: uid('cs'), coachId, cohortId, feedbackFrequency: freq, feedbackQuality: quality, learnerRating: rating, certified, certifiedUntil: until })
    this.notify(coachId, 'Coach scorecard updated', `Quality ${quality}/5 · learner rating ${rating}/5 · ${certified ? `certified until ${until ?? ''}` : 'not certified'}`, '/coaching')
    this.write()
  }
  async createMarketplaceRole(actorId: string, input: MarketplaceRoleInput) {
    await delay(150)
    const a = this.persona(actorId)
    if (!['bu_sponsor', 'line_manager', 'program_office'].includes(a.role)) throw new DomainError('Only sponsors, managers or the program office publish postings.')
    if (!input.title.trim()) throw new DomainError('Give the posting a title.')
    const id = uid('mr')
    this.snap.marketplaceRoles.push({ id, title: input.title, buId: input.buId || a.buId, kind: input.kind, description: input.description, openUntil: input.openUntil, ownerId: actorId, requirements: input.requirements })
    this.write(); return id
  }
  async updateInterest(actorId: string, interestId: string, status: 'shortlisted' | 'declined' | 'expressed') {
    await delay(120)
    const i = this.snap.marketplaceInterests.find((x) => x.id === interestId)
    if (!i) throw new DomainError('Interest not found.')
    const r = this.snap.marketplaceRoles.find((x) => x.id === i.roleId)!
    if (r.ownerId !== actorId) throw new DomainError('Only the posting owner shortlists or declines.')
    i.status = status
    this.notify(i.personaId, status === 'shortlisted' ? 'You were shortlisted' : 'Update on your marketplace interest', `"${r.title}": ${status}. Decision based on verified passport skills; the owner will contact you.`, '/marketplace')
    this.write()
  }

  async resetDemo() {
    this.snap = clone(fixtureBundle)
    this.write()
  }
}

export function simulatedCoachReply(content: string, lang: 'th' | 'en'): { content: string; moduleId: string | null } {
  const q = content.toLowerCase()
  if (/gate|เกท|เกต|มิด|mid/.test(q)) {
    return lang === 'th'
      ? { content: 'สำหรับ Mid-sprint gate ให้เตรียม evidence pack 3 ส่วน: baseline และค่าปัจจุบัน, หลักฐานรายสัปดาห์, และข้อเสนอ scale / pivot / reset ดูตัวอย่างในโมดูล CHG-01.2 (คำตอบจำลอง อ้างอิงเฉพาะเนื้อหาในโปรแกรม)', moduleId: 'mod-changeplan-2' }
      : { content: 'For the mid-sprint gate prepare three things: your baseline and current value, weekly evidence, and a scale / pivot / reset proposal. Module CHG-01.2 has the template. (Simulated answer grounded in program content only.)', moduleId: 'mod-changeplan-2' }
  }
  if (/baseline|เบสไลน์|ฐาน/.test(q)) {
    return lang === 'th'
      ? { content: 'ระบุแหล่งข้อมูล ช่วงเวลา และวิธีคำนวณของ baseline แล้วแสดงแนวโน้มรายสัปดาห์เทียบกับเป้าหมาย ดูเทมเพลตในโมดูล OPEX-01.3 (คำตอบจำลอง)', moduleId: 'mod-datastory-3' }
      : { content: 'State the data source, the period and the calculation, then show the weekly trend against the target. Module OPEX-01.3 has a one-slide template. (Simulated answer.)', moduleId: 'mod-datastory-3' }
  }
  if (/pitch|พิตช์|นำเสนอ/.test(q)) {
    return lang === 'th'
      ? { content: 'โครงสร้าง pitch 6 นาที: ปัญหาและมูลค่า, หลักฐานจากลูกค้า, โมเดลธุรกิจและกรณี best / worst, สิ่งที่ขอจากคณะกรรมการ ฝึกกับ AI coach ได้ในโหมด Practice Partner (คำตอบจำลอง)', moduleId: 'mod-pitch-2' }
      : { content: 'Six-minute pitch structure: problem and value, customer evidence, business model with best / worst case, and the ask. Rehearse with the Practice Partner mode. Module EXP-01.2 covers the recorded pitch. (Simulated answer.)', moduleId: 'mod-pitch-2' }
  }
  return lang === 'th'
    ? { content: 'ฉันตอบได้เฉพาะเรื่องที่อยู่ในเนื้อหาโปรแกรม เช่น กำหนดการ กิจกรรม impact contract หรือการเตรียม gate ลองถามเจาะจงเรื่องใดเรื่องหนึ่ง (คำตอบจำลอง: ต้นแบบยังไม่ได้เชื่อมต่อ AI จริง)', moduleId: null }
    : { content: 'I can only answer from the approved program content, such as the schedule, activities, your impact contract or gate preparation. Ask about one of those. (Simulated answer: the prototype is not connected to a live AI service.)', moduleId: null }
}

function addMonths(n: number) {
  const dt = new Date(); dt.setMonth(dt.getMonth() + n)
  return dt.toISOString()
}
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
