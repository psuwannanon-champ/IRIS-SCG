// FICTIONAL DEMO DATA for the SCG Capability Suite prototype.
// Names, numbers and outcomes are invented for walkthrough purposes.
import type {
  Assessment, GuidanceNote, CapabilityGap, LabAttendance, IntegrationRun,
  CostLine, RoleBlueprint, PolicyItem, Pod, PracticeSession, TalentReview, SuccessionEntry, Recognition, GovernanceReview, PlanMilestone,
  BusinessUnit, Persona, SkillDomain, Skill, Cohort, Enrollment, Diagnostic, DiagnosticItem,
  LearningModule, LearningPlanItem, ImpactContract, SprintEvidence, RecordEvent, ChallengeTheme,
  ChallengeBrief, Team, Concept, GateReview, CoachingClinic, CoachingNote, CoachScorecard,
  PassportEntry, LedgerEntry, MarketplaceRole, MarketplaceInterest, Notification, CoachMessage,
} from '@/domain/types'

export const DEMO_TODAY = '2026-09-14'
const d = (s: string) => `${s}T09:00:00+07:00`

export const businessUnits: BusinessUnit[] = [
  { id: 'bu-cbm', code: 'CBM', name: 'Cement & Building Materials (turnaround)', kind: 'turnaround', strategyOnboarded: true, platformOnboarded: true },
  { id: 'bu-cafi', code: 'CAFI', name: 'CAFI Shared Services', kind: 'shared_service', strategyOnboarded: true, platformOnboarded: true },
  { id: 'bu-scgp', code: 'SCGP', name: 'SCG Packaging', kind: 'business', strategyOnboarded: true, platformOnboarded: false },
  { id: 'bu-scgc', code: 'SCGC', name: 'SCG Chemicals', kind: 'business', strategyOnboarded: false, platformOnboarded: false },
  { id: 'bu-corp', code: 'CORP', name: 'Corporate HR (CHR)', kind: 'shared_service', strategyOnboarded: true, platformOnboarded: true },
]

const P = (
  id: string, fullName: string, role: Persona['role'], buId: string, functionType: Persona['functionType'],
  jobTitle: string, level: string, managerId: string | null, careerAspiration: string | null = null,
  leader = false, kpis: string | null = null,
): Persona => ({
  id, code: id.replace('per-', ''), fullName,
  email: `${id.replace('per-', '')}@demo.scg-capability.example`, role, buId, functionType, jobTitle, level, managerId,
  initials: fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), careerAspiration,
  employmentStatus: 'active', leftAt: null, leaderCohort: leader, kpis,
})

export const personas: Persona[] = [
  // Learners
  P('per-nara', 'Nara Wongsuwan', 'learner', 'bu-cbm', 'business', 'Regional Sales Lead, Building Materials Distribution', 'L3', 'per-kittipong', 'Lead a regional commercial team and own dealer P&L', false, 'Share of wallet on top 40 dealers; revenue per dealer; days sales outstanding'),
  P('per-tanawat', 'Tanawat Srisuk', 'learner', 'bu-cbm', 'business', 'Plant Operations Supervisor, Saraburi', 'L3', 'per-somsak', 'Plant manager within three years', false, 'Unplanned stop hours; cost per tonne; safety incidents'),
  P('per-boonchu', 'Boonchu Rakdee', 'learner', 'bu-cbm', 'enabling', 'Logistics Planning Supervisor', 'L2', 'per-somsak', 'Move into supply-chain analytics'),
  P('per-arisa', 'Arisa Chaiyaporn', 'learner', 'bu-cbm', 'enabling', 'Procurement Supervisor', 'L3', 'per-somsak', 'Category lead for green materials'),
  P('per-jiraporn', 'Jiraporn Suksawat', 'learner', 'bu-cbm', 'enabling', 'Quality Assurance Supervisor', 'L2', 'per-somsak', null),
  P('per-pim', 'Pim Rattanakorn', 'learner', 'bu-cafi', 'enabling', 'Accounts Payable Supervisor', 'L2', 'per-ratree', 'Lead a finance automation squad', false, 'Invoices per FTE per week; touchless rate; exception ageing'),
  P('per-krit', 'Krit Boonmee', 'learner', 'bu-cafi', 'enabling', 'IT Service Desk Lead', 'L3', 'per-ratree', 'Service delivery manager'),
  P('per-nok', 'Nok Saengthong', 'learner', 'bu-cafi', 'enabling', 'Payroll Operations Supervisor', 'L2', 'per-ratree', null),
  P('per-warit', 'Warit Thongchai', 'learner', 'bu-cbm', 'business', 'Business Development Manager, Alternative Fuels', 'L4', 'per-prasert', 'Lead a new venture inside SCG', true, 'Alternative fuel substitution rate; new revenue from waste-to-value'),
  P('per-mali', 'Mali Phromma', 'learner', 'bu-cafi', 'enabling', 'Finance Systems Analyst', 'L3', 'per-ratree', 'Product owner for finance platforms'),
  P('per-wichai', 'Wichai Kongkaew', 'learner', 'bu-scgc', 'business', 'Incubation Lead, Solar Dealer Leasing', 'L4', 'per-prasert', 'Scale the venture to three markets'),
  // Line managers
  P('per-kittipong', 'Kittipong Jaidee', 'line_manager', 'bu-cbm', 'business', 'Sales Manager, Central Region', 'L4', 'per-prasert', null, true),
  P('per-somsak', 'Somsak Petchsri', 'line_manager', 'bu-cbm', 'business', 'Plant Manager, Saraburi', 'L4', 'per-prasert', null, true),
  P('per-ratree', 'Ratree Kaewkla', 'line_manager', 'bu-cafi', 'enabling', 'Head of Transaction Services', 'L4', 'per-wanida', null, true),
  // BU sponsors (also set BU themes as BU-head delegates in this prototype)
  P('per-prasert', 'Prasert Vong-anan', 'bu_sponsor', 'bu-cbm', 'business', 'Turnaround Sponsor, CBM', 'L5', null, null, true),
  P('per-wanida', 'Wanida Sukjai', 'bu_sponsor', 'bu-cafi', 'enabling', 'Head of Shared Services, CAFI', 'L5', null, null, true),
  P('per-suchada', 'Suchada Limpanont', 'bu_sponsor', 'bu-scgp', 'business', 'Commercial Director, SCGP', 'L5', null),
  // Coaches
  P('per-anong', 'Anong Thepsiri', 'coach', 'bu-corp', 'enabling', 'Certified Capability Coach', 'L4', 'per-supattra'),
  P('per-decha', 'Decha Rungroj', 'coach', 'bu-corp', 'enabling', 'Certified Capability Coach', 'L4', 'per-supattra'),
  // Committee
  P('per-chatchai', 'Chatchai Boonyarat', 'committee', 'bu-corp', 'business', 'Chair, Capability Investment Committee', 'L5', null),
  P('per-ploy', 'Ploy Nimman', 'committee', 'bu-corp', 'business', 'Member, Capability Investment Committee (Finance)', 'L5', null),
  // Program office
  P('per-supattra', 'Supattra Meesuk', 'program_office', 'bu-corp', 'enabling', 'Capability Development Lead, CHR', 'L4', null),
]

export const skillDomains: SkillDomain[] = [
  { id: 'dom-ai', code: 'AI', program: 'ABC', name: 'AI-augmented decision-making', description: 'Using GenAI copilots and analytics to make faster, better-evidenced decisions in own role.' },
  { id: 'dom-opex', code: 'OPEX', program: 'ABC', name: 'Data-driven OpEx improvement', description: 'Finding and delivering productivity, cost and quality improvements from own-function data.' },
  { id: 'dom-comm', code: 'COMM', program: 'ABC', name: 'Commercial & green acumen', description: 'Value-chain, partnership and Green / SVP / HVA economics including CBAM readiness.' },
  { id: 'dom-silo', code: 'SILO', program: 'ABC', name: 'Cross-silo leadership', description: 'Self-awareness, cross-functional collaboration and organisation design.' },
  { id: 'dom-cust', code: 'CUST', program: 'ABC', name: 'Customer-centric innovation', description: 'Designing improvements from internal or external customer needs, by BU and channel.' },
  { id: 'dom-chg', code: 'CHG', program: 'ABC', name: 'Change execution', description: 'Landing practical improvements in the flow of work and sustaining them.' },
  { id: 'dom-bb', code: 'BB', program: 'BCD', name: 'Business building & entrepreneurship', description: 'Framing, validating and building new concepts as investable businesses.' },
  { id: 'dom-fin', code: 'FIN', program: 'BCD', name: 'Commercial finance & investment casing', description: 'Business cases, pricing and best / worst case analysis for gate decisions.' },
  { id: 'dom-green', code: 'GRN', program: 'BCD', name: 'Customer-centric & green business design', description: 'Designing propositions around validated customer and sustainability needs.' },
  { id: 'dom-aistrat', code: 'AIS', program: 'BCD', name: 'AI-augmented strategy', description: 'Using AI to accelerate research, scenario design and strategic choices.' },
  { id: 'dom-exec', code: 'EXP', program: 'BCD', name: 'Executive presence & storytelling', description: 'Pitching evidence and asks clearly to executive committees.' },
  { id: 'dom-lead', code: 'LTC', program: 'BCD', name: 'Leading through change', description: 'Leading cross-BU teams through ambiguity and gate outcomes.' },
]

const S = (id: string, domainId: string, code: string, name: string, description: string, critical = true, premium = false): Skill => ({
  id, domainId, code, name, description, critical, premiumEligible: premium,
  levelDescriptors: [
    'Level 1 · Aware: understands concepts and vocabulary; applies with close guidance.',
    'Level 2 · Practising: applies the skill in routine situations in own role with occasional support.',
    'Level 3 · Proficient: applies independently in complex situations and coaches peers.',
    'Level 4 · Leading: sets standards, redesigns work around the skill and delivers measured impact.',
  ],
})

export const skills: Skill[] = [
  S('sk-genai', 'dom-ai', 'AI-01', 'GenAI copilot practice', 'Uses approved GenAI tools to draft, analyse and decide in daily work.', true, true),
  S('sk-decision', 'dom-ai', 'AI-02', 'Evidence-based decision making', 'Frames decisions, weighs evidence and records rationale.'),
  S('sk-datastory', 'dom-opex', 'OPEX-01', 'Data storytelling', 'Turns own-function data into a clear improvement narrative.'),
  S('sk-opex', 'dom-opex', 'OPEX-02', 'OpEx improvement methods', 'Applies lean / productivity methods to quantify and remove waste.', true, false),
  S('sk-valuechain', 'dom-comm', 'COMM-01', 'Value chain & partnership economics', 'Understands where value is created and captured across partners.'),
  S('sk-green', 'dom-comm', 'COMM-02', 'Green / CBAM economics', 'Quantifies Green / SVP / HVA options and CBAM exposure.', true, true),
  S('sk-selfaware', 'dom-silo', 'SILO-01', 'Self-awareness & feedback', 'Seeks and acts on feedback across functions.', false),
  S('sk-collab', 'dom-silo', 'SILO-02', 'Cross-functional collaboration', 'Aligns priorities and decisions across silos.'),
  S('sk-custneeds', 'dom-cust', 'CUST-01', 'Customer needs discovery', 'Elicits and validates internal or external customer needs.'),
  S('sk-b2bsales', 'dom-cust', 'CUST-02', 'AI-powered marketing & sales', 'Applies AI to segmentation, lead scoring and offer design.', true, true),
  S('sk-changeplan', 'dom-chg', 'CHG-01', 'Improvement planning & tracking', 'Defines baseline, target, owner and cadence for an improvement.'),
  S('sk-sustain', 'dom-chg', 'CHG-02', 'Sustaining change', 'Embeds new practice through standards, routines and metrics.', false),
  S('sk-bizbuild', 'dom-bb', 'BB-01', 'Business building', 'Moves a concept from problem framing to validated business model.', true, true),
  S('sk-invest', 'dom-fin', 'FIN-01', 'Investment casing', 'Builds pricing, cash-flow and best / worst case for a gate decision.', true, true),
  S('sk-greendesign', 'dom-green', 'GRN-01', 'Green proposition design', 'Designs customer propositions with measurable sustainability value.'),
  S('sk-aistrat', 'dom-aistrat', 'AIS-01', 'AI-augmented strategy', 'Uses AI to research markets and stress-test strategic options.', true, true),
  S('sk-pitch', 'dom-exec', 'EXP-01', 'Executive pitching', 'Presents evidence, asks and risks concisely to executives.'),
  S('sk-leadchange', 'dom-lead', 'LTC-01', 'Leading cross-BU teams', 'Leads mixed teams through gates, pivots and stops.'),
]

