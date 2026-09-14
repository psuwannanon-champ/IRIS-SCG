// Strategic plan content from the MTP 2027 deck (People Strategic Plan Formulation, 2 Aug 2026). Static reference; KPI values are computed live where the platform tracks them.
export interface SubPlan { code: string; title: string; keyActions: string[]; whereToPlay: string[]; kpi: string; kpiKey: 'bus_onboarded' | 'learners_closing_gaps' | 'concepts_gate_approved' | 'graduates_profiles' | null; outcomes: string[]; milestone: string; owner: string }
export const SUB_PLANS: SubPlan[] = [
  { code: '1.1', title: 'Modernized Capability Transformation Strategy', keyActions: ['Adopt the five core components as one system', 'Deploy first to turnaround (CBM) and shared-service (CAFI) priorities'], whereToPlay: ['Enterprise-wide', 'First deployments at CBM and CAFI'], kpi: '% BUs onboarded to the strategy and AI platform suite', kpiKey: 'bus_onboarded', outcomes: ['Five components live as one operating system', 'AI platform suite deployed'], milestone: 'Q1 2027', owner: 'CHR / IRIS' },
  { code: '1.2', title: 'Modernize ABC · Skills-First Capability Accelerator', keyActions: ['AI diagnostics personalize journeys; labs run on real AI tools', '90-day sprint delivers agreed practical improvements in current roles'], whereToPlay: ['Supervisor and middle-manager cohorts', 'Pilot two BUs, then scale'], kpi: '% learners closing prioritized skill gaps; % completing the sprint', kpiKey: 'learners_closing_gaps', outcomes: ['New ABC live from Batch 1/2027', 'All graduates hold verified skill passports'], milestone: 'Q2 2027', owner: 'Capability Development' },
  { code: '1.3', title: 'Modernize BCD · Business Competitiveness Accelerator', keyActions: ['Challenges span growth, cost, service and productivity, gated like investments', 'Gate-3 winners scale via SCG Start the Dot or internal high impact'], whereToPlay: ['Supervisor L3–4 high-potentials', 'Concepts anchored to BU P&L priorities'], kpi: '# concepts gate-approved; THB value of validated pipeline', kpiKey: 'concepts_gate_approved', outcomes: ['≥70% of concepts pass Gate 1', 'Funded concepts incubating with P&L owners'], milestone: 'Q3 2027', owner: 'Capability Dev / BU Sponsors' },
  { code: '1.4', title: 'Wire Capability to Career, Rewards & Impact Governance', keyActions: ['Verified skills drive skills-based progression and the talent marketplace', 'Rewards link to delivered impact; THB pipeline reported to People Committee'], whereToPlay: ['All graduates', 'Integrated with Theme: Role & Skills-based Career Progression and Rewards'], kpi: '% graduates with updated skill profiles; % promotions citing verified skills', kpiKey: 'graduates_profiles', outcomes: ['Capability–career–reward loop operational', 'Impact dashboard live'], milestone: 'Q4 2027', owner: 'CHR / Rewards & Career' },
]
export interface Component { n: string; title: string; summary: string; actions: { title: string; points: string[]; platform: string }[] }
export const COMPONENTS: Component[] = [
  { n: '01', title: 'Value-Led Capability Agenda', summary: 'Start from strategy, not courses: strategic workforce planning translates the value agenda into critical P&L-driven future skills.', actions: [
    { title: 'Run a value-to-skills cascade with every BU head', points: ['Decompose the MTP value agenda into value pools, critical roles and P&L-driven future skills', 'Refresh annually within the MTP cycle'], platform: 'Capability agenda' },
    { title: 'Quantify gaps; decide build / buy / borrow / bot', points: ['Model 3-year skill supply vs demand and THB value at stake per gap', 'Fund the biggest value-at-risk gaps first, governed like capex'], platform: 'Capability agenda' },
    { title: 'Put capability OKRs on leader scorecards, leaders first', points: ['BU targets (% critical roles skill-ready, THB pipeline) reviewed quarterly', 'Leaders and influencers go first, then scale to a critical mass (~25%)'], platform: 'Impact dashboard · by business unit' } ] },
  { n: '02', title: 'Skills-First Talent Core', summary: 'Org-wide AI assessment, one skills taxonomy and verified passports as the common currency.', actions: [
    { title: 'Stand up one enterprise skills taxonomy with AI inference', points: ['~100 critical skills at four proficiency levels, AI-inferred from work data', 'Validated by function experts; governed centrally, refreshed quarterly'], platform: 'Skills taxonomy' },
    { title: 'Baseline the organization in waves; passport from day one', points: ['Org-wide AI assessment, starting with CBM and CAFI', 'Verification tiers: self-declared → AI-inferred → outcome-verified'], platform: 'Assessment · Skill passport' },
    { title: 'Rewire talent processes to read skills, not titles', points: ['Staffing, promotion, succession and marketplace consume passport data', 'Role-level skill requirements published transparently'], platform: 'Talent marketplace · Role requirements on the passport' } ] },
  { n: '03', title: 'Business-Impact Accelerators', summary: 'Journeys built on real work and governed like investments: ABC lifts individuals; BCD puts key talent on strategic projects.', actions: [
    { title: 'Charter a Capability Investment Committee', points: ['Curates BU-head themes and approves every challenge brief', 'Runs Gates 1–3; manages the portfolio to a THB pipeline target'], platform: 'Challenge briefs · Concepts & gates' },
    { title: 'Industrialize ABC and BCD into repeatable playbooks', points: ['Cohort calendar, sponsor kit, coach certification and async formats codified', 'Any BU runs the accelerators without redesign'], platform: 'Cohorts · Coaching workspace' },
    { title: 'Contract impact before learning; track it after', points: ['Targeted objectives signed with sponsors on day one', 'Delivery tracked 6–12 months on the platform into the impact ledger'], platform: 'Impact contracts · Impact ledger' } ] },
  { n: '04', title: 'One AI-Powered Platform Suite', summary: 'A single suite spanning capability transformation, career and talent marketplace, and personalization and coaching.', actions: [
    { title: 'Deploy one integrated stack on one skills data model', points: ['Mapping, marketplace, personalization and coaching share one taxonomy', 'Integrated with HR core as the single source of truth'], platform: 'This platform (HR core sync proposed)' },
    { title: 'Prove value with two 90-day lighthouses, then scale in waves', points: ['Start with CBM turnaround roles and CAFI service teams', 'Publish before / after uplift dashboards to create pull for rollout'], platform: 'Cohorts · Impact dashboard · skill uplift' },
    { title: 'Install responsible-AI guardrails as an operating standard', points: ['Retrieval-grounded content, PDPA compliance, human-in-the-loop career calls', 'Full telemetry feeds continuous re-personalization'], platform: 'Expert Guidance guardrails' } ] },
  { n: '05', title: 'Career, Rewards & Impact Governance', summary: 'Skill passport and impact ledger wired to progression, premiums and succession; THB impact reported to the People Committee.', actions: [
    { title: 'Approve the policy pack in one People Committee resolution', points: ['ROI tracking, skills-based promotion criteria, premiums, value-linked incentives', 'Effective from Batch 1/2027, before the first cohort graduates'], platform: 'Policy decisions outside the platform; triggers shown on the dashboard' },
    { title: 'Publish the career deal so employees see the payoff', points: ['Transparent role-level skill requirements and open marketplace access', 'Visible proof stories: passport-cited promotions, Gate-3 scale-up roles'], platform: 'Skill passport · Talent marketplace' },
    { title: 'Run quarterly impact governance with an audited ledger', points: ['Dashboard tracks skill uplift, THB ledger, mobility and retention', 'Annual sample audit keeps reported ROI honest'], platform: 'Impact dashboard · Impact ledger audit' } ] },
]
export const ENABLERS: { when: string; what: string }[] = [
  { when: 'Q1 2027', what: 'ROI-tracking policy sets targeted objectives from day one' },
  { when: 'Q1 2027', what: 'Skills taxonomy and passport live in HR systems' },
  { when: 'Q2 2027', what: 'Rewards policy approved by People Committee' },
  { when: 'Q3 2027', what: 'Impact-ledger dashboard at scale on the AI platform' },
  { when: 'Q1 2028', what: 'First skills-informed merit cycle' },
]
/** Proposed role-level skill requirements (the published "career deal"). Configuration to be confirmed by CHR. */
export interface RoleLadder { family: string; match: (jobTitle: string, functionType: 'business' | 'enabling') => boolean; levels: Record<string, { skillId: string; minLevel: number }[]> }
export const ROLE_LADDERS: RoleLadder[] = [
  { family: 'Commercial and sales', match: (t) => /sales|commercial|business development|dealer/i.test(t), levels: { L4: [{ skillId: 'sk-b2bsales', minLevel: 3 }, { skillId: 'sk-valuechain', minLevel: 3 }, { skillId: 'sk-datastory', minLevel: 3 }, { skillId: 'sk-collab', minLevel: 3 }], L5: [{ skillId: 'sk-bizbuild', minLevel: 3 }, { skillId: 'sk-invest', minLevel: 3 }, { skillId: 'sk-green', minLevel: 3 }, { skillId: 'sk-leadchange', minLevel: 3 }] } },
  { family: 'Plant and operations', match: (t) => /plant|operations|logistics|quality|procurement/i.test(t), levels: { L4: [{ skillId: 'sk-opex', minLevel: 3 }, { skillId: 'sk-datastory', minLevel: 3 }, { skillId: 'sk-changeplan', minLevel: 3 }, { skillId: 'sk-genai', minLevel: 2 }], L5: [{ skillId: 'sk-opex', minLevel: 4 }, { skillId: 'sk-green', minLevel: 3 }, { skillId: 'sk-leadchange', minLevel: 3 }] } },
  { family: 'Shared services and finance', match: (_t, f) => f === 'enabling', levels: { L3: [{ skillId: 'sk-genai', minLevel: 2 }, { skillId: 'sk-opex', minLevel: 2 }, { skillId: 'sk-custneeds', minLevel: 2 }], L4: [{ skillId: 'sk-opex', minLevel: 3 }, { skillId: 'sk-datastory', minLevel: 3 }, { skillId: 'sk-changeplan', minLevel: 3 }, { skillId: 'sk-sustain', minLevel: 2 }] } },
]
export const nextLevel = (level: string) => `L${Math.min(5, (parseInt(level.replace('L', ''), 10) || 3) + 1)}`

