import type { FixtureBundle } from '@/data/fixtures'
import type { ChallengeBriefInput, ImpactContractInput, GateDecision, AssessmentResponses, DiagnosticResult, GuidanceKind, GapDecision, MarketplaceRoleInput, IntegrationSystem, CostCategory, BlueprintPlan, PolicyStatus, SuccessionPool, RecognitionKind, MilestoneStatus, GateEvidence, GateBusinessCase, GateAttachment, TalentReview, PracticeSession } from '@/domain/types'

export type Snapshot = FixtureBundle

export type ContractAction =
  | 'submit' | 'withdraw' | 'manager_approve' | 'return' | 'sponsor_approve'
  | 'submit_mid_gate' | 'mid_gate_decide' | 'submit_showcase' | 'validate'

export type BriefAction = 'submit' | 'withdraw' | 'approve' | 'return' | 'reject' | 'assign'

export interface ContractActionPayload {
  note?: string
  midGateDecision?: 'scale' | 'pivot' | 'reset'
  showcaseSummary?: string
  claimedValueThb?: number
  validatedValueThb?: number
}

export interface BriefActionPayload {
  note?: string
  cohortId?: string
}

export interface EvidenceInput {
  weekNo: number
  title: string
  note: string
  metricValue: number | null
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

/**
 * One data source per backend. Components never call this directly; feature hooks do.
 * Every mutation carries the acting persona so the backend can enforce role rules.
 */
export interface DataSource {
  readonly mode: 'supabase' | 'local'
  loadSnapshot(): Promise<Snapshot>

  saveContract(actorId: string, input: ImpactContractInput & { id?: string }): Promise<string>
  transitionContract(actorId: string, contractId: string, action: ContractAction, payload?: ContractActionPayload): Promise<void>
  addEvidence(actorId: string, contractId: string, input: EvidenceInput): Promise<void>

  saveBrief(actorId: string, input: ChallengeBriefInput & { id?: string }): Promise<string>
  transitionBrief(actorId: string, briefId: string, action: BriefAction, payload?: BriefActionPayload): Promise<void>

  submitGateEvidence(actorId: string, gateId: string, evidenceSummary: string): Promise<void>
  decideGate(actorId: string, gateId: string, decision: GateDecision, note: string, validatedValueThb: number | null): Promise<void>

  reviewLedgerEntry(actorId: string, entryId: string, decision: 'validate' | 'reject' | 'audit', validatedValueThb: number | null, note: string | null): Promise<void>

  updateLearningItem(actorId: string, itemId: string, status: 'planned' | 'in_progress' | 'completed' | 'skipped'): Promise<void>
  runDiagnostic(actorId: string, enrollmentId: string): Promise<void>

  markClinicBriefingReady(actorId: string, clinicId: string): Promise<void>
  addCoachingNote(actorId: string, enrollmentId: string, note: string, clinicId: string | null): Promise<void>

  expressInterest(actorId: string, roleId: string): Promise<void>
  markNotificationRead(actorId: string, notificationId: string): Promise<void>
  sendCoachMessage(actorId: string, content: string, lang: 'th' | 'en'): Promise<void>
  /** Stores a learner question and the Expert Guidance reply that was generated server-side. */
  appendCoachExchange(actorId: string, content: string, lang: 'th' | 'en', reply: string, citedModuleId: string | null): Promise<void>

  submitAssessment(actorId: string, enrollmentId: string, responses: AssessmentResponses): Promise<string>
  completeDiagnostic(actorId: string, enrollmentId: string, result: DiagnosticResult): Promise<void>
  saveGuidance(actorId: string, personaId: string, kind: GuidanceKind, contextId: string | null, content: unknown, model: string): Promise<string>

  setGapDecision(actorId: string, gapId: string, decision: GapDecision, funded: boolean): Promise<void>
  remindAssessment(actorId: string, enrollmentId: string): Promise<void>