// Modules: three per ABC skill; two per BCD skill. Titles are illustrative.
const moduleTitles: Record<string, string[]> = {
  'sk-genai': ['Prompting for analysis (SCG approved tools)', 'Drafting proposals with a copilot', 'Checking AI output against source data'],
  'sk-decision': ['Framing a decision in one page', 'Weighing evidence and risk', 'Recording rationale for review'],
  'sk-datastory': ['From spreadsheet to story', 'Choosing the right chart for OpEx', 'Presenting a baseline and target'],
  'sk-opex': ['Value-stream mapping in one hour', 'Quantifying waste in THB', 'Daily management routines'],
  'sk-valuechain': ['Where value is created in building materials', 'Partnership economics', 'Dealer economics and margin pools'],
  'sk-green': ['Green / SVP / HVA basics', 'CBAM exposure for exports', 'Pricing green options'],
  'sk-selfaware': ['Feedback that lands', 'Working styles across functions', 'Personal operating rhythm'],
  'sk-collab': ['Aligning priorities across silos', 'Decision rights in practice', 'Running a cross-functional stand-up'],
  'sk-custneeds': ['Internal customer interviews', 'External customer interviews (B2B)', 'Turning needs into requirements'],
  'sk-b2bsales': ['AI lead scoring for dealers', 'Segmenting B2B accounts', 'Designing offers with AI'],
  'sk-changeplan': ['Baseline, target and owner', 'Weekly evidence cadence', 'Impact contract walkthrough'],
  'sk-sustain': ['Standard work after the sprint', 'Metrics that keep change alive', 'Handing over an improvement'],
  'sk-bizbuild': ['Problem framing with a sponsor', 'Business model canvas on a live concept'],
  'sk-invest': ['Pricing and unit economics', 'Best / worst case in one model'],
  'sk-greendesign': ['Sustainability value the customer will pay for', 'Measuring green outcomes'],
  'sk-aistrat': ['AI market research sprint', 'Stress-testing strategy with scenarios'],
  'sk-pitch': ['Pre-read that decides for you', 'Recorded pitch in six minutes'],
  'sk-leadchange': ['Forming a cross-BU team fast', 'Leading after a pivot or stop'],
}
const formats: LearningModule['format'][] = ['micro_video', 'reading', 'exercise', 'simulation']
export const learningModules: LearningModule[] = Object.entries(moduleTitles).flatMap(([skillId, titles]) =>
  titles.map((title, i) => ({
    id: `mod-${skillId.replace('sk-', '')}-${i + 1}`,
    skillId,
    code: `${skills.find((s) => s.id === skillId)!.code}.${i + 1}`,
    title,
    durationMin: [12, 18, 25, 30][i % 4],
    format: formats[i % 4],
    variant: skillId === 'sk-b2bsales' && i === 0 ? 'B2B external customer · CBM dealers' : skillId === 'sk-custneeds' && i === 0 ? 'Internal customer · shared services' : null,
    origin: 'catalogue', sourceContractId: null, buId: null, body: null,
  })),
)

export const cohorts: Cohort[] = [
  {
    id: 'coh-abc-a0', program: 'ABC', code: 'ABC-A0', name: 'ABC Alpha pilot 2026 (CBM)', buId: 'bu-cbm', status: 'completed',
    startDate: '2026-04-06', endDate: '2026-07-24',
    keyDates: [
      { label: 'AI skill diagnostic', date: '2026-04-06' }, { label: 'Applied capability labs', date: '2026-04-20' },
      { label: 'Impact sprint', date: '2026-04-27' }, { label: 'Mid-sprint gate', date: '2026-06-05' }, { label: 'Impact showcase', date: '2026-07-24' },
    ],
    pipelineTargetThb: 6_000_000, seats: 24, budgetThb: 1_800_000,
  },
  {
    id: 'coh-abc-l1', program: 'ABC', code: 'ABC-L1', name: 'ABC Lighthouse 1 · CBM turnaround roles', buId: 'bu-cbm', status: 'sprint',
    startDate: '2026-07-27', endDate: '2026-11-13',
    keyDates: [
      { label: 'AI skill diagnostic', date: '2026-07-27' }, { label: 'Flipped micro-learning', date: '2026-07-27' },
      { label: 'Applied capability labs (4 days)', date: '2026-08-10' }, { label: 'Impact sprint starts', date: '2026-08-17' },
      { label: 'Coaching clinic 1', date: '2026-09-11' }, { label: 'Mid-sprint gate', date: '2026-09-25' },
      { label: 'Coaching clinic 2', date: '2026-10-16' }, { label: 'Impact showcase', date: '2026-11-13' },
    ],
    pipelineTargetThb: 12_000_000, seats: 30, budgetThb: 2_400_000,
  },
  {
    id: 'coh-abc-l2', program: 'ABC', code: 'ABC-L2', name: 'ABC Lighthouse 2 · CAFI service teams', buId: 'bu-cafi', status: 'sprint',
    startDate: '2026-08-17', endDate: '2026-12-04',
    keyDates: [
      { label: 'AI skill diagnostic', date: '2026-08-17' }, { label: 'Applied capability labs (4 days)', date: '2026-08-31' },
      { label: 'Impact sprint starts', date: '2026-09-07' }, { label: 'Coaching clinic 1', date: '2026-10-02' },
      { label: 'Mid-sprint gate', date: '2026-10-16' }, { label: 'Coaching clinic 2', date: '2026-11-06' }, { label: 'Impact showcase', date: '2026-12-04' },
    ],
    pipelineTargetThb: 9_000_000, seats: 30, budgetThb: 2_200_000,
  },
  {
    id: 'coh-abc-2027-1', program: 'ABC', code: 'ABC-2027-01', name: 'ABC Batch 1/2027 · enterprise-wide', buId: null, status: 'planned',
    startDate: '2027-01-11', endDate: '2027-04-30',
    keyDates: [{ label: 'AI skill diagnostic', date: '2027-01-11' }, { label: 'Applied capability labs', date: '2027-01-25' }, { label: 'Impact showcase', date: '2027-04-30' }],
    pipelineTargetThb: 20_000_000, seats: 60, budgetThb: 4_500_000,
  },
  {
    id: 'coh-bcd-2025', program: 'BCD', code: 'BCD-2025', name: 'BCD Pilot cohort 2025', buId: null, status: 'scale_up',
    startDate: '2025-06-02', endDate: '2025-10-17',
    keyDates: [{ label: 'Gate 1', date: '2025-07-28' }, { label: 'Gate 2', date: '2025-09-19' }, { label: 'Gate 3', date: '2026-03-13' }],
    pipelineTargetThb: 100_000_000, seats: 18, budgetThb: 6_000_000,
  },
  {
    id: 'coh-bcd-l1', program: 'BCD', code: 'BCD-L1', name: 'BCD Lighthouse cohort 2026', buId: null, status: 'building_case',
    startDate: '2026-06-01', endDate: '2026-10-23',
    keyDates: [
      { label: 'Challenge sourcing', date: '2026-06-01' }, { label: 'Onboard, diagnose & team up', date: '2026-06-29' },
      { label: 'Immersion camp (3 days)', date: '2026-07-06' }, { label: 'Concept studio sprint', date: '2026-07-13' },
      { label: 'Field validation', date: '2026-08-03' }, { label: 'Gate 1 · Proof of concept', date: '2026-08-24' },
      { label: 'Commercial build', date: '2026-08-31' }, { label: 'Prototype & stress-test', date: '2026-09-28' },
      { label: 'Gate 2 · CEO investment pitch', date: '2026-10-23' },
    ],
    pipelineTargetThb: 150_000_000, seats: 18, budgetThb: 6_800_000,
  },
  {
    id: 'coh-bcd-2027-1', program: 'BCD', code: 'BCD-2027-01', name: 'BCD Batch 1/2027', buId: null, status: 'framing',
    startDate: '2027-01-18', endDate: '2027-05-14',
    keyDates: [{ label: 'Challenge brief deadline', date: '2026-10-30' }, { label: 'Selection board', date: '2026-11-13' }, { label: 'Immersion camp', date: '2027-01-25' }],
    pipelineTargetThb: 200_000_000, seats: 24, budgetThb: 8_000_000,
  },
]

const E = (id: string, cohortId: string, personaId: string, status: Enrollment['status'], extra: Partial<Enrollment> = {}): Enrollment => ({
  id, cohortId, personaId, status, teamId: null, coachId: null, sponsorId: null, managerId: personas.find((p) => p.id === personaId)?.managerId ?? null,
  impactRating: null, topDecile: false, fastTrackBcd: false, podId: null, ...extra,
})

export const enrollments: Enrollment[] = [
  E('enr-arisa', 'coh-abc-a0', 'per-arisa', 'graduated', { coachId: 'per-anong', sponsorId: 'per-prasert', impactRating: 'exceptional', topDecile: true, fastTrackBcd: true }),
  E('enr-jiraporn', 'coh-abc-a0', 'per-jiraporn', 'showcase', { coachId: 'per-anong', sponsorId: 'per-prasert', impactRating: 'strong' }),
  E('enr-nara', 'coh-abc-l1', 'per-nara', 'in_sprint', { coachId: 'per-anong', sponsorId: 'per-prasert', podId: 'pod-l1-a' }),
  E('enr-tanawat', 'coh-abc-l1', 'per-tanawat', 'in_sprint', { coachId: 'per-anong', sponsorId: 'per-prasert', podId: 'pod-l1-a' }),
  E('enr-boonchu', 'coh-abc-l1', 'per-boonchu', 'in_sprint', { coachId: 'per-anong', sponsorId: 'per-prasert', podId: 'pod-l1-a' }),
  E('enr-pim', 'coh-abc-l2', 'per-pim', 'in_sprint', { coachId: 'per-decha', sponsorId: 'per-wanida', podId: 'pod-l2-a' }),
  E('enr-krit', 'coh-abc-l2', 'per-krit', 'in_sprint', { coachId: 'per-decha', sponsorId: 'per-wanida', podId: 'pod-l2-a' }),
  E('enr-nok', 'coh-abc-l2', 'per-nok', 'in_sprint', { coachId: 'per-decha', sponsorId: 'per-wanida', podId: 'pod-l2-a' }),
  E('enr-warit', 'coh-bcd-l1', 'per-warit', 'in_sprint', { teamId: 'team-a', coachId: 'per-decha', sponsorId: 'per-prasert' }),
  E('enr-mali', 'coh-bcd-l1', 'per-mali', 'in_sprint', { teamId: 'team-b', coachId: 'per-decha', sponsorId: 'per-wanida' }),
  E('enr-wichai', 'coh-bcd-2025', 'per-wichai', 'graduated', { teamId: 'team-d', coachId: 'per-anong', sponsorId: 'per-prasert', impactRating: 'exceptional', topDecile: true }),
]

export const diagnostics: Diagnostic[] = [
  { id: 'dx-nara', enrollmentId: 'enr-nara', status: 'completed', completedAt: d('2026-07-29'), summary: 'Strongest in customer needs discovery and collaboration. Priority gaps: AI-powered sales, GenAI copilot practice and data storytelling, which map directly to dealer share-of-wallet in the CBM turnaround.' },
  { id: 'dx-tanawat', enrollmentId: 'enr-tanawat', status: 'completed', completedAt: d('2026-07-30'), summary: 'Strong OpEx foundations. Priority gaps: data storytelling, GenAI copilot practice and improvement tracking.' },
  { id: 'dx-boonchu', enrollmentId: 'enr-boonchu', status: 'completed', completedAt: d('2026-07-31'), summary: 'Priority gaps: evidence-based decisions, OpEx methods and sustaining change.' },
  { id: 'dx-arisa', enrollmentId: 'enr-arisa', status: 'completed', completedAt: d('2026-04-07'), summary: 'Priority gaps closed during sprint: green / CBAM economics and value chain economics.' },
  { id: 'dx-jiraporn', enrollmentId: 'enr-jiraporn', status: 'completed', completedAt: d('2026-04-08'), summary: 'Priority gaps: OpEx methods and data storytelling.' },
  { id: 'dx-pim', enrollmentId: 'enr-pim', status: 'completed', completedAt: d('2026-08-19'), summary: 'Priority gaps: GenAI copilot practice, OpEx methods and internal customer needs discovery.' },
  { id: 'dx-krit', enrollmentId: 'enr-krit', status: 'completed', completedAt: d('2026-08-19'), summary: 'Priority gaps: data storytelling, improvement tracking and cross-functional collaboration.' },
  { id: 'dx-nok', enrollmentId: 'enr-nok', status: 'pending', completedAt: null, summary: null },
  { id: 'dx-warit', enrollmentId: 'enr-warit', status: 'completed', completedAt: d('2026-06-30'), summary: 'Priority gaps: investment casing and executive pitching.' },
  { id: 'dx-mali', enrollmentId: 'enr-mali', status: 'completed', completedAt: d('2026-06-30'), summary: 'Priority gaps: business building and executive pitching.' },
  { id: 'dx-wichai', enrollmentId: 'enr-wichai', status: 'completed', completedAt: d('2025-06-30'), summary: 'All priority gaps closed through Gates 1–3.' },
]

