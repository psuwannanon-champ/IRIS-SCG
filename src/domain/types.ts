// Domain model for the SCG Capability Suite prototype.
// All records are fictional demo data unless stated otherwise.

export type Role =
  | 'learner'
  | 'line_manager'
  | 'bu_sponsor'
  | 'coach'
  | 'committee'
  | 'program_office'

export const ROLE_LABEL: Record<Role, string> = {
  learner: 'Learner',
  line_manager: 'Line manager',
  bu_sponsor: 'BU sponsor',
  coach: 'Certified coach',
  committee: 'Capability Investment Committee',
  program_office: 'Program office (CHR)',
}

export type FunctionType = 'business' | 'enabling'

export interface BusinessUnit {
  id: string
  code: string
  name: string
  kind: 'turnaround' | 'shared_service' | 'business'
  strategyOnboarded: boolean
  platformOnboarded: boolean
}

export interface Persona {
  id: string
  code: string
  fullName: string
  email: string
  role: Role
  buId: string
  functionType: FunctionType
  jobTitle: string
  level: string // L1..L5
  managerId: string | null
  initials: string
  careerAspiration: string | null
}

export interface SkillDomain {
  id: string
  code: string
  name: string
  program: 'ABC' | 'BCD'
  description: string
}

export interface Skill {
  id: string
  domainId: string
  code: string
  name: string
  description: string
  levelDescriptors: [string, string, string, string]
  critical: boolean
  premiumEligible: boolean
}

export type Program = 'ABC' | 'BCD'

export type CohortStatus =
  | 'planned'
  | 'diagnosing'
  | 'labs'
  | 'sprint'
  | 'showcase'
  | 'completed'
  // BCD stages
  | 'framing'
  | 'building'
  | 'validating'
  | 'building_case'
  | 'scale_up'

export interface Cohort {
  id: string
  program: Program
  code: string
  name: string
  buId: string | null
  status: CohortStatus
  startDate: string
  endDate: string
  keyDates: { label: string; date: string }[]
  pipelineTargetThb: number | null
  seats: number
}

export type EnrollmentStatus =
  | 'invited'
  | 'diagnosed'
  | 'in_labs'
  | 'in_sprint'
  | 'showcase'
  | 'graduated'
  | 'withdrawn'

export interface Enrollment {
  id: string
  cohortId: string
  personaId: string
  status: EnrollmentStatus
  teamId: string | null
  coachId: string | null
  sponsorId: string | null
  managerId: string | null
  impactRating: 'exceptional' | 'strong' | 'on_track' | 'needs_support' | null
  topDecile: boolean
  fastTrackBcd: boolean
}

export type EvidenceSource = 'self_declared' | 'ai_inferred' | 'knowledge_test' | 'manager_input'

export interface Diagnostic {
  id: string
  enrollmentId: string
  completedAt: string | null
  summary: string | null
  status: 'pending' | 'completed'
}

export interface DiagnosticItem {
  id: string
  diagnosticId: string
  skillId: string
  currentLevel: number // 0 = not assessed
  targetLevel: number
  priorityRank: number | null
  evidenceSource: EvidenceSource | null
  rationale: string | null
}

export interface LearningModule {
  id: string
  skillId: string
  code: string
  title: string
  durationMin: number
  format: 'micro_video' | 'reading' | 'exercise' | 'simulation'
  variant: string | null // e.g. "B2B external customer"
}

export interface LearningPlanItem {
  id: string
  enrollmentId: string
  moduleId: string
  sequence: number
  status: 'planned' | 'in_progress' | 'completed' | 'skipped'
  reason: string | null
}

export type ObjectiveType =
  | 'revenue_uplift'
  | 'margin'
  | 'share_of_wallet'
  | 'cost_to_serve'
  | 'sla_turnaround'
  | 'productivity_per_fte'

export const OBJECTIVE_LABEL: Record<ObjectiveType, string> = {
  revenue_uplift: 'Revenue uplift',
  margin: 'Margin improvement',
  share_of_wallet: 'Share of wallet',
  cost_to_serve: 'Cost-to-serve reduction',
  sla_turnaround: 'SLA / turnaround time',
  productivity_per_fte: 'Productivity per FTE',
}

