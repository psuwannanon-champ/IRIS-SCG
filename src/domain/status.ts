import type { Tone } from '@/components/ui'
import type { ContractStatus, BriefStatus, ConceptStage, LedgerStatus, GateDecision, VerificationTier, EnrollmentStatus } from '@/domain/types'

export const contractTone: Record<ContractStatus, Tone> = {
  draft: 'neutral', manager_review: 'info', sponsor_review: 'info', active: 'accent', mid_gate_review: 'warning', showcase_review: 'warning',
  validated: 'success', returned: 'error', withdrawn: 'neutral', reset: 'error',
}
export const briefTone: Record<BriefStatus, Tone> = { draft: 'neutral', committee_review: 'info', approved: 'success', returned: 'error', rejected: 'error', assigned: 'accent', withdrawn: 'neutral' }
export const stageTone: Record<ConceptStage, Tone> = { frame: 'neutral', build: 'info', validate: 'info', gate1: 'warning', build_case: 'accent', gate2: 'warning', incubating: 'accent', gate3: 'warning', scaled: 'success', pivot: 'warning', stopped: 'error' }
export const ledgerTone: Record<LedgerStatus, Tone> = { pending_validation: 'warning', validated: 'success', rejected: 'error', audited: 'accent' }
export const gateTone: Record<GateDecision, Tone> = { pending: 'neutral', go: 'success', pivot: 'warning', stop: 'error', invest: 'success', small_scale: 'success', scale: 'success', hold: 'warning' }
export const tierTone: Record<VerificationTier, Tone> = { self_declared: 'neutral', ai_inferred: 'info', outcome_verified: 'success' }
export const enrollmentTone: Record<EnrollmentStatus, Tone> = { invited: 'neutral', diagnosed: 'info', in_labs: 'info', in_sprint: 'accent', showcase: 'warning', graduated: 'success', withdrawn: 'neutral' }
export const ENROLLMENT_LABEL: Record<EnrollmentStatus, string> = { invited: 'Invited', diagnosed: 'Diagnosed', in_labs: 'In labs', in_sprint: 'In sprint', showcase: 'Showcase', graduated: 'Graduated', withdrawn: 'Withdrawn' }
/** Who holds the next action for a contract status. */
export const contractResponsible: Record<ContractStatus, string> = {
  draft: 'Learner', manager_review: 'Line manager', sponsor_review: 'BU sponsor', active: 'Learner', mid_gate_review: 'Line manager / sponsor', showcase_review: 'BU sponsor',
  validated: 'Completed', returned: 'Learner', withdrawn: 'Closed', reset: 'Learner with manager',
}
export const briefResponsible: Record<BriefStatus, string> = { draft: 'BU sponsor', committee_review: 'Committee', approved: 'Program office', returned: 'BU sponsor', rejected: 'Closed', assigned: 'Cohort team', withdrawn: 'Closed' }