const DI = (dx: string, skillId: string, cur: number, tgt: number, rank: number | null, src: DiagnosticItem['evidenceSource'], rationale: string | null = null): DiagnosticItem => ({
  id: `dxi-${dx.replace('dx-', '')}-${skillId.replace('sk-', '')}`, diagnosticId: dx, skillId, currentLevel: cur, targetLevel: tgt, priorityRank: rank, evidenceSource: src, rationale,
})

export const diagnosticItems: DiagnosticItem[] = [
  DI('dx-nara', 'sk-b2bsales', 1, 3, 1, 'ai_inferred', 'Role requires AI-assisted dealer segmentation; CRM activity shows manual lead prioritisation.'),
  DI('dx-nara', 'sk-genai', 1, 3, 2, 'knowledge_test', 'Knowledge test 42%. Copilot not yet used in weekly reporting.'),
  DI('dx-nara', 'sk-datastory', 2, 3, 3, 'ai_inferred', 'Reports list numbers without a narrative or baseline.'),
  DI('dx-nara', 'sk-changeplan', 2, 3, 4, 'manager_input', 'Manager notes improvements start well but lack tracking cadence.'),
  DI('dx-nara', 'sk-custneeds', 3, 3, null, 'ai_inferred', 'Strength: structured dealer visits and needs capture.'),
  DI('dx-nara', 'sk-collab', 3, 3, null, 'manager_input', 'Strength: works well with logistics and credit teams.'),
  DI('dx-nara', 'sk-valuechain', 2, 3, 5, 'knowledge_test', 'Knowledge test 61%.'),
  DI('dx-nara', 'sk-green', 1, 2, 6, 'self_declared', 'Self-declared awareness only; low relevance to current role this sprint.'),
  DI('dx-nara', 'sk-decision', 2, 3, null, 'ai_inferred', null),
  DI('dx-nara', 'sk-opex', 0, 2, null, null, 'Not assessed: no work data available for this skill.'),
  DI('dx-nara', 'sk-selfaware', 3, 3, null, 'self_declared', null),
  DI('dx-nara', 'sk-sustain', 2, 3, null, 'ai_inferred', null),
  DI('dx-tanawat', 'sk-datastory', 1, 3, 1, 'ai_inferred', 'Shift reports contain raw downtime logs without trend or narrative.'),
  DI('dx-tanawat', 'sk-genai', 1, 3, 2, 'knowledge_test', 'Knowledge test 38%.'),
  DI('dx-tanawat', 'sk-changeplan', 2, 3, 3, 'manager_input', null),
  DI('dx-tanawat', 'sk-opex', 3, 4, 4, 'ai_inferred', 'Strength to extend to Level 4: lead plant-wide OpEx routine.'),
  DI('dx-tanawat', 'sk-collab', 2, 3, 5, 'self_declared', null),
  DI('dx-boonchu', 'sk-decision', 1, 3, 1, 'ai_inferred', null),
  DI('dx-boonchu', 'sk-opex', 1, 3, 2, 'knowledge_test', null),
  DI('dx-boonchu', 'sk-sustain', 1, 2, 3, 'manager_input', null),
  DI('dx-arisa', 'sk-green', 1, 3, 1, 'knowledge_test', null),
  DI('dx-arisa', 'sk-valuechain', 2, 3, 2, 'ai_inferred', null),
  DI('dx-arisa', 'sk-changeplan', 2, 3, 3, 'manager_input', null),
  DI('dx-jiraporn', 'sk-opex', 2, 3, 1, 'ai_inferred', null),
  DI('dx-jiraporn', 'sk-datastory', 1, 3, 2, 'knowledge_test', null),
  DI('dx-pim', 'sk-genai', 1, 3, 1, 'knowledge_test', 'Knowledge test 45%.'),
  DI('dx-pim', 'sk-opex', 2, 3, 2, 'ai_inferred', 'Invoice exceptions handled manually; no waste quantification.'),
  DI('dx-pim', 'sk-custneeds', 1, 3, 3, 'ai_inferred', 'Internal customer (BU finance) needs not captured systematically.'),
  DI('dx-pim', 'sk-changeplan', 2, 3, 4, 'manager_input', null),
  DI('dx-krit', 'sk-datastory', 1, 3, 1, 'ai_inferred', null),
  DI('dx-krit', 'sk-changeplan', 2, 3, 2, 'manager_input', null),
  DI('dx-krit', 'sk-collab', 2, 3, 3, 'self_declared', null),
  DI('dx-warit', 'sk-invest', 2, 3, 1, 'ai_inferred', null),
  DI('dx-warit', 'sk-pitch', 2, 3, 2, 'manager_input', null),
  DI('dx-warit', 'sk-bizbuild', 3, 4, 3, 'ai_inferred', null),
  DI('dx-mali', 'sk-bizbuild', 1, 3, 1, 'ai_inferred', null),
  DI('dx-mali', 'sk-pitch', 1, 3, 2, 'knowledge_test', null),
  DI('dx-wichai', 'sk-bizbuild', 4, 4, null, 'ai_inferred', null),
  DI('dx-wichai', 'sk-invest', 3, 3, null, 'ai_inferred', null),
]

const plan = (enr: string, entries: [string, LearningPlanItem['status'], string | null][]): LearningPlanItem[] =>
  entries.map(([moduleId, status, reason], i) => ({ id: `lp-${enr.replace('enr-', '')}-${i + 1}`, enrollmentId: enr, moduleId, sequence: i + 1, status, reason }))

export const learningPlanItems: LearningPlanItem[] = [
  ...plan('enr-nara', [
    ['mod-b2bsales-1', 'completed', 'Priority gap 1 · B2B dealer variant selected for CBM distribution'],
    ['mod-b2bsales-2', 'completed', 'Priority gap 1'],
    ['mod-genai-1', 'completed', 'Priority gap 2'],
    ['mod-genai-3', 'completed', 'Priority gap 2 · checking output before sharing with dealers'],
    ['mod-datastory-3', 'completed', 'Priority gap 3 · needed for impact contract baseline'],
    ['mod-changeplan-1', 'in_progress', 'Priority gap 4'],
    ['mod-changeplan-2', 'planned', 'Priority gap 4 · weekly evidence cadence'],
    ['mod-valuechain-3', 'planned', 'Priority gap 5 · dealer margin pools'],
    ['mod-custneeds-2', 'skipped', 'Skipped: already at target level (strength)'],
    ['mod-genai-2', 'skipped', 'Skipped: covered in Lab Day 3'],
  ]),
  ...plan('enr-tanawat', [
    ['mod-datastory-1', 'completed', 'Priority gap 1'], ['mod-datastory-2', 'completed', 'Priority gap 1'], ['mod-genai-1', 'completed', 'Priority gap 2'],
    ['mod-changeplan-1', 'completed', 'Priority gap 3'], ['mod-opex-3', 'in_progress', 'Extend strength to Level 4'], ['mod-collab-3', 'planned', 'Priority gap 5'],
  ]),
  ...plan('enr-boonchu', [
    ['mod-decision-1', 'completed', 'Priority gap 1'], ['mod-decision-2', 'in_progress', 'Priority gap 1'], ['mod-opex-1', 'planned', 'Priority gap 2'], ['mod-sustain-1', 'planned', 'Priority gap 3'],
  ]),
  ...plan('enr-pim', [
    ['mod-genai-1', 'completed', 'Priority gap 1'], ['mod-genai-2', 'in_progress', 'Priority gap 1'], ['mod-opex-2', 'planned', 'Priority gap 2 · quantify exception handling waste'],
    ['mod-custneeds-1', 'planned', 'Priority gap 3 · internal customer variant'], ['mod-changeplan-1', 'planned', 'Priority gap 4'],
  ]),
  ...plan('enr-krit', [['mod-datastory-1', 'completed', 'Priority gap 1'], ['mod-changeplan-1', 'completed', 'Priority gap 2'], ['mod-collab-1', 'in_progress', 'Priority gap 3']]),
  ...plan('enr-arisa', [['mod-green-1', 'completed', null], ['mod-green-2', 'completed', null], ['mod-valuechain-2', 'completed', null], ['mod-changeplan-1', 'completed', null]]),
  ...plan('enr-jiraporn', [['mod-opex-1', 'completed', null], ['mod-datastory-1', 'completed', null], ['mod-datastory-3', 'completed', null]]),
  ...plan('enr-warit', [['mod-invest-1', 'completed', 'Priority gap 1'], ['mod-invest-2', 'in_progress', 'Priority gap 1 · needed for Gate 2 pre-read'], ['mod-pitch-1', 'planned', 'Priority gap 2'], ['mod-pitch-2', 'planned', 'Priority gap 2']]),
  ...plan('enr-mali', [['mod-bizbuild-1', 'completed', 'Priority gap 1'], ['mod-bizbuild-2', 'completed', 'Priority gap 1'], ['mod-pitch-1', 'in_progress', 'Priority gap 2']]),
]

const C = (id: string, enrollmentId: string, learnerId: string, managerId: string, sponsorId: string, title: string, objectiveType: ImpactContract['objectiveType'], description: string, status: ImpactContract['status'], extra: Partial<ImpactContract> = {}): ImpactContract => ({
  id, enrollmentId, learnerId, managerId, sponsorId, title, objectiveType, description,
  baselineValue: null, targetValue: null, unit: null, targetThb: null, toolsApplied: null, status, returnReason: null,
  midGateDecision: null, midGateNote: null, showcaseSummary: null, validatedValueThb: null, validatedAt: null,
  createdAt: d('2026-08-13'), updatedAt: d('2026-09-10'), ...extra,
})

export const impactContracts: ImpactContract[] = [
  C('ic-nara', 'enr-nara', 'per-nara', 'per-kittipong', 'per-prasert', 'Lift dealer share of wallet in Central Region with AI lead scoring', 'share_of_wallet',
    'Use AI lead scoring on the 120 active dealers in Central Region to prioritise weekly visits and offers. Practical improvement: a scored dealer list every Monday, a standard offer pack per segment, and a weekly review with the credit team.',
    'active', { baselineValue: 31, targetValue: 36, unit: '% share of wallet (top 40 dealers)', targetThb: 4_200_000, toolsApplied: 'SCG GenAI copilot; CRM export; dealer segmentation template from Lab Day 4', createdAt: d('2026-08-13'), updatedAt: d('2026-08-20') }),
  C('ic-tanawat', 'enr-tanawat', 'per-tanawat', 'per-somsak', 'per-prasert', 'Reduce unplanned kiln downtime at Saraburi Line 2', 'productivity_per_fte',
    'Daily downtime story with root-cause tags, GenAI-assisted shift handover and a weekly OpEx routine. Practical improvement: 15% fewer unplanned stops on Line 2.',
    'mid_gate_review', { baselineValue: 42, targetValue: 36, unit: 'unplanned stop hours per month', targetThb: 3_600_000, toolsApplied: 'Downtime log analytics; GenAI copilot for handover notes', createdAt: d('2026-08-13'), updatedAt: d('2026-09-12') }),
  C('ic-boonchu', 'enr-boonchu', 'per-boonchu', 'per-somsak', 'per-prasert', 'Cut empty return trips from Saraburi to Bangkok depots', 'cost_to_serve',
    'Use route data to pair outbound deliveries with backhaul loads.',
    'returned', { baselineValue: 38, targetValue: 30, unit: '% empty return trips', targetThb: null, toolsApplied: 'Route planning export', returnReason: 'Add the THB value of the target and name the logistics partner who will confirm the baseline. The sprint scope is good.', createdAt: d('2026-08-13'), updatedAt: d('2026-09-08') }),
  C('ic-arisa', 'enr-arisa', 'per-arisa', 'per-somsak', 'per-prasert', 'Switch two packaging categories to lower-CBAM-exposure suppliers', 'cost_to_serve',
    'Re-quote two categories with green options and a total-cost model.',
    'validated', { baselineValue: 100, targetValue: 92, unit: 'index of category cost (baseline = 100)', targetThb: 2_000_000, toolsApplied: 'Total-cost model; CBAM exposure calculator', midGateDecision: 'scale', midGateNote: 'Evidence shows 5% saving already on category 1. Scale to category 2.', showcaseSummary: 'Delivered THB 2.4M annualised saving across both categories with CBAM exposure reduced by 18%.', validatedValueThb: 2_400_000, validatedAt: d('2026-07-31'), createdAt: d('2026-04-23'), updatedAt: d('2026-07-31') }),
  C('ic-jiraporn', 'enr-jiraporn', 'per-jiraporn', 'per-somsak', 'per-prasert', 'Reduce QA re-test cycle time for cement samples', 'sla_turnaround',
    'Standard sample routing and a daily data story of re-test causes.',
    'showcase_review', { baselineValue: 3.2, targetValue: 2.0, unit: 'days re-test cycle time', targetThb: 1_100_000, toolsApplied: 'Lab data export; GenAI copilot for cause tagging', midGateDecision: 'scale', midGateNote: 'On track; extend to second lab.', showcaseSummary: 'Cycle time down to 2.1 days; THB 1.1M avoided rework and overtime (annualised).', createdAt: d('2026-04-23'), updatedAt: d('2026-07-27') }),
  C('ic-pim', 'enr-pim', 'per-pim', 'per-ratree', 'per-wanida', 'Automate invoice exception triage for BU finance teams', 'productivity_per_fte',
    'Use GenAI to classify invoice exceptions and route them; agree a service level with two BU finance teams.',
    'manager_review', { baselineValue: 210, targetValue: 300, unit: 'invoices processed per FTE per week', targetThb: 1_800_000, toolsApplied: 'SCG GenAI copilot; AP workflow export', createdAt: d('2026-09-03'), updatedAt: d('2026-09-10') }),
  C('ic-krit', 'enr-krit', 'per-krit', 'per-ratree', 'per-wanida', 'Cut service-desk resolution time with a knowledge copilot', 'sla_turnaround',
    'Publish a copilot over approved runbooks and track first-contact resolution weekly.',
    'sponsor_review', { baselineValue: 18, targetValue: 12, unit: 'hours mean time to resolve', targetThb: 1_500_000, toolsApplied: 'Runbook copilot; ticket analytics', createdAt: d('2026-09-02'), updatedAt: d('2026-09-11') }),
  C('ic-nok', 'enr-nok', 'per-nok', 'per-ratree', 'per-wanida', 'Reduce payroll query turnaround for plant HR teams', 'sla_turnaround',
    'Draft only. Diagnostic still pending, so priority skills are not yet selected.',
    'draft', { baselineValue: 5, targetValue: 2, unit: 'days to resolve payroll query', targetThb: null, toolsApplied: null, createdAt: d('2026-09-09'), updatedAt: d('2026-09-09') }),
]

