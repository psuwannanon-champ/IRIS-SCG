import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Snapshot, DataSource, ContractAction, ContractActionPayload, BriefAction, BriefActionPayload, EvidenceInput } from '@/data/datasource'
import { DomainError } from '@/data/datasource'
import type { ChallengeBriefInput, ImpactContractInput, GateDecision, AssessmentResponses, DiagnosticResult, GuidanceKind, GapDecision } from '@/domain/types'
import { simulatedCoachReply } from '@/data/local'

const TABLES: Record<keyof Snapshot, string> = {
  businessUnits: 'business_units', personas: 'personas', skillDomains: 'skill_domains', skills: 'skills', learningModules: 'learning_modules',
  cohorts: 'cohorts', enrollments: 'enrollments', diagnostics: 'diagnostics', diagnosticItems: 'diagnostic_items', learningPlanItems: 'learning_plan_items',
  impactContracts: 'impact_contracts', sprintEvidence: 'sprint_evidence', challengeThemes: 'challenge_themes', challengeBriefs: 'challenge_briefs', teams: 'teams',
  concepts: 'concepts', gateReviews: 'gate_reviews', coachingClinics: 'coaching_clinics', coachingNotes: 'coaching_notes', coachScorecards: 'coach_scorecards',
  passportEntries: 'passport_entries', ledgerEntries: 'ledger_entries', marketplaceRoles: 'marketplace_roles', marketplaceInterests: 'marketplace_interests',
  notifications: 'notifications', coachMessages: 'coach_messages', recordEvents: 'record_events', assessments: 'assessments', guidanceNotes: 'guidance_notes', capabilityGaps: 'capability_gaps',
}

export const toSnake = (s: string) => s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
export const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())

function camelRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v
  return out as T
}
function deepSnake(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(deepSnake)
  if (v && typeof v === 'object') { const out: Record<string, unknown> = {}; for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[toSnake(k)] = deepSnake(x); return out }
  return v
}
function snakeObj(obj: object) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) out[toSnake(k)] = v
  return out
}

