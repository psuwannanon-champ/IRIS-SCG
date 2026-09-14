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
  employmentStatus: 'active' | 'left'
  leftAt: string | null
  leaderCohort: boolean
  kpis: string | null
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
  budgetThb: number | null
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
  podId: string | null
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
  origin: 'catalogue' | 'success_case'
  sourceContractId: string | null
  buId: string | null
  body: { whatChanged: string; howToRepeat: string[]; provenResult: string } | null
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
  alignmentNote: string | null
  alignedBy: string | null
  alignedAt: string | null
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
  evidence: GateEvidence | null
  businessCase: GateBusinessCase | null
  attachments: GateAttachment[]
}

export interface GateEvidence { customerInterviews: number | null; validatedNeeds: string; prototype: string; risks: string }
export interface GateBusinessCase { pricing: string; paybackMonths: number | null; baseCaseThb: number | null; bestCaseThb: number | null; worstCaseThb: number | null; ask: string }
export interface GateAttachment { name: string; kind: 'pre_read' | 'recorded_pitch' | 'evidence_pack' | 'model' | 'other'; note: string }

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
  status: 'expressed' | 'shortlisted' | 'declined' | 'placed'
  placedAt: string | null
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

/* ---------- Assessment and Expert Guidance ---------- */
export interface AssessmentResponses {
  selfRatings: Record<string, number | null> // skillId -> 1..4, null = not sure
  knowledge: Record<string, number> // questionId -> chosen option index
  roleFocus: string
  currentInitiatives: string
  biggestChallenge: string
  preferredFormat: 'micro_video' | 'reading' | 'exercise' | 'simulation' | 'mixed'
}
export interface Assessment {
  id: string
  enrollmentId: string
  personaId: string
  responses: AssessmentResponses
  submittedAt: string
}
export type GuidanceKind = 'diagnostic' | 'journey' | 'contract' | 'coach' | 'clinic_briefing' | 'performance' | 'role_blueprint' | 'practice' | 'talent_review'
export interface GuidanceNote {
  id: string
  personaId: string
  kind: GuidanceKind
  contextId: string | null
  content: unknown
  model: string
  createdBy: string | null
  createdAt: string
}
export interface DiagnosticResult {
  summary: string
  items: { skillId: string; currentLevel: number; targetLevel: number; priorityRank: number | null; evidenceSource: EvidenceSource | null; rationale: string }[]
  plan: { moduleId: string; reason: string }[]
  skipped: { moduleId: string; reason: string }[]
}

/* ---------- Value-led capability agenda ---------- */
export type GapDecision = 'undecided' | 'build' | 'buy' | 'borrow' | 'bot'
export const GAP_DECISION_LABEL: Record<GapDecision, string> = { undecided: 'Not decided', build: 'Build (develop internally)', buy: 'Buy (hire)', borrow: 'Borrow (partner or contractor)', bot: 'Bot (automate)' }
export interface CapabilityGap {
  id: string
  buId: string
  valuePool: string
  criticalRole: string
  skillId: string
  futureSkillNote: string
  supplyFte: number
  demandFte: number
  thbValueAtRisk: number
  decision: GapDecision
  funded: boolean
  decidedById: string | null
  decidedAt: string | null
}

/* ---------- Labs ---------- */
export interface LabAttendance { id: string; enrollmentId: string; labDay: number; attendedAt: string; reflection: string | null }
export interface MarketplaceRoleInput { title: string; buId: string; kind: 'role' | 'project' | 'gig'; description: string; openUntil: string; requirements: { skillId: string; minLevel: number }[] }

/* ---------- Integrations (simulated connectors) ---------- */
export type IntegrationSystem = 'hr_core' | 'payroll_rewards' | 'notifications' | 'finance_actuals' | 'start_the_dot'
export interface IntegrationRun {
  id: string
  system: IntegrationSystem
  direction: 'outbound' | 'inbound'
  status: 'succeeded' | 'failed'
  records: number
  summary: string
  payload: Record<string, unknown>[]
  triggeredBy: string | null
  startedAt: string
  finishedAt: string
}