const EV = (contractId: string, weekNo: number, title: string, note: string, metricValue: number | null, createdBy: string, date: string): SprintEvidence => ({
  id: `ev-${contractId.replace('ic-', '')}-w${weekNo}`, contractId, weekNo, title, note, metricValue, createdBy, createdAt: d(date),
})

export const sprintEvidence: SprintEvidence[] = [
  EV('ic-nara', 1, 'Scored dealer list produced', 'First AI lead-scoring run on 120 dealers; top 40 identified. Baseline confirmed with credit team.', 31, 'per-nara', '2026-08-21'),
  EV('ic-nara', 2, 'Standard offer pack per segment', 'Three offer packs drafted with the copilot and reviewed by marketing.', 31.5, 'per-nara', '2026-08-28'),
  EV('ic-nara', 3, 'Weekly review with credit team started', 'Two dealers moved to prioritised credit terms; visit plan follows scores.', 32.4, 'per-nara', '2026-09-04'),
  EV('ic-nara', 4, 'Clinic 1 feedback applied', 'Coach suggested tracking share of wallet weekly rather than monthly. Dashboard now weekly.', 33.1, 'per-nara', '2026-09-11'),
  EV('ic-tanawat', 1, 'Downtime tagging live', 'All Line 2 stops now tagged with root cause.', 42, 'per-tanawat', '2026-08-21'),
  EV('ic-tanawat', 2, 'Handover notes with copilot', 'Shift handover written with the copilot; 20 minutes saved per shift.', 41, 'per-tanawat', '2026-08-28'),
  EV('ic-tanawat', 3, 'Weekly OpEx routine', 'Top 3 causes reviewed weekly with maintenance.', 39, 'per-tanawat', '2026-09-04'),
  EV('ic-tanawat', 4, 'Mid-gate evidence pack submitted', 'Unplanned stop hours trending to 37 hours per month. Requesting scale to Line 1.', 37.5, 'per-tanawat', '2026-09-12'),
  EV('ic-pim', 1, 'Exception categories defined', 'Nine categories agreed with two BU finance teams.', 210, 'per-pim', '2026-09-11'),
]

export const challengeThemes: ChallengeTheme[] = [
  { id: 'th-cbm-fuel', buId: 'bu-cbm', title: 'Waste reduction & alternative fuels', description: 'Lower cost per tonne and carbon intensity through alternative fuels and waste-to-value.', setById: 'per-prasert', year: 2026 },
  { id: 'th-cbm-dealer', buId: 'bu-cbm', title: 'Dealer service excellence', description: 'Grow share of wallet and cut cost-to-serve across the dealer network.', setById: 'per-prasert', year: 2026 },
  { id: 'th-cafi-auto', buId: 'bu-cafi', title: 'Automation of transactional finance', description: 'Raise productivity per FTE and service levels with automation and analytics.', setById: 'per-wanida', year: 2026 },
  { id: 'th-cafi-sla', buId: 'bu-cafi', title: 'Service level excellence', description: 'Turnaround times down and satisfaction up for every service team.', setById: 'per-wanida', year: 2026 },
  { id: 'th-scgp-green', buId: 'bu-scgp', title: 'Green packaging growth', description: 'New revenue from recyclable and low-carbon packaging in B2B and B2B2C.', setById: 'per-suchada', year: 2027 },
]

const B = (id: string, themeId: string | null, buId: string, sponsorId: string, title: string, challengeType: ChallengeBrief['challengeType'], problemStatement: string, successMetric: string, targetValueThb: number | null, status: ChallengeBrief['status'], extra: Partial<ChallengeBrief> = {}): ChallengeBrief => ({
  id, themeId, buId, sponsorId, title, challengeType, problemStatement, successMetric, targetValueThb, constraints: null, status, cohortId: null,
  committeeNote: null, reviewedById: null, reviewedAt: null, createdAt: d('2026-09-01'), updatedAt: d('2026-09-10'), ...extra,
})

export const challengeBriefs: ChallengeBrief[] = [
  // Assigned to the 2026 lighthouse cohort
  B('cb-fuel', 'th-cbm-fuel', 'bu-cbm', 'per-prasert', 'Raise alternative-fuel substitution at two kilns to 35%', 'cost', 'Fuel is the largest controllable cost per tonne. Substitution is stuck at 22% because supply of refuse-derived fuel is unreliable.', 'Fuel cost per tonne; substitution rate', 45_000_000, 'assigned', { cohortId: 'coh-bcd-l1', reviewedById: 'per-chatchai', reviewedAt: d('2026-06-12'), committeeNote: 'Approved. Strong P&L anchor for the turnaround.', createdAt: d('2026-05-20'), updatedAt: d('2026-06-29') }),
  B('cb-invoice', 'th-cafi-auto', 'bu-cafi', 'per-wanida', 'Touchless invoice processing for all BUs', 'productivity', 'Only 40% of invoices are processed without manual touch. BU finance teams escalate exceptions by email.', 'Touchless rate; cost per invoice', 18_000_000, 'assigned', { cohortId: 'coh-bcd-l1', reviewedById: 'per-chatchai', reviewedAt: d('2026-06-12'), committeeNote: 'Approved with a request to include a service-level commitment.', createdAt: d('2026-05-22'), updatedAt: d('2026-06-29') }),
  B('cb-pack', 'th-scgp-green', 'bu-scgp', 'per-suchada', 'Recyclable packaging line for B2B2C food brands', 'growth', 'Food brands ask for recyclable packaging but current offers do not meet cost targets.', 'New revenue; gross margin', 60_000_000, 'assigned', { cohortId: 'coh-bcd-l1', reviewedById: 'per-chatchai', reviewedAt: d('2026-06-12'), committeeNote: 'Approved.', createdAt: d('2026-05-25'), updatedAt: d('2026-06-29') }),
  // 2027 intake
  B('cb-logistics', 'th-cbm-dealer', 'bu-cbm', 'per-prasert', 'Cut cost-to-serve in CBM dealer logistics by 15%', 'cost', 'Small, frequent dealer orders drive high delivery cost. No shared visibility between sales, logistics and dealers.', 'Cost-to-serve per tonne delivered', 35_000_000, 'committee_review', { constraints: 'Must work with existing transport partners; no new fleet capex in 2027.', createdAt: d('2026-09-02'), updatedAt: d('2026-09-08') }),
  B('cb-close', 'th-cafi-auto', 'bu-cafi', 'per-wanida', 'AI-assisted month-end close in five days', 'service', 'Month-end close takes nine working days; BU CFOs want five.', 'Working days to close; adjustments after close', 12_000_000, 'committee_review', { createdAt: d('2026-09-04'), updatedAt: d('2026-09-09') }),
  B('cb-cbam', 'th-cbm-fuel', 'bu-cbm', 'per-prasert', 'Low-carbon cement for CBAM export markets', 'growth', 'European customers will pay a premium for verified low-carbon cement from 2027 but SCG has no certified product.', 'Export revenue; premium per tonne', 80_000_000, 'approved', { reviewedById: 'per-chatchai', reviewedAt: d('2026-09-11'), committeeNote: 'Approved. Program office to assign to BCD Batch 1/2027.', createdAt: d('2026-08-28'), updatedAt: d('2026-09-11') }),
  B('cb-ordering', 'th-cbm-dealer', 'bu-cbm', 'per-suchada', 'Dealer digital ordering and credit self-service', 'service', 'Dealers order by phone and LINE; credit checks take two days.', 'Order-to-confirm time; dealer satisfaction', null, 'returned', { reviewedById: 'per-ploy', reviewedAt: d('2026-09-10'), committeeNote: 'Add a THB target value and confirm which BU P&L owns the benefit. Sponsor and brief BU do not match.', createdAt: d('2026-09-01'), updatedAt: d('2026-09-10') }),
  B('cb-hrbot', 'th-cafi-sla', 'bu-cafi', 'per-wanida', 'Shared-service copilot for HR and payroll queries', 'service', 'HR service desk answers 6,000 repeat queries a month by email.', 'Queries resolved by copilot; turnaround time', 6_000_000, 'draft', { createdAt: d('2026-09-12'), updatedAt: d('2026-09-12') }),
  B('cb-office', null, 'bu-cafi', 'per-wanida', 'New collaborative office layout for shared services', 'productivity', 'Teams report the current layout limits collaboration.', 'Employee satisfaction', null, 'rejected', { reviewedById: 'per-chatchai', reviewedAt: d('2026-09-05'), committeeNote: 'Rejected: not anchored to a BU P&L priority. Consider as a facilities request.', createdAt: d('2026-08-30'), updatedAt: d('2026-09-05') }),
  B('cb-solar', null, 'bu-scgc', 'per-prasert', 'Solar rooftop leasing through the dealer network', 'growth', 'Dealers have customer access but no clean-energy offer.', 'Recurring revenue; dealers activated', 100_000_000, 'assigned', { cohortId: 'coh-bcd-2025', reviewedById: 'per-chatchai', reviewedAt: d('2025-06-10'), committeeNote: 'Approved.', createdAt: d('2025-05-20'), updatedAt: d('2025-06-30') }),
]

export const teams: Team[] = [
  { id: 'team-a', cohortId: 'coh-bcd-l1', name: 'Team Kiln', briefId: 'cb-fuel', coachId: 'per-decha' },
  { id: 'team-b', cohortId: 'coh-bcd-l1', name: 'Team Touchless', briefId: 'cb-invoice', coachId: 'per-decha' },
  { id: 'team-c', cohortId: 'coh-bcd-l1', name: 'Team Loop', briefId: 'cb-pack', coachId: 'per-anong' },
  { id: 'team-d', cohortId: 'coh-bcd-2025', name: 'Team Sunrise', briefId: 'cb-solar', coachId: 'per-anong' },
]

