import type { FixtureBundle } from '@/data/fixtures'
import type { ChallengeBriefInput, ImpactContractInput, GateDecision, AssessmentResponses, DiagnosticResult, GuidanceKind, GapDecision } from '@/domain/types'

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

  resetDemo(): Promise<void>
}