/** The transformation story from the deck (pages 6 and 8). */
export interface FromTo { from: string; to: string }
export const ABC_FROM_TO: FromTo[] = [
  { from: 'Same 4-day agenda for all', to: 'AI skill diagnostic personalises each journey to critical future skills' },
  { from: 'Lecture-led coverage of 6 domains', to: 'Flipped micro-learning frees class time for applied labs with AI copilots' },
  { from: 'Learning ends on Day 4', to: '90-day sprint delivering agreed practical improvements in the current role' },
  { from: 'Attendance certificate, smile sheets', to: 'Verified skill passport and a measured business-impact target per learner' },
]
export const BCD_FROM_TO: FromTo[] = [
  { from: 'Project assigned mid-journey', to: 'Sponsor-owned briefs (growth, cost, service, productivity) chosen before Day 1; the project is the journey' },
  { from: 'Two coaching days near the end', to: 'Async certified and AI coaching across all stages: fewer man-days, quality on a scorecard' },
  { from: 'Final day: share and learn', to: 'Three gates: proof of concept, then investment or small-scale implementation, then scale-up' },
  { from: 'Program ends at graduation', to: 'Gate-3 winners scale as startups under SCG Start the Dot or internal high-impact initiatives' },
]
export const WHY_IT_FITS: { title: string; icon: string; body: string; evidence: string }[] = [
  { title: 'Scalable', icon: 'layers-three-01', body: 'One strategy and three platforms deploy to any BU without redesign.', evidence: 'Cohorts are created from the ABC / BCD playbook: calendar, clinics and gates generated automatically.' },
  { title: 'Simple', icon: 'check-done-01', body: 'Ready-to-run journeys; management approves rather than co-designs.', evidence: 'Role blueprints generate the capability plan; managers approve contracts and decide gates in a few clicks.' },
  { title: 'Self-funding', icon: 'coins-hand', body: 'Targeted objectives are set from day one, so ROI is measured on everything and capability pays for itself.', evidence: 'Every cohort carries a cost base; validated THB in the ledger is compared against it on the impact dashboard.' },
]