export const concepts: Concept[] = [
  { id: 'cp-fuel', teamId: 'team-a', briefId: 'cb-fuel', cohortId: 'coh-bcd-l1', title: 'RDF supply marketplace for kilns', summary: 'A managed marketplace that contracts municipal and industrial waste streams into refuse-derived fuel with quality guarantees, lifting substitution to 35% at two kilns.', stage: 'build_case', pipelineValueThb: 45_000_000, validatedValueThb: null, scaleRoute: null, alignmentNote: null, alignedBy: null, alignedAt: null, createdAt: d('2026-07-13'), updatedAt: d('2026-09-10') },
  { id: 'cp-invoice', teamId: 'team-b', briefId: 'cb-invoice', cohortId: 'coh-bcd-l1', title: 'Touchless invoicing with a supplier portal', summary: 'Supplier self-service portal plus AI exception handling, targeting 80% touchless processing and a 24-hour exception service level.', stage: 'gate2', pipelineValueThb: 18_000_000, validatedValueThb: null, scaleRoute: null, alignmentNote: null, alignedBy: null, alignedAt: null, createdAt: d('2026-07-13'), updatedAt: d('2026-09-13') },
  { id: 'cp-pack', teamId: 'team-c', briefId: 'cb-pack', cohortId: 'coh-bcd-l1', title: 'Mono-material recyclable pouch for snack brands', summary: 'Field validation showed brands value recyclability but will not absorb a 12% cost premium. Pivoting to a co-branded take-back scheme that lowers net cost.', stage: 'pivot', pipelineValueThb: 25_000_000, validatedValueThb: null, scaleRoute: null, alignmentNote: null, alignedBy: null, alignedAt: null, createdAt: d('2026-07-13'), updatedAt: d('2026-08-24') },
  { id: 'cp-solar', teamId: 'team-d', briefId: 'cb-solar', cohortId: 'coh-bcd-2025', title: 'Solar rooftop leasing via dealers', summary: 'Dealers sell and install leased rooftop solar for SME customers. Scaled under SCG Start the Dot in March 2026.', stage: 'scaled', pipelineValueThb: 100_000_000, validatedValueThb: 120_000_000, scaleRoute: 'start_the_dot', alignmentNote: 'Aligned with SCG management on 2 Aug 2025: dealer leasing model approved for field validation.', alignedBy: 'per-prasert', alignedAt: d('2025-08-02'), createdAt: d('2025-07-01'), updatedAt: d('2026-03-13') },
]

export const gateReviews: GateReview[] = [
  { id: 'gr-fuel-1', conceptId: 'cp-fuel', gateNo: 1, scheduledDate: '2026-08-24', evidenceSummary: 'Evidence pack: 14 waste-stream owners interviewed; two pilot contracts signed; RDF quality test passed at kiln 2.', submittedAt: d('2026-08-20'), decision: 'go', decidedById: 'per-chatchai', decidedAt: d('2026-08-24'), note: 'Go. Build the commercial case with a firm supply plan.', validatedValueThb: null, evidence: { customerInterviews: 14, validatedNeeds: 'Municipal and industrial waste owners want a guaranteed offtake and a disposal certificate; both rank above price.', prototype: 'Two pilot supply contracts signed; RDF batch passed the kiln 2 quality test at 3,900 kcal/kg.', risks: 'Moisture in the rainy season; sorting capacity at the transfer station.' }, businessCase: null, attachments: [{ name: 'Waste-owner interview log', kind: 'evidence_pack', note: '14 interviews, coded by need' }, { name: 'Kiln 2 quality test report', kind: 'evidence_pack', note: 'Batch 2026-08-14' }] },
  { id: 'gr-fuel-2', conceptId: 'cp-fuel', gateNo: 2, scheduledDate: '2026-10-23', evidenceSummary: null, submittedAt: null, decision: 'pending', decidedById: null, decidedAt: null, note: null, validatedValueThb: null, evidence: null, businessCase: null, attachments: [] },
  { id: 'gr-invoice-1', conceptId: 'cp-invoice', gateNo: 1, scheduledDate: '2026-08-24', evidenceSummary: 'Evidence pack: 30 suppliers tested the portal prototype; exception model 91% accurate on 2,000 invoices.', submittedAt: d('2026-08-20'), decision: 'go', decidedById: 'per-chatchai', decidedAt: d('2026-08-24'), note: 'Go, with a service-level commitment in the case.', validatedValueThb: null, evidence: null, businessCase: null, attachments: [] },
  { id: 'gr-invoice-2', conceptId: 'cp-invoice', gateNo: 2, scheduledDate: '2026-10-23', evidenceSummary: 'Pre-read submitted early: business case THB 18M annual saving, payback 14 months, best / worst case THB 9M–24M; recorded 6-minute pitch attached.', submittedAt: d('2026-09-13'), decision: 'pending', decidedById: null, decidedAt: null, note: null, validatedValueThb: null, evidence: { customerInterviews: 30, validatedNeeds: 'Suppliers want status visibility without emailing AP; BU finance wants exceptions resolved inside 24 hours.', prototype: 'Portal prototype tested with 30 suppliers; exception model 91% accurate on 2,000 invoices.', risks: 'Master-data quality for small suppliers; change effort in two BU finance teams.' }, businessCase: { pricing: 'No external pricing: internal cost-to-serve model, THB 42 per invoice today against THB 17 at 80% touchless.', paybackMonths: 14, baseCaseThb: 18_000_000, bestCaseThb: 24_000_000, worstCaseThb: 9_000_000, ask: 'THB 21M over 18 months for the portal build, integration and two-team roll-out.' }, attachments: [{ name: 'Gate 2 pre-read (6 pages)', kind: 'pre_read', note: 'Sent to committee 13 Sep' }, { name: 'Recorded pitch, 6 minutes', kind: 'recorded_pitch', note: 'Team Touchless, Mali presenting' }, { name: 'Business case model', kind: 'model', note: 'Base, best and worst case with assumptions' }] },
  { id: 'gr-pack-1', conceptId: 'cp-pack', gateNo: 1, scheduledDate: '2026-08-24', evidenceSummary: 'Evidence pack: 12 brand interviews; willingness to pay below cost premium.', submittedAt: d('2026-08-20'), decision: 'pivot', decidedById: 'per-chatchai', decidedAt: d('2026-08-24'), note: 'Pivot to the take-back scheme; re-validate with five brands before Gate 2.', validatedValueThb: null, evidence: null, businessCase: null, attachments: [] },
  { id: 'gr-solar-1', conceptId: 'cp-solar', gateNo: 1, scheduledDate: '2025-07-28', evidenceSummary: 'Evidence pack: 40 SME customers; 8 dealers committed.', submittedAt: d('2025-07-24'), decision: 'go', decidedById: 'per-chatchai', decidedAt: d('2025-07-28'), note: 'Go.', validatedValueThb: null, evidence: null, businessCase: null, attachments: [] },
  { id: 'gr-solar-2', conceptId: 'cp-solar', gateNo: 2, scheduledDate: '2025-09-19', evidenceSummary: 'Business case THB 100M recurring revenue by year 3.', submittedAt: d('2025-09-15'), decision: 'invest', decidedById: 'per-chatchai', decidedAt: d('2025-09-19'), note: 'Invest THB 30M for small-scale roll-out in two provinces.', validatedValueThb: null, evidence: null, businessCase: null, attachments: [] },
  { id: 'gr-solar-3', conceptId: 'cp-solar', gateNo: 3, scheduledDate: '2026-03-13', evidenceSummary: 'Two provinces live; THB 120M contracted recurring revenue; 46 dealers activated.', submittedAt: d('2026-03-09'), decision: 'scale', decidedById: 'per-chatchai', decidedAt: d('2026-03-13'), note: 'Scale as a Start the Dot venture.', validatedValueThb: 120_000_000, evidence: null, businessCase: null, attachments: [] },
]

export const coachingClinics: CoachingClinic[] = [
  { id: 'cl-l1-1', cohortId: 'coh-abc-l1', clinicNo: 1, scheduledAt: d('2026-09-11'), coachId: 'per-anong', topics: 'Baselines and weekly evidence; using the copilot for data stories', briefingReady: true },
  { id: 'cl-l1-2', cohortId: 'coh-abc-l1', clinicNo: 2, scheduledAt: d('2026-10-16'), coachId: 'per-anong', topics: 'Preparing showcase evidence; sustaining change after week 12', briefingReady: false },
  { id: 'cl-l2-1', cohortId: 'coh-abc-l2', clinicNo: 1, scheduledAt: d('2026-10-02'), coachId: 'per-decha', topics: 'Impact contract quality; internal customer needs', briefingReady: false },
  { id: 'cl-l2-2', cohortId: 'coh-abc-l2', clinicNo: 2, scheduledAt: d('2026-11-06'), coachId: 'per-decha', topics: 'Showcase preparation', briefingReady: false },
  { id: 'cl-bcd-1', cohortId: 'coh-bcd-l1', clinicNo: 1, scheduledAt: d('2026-09-18'), coachId: 'per-decha', topics: 'Gate 2 pre-reads and pitch rehearsal', briefingReady: false },
]

export const coachingNotes: CoachingNote[] = [
  { id: 'cn-1', enrollmentId: 'enr-nara', coachId: 'per-anong', clinicId: 'cl-l1-1', note: 'Move share-of-wallet tracking to weekly; pair with credit team lead on prioritised terms.', aiFlag: 'AI coach flag: learner asked three times about baseline data access in week 3.', createdAt: d('2026-09-11') },
  { id: 'cn-2', enrollmentId: 'enr-tanawat', coachId: 'per-anong', clinicId: 'cl-l1-1', note: 'Evidence strong. Prepare the mid-gate pack with a clear scale proposal for Line 1.', aiFlag: null, createdAt: d('2026-09-11') },
  { id: 'cn-3', enrollmentId: 'enr-boonchu', coachId: 'per-anong', clinicId: 'cl-l1-1', note: 'Contract returned by manager; agreed to add THB value with logistics partner by 18 Sep.', aiFlag: 'AI coach flag: no activity in the past 9 days.', createdAt: d('2026-09-11') },
  { id: 'cn-4', enrollmentId: 'enr-warit', coachId: 'per-decha', clinicId: null, note: 'Gate 2 pre-read draft due 9 Oct. Investment casing module in progress.', aiFlag: 'AI coach flag: best / worst case model not started.', createdAt: d('2026-09-09') },
]

export const coachScorecards: CoachScorecard[] = [
  { id: 'cs-anong-l1', coachId: 'per-anong', cohortId: 'coh-abc-l1', feedbackFrequency: 2.4, feedbackQuality: 4.6, learnerRating: 4.7, certified: true, certifiedUntil: '2027-06-30' },
  { id: 'cs-anong-a0', coachId: 'per-anong', cohortId: 'coh-abc-a0', feedbackFrequency: 2.1, feedbackQuality: 4.4, learnerRating: 4.5, certified: true, certifiedUntil: '2027-06-30' },
  { id: 'cs-decha-l2', coachId: 'per-decha', cohortId: 'coh-abc-l2', feedbackFrequency: 1.8, feedbackQuality: 4.2, learnerRating: 4.3, certified: true, certifiedUntil: '2027-03-31' },
  { id: 'cs-decha-bcd', coachId: 'per-decha', cohortId: 'coh-bcd-l1', feedbackFrequency: 2.0, feedbackQuality: 4.5, learnerRating: 4.4, certified: true, certifiedUntil: '2027-03-31' },
]

const PE = (personaId: string, skillId: string, level: number, tier: PassportEntry['tier'], sourceType: PassportEntry['sourceType'], sourceId: string | null, badgeCode: string | null, mintedAt: string): PassportEntry => ({
  id: `pp-${personaId.replace('per-', '')}-${skillId.replace('sk-', '')}-${tier === 'outcome_verified' ? 'ov' : tier === 'ai_inferred' ? 'ai' : 'sd'}`, personaId, skillId, level, tier, sourceType, sourceId, badgeCode, mintedAt: d(mintedAt),
})