/* ---------- Deck closure records ---------- */
export type CostCategory = 'design' | 'delivery' | 'coaching' | 'platform' | 'travel' | 'other'
export const COST_CATEGORY_LABEL: Record<CostCategory, string> = { design: 'Design and content', delivery: 'Delivery (labs, facilitation)', coaching: 'Coaching', platform: 'AI platform and licences', travel: 'Travel and venue', other: 'Other' }
export interface CostLine { id: string; cohortId: string; category: CostCategory; description: string; amountThb: number; recordedBy: string | null; recordedAt: string }

export interface BlueprintSkill { skillCode: string; targetLevel: number; why: string; supplyFte: number; demandFte: number; thbValueAtRisk: number; decision: 'build' | 'buy' | 'borrow' | 'bot' }
export interface BlueprintPlan { valuePool: string; summary: string; skills: BlueprintSkill[]; cohortPlan: { program: 'ABC' | 'BCD'; seats: number; startQuarter: string; rationale: string }; risks: string[] }
export interface RoleBlueprint { id: string; buId: string; roleTitle: string; level: string; operatingModelChange: string; responsibilities: string; headcount: number; status: 'draft' | 'generated' | 'adopted'; generated: BlueprintPlan | null; model: string | null; createdBy: string | null; createdAt: string; adoptedAt: string | null }

export type PolicyStatus = 'drafted' | 'submitted' | 'approved' | 'deferred'
export const POLICY_STATUS_LABEL: Record<PolicyStatus, string> = { drafted: 'Drafted', submitted: 'With People Committee', approved: 'Approved', deferred: 'Deferred' }
export interface PolicyItem { id: string; name: string; description: string; status: PolicyStatus; effectiveFrom: string | null; resolutionRef: string | null; owner: string; decidedBy: string | null; decidedAt: string | null; note: string | null }

export interface Pod { id: string; cohortId: string; name: string; coachId: string | null }
export interface PracticeSession { id: string; personaId: string; scenario: string; transcript: { role: 'learner' | 'partner'; text: string }[]; scores: { criterion: string; score: number; comment: string }[] | null; overall: number | null; model: string | null; createdAt: string }
export interface TalentReview { id: string; personaId: string; cycle: string; content: { headline: string; evidence: string[]; strengths: string[]; development: string[]; recommendation: string }; model: string | null; createdBy: string | null; createdAt: string }
export type SuccessionPool = 'L2' | 'L3' | 'incubation_lead'
export const POOL_LABEL: Record<SuccessionPool, string> = { L2: 'L2 succession pool', L3: 'L3 succession pool', incubation_lead: 'Incubation leadership' }
export interface SuccessionEntry { id: string; personaId: string; pool: SuccessionPool; basis: string; enteredBy: string | null; enteredAt: string; dueBy: string | null; fulfilledAt: string | null }
export type RecognitionKind = 'ceo_showcase' | 'gate2' | 'impact_award' | 'skill_premium'
export const RECOGNITION_LABEL: Record<RecognitionKind, string> = { ceo_showcase: 'CEO recognition at showcase', gate2: 'CEO recognition at Gate 2', impact_award: 'Impact recognition award', skill_premium: 'Skill premium considered' }
export interface Recognition { id: string; personaId: string; kind: RecognitionKind; note: string; givenBy: string | null; givenAt: string }
export interface GovernanceReview { id: string; area: 'taxonomy' | 'critical_skills' | 'capability_agenda'; cycle: string; note: string; itemsReviewed: number; reviewedBy: string | null; reviewedAt: string; nextDue: string | null }
export type MilestoneStatus = 'not_started' | 'on_track' | 'at_risk' | 'done'
export const MILESTONE_LABEL: Record<MilestoneStatus, string> = { not_started: 'Not started', on_track: 'On track', at_risk: 'At risk', done: 'Done' }
export interface PlanMilestone { id: string; subPlan: string; milestone: string; owner: string; dueQuarter: string; status: MilestoneStatus; note: string | null; updatedBy: string | null; updatedAt: string }