export type ContractStatus =
  | 'draft'
  | 'manager_review'
  | 'sponsor_review'
  | 'active'
  | 'mid_gate_review'
  | 'showcase_review'
  | 'validated'
  | 'returned'
  | 'withdrawn'
  | 'reset'

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  draft: 'Draft',
  manager_review: 'Waiting for manager',
  sponsor_review: 'Waiting for sponsor',
  active: 'Sprint active',
  mid_gate_review: 'Mid-sprint gate',
  showcase_review: 'Showcase review',
  validated: 'Impact validated',
  returned: 'Returned for changes',
  withdrawn: 'Withdrawn',
  reset: 'Reset',
}

export interface ImpactContract {
  id: string
  enrollmentId: string
  learnerId: string
  managerId: string
  sponsorId: string
  title: string
  objectiveType: ObjectiveType
  description: string
  baselineValue: number | null
  targetValue: number | null
  unit: string | null
  targetThb: number | null
  toolsApplied: string | null
  status: ContractStatus
  returnReason: string | null
  midGateDecision: 'scale' | 'pivot' | 'reset' | null
  midGateNote: string | null
  showcaseSummary: string | null
  validatedValueThb: number | null
  validatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SprintEvidence {
  id: string
  contractId: string
  weekNo: number
  title: string
  note: string
  metricValue: number | null
  createdBy: string
  createdAt: string
}

export interface RecordEvent {
  id: string
  recordType: 'impact_contract' | 'challenge_brief' | 'concept' | 'ledger_entry'
  recordId: string
  actorId: string | null
  action: string
  fromStatus: string | null
  toStatus: string | null
  note: string | null
  createdAt: string
}

export interface ChallengeTheme {
  id: string
  buId: string
  title: string
  description: string
  setById: string
  year: number
}

export type ChallengeType = 'growth' | 'cost' | 'service' | 'productivity'
export const CHALLENGE_TYPE_LABEL: Record<ChallengeType, string> = {
  growth: 'Growth',
  cost: 'Cost',
  service: 'Service',
  productivity: 'Productivity',
}

export type BriefStatus =
  | 'draft'
  | 'committee_review'
  | 'approved'
  | 'returned'
  | 'rejected'
  | 'assigned'
  | 'withdrawn'

export const BRIEF_STATUS_LABEL: Record<BriefStatus, string> = {
  draft: 'Draft',
  committee_review: 'Committee review',
  approved: 'Approved',
  returned: 'Returned for changes',
  rejected: 'Rejected',
  assigned: 'Assigned to cohort',
  withdrawn: 'Withdrawn',
}

export interface ChallengeBrief {
  id: string
  themeId: string | null
  buId: string
  sponsorId: string
  title: string
  challengeType: ChallengeType
  problemStatement: string
  successMetric: string
  targetValueThb: number | null
  constraints: string | null
  status: BriefStatus
  cohortId: string | null
  committeeNote: string | null
  reviewedById: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: string
  cohortId: string
  name: string
  briefId: string | null
  coachId: string | null
}

export type ConceptStage =
  | 'frame'
  | 'build'
  | 'validate'
  | 'gate1'
  | 'build_case'
  | 'gate2'
  | 'incubating'
  | 'gate3'
  | 'scaled'
  | 'pivot'
  | 'stopped'

export const CONCEPT_STAGE_LABEL: Record<ConceptStage, string> = {
  frame: 'Stage 1 · Frame',
  build: 'Stage 2 · Build',
  validate: 'Stage 3 · Validate',
  gate1: 'Gate 1 · Proof of concept',
  build_case: 'Stage 4 · Build the case',
  gate2: 'Gate 2 · Investment pitch',
  incubating: 'Incubating',
  gate3: 'Gate 3 · Scale-up',
  scaled: 'Scaled',
  pivot: 'Pivoting',
  stopped: 'Stopped',
}

export interface Concept {
  id: string
  teamId: string
  briefId: string
  cohortId: string
  title: string
  summary: string
  stage: ConceptStage
  pipelineValueThb: number | null
  validatedValueThb: number | null
  scaleRoute: 'start_the_dot' | 'internal_high_impact' | null
  createdAt: string
  updatedAt: string
}

export type GateDecision =
  | 'pending'
  | 'go'
  | 'pivot'
  | 'stop'
  | 'invest'
  | 'small_scale'
  | 'scale'
  | 'hold'

export const GATE_DECISION_LABEL: Record<GateDecision, string> = {
  pending: 'Pending',
  go: 'Go',
  pivot: 'Pivot',
  stop: 'Stop',
  invest: 'Invest',
  small_scale: 'Small-scale implementation',
  scale: 'Scale up',
  hold: 'Hold',
}

export interface GateReview {
  id: string
  conceptId: string
  gateNo: 1 | 2 | 3
  scheduledDate: string
  evidenceSummary: string | null
  submittedAt: string | null
  decision: GateDecision
  decidedById: string | null
  decidedAt: string | null
  note: string | null
  validatedValueThb: number | null
}

export interface CoachingClinic {
  id: string
  cohortId: string
  clinicNo: number
  scheduledAt: string
  coachId: string
  topics: string
  briefingReady: boolean
}

export interface CoachingNote {
  id: string
  enrollmentId: string
  coachId: string
  clinicId: string | null
  note: string
  aiFlag: string | null
  createdAt: string
}

export interface CoachScorecard {
  id: string
  coachId: string
  cohortId: string
  feedbackFrequency: number // per learner per sprint
  feedbackQuality: number // 1-5
  learnerRating: number // 1-5
  certified: boolean
  certifiedUntil: string | null
}

export type VerificationTier = 'self_declared' | 'ai_inferred' | 'outcome_verified'
export const TIER_LABEL: Record<VerificationTier, string> = {
  self_declared: 'Self-declared',
  ai_inferred: 'AI-inferred',
  outcome_verified: 'Outcome-verified',
}

export interface PassportEntry {
  id: string
  personaId: string
  skillId: string
  level: number
  tier: VerificationTier
  sourceType: 'diagnostic' | 'showcase' | 'gate' | 'manager'
  sourceId: string | null
  badgeCode: string | null
  mintedAt: string
}

export type LedgerStatus = 'pending_validation' | 'validated' | 'rejected' | 'audited'
export const LEDGER_STATUS_LABEL: Record<LedgerStatus, string> = {
  pending_validation: 'Pending sponsor validation',
  validated: 'Validated',
  rejected: 'Rejected',
  audited: 'Audited',
}

export interface LedgerEntry {
  id: string
  personaId: string
  buId: string
  sourceType: 'impact_contract' | 'concept'
  sourceId: string
  title: string
  objectiveType: ObjectiveType | null
  claimedValueThb: number
  validatedValueThb: number | null
  sponsorId: string
  status: LedgerStatus
  validatedAt: string | null
  trackingUntil: string
  auditNote: string | null
  createdAt: string
}

export interface MarketplaceRole {
  id: string
  title: string
  buId: string
  kind: 'role' | 'project' | 'gig'
  description: string
  openUntil: string
  ownerId: string
  requirements: { skillId: string; minLevel: number }[]
}

export interface MarketplaceInterest {
  id: string
  roleId: string
  personaId: string
  createdAt: string
  status: 'expressed' | 'shortlisted' | 'declined'
}

export interface Notification {
  id: string
  personaId: string
  kind: 'update'
  title: string
  body: string
  link: string | null
  readAt: string | null
  createdAt: string
}

export interface CoachMessage {
  id: string
  personaId: string
  sender: 'user' | 'coach'
  lang: 'th' | 'en'
  content: string
  citedModuleId: string | null
  createdAt: string
}

export interface Task {
  key: string
  recordType: 'impact_contract' | 'challenge_brief' | 'gate_review' | 'ledger_entry' | 'diagnostic' | 'learning_plan' | 'sprint_evidence' | 'coaching'
  recordId: string
  title: string
  nextAction: string
  responsibleRole: Role
  status: string
  dueDate: string | null
  link: string
  urgency: 'overdue' | 'due_soon' | 'normal'
}

export interface ImpactContractInput {
  enrollmentId: string
  title: string
  objectiveType: ObjectiveType
  description: string
  baselineValue: number | null
  targetValue: number | null
  unit: string | null
  targetThb: number | null
  toolsApplied: string | null
}

export interface ChallengeBriefInput {
  themeId: string | null
  buId: string
  title: string
  challengeType: ChallengeType
  problemStatement: string
  successMetric: string
  targetValueThb: number | null
  constraints: string | null
}