export const passportEntries: PassportEntry[] = [
  // Arisa: outcome-verified from showcase
  PE('per-arisa', 'sk-green', 3, 'outcome_verified', 'showcase', 'ic-arisa', 'ABC-A0-COMM-02-L3', '2026-07-31'),
  PE('per-arisa', 'sk-valuechain', 3, 'outcome_verified', 'showcase', 'ic-arisa', 'ABC-A0-COMM-01-L3', '2026-07-31'),
  PE('per-arisa', 'sk-changeplan', 3, 'outcome_verified', 'showcase', 'ic-arisa', 'ABC-A0-CHG-01-L3', '2026-07-31'),
  PE('per-arisa', 'sk-genai', 2, 'ai_inferred', 'diagnostic', 'dx-arisa', null, '2026-04-07'),
  // Nara: AI-inferred baseline from diagnostic; one self-declared
  PE('per-nara', 'sk-custneeds', 3, 'ai_inferred', 'diagnostic', 'dx-nara', null, '2026-07-29'),
  PE('per-nara', 'sk-collab', 3, 'ai_inferred', 'diagnostic', 'dx-nara', null, '2026-07-29'),
  PE('per-nara', 'sk-datastory', 2, 'ai_inferred', 'diagnostic', 'dx-nara', null, '2026-07-29'),
  PE('per-nara', 'sk-b2bsales', 1, 'ai_inferred', 'diagnostic', 'dx-nara', null, '2026-07-29'),
  PE('per-nara', 'sk-genai', 1, 'ai_inferred', 'diagnostic', 'dx-nara', null, '2026-07-29'),
  PE('per-nara', 'sk-changeplan', 2, 'ai_inferred', 'diagnostic', 'dx-nara', null, '2026-07-29'),
  PE('per-nara', 'sk-valuechain', 2, 'ai_inferred', 'diagnostic', 'dx-nara', null, '2026-07-29'),
  PE('per-nara', 'sk-green', 1, 'self_declared', 'diagnostic', 'dx-nara', null, '2026-07-29'),
  PE('per-nara', 'sk-decision', 2, 'ai_inferred', 'diagnostic', 'dx-nara', null, '2026-07-29'),
  // Tanawat
  PE('per-tanawat', 'sk-opex', 3, 'ai_inferred', 'diagnostic', 'dx-tanawat', null, '2026-07-30'),
  PE('per-tanawat', 'sk-datastory', 1, 'ai_inferred', 'diagnostic', 'dx-tanawat', null, '2026-07-30'),
  PE('per-tanawat', 'sk-genai', 1, 'ai_inferred', 'diagnostic', 'dx-tanawat', null, '2026-07-30'),
  // Wichai: outcome-verified BCD skills
  PE('per-wichai', 'sk-bizbuild', 4, 'outcome_verified', 'gate', 'gr-solar-3', 'BCD-2025-BB-01-L4', '2026-03-13'),
  PE('per-wichai', 'sk-invest', 3, 'outcome_verified', 'gate', 'gr-solar-2', 'BCD-2025-FIN-01-L3', '2025-09-19'),
  PE('per-wichai', 'sk-pitch', 3, 'outcome_verified', 'gate', 'gr-solar-2', 'BCD-2025-EXP-01-L3', '2025-09-19'),
  PE('per-wichai', 'sk-leadchange', 3, 'outcome_verified', 'gate', 'gr-solar-3', 'BCD-2025-LTC-01-L3', '2026-03-13'),
  // Warit / Mali
  PE('per-warit', 'sk-bizbuild', 3, 'ai_inferred', 'diagnostic', 'dx-warit', null, '2026-06-30'),
  PE('per-warit', 'sk-invest', 2, 'ai_inferred', 'diagnostic', 'dx-warit', null, '2026-06-30'),
  PE('per-warit', 'sk-pitch', 2, 'ai_inferred', 'diagnostic', 'dx-warit', null, '2026-06-30'),
  PE('per-warit', 'sk-bizbuild', 3, 'outcome_verified', 'gate', 'gr-fuel-1', 'BCD-L1-BB-01-L3', '2026-08-24'),
  PE('per-mali', 'sk-bizbuild', 2, 'outcome_verified', 'gate', 'gr-invoice-1', 'BCD-L1-BB-01-L2', '2026-08-24'),
  PE('per-mali', 'sk-pitch', 1, 'ai_inferred', 'diagnostic', 'dx-mali', null, '2026-06-30'),
  // Pim / Krit
  PE('per-pim', 'sk-genai', 1, 'ai_inferred', 'diagnostic', 'dx-pim', null, '2026-08-19'),
  PE('per-pim', 'sk-opex', 2, 'ai_inferred', 'diagnostic', 'dx-pim', null, '2026-08-19'),
  PE('per-krit', 'sk-datastory', 1, 'ai_inferred', 'diagnostic', 'dx-krit', null, '2026-08-19'),
  PE('per-krit', 'sk-changeplan', 2, 'ai_inferred', 'diagnostic', 'dx-krit', null, '2026-08-19'),
]

export const ledgerEntries: LedgerEntry[] = [
  { id: 'lg-arisa', personaId: 'per-arisa', buId: 'bu-cbm', sourceType: 'impact_contract', sourceId: 'ic-arisa', title: 'Packaging category switch (CBAM exposure)', objectiveType: 'cost_to_serve', claimedValueThb: 2_400_000, validatedValueThb: 2_400_000, sponsorId: 'per-prasert', status: 'validated', validatedAt: d('2026-07-31'), trackingUntil: '2027-07-31', auditNote: null, createdAt: d('2026-07-27') },
  { id: 'lg-jiraporn', personaId: 'per-jiraporn', buId: 'bu-cbm', sourceType: 'impact_contract', sourceId: 'ic-jiraporn', title: 'QA re-test cycle time', objectiveType: 'sla_turnaround', claimedValueThb: 1_100_000, validatedValueThb: null, sponsorId: 'per-prasert', status: 'pending_validation', validatedAt: null, trackingUntil: '2027-07-31', auditNote: null, createdAt: d('2026-07-27') },
  { id: 'lg-solar', personaId: 'per-wichai', buId: 'bu-scgc', sourceType: 'concept', sourceId: 'cp-solar', title: 'Solar rooftop leasing via dealers (Gate 3)', objectiveType: 'revenue_uplift', claimedValueThb: 120_000_000, validatedValueThb: 120_000_000, sponsorId: 'per-prasert', status: 'audited', validatedAt: d('2026-03-13'), trackingUntil: '2027-03-13', auditNote: 'Annual sample audit June 2026: contracted revenue confirmed against signed leases.', createdAt: d('2026-03-13') },
]

export const marketplaceRoles: MarketplaceRole[] = [
  { id: 'mr-incubation', title: 'Incubation lead · RDF supply marketplace (if funded at Gate 2)', buId: 'bu-cbm', kind: 'role', description: 'Lead the small-scale implementation for six months with a P&L owner.', openUntil: '2026-11-15', ownerId: 'per-prasert', requirements: [{ skillId: 'sk-bizbuild', minLevel: 3 }, { skillId: 'sk-invest', minLevel: 3 }, { skillId: 'sk-leadchange', minLevel: 2 }] },
  { id: 'mr-dealer-analytics', title: 'Dealer analytics gig · Central Region (3 months)', buId: 'bu-cbm', kind: 'gig', description: 'Build the weekly share-of-wallet dashboard for all regions using the lighthouse template.', openUntil: '2026-10-31', ownerId: 'per-kittipong', requirements: [{ skillId: 'sk-datastory', minLevel: 2 }, { skillId: 'sk-b2bsales', minLevel: 2 }, { skillId: 'sk-genai', minLevel: 2 }] },
  { id: 'mr-cafi-squad', title: 'Finance automation squad member', buId: 'bu-cafi', kind: 'project', description: 'Six-month squad delivering touchless invoicing for two BUs.', openUntil: '2026-12-15', ownerId: 'per-wanida', requirements: [{ skillId: 'sk-opex', minLevel: 2 }, { skillId: 'sk-genai', minLevel: 2 }, { skillId: 'sk-custneeds', minLevel: 2 }] },
  { id: 'mr-green-category', title: 'Category lead · Green materials procurement', buId: 'bu-cbm', kind: 'role', description: 'Own supplier strategy for low-CBAM-exposure categories.', openUntil: '2026-10-15', ownerId: 'per-prasert', requirements: [{ skillId: 'sk-green', minLevel: 3 }, { skillId: 'sk-valuechain', minLevel: 3 }, { skillId: 'sk-sustain', minLevel: 2 }] },
]

export const marketplaceInterests: MarketplaceInterest[] = [
  { id: 'mi-1', roleId: 'mr-green-category', personaId: 'per-arisa', createdAt: d('2026-08-15'), status: 'placed', placedAt: d('2026-09-01') },
  { id: 'mi-2', roleId: 'mr-incubation', personaId: 'per-warit', createdAt: d('2026-09-01'), status: 'expressed', placedAt: null },
]

const N = (id: string, personaId: string, title: string, body: string, link: string | null, createdAt: string, readAt: string | null = null): Notification => ({ id, personaId, kind: 'update', title, body, link, readAt, createdAt: d(createdAt) })

export const notifications: Notification[] = [
  N('nt-1', 'per-nara', 'Impact contract approved by sponsor', 'Prasert Vong-anan approved your impact contract. The sprint is active from 17 August.', '/contracts/ic-nara', '2026-08-20', d('2026-08-20')),
  N('nt-2', 'per-nara', 'Clinic 1 note from your coach', 'Anong Thepsiri added a coaching note after clinic 1.', '/contracts/ic-nara', '2026-09-11'),
  N('nt-3', 'per-nara', 'Mid-sprint gate on 25 September', 'Submit your evidence pack by 23 September so your manager and sponsor can review.', '/contracts/ic-nara', '2026-09-12'),
  N('nt-4', 'per-kittipong', 'Nara logged week 4 evidence', 'Share of wallet is trending at 33.1% against a 36% target.', '/contracts/ic-nara', '2026-09-11'),
  N('nt-5', 'per-somsak', 'Tanawat submitted the mid-gate evidence pack', 'Decide scale, pivot or reset before 25 September.', '/contracts/ic-tanawat', '2026-09-12'),
  N('nt-6', 'per-prasert', 'Gate 2 pre-read available for Touchless invoicing', 'Team Touchless submitted their Gate 2 case early.', '/concepts/cp-invoice', '2026-09-13'),
  N('nt-7', 'per-chatchai', 'Gate 2 pre-read submitted early', 'Team Touchless submitted the Gate 2 business case and recorded pitch.', '/concepts/cp-invoice', '2026-09-13'),
  N('nt-8', 'per-arisa', 'Badges minted to your skill passport', 'Three outcome-verified badges were minted after your showcase. Your talent profile is updated.', '/passport', '2026-07-31', d('2026-08-01')),
  N('nt-9', 'per-arisa', 'Shortlisted for Category lead · Green materials', 'Prasert Vong-anan shortlisted you based on verified passport skills.', '/marketplace', '2026-08-20'),
  N('nt-10', 'per-wanida', 'Brief returned by the committee', 'The committee returned "Dealer digital ordering" with a request for a THB target.', '/briefs/cb-ordering', '2026-09-10'),
  N('nt-11', 'per-supattra', 'Brief approved: Low-carbon cement for CBAM markets', 'Assign the approved brief to BCD Batch 1/2027.', '/briefs/cb-cbam', '2026-09-11'),
  N('nt-12', 'per-warit', 'Gate 2 pre-read due 9 October', 'Your coach flagged that the best / worst case model has not started.', '/concepts/cp-fuel', '2026-09-09'),
  N('nt-13', 'per-anong', 'AI coach flags for clinic 2', 'Two learners in ABC Lighthouse 1 are flagged for follow-up.', '/coaching', '2026-09-12'),
]

export const coachMessages: CoachMessage[] = [
  { id: 'cm-1', personaId: 'per-nara', sender: 'user', lang: 'th', content: 'สัปดาห์นี้ต้องส่งอะไรบ้างสำหรับ mid-sprint gate?', citedModuleId: null, createdAt: d('2026-09-12') },
  { id: 'cm-2', personaId: 'per-nara', sender: 'coach', lang: 'th', content: 'สำหรับ Mid-sprint gate วันที่ 25 กันยายน คุณต้องส่ง evidence pack ภายในวันที่ 23 กันยายน ประกอบด้วย 1) ค่า baseline และค่าปัจจุบันของ share of wallet 2) หลักฐานการทำงานรายสัปดาห์ 5 สัปดาห์ 3) ข้อเสนอว่าจะ scale, pivot หรือ reset ดูตัวอย่างได้ในโมดูล CHG-01.2 "Weekly evidence cadence"', citedModuleId: 'mod-changeplan-2', createdAt: d('2026-09-12') },
  { id: 'cm-3', personaId: 'per-nara', sender: 'user', lang: 'en', content: 'How do I present the baseline so the sponsor trusts it?', citedModuleId: null, createdAt: d('2026-09-12') },
  { id: 'cm-4', personaId: 'per-nara', sender: 'coach', lang: 'en', content: 'State the data source (CRM export, confirmed with the credit team on 21 August), the period (12 weeks before the sprint), and the calculation. Then show the weekly trend from 31.0% to 33.1% next to the 36% target. Module OPEX-01.3 "Presenting a baseline and target" has a one-slide template.', citedModuleId: 'mod-datastory-3', createdAt: d('2026-09-12') },
]