  checkInLab(actorId: string, enrollmentId: string, labDay: number, reflection: string): Promise<void>
  raiseAiFlag(actorId: string, flag: string): Promise<void>
  setProgramOutcome(actorId: string, enrollmentId: string, rating: string | null, topDecile: boolean, fastTrack: boolean): Promise<void>
  saveTheme(actorId: string, buId: string, title: string, description: string, year: number): Promise<string>
  createCohort(actorId: string, input: { program: 'ABC' | 'BCD'; code: string; name: string; buId: string | null; startDate: string; seats: number; pipelineTargetThb: number | null; coachId: string | null }): Promise<string>
  enrollLearner(actorId: string, cohortId: string, personaId: string, sponsorId: string | null, coachId: string | null): Promise<string>
  formTeam(actorId: string, briefId: string, name: string, memberEnrollmentIds: string[], coachId: string | null): Promise<string>
  advanceConceptStage(actorId: string, conceptId: string, note: string): Promise<void>
  updateCoachScorecard(actorId: string, coachId: string, cohortId: string, freq: number, quality: number, rating: number, certified: boolean, until: string | null): Promise<void>
  createMarketplaceRole(actorId: string, input: MarketplaceRoleInput): Promise<string>
  updateInterest(actorId: string, interestId: string, status: 'shortlisted' | 'declined' | 'expressed'): Promise<void>
  recordIntegrationRun(actorId: string, run: { system: IntegrationSystem; direction: 'outbound' | 'inbound'; status: 'succeeded' | 'failed'; records: number; summary: string; payload: Record<string, unknown>[] }): Promise<string>

  /* Deck closure */
  setCohortBudget(actorId: string, cohortId: string, budgetThb: number): Promise<void>
  addCostLine(actorId: string, cohortId: string, category: CostCategory, description: string, amountThb: number): Promise<string>
  saveRoleBlueprint(actorId: string, input: { buId: string; roleTitle: string; level: string; operatingModelChange: string; responsibilities: string; headcount: number }): Promise<string>
  saveBlueprintPlan(actorId: string, blueprintId: string, generated: BlueprintPlan, model: string): Promise<void>
  adoptBlueprint(actorId: string, blueprintId: string): Promise<number>
  setEmploymentStatus(actorId: string, personaId: string, status: 'active' | 'left', leftAt: string | null): Promise<void>
  markInterestPlaced(actorId: string, interestId: string): Promise<void>
  packageCaseAsModule(actorId: string, contractId: string, input: { title: string; skillCode: string; durationMin: number; body: { whatChanged: string; howToRepeat: string[]; provenResult: string } }): Promise<string>
  decidePolicyItem(actorId: string, itemId: string, status: PolicyStatus, effectiveFrom: string | null, resolutionRef: string, note: string): Promise<void>
  /** Writes or re-sequences a learning path. enrollmentId null = the org-wide personal path. */
  inviteToRole(actorId: string, roleId: string, personaId: string, note: string): Promise<void>
  respondToInvite(actorId: string, interestId: string, accept: boolean): Promise<void>
  saveLearningPath(actorId: string, enrollmentId: string | null, plan: { moduleId: string; reason: string }[], reason: string): Promise<number>
  submitBaselineAssessment(actorId: string, responses: AssessmentResponses): Promise<string>
  completeBaselineDiagnostic(actorId: string, result: DiagnosticResult): Promise<void>
  submitGatePack(actorId: string, gateId: string, summary: string, evidence: GateEvidence | null, businessCase: GateBusinessCase | null, attachments: GateAttachment[]): Promise<void>
  createPod(actorId: string, cohortId: string, name: string, coachId: string | null): Promise<string>
  assignPod(actorId: string, enrollmentId: string, podId: string | null): Promise<void>
  savePracticeSession(actorId: string, session: { scenario: string; transcript: PracticeSession['transcript']; scores: PracticeSession['scores']; overall: number | null; model: string }): Promise<string>
  saveTalentReview(actorId: string, personaId: string, cycle: string, content: TalentReview['content'], model: string): Promise<string>
  addSuccessionEntry(actorId: string, personaId: string, pool: SuccessionPool, basis: string, dueBy: string | null): Promise<string>
  fulfilSuccession(actorId: string, entryId: string): Promise<void>
  addRecognition(actorId: string, personaId: string, kind: RecognitionKind, note: string): Promise<string>
  recordGovernanceReview(actorId: string, area: 'taxonomy' | 'critical_skills' | 'capability_agenda', cycle: string, note: string, itemsReviewed: number, nextDue: string | null): Promise<string>
  recordAlignment(actorId: string, conceptId: string, note: string): Promise<void>
  setMilestoneStatus(actorId: string, milestoneId: string, status: MilestoneStatus, note: string): Promise<void>
  sendNudges(actorId: string): Promise<number>

  resetDemo(): Promise<void>
}