export function createSupabase(url: string, key: string): SupabaseClient {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export class SupabaseDataSource implements DataSource {
  readonly mode = 'supabase' as const
  constructor(private client: SupabaseClient) {}

  /** Cheap reachability probe: does the schema exist? */
  async probe(): Promise<boolean> {
    const { error } = await this.client.from('personas').select('id').limit(1)
    return !error
  }

  async loadSnapshot(): Promise<Snapshot> {
    const entries = await Promise.all(
      (Object.keys(TABLES) as (keyof Snapshot)[]).map(async (key) => {
        const { data, error } = await this.client.from(TABLES[key]).select('*').order('id')
        if (error) throw new Error(`Could not load ${TABLES[key]}: ${error.message}`)
        return [key, (data ?? []).map((r) => camelRow(r as Record<string, unknown>))] as const
      }),
    )
    return Object.fromEntries(entries) as unknown as Snapshot
  }

  private async rpc<T = void>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.client.rpc(fn, args)
    if (error) {
      // Business-rule errors are raised with ERRCODE P0001 (raise exception) in the SQL functions.
      throw new DomainError(error.message || 'The action could not be completed.')
    }
    return data as T
  }

  saveContract(actorId: string, input: ImpactContractInput & { id?: string }) {
    return this.rpc<string>('save_impact_contract', { p_actor: actorId, p_input: snakeObj(input) })
  }
  transitionContract(actorId: string, contractId: string, action: ContractAction, payload: ContractActionPayload = {}) {
    return this.rpc('transition_impact_contract', { p_actor: actorId, p_contract: contractId, p_action: action, p_payload: snakeObj(payload) })
  }
  addEvidence(actorId: string, contractId: string, input: EvidenceInput) {
    return this.rpc('add_sprint_evidence', { p_actor: actorId, p_contract: contractId, p_input: snakeObj(input) })
  }
  saveBrief(actorId: string, input: ChallengeBriefInput & { id?: string }) {
    return this.rpc<string>('save_challenge_brief', { p_actor: actorId, p_input: snakeObj(input) })
  }
  transitionBrief(actorId: string, briefId: string, action: BriefAction, payload: BriefActionPayload = {}) {
    return this.rpc('transition_challenge_brief', { p_actor: actorId, p_brief: briefId, p_action: action, p_payload: snakeObj(payload) })
  }
  submitGateEvidence(actorId: string, gateId: string, evidenceSummary: string) {
    return this.rpc('submit_gate_evidence', { p_actor: actorId, p_gate: gateId, p_summary: evidenceSummary })
  }
  decideGate(actorId: string, gateId: string, decision: GateDecision, note: string, validatedValueThb: number | null) {
    return this.rpc('decide_gate', { p_actor: actorId, p_gate: gateId, p_decision: decision, p_note: note, p_value: validatedValueThb })
  }
  reviewLedgerEntry(actorId: string, entryId: string, decision: 'validate' | 'reject' | 'audit', validatedValueThb: number | null, note: string | null) {
    return this.rpc('review_ledger_entry', { p_actor: actorId, p_entry: entryId, p_decision: decision, p_value: validatedValueThb, p_note: note })
  }
  updateLearningItem(actorId: string, itemId: string, status: 'planned' | 'in_progress' | 'completed' | 'skipped') {
    return this.rpc('update_learning_item', { p_actor: actorId, p_item: itemId, p_status: status })
  }
  runDiagnostic(actorId: string, enrollmentId: string) {
    return this.rpc('run_diagnostic', { p_actor: actorId, p_enrollment: enrollmentId })
  }
  markClinicBriefingReady(actorId: string, clinicId: string) {
    return this.rpc('mark_clinic_briefing_ready', { p_actor: actorId, p_clinic: clinicId })
  }
  addCoachingNote(actorId: string, enrollmentId: string, note: string, clinicId: string | null) {
    return this.rpc('add_coaching_note', { p_actor: actorId, p_enrollment: enrollmentId, p_note: note, p_clinic: clinicId })
  }
  expressInterest(actorId: string, roleId: string) {
    return this.rpc('express_interest', { p_actor: actorId, p_role: roleId })
  }
  markNotificationRead(actorId: string, notificationId: string) {
    return this.rpc('mark_notification_read', { p_actor: actorId, p_notification: notificationId })
  }
  async sendCoachMessage(actorId: string, content: string, lang: 'th' | 'en') {
    // The AI coach is simulated in the prototype; the reply is generated from a fixed, program-grounded script.
    const reply = simulatedCoachReply(content, lang)
    await this.rpc('append_coach_messages', { p_actor: actorId, p_content: content, p_lang: lang, p_reply: reply.content, p_module: reply.moduleId })
  }
  appendCoachExchange(actorId: string, content: string, lang: 'th' | 'en', reply: string, citedModuleId: string | null) {
    return this.rpc('append_coach_messages', { p_actor: actorId, p_content: content, p_lang: lang, p_reply: reply, p_module: citedModuleId })
  }
  submitAssessment(actorId: string, enrollmentId: string, responses: AssessmentResponses) {
    return this.rpc<string>('submit_assessment', { p_actor: actorId, p_enrollment: enrollmentId, p_responses: responses })
  }
  completeDiagnostic(actorId: string, enrollmentId: string, result: DiagnosticResult) {
    return this.rpc('complete_diagnostic', { p_actor: actorId, p_enrollment: enrollmentId, p_result: deepSnake(result) })
  }
  saveGuidance(actorId: string, personaId: string, kind: GuidanceKind, contextId: string | null, content: unknown, model: string) {
    return this.rpc<string>('save_guidance', { p_actor: actorId, p_persona: personaId, p_kind: kind, p_context: contextId, p_content: content, p_model: model })
  }
  setGapDecision(actorId: string, gapId: string, decision: GapDecision, funded: boolean) {
    return this.rpc('set_gap_decision', { p_actor: actorId, p_gap: gapId, p_decision: decision, p_funded: funded })
  }
  resetDemo() {
    return this.rpc('reset_demo', {})
  }
}