export const recordEvents: RecordEvent[] = [
  { id: 'rev-1', recordType: 'impact_contract', recordId: 'ic-nara', actorId: 'per-nara', action: 'submit', fromStatus: 'draft', toStatus: 'manager_review', note: null, createdAt: d('2026-08-14') },
  { id: 'rev-2', recordType: 'impact_contract', recordId: 'ic-nara', actorId: 'per-kittipong', action: 'manager_approve', fromStatus: 'manager_review', toStatus: 'sponsor_review', note: 'Good scope. Keep the credit team involved.', createdAt: d('2026-08-17') },
  { id: 'rev-3', recordType: 'impact_contract', recordId: 'ic-nara', actorId: 'per-prasert', action: 'sponsor_approve', fromStatus: 'sponsor_review', toStatus: 'active', note: 'Approved. THB 4.2M target agreed.', createdAt: d('2026-08-20') },
  { id: 'rev-4', recordType: 'impact_contract', recordId: 'ic-tanawat', actorId: 'per-tanawat', action: 'submit', fromStatus: 'draft', toStatus: 'manager_review', note: null, createdAt: d('2026-08-14') },
  { id: 'rev-5', recordType: 'impact_contract', recordId: 'ic-tanawat', actorId: 'per-somsak', action: 'manager_approve', fromStatus: 'manager_review', toStatus: 'sponsor_review', note: null, createdAt: d('2026-08-17') },
  { id: 'rev-6', recordType: 'impact_contract', recordId: 'ic-tanawat', actorId: 'per-prasert', action: 'sponsor_approve', fromStatus: 'sponsor_review', toStatus: 'active', note: null, createdAt: d('2026-08-19') },
  { id: 'rev-7', recordType: 'impact_contract', recordId: 'ic-tanawat', actorId: 'per-tanawat', action: 'submit_mid_gate', fromStatus: 'active', toStatus: 'mid_gate_review', note: 'Requesting scale to Line 1.', createdAt: d('2026-09-12') },
  { id: 'rev-8', recordType: 'impact_contract', recordId: 'ic-boonchu', actorId: 'per-boonchu', action: 'submit', fromStatus: 'draft', toStatus: 'manager_review', note: null, createdAt: d('2026-09-04') },
  { id: 'rev-9', recordType: 'impact_contract', recordId: 'ic-boonchu', actorId: 'per-somsak', action: 'return', fromStatus: 'manager_review', toStatus: 'returned', note: 'Add the THB value of the target and name the logistics partner who will confirm the baseline.', createdAt: d('2026-09-08') },
  { id: 'rev-10', recordType: 'impact_contract', recordId: 'ic-pim', actorId: 'per-pim', action: 'submit', fromStatus: 'draft', toStatus: 'manager_review', note: null, createdAt: d('2026-09-10') },
  { id: 'rev-11', recordType: 'impact_contract', recordId: 'ic-krit', actorId: 'per-krit', action: 'submit', fromStatus: 'draft', toStatus: 'manager_review', note: null, createdAt: d('2026-09-09') },
  { id: 'rev-12', recordType: 'impact_contract', recordId: 'ic-krit', actorId: 'per-ratree', action: 'manager_approve', fromStatus: 'manager_review', toStatus: 'sponsor_review', note: null, createdAt: d('2026-09-11') },
  { id: 'rev-13', recordType: 'impact_contract', recordId: 'ic-arisa', actorId: 'per-prasert', action: 'validate', fromStatus: 'showcase_review', toStatus: 'validated', note: 'THB 2.4M validated against category invoices.', createdAt: d('2026-07-31') },
  { id: 'rev-14', recordType: 'impact_contract', recordId: 'ic-jiraporn', actorId: 'per-jiraporn', action: 'submit_showcase', fromStatus: 'active', toStatus: 'showcase_review', note: null, createdAt: d('2026-07-27') },
  { id: 'rev-15', recordType: 'challenge_brief', recordId: 'cb-logistics', actorId: 'per-prasert', action: 'submit', fromStatus: 'draft', toStatus: 'committee_review', note: null, createdAt: d('2026-09-08') },
  { id: 'rev-16', recordType: 'challenge_brief', recordId: 'cb-close', actorId: 'per-wanida', action: 'submit', fromStatus: 'draft', toStatus: 'committee_review', note: null, createdAt: d('2026-09-09') },
  { id: 'rev-17', recordType: 'challenge_brief', recordId: 'cb-cbam', actorId: 'per-chatchai', action: 'approve', fromStatus: 'committee_review', toStatus: 'approved', note: 'Approved. Program office to assign to BCD Batch 1/2027.', createdAt: d('2026-09-11') },
  { id: 'rev-18', recordType: 'challenge_brief', recordId: 'cb-ordering', actorId: 'per-ploy', action: 'return', fromStatus: 'committee_review', toStatus: 'returned', note: 'Add a THB target value and confirm which BU P&L owns the benefit.', createdAt: d('2026-09-10') },
  { id: 'rev-19', recordType: 'challenge_brief', recordId: 'cb-office', actorId: 'per-chatchai', action: 'reject', fromStatus: 'committee_review', toStatus: 'rejected', note: 'Not anchored to a BU P&L priority.', createdAt: d('2026-09-05') },
  { id: 'rev-20', recordType: 'concept', recordId: 'cp-invoice', actorId: 'per-mali', action: 'submit_gate_evidence', fromStatus: 'build_case', toStatus: 'gate2', note: 'Gate 2 pre-read and recorded pitch submitted.', createdAt: d('2026-09-13') },
  { id: 'rev-21', recordType: 'concept', recordId: 'cp-fuel', actorId: 'per-chatchai', action: 'gate_decision', fromStatus: 'gate1', toStatus: 'build_case', note: 'Gate 1: Go.', createdAt: d('2026-08-24') },
  { id: 'rev-22', recordType: 'concept', recordId: 'cp-pack', actorId: 'per-chatchai', action: 'gate_decision', fromStatus: 'gate1', toStatus: 'pivot', note: 'Gate 1: Pivot to take-back scheme.', createdAt: d('2026-08-24') },
  { id: 'rev-23', recordType: 'ledger_entry', recordId: 'lg-arisa', actorId: 'per-prasert', action: 'validate', fromStatus: 'pending_validation', toStatus: 'validated', note: null, createdAt: d('2026-07-31') },
  { id: 'rev-24', recordType: 'ledger_entry', recordId: 'lg-solar', actorId: 'per-supattra', action: 'audit', fromStatus: 'validated', toStatus: 'audited', note: 'Annual sample audit June 2026.', createdAt: d('2026-06-20') },
]

const G = (id: string, buId: string, valuePool: string, criticalRole: string, skillId: string, futureSkillNote: string, supplyFte: number, demandFte: number, thbValueAtRisk: number, decision: CapabilityGap['decision'] = 'undecided', funded = false): CapabilityGap => ({ id, buId, valuePool, criticalRole, skillId, futureSkillNote, supplyFte, demandFte, thbValueAtRisk, decision, funded, decidedById: decision === 'undecided' ? null : 'per-supattra', decidedAt: decision === 'undecided' ? null : d('2026-08-28') })
export const capabilityGaps: CapabilityGap[] = [
  G('gap-cbm-1', 'bu-cbm', 'Dealer share of wallet (THB 1.2B margin pool)', 'Regional sales lead', 'sk-b2bsales', 'AI-assisted segmentation and offer design across 400 dealers', 6, 18, 180_000_000, 'build', true),
  G('gap-cbm-2', 'bu-cbm', 'Kiln fuel cost (THB 900M/yr)', 'Plant operations supervisor', 'sk-opex', 'Data-driven OpEx routines on downtime and fuel substitution', 9, 22, 140_000_000, 'build', true),
  G('gap-cbm-3', 'bu-cbm', 'Low-carbon export premium', 'Green materials category lead', 'sk-green', 'CBAM exposure modelling and green option pricing', 2, 8, 80_000_000, 'borrow'),
  G('gap-cbm-4', 'bu-cbm', 'Dealer logistics cost-to-serve', 'Logistics planner', 'sk-decision', 'Route and backhaul decisions on shared data', 4, 10, 35_000_000),
  G('gap-cafi-1', 'bu-cafi', 'Transactional finance productivity', 'AP / AR team lead', 'sk-genai', 'GenAI exception handling and supplier self-service', 5, 30, 60_000_000, 'bot', true),
  G('gap-cafi-2', 'bu-cafi', 'Service level excellence', 'Service desk lead', 'sk-custneeds', 'Internal customer needs discovery and SLA design', 3, 12, 25_000_000, 'build'),
  G('gap-cafi-3', 'bu-cafi', 'Month-end close', 'Finance systems analyst', 'sk-datastory', 'Close analytics and exception narratives', 4, 9, 12_000_000),
  G('gap-scgp-1', 'bu-scgp', 'Recyclable packaging growth', 'B2B2C proposition lead', 'sk-greendesign', 'Green proposition design validated with brands', 2, 6, 60_000_000, 'buy'),
  G('gap-scgc-1', 'bu-scgc', 'Clean energy ventures', 'Incubation lead', 'sk-bizbuild', 'Business building from concept to Gate 3', 3, 6, 100_000_000, 'build', true),
]

export const labAttendance: LabAttendance[] = [
  { id: 'la-nara-1', enrollmentId: 'enr-nara', labDay: 1, attendedAt: d('2026-08-10'), reflection: 'Mapped sales, credit and logistics around the dealer promise.' },
  { id: 'la-nara-2', enrollmentId: 'enr-nara', labDay: 2, attendedAt: d('2026-08-11'), reflection: null },
  { id: 'la-nara-3', enrollmentId: 'enr-nara', labDay: 3, attendedAt: d('2026-08-12'), reflection: 'Built the share-of-wallet baseline chart from the CRM export.' },
  { id: 'la-nara-4', enrollmentId: 'enr-nara', labDay: 4, attendedAt: d('2026-08-13'), reflection: 'Agreed the impact contract with Kittipong and Prasert.' },
  { id: 'la-tanawat-1', enrollmentId: 'enr-tanawat', labDay: 1, attendedAt: d('2026-08-10'), reflection: null },
  { id: 'la-tanawat-3', enrollmentId: 'enr-tanawat', labDay: 3, attendedAt: d('2026-08-12'), reflection: 'Downtime log analytics baseline.' },
  { id: 'la-tanawat-4', enrollmentId: 'enr-tanawat', labDay: 4, attendedAt: d('2026-08-13'), reflection: null },
  { id: 'la-pim-1', enrollmentId: 'enr-pim', labDay: 1, attendedAt: d('2026-08-31'), reflection: null },
]

export const integrationRuns: IntegrationRun[] = [
  { id: 'ir-1', system: 'hr_core', direction: 'outbound', status: 'succeeded', records: 4, summary: 'Talent profile sync: 4 outcome-verified badges pushed for 2 people.', payload: [{ person: 'Arisa Chaiyaporn', badge: 'ABC-A0-COMM-02-L3' }, { person: 'Arisa Chaiyaporn', badge: 'ABC-A0-COMM-01-L3' }, { person: 'Arisa Chaiyaporn', badge: 'ABC-A0-CHG-01-L3' }, { person: 'Wichai Kongkaew', badge: 'BCD-2025-BB-01-L4' }], triggeredBy: 'per-supattra', startedAt: d('2026-08-01'), finishedAt: d('2026-08-01') },
  { id: 'ir-2', system: 'finance_actuals', direction: 'inbound', status: 'succeeded', records: 2, summary: 'P&L actuals matched against 2 validated ledger entries; no variance above 10%.', payload: [{ entry: 'Packaging category switch (CBAM exposure)', validatedThb: 2400000, actualThb: 2310000, variance: '-3.8%' }, { entry: 'Solar rooftop leasing via dealers (Gate 3)', validatedThb: 120000000, actualThb: 118500000, variance: '-1.3%' }], triggeredBy: 'per-supattra', startedAt: d('2026-09-01'), finishedAt: d('2026-09-01') },
  { id: 'ir-3', system: 'notifications', direction: 'outbound', status: 'failed', records: 0, summary: 'LINE Official Account delivery failed: token expired. Email fallback delivered 6 of 6.', payload: [{ channel: 'LINE', delivered: 0, failed: 6 }, { channel: 'Email', delivered: 6, failed: 0 }], triggeredBy: 'per-supattra', startedAt: d('2026-09-08'), finishedAt: d('2026-09-08') },
]

export const costLines: CostLine[] = [
  { id: 'cl-a0-1', cohortId: 'coh-abc-a0', category: 'design', description: 'Journey redesign and module authoring (one-off, amortised over 2026 cohorts)', amountThb: 600_000, recordedBy: 'per-supattra', recordedAt: d('2026-04-06') },
  { id: 'cl-a0-2', cohortId: 'coh-abc-a0', category: 'delivery', description: 'Four lab days, facilitation and materials, 24 learners', amountThb: 720_000, recordedBy: 'per-supattra', recordedAt: d('2026-04-20') },
  { id: 'cl-a0-3', cohortId: 'coh-abc-a0', category: 'coaching', description: 'Certified coach time, clinics and sprint support', amountThb: 300_000, recordedBy: 'per-supattra', recordedAt: d('2026-07-24') },
  { id: 'cl-a0-4', cohortId: 'coh-abc-a0', category: 'platform', description: 'AI platform licences and GenAI usage, 24 seats', amountThb: 180_000, recordedBy: 'per-supattra', recordedAt: d('2026-07-24') },
  { id: 'cl-l1-1', cohortId: 'coh-abc-l1', category: 'delivery', description: 'Four lab days, facilitation and venue, 30 learners', amountThb: 900_000, recordedBy: 'per-supattra', recordedAt: d('2026-08-10') },
  { id: 'cl-l1-2', cohortId: 'coh-abc-l1', category: 'coaching', description: 'Coach certification and clinic delivery', amountThb: 420_000, recordedBy: 'per-supattra', recordedAt: d('2026-08-17') },
  { id: 'cl-l1-3', cohortId: 'coh-abc-l1', category: 'platform', description: 'AI platform licences and GenAI usage, 30 seats', amountThb: 225_000, recordedBy: 'per-supattra', recordedAt: d('2026-08-17') },
  { id: 'cl-l1-4', cohortId: 'coh-abc-l1', category: 'travel', description: 'Travel and accommodation for lab week', amountThb: 310_000, recordedBy: 'per-supattra', recordedAt: d('2026-08-13') },
  { id: 'cl-l2-1', cohortId: 'coh-abc-l2', category: 'delivery', description: 'Four lab days, CAFI service teams', amountThb: 840_000, recordedBy: 'per-supattra', recordedAt: d('2026-08-31') },
  { id: 'cl-l2-2', cohortId: 'coh-abc-l2', category: 'coaching', description: 'Coach time and async clinics', amountThb: 380_000, recordedBy: 'per-supattra', recordedAt: d('2026-09-07') },
  { id: 'cl-l2-3', cohortId: 'coh-abc-l2', category: 'platform', description: 'AI platform licences, 30 seats', amountThb: 225_000, recordedBy: 'per-supattra', recordedAt: d('2026-09-07') },
  { id: 'cl-bcd-1', cohortId: 'coh-bcd-l1', category: 'delivery', description: 'Immersion camp, concept studio and field validation support', amountThb: 2_400_000, recordedBy: 'per-supattra', recordedAt: d('2026-07-06') },
  { id: 'cl-bcd-2', cohortId: 'coh-bcd-l1', category: 'coaching', description: 'Async certified coaching across five stages', amountThb: 1_100_000, recordedBy: 'per-supattra', recordedAt: d('2026-08-31') },
  { id: 'cl-bcd-3', cohortId: 'coh-bcd-l1', category: 'platform', description: 'AI platform and research tooling', amountThb: 480_000, recordedBy: 'per-supattra', recordedAt: d('2026-08-31') },
  { id: 'cl-bcd-4', cohortId: 'coh-bcd-2025', category: 'delivery', description: 'Pilot cohort delivery and gates', amountThb: 3_200_000, recordedBy: 'per-supattra', recordedAt: d('2025-10-17') },
  { id: 'cl-bcd-5', cohortId: 'coh-bcd-2025', category: 'coaching', description: 'Coaching spine, pilot cohort', amountThb: 900_000, recordedBy: 'per-supattra', recordedAt: d('2025-10-17') },
]

export const roleBlueprints: RoleBlueprint[] = [
  { id: 'rb-cbm-plant', buId: 'bu-cbm', roleTitle: 'Plant Performance Lead (new operating model)', level: 'L4', operatingModelChange: 'CBM moves from plant-by-plant reporting to a regional performance cell. The role owns cost per tonne across three plants and runs a daily data-led routine instead of monthly reviews.', responsibilities: 'Own cost per tonne and unplanned downtime across three plants; run the daily performance routine; lead alternative-fuel substitution; coach shift supervisors on data use.', headcount: 6, status: 'adopted', model: 'claude-opus-5', createdBy: 'per-supattra', createdAt: d('2026-08-28'), adoptedAt: d('2026-08-29'),
    generated: { valuePool: 'Cement cost per tonne across the Saraburi cluster', summary: 'The new role shifts judgement from monthly review to daily data-led decisions across three plants. The binding gaps are data storytelling and OpEx quantification at Level 3, with GenAI copilot practice as the enabler; green economics matters only for the fuel mix decision.',
      skills: [
        { skillCode: 'OPEX-02', targetLevel: 4, why: 'Owns cost per tonne across three plants and must quantify waste in THB, not hours.', supplyFte: 2, demandFte: 6, thbValueAtRisk: 90_000_000, decision: 'build' },
        { skillCode: 'OPEX-01', targetLevel: 3, why: 'The daily routine only works if the performance story is readable by shift teams.', supplyFte: 1, demandFte: 6, thbValueAtRisk: 45_000_000, decision: 'build' },
        { skillCode: 'AI-01', targetLevel: 3, why: 'Daily cadence is only affordable with copilot-assisted analysis and handover.', supplyFte: 1, demandFte: 6, thbValueAtRisk: 30_000_000, decision: 'build' },
        { skillCode: 'COMM-02', targetLevel: 2, why: 'Fuel mix choices now carry a carbon cost that the role must weigh.', supplyFte: 0, demandFte: 6, thbValueAtRisk: 25_000_000, decision: 'borrow' },
      ],
      cohortPlan: { program: 'ABC', seats: 6, startQuarter: 'Q1 2027', rationale: 'Six holders of one critical role, same gaps: one ABC wave with a shared impact contract theme on cost per tonne.' },
      risks: ['Shift patterns limit lab attendance; run labs in two half-cohorts.', 'Plant data access must be granted before the sprint or baselines slip.'] } },
]

export const policyItems: PolicyItem[] = [
  { id: 'pol-roi', name: 'ROI-tracking policy', description: 'Targeted objectives are set on day one for every learner and cohort; delivered value is sponsor-validated into the impact ledger and tracked 6–12 months.', status: 'approved', effectiveFrom: '2027-01-01', resolutionRef: 'PC-2026-11', owner: 'CHR / Capability Development', decidedBy: 'per-chatchai', decidedAt: d('2026-08-14'), note: 'Approved as part of the MTP 2027 policy pack.' },
  { id: 'pol-promo', name: 'Skills-based promotion criteria', description: 'Each role level defines required verified skills; promotion cases must cite skill passport evidence.', status: 'submitted', effectiveFrom: '2027-01-01', resolutionRef: null, owner: 'Rewards & Career', decidedBy: null, decidedAt: null, note: 'With the People Committee for the Q2 resolution.' },
  { id: 'pol-premium', name: 'Skill premiums for critical skills', description: 'Verified passport skills on the annual critical-skill list qualify for skill-premium consideration in the merit cycle.', status: 'submitted', effectiveFrom: '2027-04-01', resolutionRef: null, owner: 'Rewards & Career', decidedBy: null, decidedAt: null, note: 'Requires the critical-skill list to be refreshed first.' },
  { id: 'pol-incentive', name: 'Value-linked incentives', description: 'Sponsor-validated impact and funded Gate-2 concepts feed recognition and value-linked bonuses.', status: 'drafted', effectiveFrom: null, resolutionRef: null, owner: 'Rewards & Career', decidedBy: null, decidedAt: null, note: 'Draft pending finance review of the ledger audit trail.' },
  { id: 'pol-pdpa', name: 'Responsible-AI and PDPA standard', description: 'Retrieval-grounded content only, PDPA-compliant processing, human-in-the-loop for career decisions, full telemetry for re-personalisation.', status: 'approved', effectiveFrom: '2026-09-01', resolutionRef: 'PC-2026-09', owner: 'CHR digital / Legal', decidedBy: 'per-chatchai', decidedAt: d('2026-08-14'), note: 'Standing operating standard for the AI platform suite.' },
]

export const pods: Pod[] = [
  { id: 'pod-l1-a', cohortId: 'coh-abc-l1', name: 'Pod A · CBM turnaround', coachId: 'per-anong' },
  { id: 'pod-l2-a', cohortId: 'coh-abc-l2', name: 'Pod A · CAFI services', coachId: 'per-decha' },
]

export const practiceSessions: PracticeSession[] = [
  { id: 'ps-warit-1', personaId: 'per-warit', scenario: 'Gate 2 investment pitch, six minutes', overall: 3.4, model: 'claude-opus-5', createdAt: d('2026-09-10'),
    transcript: [{ role: 'partner', text: 'You have six minutes with the committee. Start.' }, { role: 'learner', text: 'Our concept builds an RDF supply marketplace so kilns reach 35% substitution...' }],
    scores: [{ criterion: 'Problem and value stated first', score: 4, comment: 'Clear THB value in the opening line.' }, { criterion: 'Evidence quality', score: 4, comment: 'Interview count and pilot contracts cited.' }, { criterion: 'Business case and best / worst case', score: 2, comment: 'No payback period and no downside case.' }, { criterion: 'The ask', score: 3, comment: 'Amount given, but not what it buys or when.' }] },
]

export const talentReviews: TalentReview[] = []
export const successionEntries: SuccessionEntry[] = [
  { id: 'se-wichai', personaId: 'per-wichai', pool: 'incubation_lead', basis: 'Gate 3 scale decision on Solar rooftop leasing; leads the venture under SCG Start the Dot.', enteredBy: 'per-chatchai', enteredAt: d('2026-03-13'), dueBy: '2026-09-13', fulfilledAt: d('2026-04-01') },
  { id: 'se-arisa', personaId: 'per-arisa', pool: 'L3', basis: 'ABC top decile with three outcome-verified badges and THB 2.4M validated impact.', enteredBy: 'per-supattra', enteredAt: d('2026-08-05'), dueBy: null, fulfilledAt: null },
]

export const recognitions: Recognition[] = [
  { id: 'rc-arisa', personaId: 'per-arisa', kind: 'ceo_showcase', note: 'CEO recognition at the Alpha pilot showcase for the CBAM-exposure category switch.', givenBy: 'per-chatchai', givenAt: d('2026-07-31') },
  { id: 'rc-wichai', personaId: 'per-wichai', kind: 'gate2', note: 'CEO recognition at Gate 2 for the solar dealer leasing investment case.', givenBy: 'per-chatchai', givenAt: d('2025-09-19') },
]

export const governanceReviews: GovernanceReview[] = [
  { id: 'gv-tax-q3', area: 'taxonomy', cycle: 'Q3 2026', note: 'Quarterly taxonomy review with function experts: level descriptors sharpened for OpEx and GenAI; no skills retired.', itemsReviewed: 18, reviewedBy: 'per-supattra', reviewedAt: d('2026-07-15'), nextDue: '2026-10-15' },
  { id: 'gv-crit-2026', area: 'critical_skills', cycle: '2026 annual', note: 'People Committee refreshed the critical-skill list: AI, green commercial and business building confirmed as premium-eligible.', itemsReviewed: 7, reviewedBy: 'per-chatchai', reviewedAt: d('2026-06-20'), nextDue: '2027-06-20' },
  { id: 'gv-agenda-2026', area: 'capability_agenda', cycle: 'MTP 2027 cycle', note: 'Value-to-skills cascade run with CBM and CAFI BU heads; SCGP and SCGC scheduled for Q4.', itemsReviewed: 9, reviewedBy: 'per-supattra', reviewedAt: d('2026-08-28'), nextDue: '2027-08-28' },
]

export const planMilestones: PlanMilestone[] = [
  { id: 'ms-11', subPlan: '1.1', milestone: 'Five components live as one operating system; AI platform suite deployed', owner: 'CHR / IRIS', dueQuarter: 'Q1 2027', status: 'on_track', note: 'Two lighthouses running; SCGP and SCGC onboarding in Q4 2026.', updatedBy: 'per-supattra', updatedAt: d('2026-09-01') },
  { id: 'ms-12', subPlan: '1.2', milestone: 'New ABC live from Batch 1/2027; all graduates hold verified skill passports', owner: 'Capability Development', dueQuarter: 'Q2 2027', status: 'on_track', note: 'Alpha pilot graduated with verified passports; Batch 1/2027 calendar published.', updatedBy: 'per-supattra', updatedAt: d('2026-09-01') },
  { id: 'ms-13', subPlan: '1.3', milestone: '≥70% of concepts pass Gate 1; funded concepts incubating with P&L owners', owner: 'Capability Dev / BU Sponsors', dueQuarter: 'Q3 2027', status: 'at_risk', note: 'Gate 1 pass rate is on target, but only one concept is funded and incubating so far.', updatedBy: 'per-chatchai', updatedAt: d('2026-09-05') },
  { id: 'ms-14', subPlan: '1.4', milestone: 'Capability–career–reward loop operational; impact dashboard live', owner: 'CHR / Rewards & Career', dueQuarter: 'Q4 2027', status: 'at_risk', note: 'Dashboard is live; promotion criteria and premium policy still with the People Committee.', updatedBy: 'per-supattra', updatedAt: d('2026-09-05') },
]

export const assessments: Assessment[] = []
export const guidanceNotes: GuidanceNote[] = []

export const fixtureBundle = {
  businessUnits, personas, skillDomains, skills, learningModules, cohorts, enrollments, diagnostics, diagnosticItems,
  learningPlanItems, impactContracts, sprintEvidence, challengeThemes, challengeBriefs, teams, concepts, gateReviews,
  coachingClinics, coachingNotes, coachScorecards, passportEntries, ledgerEntries, marketplaceRoles, marketplaceInterests,
  notifications, coachMessages, recordEvents, assessments, guidanceNotes, capabilityGaps, labAttendance, integrationRuns,
  costLines, roleBlueprints, policyItems, pods, practiceSessions, talentReviews, successionEntries, recognitions, governanceReviews, planMilestones,
}
export type FixtureBundle = typeof fixtureBundle
