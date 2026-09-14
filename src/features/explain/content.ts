// Page explainer content. Authored from the implemented workflows; keep in sync when behaviour changes.
export interface Stage { icon: string; title: string; body: string }
export interface RoleLine { role: string; does: string }
export interface Explainer {
  id: string
  name: string
  purpose: string
  benefit: string
  users: string
  roles: RoleLine[]
  stages: Stage[]
  limitations?: string[]
}
export interface PageExplainer { title: string; functions: Explainer[] }

const learnerRoles: RoleLine[] = [
  { role: 'Learner', does: 'Owns the record, enters evidence and submits at each step.' },
  { role: 'Line manager', does: 'Reviews the contract, returns it with a note or approves it; decides scale / pivot / reset at the mid-sprint gate.' },
  { role: 'BU sponsor', does: 'Approves the impact contract and later validates the delivered THB value into the ledger.' },
  { role: 'Certified coach', does: 'Reads evidence and AI-coach flags, adds coaching notes before each clinic.' },
]

export const EXPLAINERS: Record<string, PageExplainer> = {
  home: {
    title: 'Home',
    functions: [{
      id: 'home', name: 'Role home', purpose: 'Shows what the signed-in person must do now, what changed since they last looked, and the state of the programs they are part of.',
      benefit: 'One place to see actionable work and updates without hunting through menus; badges and counts open the exact records behind them.',
      users: 'Every role. Content is scoped to the person: learners see their journey, managers their team, sponsors their BU, the committee its gates and briefs, the program office all cohorts.',
      roles: [{ role: 'All roles', does: 'Read the summary, open a task or update, continue to the record.' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Tasks are calculated from live record statuses (impact contracts, briefs, gates, ledger entries, learning plans, clinics). Updates are informational notifications created when another role acts on a record you are connected to.' },
        { icon: 'check-done-01', title: 'Work happens', body: 'Open a task to perform the action on the record itself. A task disappears only after the action is saved successfully. Reading an update does not complete a task.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Each task names the next action and the responsible role. Once you act, the record moves to the next role and appears in their task list.' },
      ],
    }],
  },
  tasks: {
    title: 'My tasks',
    functions: [{
      id: 'tasks', name: 'Actionable tasks', purpose: 'Lists every action the signed-in person can perform right now, ordered by urgency.',
      benefit: 'The sidebar badge, this list and the page summaries all count the same records, so the number always matches what opens.',
      users: 'Every role.', roles: [{ role: 'All roles', does: 'Filter by area, open the record, act.' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Derived from record statuses plus cohort key dates (mid-sprint gate, showcase, brief deadline, gate dates). Nothing is entered here.' },
        { icon: 'flag-05', title: 'Ordering', body: 'Overdue first, then due within seven days, then everything else by due date. Waiting-for-someone-else records are excluded.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Acting on the record clears the task and creates the next task for the next responsible role.' },
      ],
    }],
  },
  journey: {
    title: 'My journey',
    functions: [
      {
        id: 'phases', name: 'Journey phases', purpose: 'Shows where the learner is in the ABC 12-week journey (diagnose, labs, sprint, showcase) or the BCD gated journey, with the cohort\'s key dates.',
        benefit: 'Learners always know the current phase, the next milestone and what is expected before it.',
        users: 'Learners. Coaches and managers see the same information through the coaching workspace and My team.',
        roles: [{ role: 'Learner', does: 'Reads the timeline and follows the next step.' }, { role: 'Program office', does: 'Sets the cohort calendar that drives the dates shown here.' }],
        stages: [
          { icon: 'data', title: 'Data enters', body: 'Cohort key dates are set by the program office; enrollment status changes as the learner completes the diagnostic, is approved into the sprint, submits the showcase and is validated.' },
          { icon: 'arrow-right', title: 'What comes next', body: 'After the showcase is validated by the sponsor, badges mint to the skill passport and the talent profile updates (week 14 system trigger).' },
        ],
      },
      {
        id: 'diagnostic', name: 'AI skill diagnostic and gap map', purpose: 'Shows the learner\'s current and target level for each critical skill, the evidence behind it, and which gaps were prioritised for this program.',
        benefit: 'Learning time goes to the few skills that matter for the learner\'s role and the BU priority instead of the same agenda for everyone.',
        users: 'Learner (own), coach (own learners), manager (direct reports).',
        roles: [{ role: 'Learner', does: 'Runs the diagnostic when pending; inspects rationale for each level.' }, { role: 'AI matching engine (simulated)', does: 'Ranks skill gap × role relevance × project need. In this prototype the ranking is a fixed illustrative result, clearly labelled.' }],
        stages: [
          { icon: 'data', title: 'Data enters', body: 'Knowledge test, self-declaration, manager input and AI inference from work data (simulated). Each row states its evidence source.' },
          { icon: 'target-04', title: 'Work happens', body: 'Priority gaps become the personal micro-learning path and the skills that will be verified at the showcase.' },
          { icon: 'award-01', title: 'Connected records', body: 'AI-inferred levels are written to the skill passport at the AI-inferred tier. Not assessed means no evidence, not zero ability.' },
          { icon: 'arrow-right', title: 'What comes next', body: 'The learner continues to the learning plan; the manager and sponsor use the priority skills when agreeing the impact contract.' },
        ],
        limitations: ['The diagnostic and inference are simulated in the prototype. No live AI service or HR core integration is connected.'],
      },
    ],
  },
  learning: {
    title: 'Learning plan',
    functions: [{
      id: 'plan', name: 'Personal micro-learning path', purpose: 'The ordered list of modules the personalisation engine selected for this learner, including modules skipped and why.',
      benefit: 'Flipped micro-learning before class frees the four lab days for practice with real AI tools.',
      users: 'Learners.', roles: [{ role: 'Learner', does: 'Starts, completes or skips modules; the status persists.' }, { role: 'Personalisation engine (simulated)', does: 'Chooses modules, order and BU variant from the diagnostic.' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Modules and BU variants come from the program skill map; the selection and reason come from the diagnostic priority ranking.' },
        { icon: 'book-open-01', title: 'Work happens', body: 'The learner works through modules in sequence before the labs; progress is tracked per module.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Open modules appear as a task until the showcase. Completed modules inform the coach briefing before each clinic.' },
      ],
    }],
  },
  labs: {
    title: 'Lab days',
    functions: [{ id: 'labs', name: 'Applied capability labs', purpose: 'The four in-person lab days (ABC) or three-day immersion camp (BCD): agenda, live SCG case, tools, deliverable, pre-work status, check-in and takeaway.', benefit: 'Class time is 70% practice with real AI tools; learners take the same tools back to work and Lab Day 4 ends with an agreed impact contract.', users: 'Learners; coaches and the program office see attendance on the cohort.', roles: [{ role: 'Learner', does: 'Completes pre-work modules, checks in each day, records the takeaway, creates the impact contract on Day 4.' }, { role: 'Certified coach', does: 'Facilitates in person; reads takeaways before clinic 1.' }], stages: [{ icon: 'data', title: 'Data enters', body: 'Lab agenda from the playbook; pre-work status from the learning plan; attendance and takeaways entered here.' }, { icon: 'arrow-right', title: 'What comes next', body: 'Day 4 hands off to the impact contract and the 90-day sprint.' }] }],
  },
  'success-cases': {
    title: 'Success cases',
    functions: [{ id: 'cases', name: 'Proof stories', purpose: 'Every sponsor-validated improvement and funded or scaled concept, with the people, badges and THB value behind it.', benefit: 'Makes the career deal visible: passport-cited results, Gate-3 scale-up roles, recognition at showcases.', users: 'Every role.', roles: [{ role: 'All roles', does: 'Browse and open the record behind each case.' }], stages: [{ icon: 'data', title: 'Data enters', body: 'Derived from validated impact contracts and concepts past Gate 2; nothing is entered here.' }] }],
  },
  team: {
    title: 'My team',
    functions: [{
      id: 'team', name: 'Direct reports in programs', purpose: 'Shows each direct report\'s program, contract status, sprint evidence and verified skills.',
      benefit: 'Managers spend hours, not weeks: they approve, decide gates and see evidence without co-designing the program.',
      users: 'Line managers.', roles: [{ role: 'Line manager', does: 'Opens a report\'s contract to review or decide; opens the passport to see verified skills.' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Reports are people whose manager is the signed-in person. Statuses come from their impact contracts and enrollments.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Approvals move contracts to the sponsor; gate decisions return them to the learner as scale, pivot or reset.' },
      ],
    }],
  },
  contracts: {
    title: 'Impact contracts',
    functions: [{
      id: 'list', name: 'Impact contract list', purpose: 'Every impact contract the signed-in person owns, reviews, sponsors or coaches, with status and next responsible role.',
      benefit: 'Targeted objectives are set from day one, so ROI is measurable for every learner.',
      users: 'Learners, line managers, BU sponsors, coaches, program office, committee (read).', roles: learnerRoles,
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Created by the learner on Lab Day 4 with a title, objective type by function (revenue, margin, share of wallet for business functions; cost-to-serve, SLA, productivity for enabling functions), baseline, target and THB value.' },
        { icon: 'user-check-01', title: 'Review', body: 'Manager review, then sponsor approval. Either may return it with a note; the learner edits and resubmits.' },
        { icon: 'activity', title: 'Sprint', body: 'Weekly evidence is logged for 12 weeks. At week 6 the manager or sponsor records scale, pivot or reset.' },
        { icon: 'coins-stacked-01', title: 'Business outcome', body: 'The showcase claim creates a ledger entry; the sponsor validates the THB value and badges mint to the passport.' },
      ],
    }],
  },
  'contract-detail': {
    title: 'Impact contract',
    functions: [{
      id: 'detail', name: 'Contract details and actions', purpose: 'All contract fields, the review history, weekly evidence and the actions available to the signed-in role, in one view.',
      benefit: 'Reviewers decide with the evidence in front of them; learners see who is responsible now and what happens after each action.',
      users: 'Learner (owner), manager, sponsor, coach, program office, committee (read).', roles: learnerRoles,
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Fields entered by the learner; evidence logged weekly by the learner; notes entered by the reviewer at each decision.' },
        { icon: 'file-check-02', title: 'Decision', body: 'Submit → manager approves or returns → sponsor approves or returns → active. Mid-sprint: scale, pivot or reset. Showcase: sponsor validates the THB value or returns for more evidence.' },
        { icon: 'award-01', title: 'Connected records', body: 'Validation creates a validated ledger entry, marks the enrollment graduated and mints outcome-verified badges for the learner\'s top three priority skills at target level.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'The impact rating feeds the performance review; the top decile is flagged for the BCD fast track (shown on the passport when set).' },
      ],
      limitations: ['Notifications are in-platform only; no email or chat integration is connected.'],
    }],
  },
  briefs: {
    title: 'Challenge briefs',
    functions: [{
      id: 'list', name: 'Challenge brief portfolio', purpose: 'Sponsor-owned P&L challenge briefs for BCD cohorts, from draft to committee decision to cohort assignment.',
      benefit: 'Sponsors choose the project before Day 1; the project is the journey and the portfolio is managed to a THB pipeline target.',
      users: 'BU sponsors, Capability Investment Committee, program office.',
      roles: [{ role: 'BU sponsor', does: 'Creates the brief under a BU theme, submits it, revises returned briefs.' }, { role: 'Committee', does: 'Approves, returns with a note or rejects.' }, { role: 'Program office', does: 'Assigns approved briefs to a BCD cohort.' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Theme selected from the BU head\'s themes; title, type (growth, cost, service, productivity), problem statement, success metric, THB target and constraints entered by the sponsor.' },
        { icon: 'scales-01', title: 'Decision', body: 'The committee curates the portfolio: approve, return or reject, each with a recorded note.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Approved briefs are assigned to a cohort by the program office; a cross-BU team forms around each brief and the concept enters Stage 1.' },
      ],
    }],
  },
  'brief-detail': {
    title: 'Challenge brief',
    functions: [{
      id: 'detail', name: 'Brief details and decision', purpose: 'The full brief, its theme and BU, the committee note and history, with the actions available to the signed-in role.',
      benefit: 'Decisions and reasons are recorded once and visible to sponsor, committee and program office.',
      users: 'Sponsor (owner), committee, program office.',
      roles: [{ role: 'BU sponsor', does: 'Edit, submit, withdraw.' }, { role: 'Committee', does: 'Approve, return, reject with a note.' }, { role: 'Program office', does: 'Assign to a BCD cohort.' }],
      stages: [
        { icon: 'lightbulb-02', title: 'Submission', body: 'Draft or returned briefs are submitted to committee review.' },
        { icon: 'scales-01', title: 'Decision', body: 'Approved → waits for cohort assignment. Returned → sponsor revises. Rejected → closed with reason.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Assigned briefs appear in the cohort and become the concept a team works on.' },
      ],
    }],
  },
  concepts: {
    title: 'Concepts & gates',
    functions: [{
      id: 'list', name: 'Concept portfolio', purpose: 'Live BCD concepts by stage with pipeline value, gate dates and decisions.',
      benefit: 'Concepts are gated like investments: proof of concept, investment pitch, scale-up.',
      users: 'All roles (scoped: learners see their team\'s concept and scaled concepts).',
      roles: [{ role: 'Team member', does: 'Submits the evidence pack for the next gate.' }, { role: 'Committee', does: 'Records go / pivot / stop, invest / small-scale, scale decisions.' }, { role: 'Sponsor', does: 'Receives gate outcomes for their brief.' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Concepts are created from assigned briefs when a team forms. Evidence packs are entered by the team before each gate.' },
        { icon: 'flag-05', title: 'Gates', body: 'Gate 1 approves the proof of concept; Gate 2 passes concepts for investment or small-scale implementation; Gate 3 scales winners under SCG Start the Dot or as internal high-impact initiatives.' },
        { icon: 'coins-stacked-01', title: 'Business outcome', body: 'Gate 3 scale records the validated value in the impact ledger for every team member.' },
      ],
    }],
  },
  'concept-detail': {
    title: 'Concept',
    functions: [{
      id: 'detail', name: 'Concept, team and gate reviews', purpose: 'Concept summary, the challenge brief it answers, team members, each gate\'s evidence pack and decision, and the actions available now.',
      benefit: 'Gate decisions are taken on recorded evidence and feed talent reviews and rewards.',
      users: 'Team members, coach, sponsor, committee, program office.',
      roles: [{ role: 'Team member', does: 'Submit evidence pack for the pending gate.' }, { role: 'Committee', does: 'Record the decision with reasoning and, at Gate 3, the validated value.' }],
      stages: [
        { icon: 'file-check-02', title: 'Submission', body: 'A team member summarises the evidence pack; the concept moves to the gate stage and the committee is notified.' },
        { icon: 'scales-01', title: 'Decision', body: 'Gate 1: go, pivot, stop. Gate 2: invest, small-scale implementation, pivot, stop (invest schedules Gate 3). Gate 3: scale, hold, stop.' },
        { icon: 'award-01', title: 'Connected records', body: 'Positive decisions mint outcome-verified BCD badges for each team member\'s priority skills. Gate 3 scale writes ledger entries.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Gate-2 winners take incubation leadership roles; Gate-3 winners scale with a P&L owner.' },
      ],
    }],
  },
  cohorts: {
    title: 'Cohorts',
    functions: [{
      id: 'cohorts', name: 'Cohort calendar and progress', purpose: 'Every ABC and BCD cohort with phase dates, seats, learners and pipeline target.',
      benefit: 'Any BU runs the accelerators without redesign: the same calendar, sponsor kit and coaching spine.',
      users: 'Program office, coaches, committee.', roles: [{ role: 'Program office', does: 'Owns the cohort calendar and assigns briefs.' }],
      stages: [
        { icon: 'calendar', title: 'Data enters', body: 'Cohort dates and seats are configured by the program office (fixed in this prototype). Enrollment statuses update as learners progress.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Key dates drive learner tasks and clinic scheduling.' },
      ],
      limitations: ['Cohort creation and editing are not implemented in the prototype.'],
    }],
  },
  coaching: {
    title: 'Coaching workspace',
    functions: [{
      id: 'coaching', name: 'Clinics, learners and AI-coach flags', purpose: 'Upcoming clinics, the learners and teams assigned to the coach, AI-coach flags that need follow-up, and the coach\'s quality scorecard.',
      benefit: 'Asynchronous small-group clinics with the AI coach flagging who needs what: fewer man-days and quality tracked on a scorecard.',
      users: 'Certified coaches.', roles: [{ role: 'Coach', does: 'Reviews flags, adds coaching notes, marks the clinic briefing ready.' }, { role: 'AI coach (simulated)', does: 'Flags learners who are stuck and briefs the coach before each clinic.' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Flags come from the AI coach (fixed in the prototype); evidence and contract status come from the learner records.' },
        { icon: 'message-chat-circle', title: 'Work happens', body: 'The coach writes notes visible to the learner and marks the clinic briefing ready, which clears the task.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Learners see notes on their journey; the scorecard feeds coach certification renewal.' },
      ],
    }],
  },
  passport: {
    title: 'Skill passport',
    functions: [{
      id: 'passport', name: 'Verified skill passport', purpose: 'Every skill level held by a person with its verification tier: self-declared, AI-inferred or outcome-verified, and the badge that minted it.',
      benefit: 'One common currency for career progression, key-talent allocation, project assignment and the marketplace.',
      users: 'Own passport for every role; managers, sponsors and the program office can open a report\'s passport.',
      roles: [{ role: 'Learner', does: 'Reads levels and evidence; cannot edit verified entries.' }, { role: 'Manager / sponsor', does: 'Uses passport evidence in promotion cases and marketplace decisions.' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Diagnostic results write AI-inferred levels. Validated showcases and positive gate decisions mint outcome-verified badges automatically.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Verified skills qualify for skill-premium consideration in the merit cycle and open marketplace roles.' },
      ],
      limitations: ['Sync to the HR core talent profile is a proposed integration and not connected.'],
    }],
  },
  marketplace: {
    title: 'Talent marketplace',
    functions: [{
      id: 'market', name: 'Roles, projects and gigs by verified skills', purpose: 'Open internal opportunities with their skill requirements, the person\'s evidence against each requirement, and an interest action.',
      benefit: 'Key talent is allocated by verified skills, not titles; employees see the payoff of verified skills.',
      users: 'Learners, managers, sponsors, program office.',
      roles: [{ role: 'Employee', does: 'Reviews requirements versus passport and expresses interest.' }, { role: 'Posting owner', does: 'Receives interest and shortlists (shortlisting is not implemented in the prototype).' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Requirements are set by the posting owner; evidence comes from the person\'s passport.' },
        { icon: 'target-04', title: 'Requirements and evidence', body: 'Each requirement shows Meets requirement, Needs development, Not assessed or Requirement not configured. The match percentage counts only requirements met; inspect the rows to see why.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Expressing interest notifies the owner. A directional match is not a decision.' },
      ],
    }],
  },
  ledger: {
    title: 'Impact ledger',
    functions: [{
      id: 'ledger', name: 'Sponsor-validated impact ledger', purpose: 'Claimed and validated THB value per learner and concept, its sponsor, tracking window and audit status.',
      benefit: 'Capability pays for itself: pay follows delivered impact and the THB pipeline is reported to the People Committee.',
      users: 'Learners (own), managers (reports), sponsors (BU), committee, program office.',
      roles: [{ role: 'BU sponsor', does: 'Validates or rejects claimed values.' }, { role: 'Program office', does: 'Records the annual sample audit.' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Entries are created by showcase submissions (claimed value) and Gate 3 decisions (validated value).' },
        { icon: 'scales-01', title: 'Decision', body: 'Sponsor validates with the confirmed THB value or rejects with a reason. Validated entries are tracked 6–12 months and sample-audited.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Validated value feeds reviews, recognition and value-linked incentives (policy decisions outside this platform).' },
      ],
    }],
  },
  governance: {
    title: 'Impact dashboard',
    functions: [{
      id: 'gov', name: 'Quarterly impact governance', purpose: 'The MTP 2027 measures: validated THB impact, pipeline, graduates with verified uplift, BUs onboarded and Gate-1 pass rate, each linked to the records behind it.',
      benefit: 'One audited view for the People Committee and BU scorecards.',
      users: 'Committee, program office, sponsors.', roles: [{ role: 'Committee', does: 'Reviews quarterly; opens drill-downs.' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Calculated from ledger entries, concepts, enrollments, passports and BU onboarding flags. Every number opens the list it counts.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'Targets and scorecard reviews happen in the People Committee; this page supplies the evidence.' },
      ],
      limitations: ['Percentages are computed from the small demo dataset and are illustrative only.'],
    }],
  },
  strategy: {
    title: 'Strategy roadmap',
    functions: [{ id: 'strategy', name: 'People strategic plan for MTP 2027', purpose: 'The four sub-plans with key actions, KPIs, expected outcomes, milestones and owners; the five core components with their three actions each; the CBM and CAFI applications; and the enabler timeline.', benefit: 'Everyone presenting the platform can trace each screen back to the strategy it serves; KPIs are live where the platform tracks them.', users: 'Program office, committee, sponsors.', roles: [{ role: 'Program office', does: 'Uses it as the master checklist for deployment.' }], stages: [{ icon: 'data', title: 'Data enters', body: 'Plan content from the strategy deck (static); KPI values calculated from ledger, passports, gates and BU flags.' }, { icon: 'arrow-right', title: 'What comes next', body: 'Quarterly review by the People Committee; BU targets on leader scorecards.' }], limitations: ['"% promotions citing verified skills" is not tracked in the prototype (no HR core integration).'] }],
  },
  agenda: {
    title: 'Capability agenda',
    functions: [{ id: 'agenda', name: 'Value-to-skills cascade and gap funding', purpose: 'Value pools, critical roles and future skills per BU with three-year supply versus demand, THB value at stake and the build / buy / borrow / bot decision.', benefit: 'Capability spend goes to the biggest value-at-risk gaps first, governed like capex.', users: 'Program office and committee decide; sponsors read their BU.', roles: [{ role: 'BU head (via sponsor)', does: 'Runs the cascade with CHR annually.' }, { role: 'Program office / committee', does: 'Records the decision and funding flag.' }], stages: [{ icon: 'data', title: 'Data enters', body: 'Cascade rows are configured with the BU head (fixtures in the prototype); decisions are entered here.' }, { icon: 'scales-01', title: 'Decision', body: 'Build feeds cohort seats and assessment waves; bot points to automation; buy and borrow go to acquisition and partners.' }, { icon: 'arrow-right', title: 'What comes next', body: 'Funded gaps appear on quarterly leader scorecards; the taxonomy and cohorts are refreshed accordingly.' }] }],
  },
  performance: {
    title: 'Performance dashboard',
    functions: [{ id: 'ai-summary', name: 'AI summary', purpose: 'A written read of the scorecard: two sentences on where the unit stands (health score, rank, measures ahead of company, biggest strength and weakness) and two things to do next or investigate.', benefit: 'A leader gets the answer without reading twelve measures, and every leader gets it in the same shape.', users: 'Line managers, sponsors, coaches, committee and program office.', roles: [{ role: 'Viewer', does: 'Reads it; presses Refresh after the numbers change.' }, { role: 'Platform', does: 'Picks the strength, weakness, the two focus measures and every count, so the summary is consistent and matches the tiles.' }, { role: 'Claude (Sonnet)', does: 'Writes the wording from those chosen numbers only.' }], stages: [{ icon: 'data', title: 'Data enters', body: 'Only the rounded numbers already shown on this page are sent: the twelve measures for this unit and for the company, the rank and the counts. No names of learners, no record content.' }, { icon: 'stars-02', title: 'Work happens', body: 'The summary is generated once per unit and view, saved, and shown to everyone who can see that unit. It is flagged when the numbers change.' }, { icon: 'arrow-right', title: 'What comes next', body: 'Act on the two next steps using the linked pages; refresh the summary afterwards to confirm the move.' }], limitations: ['Advisory only. It restates the scorecard and never sees individual records or explains causes.'] },
    { id: 'perf', name: 'Team view and company view', purpose: 'Twelve measures across readiness (diagnostic, micro-learning, labs), execution (contracts active, evidence cadence, mid-gate scale rate, manager decision time), impact (validated THB) and skills (verified uplift, badges, Gate 1 pass rate), rolled into a program health score. Team view compares your unit with the company; company view ranks all units.', benefit: 'Each manager, sponsor and coach sees whether their team is ahead or behind and exactly where to act; the committee sees the whole company.', users: 'Line managers (direct reports), BU sponsors (their BU), coaches (their learners), committee and program office (any unit).', roles: [{ role: 'Manager / sponsor / coach', does: 'Reads the comparison and follows the next actions.' }, { role: 'Committee / program office', does: 'Switches the comparison unit (managers, BUs, coaches, cohorts) and reviews the leaderboard quarterly.' }], stages: [{ icon: 'data', title: 'Data enters', body: 'Calculated from enrollments, diagnostics, learning plans, lab attendance, contracts, evidence, events, ledger and passports. Nothing is entered here.' }, { icon: 'arrow-right', title: 'What comes next', body: 'Act on the linked pages; the dashboard updates as records change.' }], limitations: ['Small teams swing quickly; the demo dataset is tiny. Targets are not configured.'] }],
  },
  integrations: {
    title: 'Integrations',
    functions: [{ id: 'integrations', name: 'Connected systems (simulated)', purpose: 'HR core talent-profile sync, payroll and rewards merit-cycle export, email and LINE notifications, finance P&L actuals import, and the Start the Dot venture hand-off, each with an auditable run log and payload.', benefit: 'The platform becomes the single skills data model feeding HR core, rewards and finance instead of another silo.', users: 'Program office runs and reviews; committee reads.', roles: [{ role: 'Program office', does: 'Runs a sync or import and reviews payloads.' }, { role: 'HRIS, Rewards, Finance owners', does: 'Own the receiving systems and field mappings (outside the platform).' }], stages: [{ icon: 'data', title: 'Data enters', body: 'Payloads are built from live platform records (badges, ledger, notifications, scaled concepts). Inbound actuals are simulated from validated values.' }, { icon: 'lock-01', title: 'Limitation', body: 'No external system is connected. Production needs server-side credentials, scheduled jobs and PDPA review.' }] }],
  },
  taxonomy: {
    title: 'Skills taxonomy',
    functions: [{
      id: 'tax', name: 'Enterprise skills taxonomy', purpose: 'The critical skills by domain with four proficiency levels, criticality and premium eligibility.',
      benefit: 'Mapping, marketplace, personalisation and coaching share one taxonomy.',
      users: 'Program office (owner), committee, coaches.', roles: [{ role: 'Program office', does: 'Governs the list centrally; refreshed quarterly.' }],
      stages: [{ icon: 'layers-three-01', title: 'Data enters', body: 'Configured by the program office and validated by function experts (read-only in the prototype; ~100 skills in the target state, 18 shown).' }],
    }],
  },
  assessment: {
    title: 'Assessment',
    functions: [{
      id: 'assessment', name: 'AI skill diagnostic', purpose: 'The Phase 0 assessment: self-rating on the critical skills, a knowledge check per domain and the learner\'s role context. Expert Guidance turns the answers into a gap map, priority ranking and personal micro-learning path.',
      benefit: 'Start from the learner\'s real gaps and the BU priority, not a fixed course list; class time is freed for practice.',
      users: 'Learners with a pending diagnostic. Coaches and managers see the result on the journey and in their workspaces.',
      roles: [{ role: 'Learner', does: 'Completes the three steps, reviews the draft gap map and accepts it.' }, { role: 'Expert Guidance (Claude)', does: 'Infers current levels from self-rating and knowledge answers, ranks priority gaps by skill gap × role relevance × project need, selects modules and BU variants, and pushes coaching points to the human coach.' }],
      stages: [
        { icon: 'data', title: 'Data enters', body: 'Self-ratings, knowledge answers and role context entered here; talent profile and BU themes from the platform; skills and module catalogue from the taxonomy.' },
        { icon: 'stars-02', title: 'Work happens', body: 'Answers are saved, then Expert Guidance produces the draft. The learner reviews before anything is written.' },
        { icon: 'award-01', title: 'Connected records', body: 'Accepting writes diagnostic items, AI-inferred (or self-declared) passport levels and the learning plan; the guidance note is kept.' },
        { icon: 'arrow-right', title: 'What comes next', body: 'The learner starts the micro-learning path before the labs; the coach receives the coaching points before clinic 1.' },
      ],
      limitations: ['Knowledge questions are illustrative (one per domain). Levels are inferred, not certified; outcome-verified badges come only from validated results.'],
    }],
  },
  assessments: {
    title: 'Assessments',
    functions: [{ id: 'waves', name: 'Assessment waves and completion', purpose: 'Org-wide AI assessment run in waves by cohort and BU: who is invited, who has completed the diagnostic, their priority gaps, and who needs a reminder.', benefit: 'Baselines the organisation from day one so passports, learning paths and coaching start from evidence.', users: 'Program office, committee, sponsors (own BU), line managers (own reports), coaches (own learners).', roles: [{ role: 'Program office', does: 'Plans waves through cohorts and sends reminders.' }, { role: 'Manager / sponsor / coach', does: 'Sees status for their people and can send a reminder.' }], stages: [{ icon: 'data', title: 'Data enters', body: 'Enrollments define the wave; learners complete the assessment themselves; Expert Guidance produces the gap map.' }, { icon: 'bell-01', title: 'Work happens', body: 'A reminder creates an update for the learner linking to the assessment. It does not complete anything on their behalf.' }, { icon: 'arrow-right', title: 'What comes next', body: 'Completed diagnostics feed passports, learning plans, coaching points and the skill-uplift dashboard.' }] }],
  },
  'ai-coach': {
    title: 'Expert Guidance',
    functions: [{
      id: 'coach', name: 'Always-on coach', purpose: 'Answers program questions in Thai and English, grounded in the approved content universe and the learner\'s own records, citing the source module. Also produces weekly guidance on the journey, sprint reviews on contracts and clinic briefings for coaches.',
      benefit: 'Learning continues after every program; the coach nudges before deadlines and briefs the human coach.',
      users: 'Learners; coaches can view.', roles: [{ role: 'Learner', does: 'Asks about schedule, activities, deliverables and practice.' }],
      stages: [
        { icon: 'stars-02', title: 'Work happens', body: 'Messages and replies are saved to the person\'s history. Replies cite the module they are grounded in.' },
        { icon: 'shield-tick', title: 'Guardrails', body: 'Retrieval-grounded answers only, PDPA-compliant, human in the loop for career decisions.' },
      ],
      limitations: ['Powered by Claude through a server-side key. If the service is unavailable a scripted answer is used and labelled. Guidance is advisory; decisions stay with people.'],
    }],
  },
  notifications: {
    title: 'Updates',
    functions: [{
      id: 'updates', name: 'Informational updates', purpose: 'History of what other roles did on records connected to you. Separate from tasks.',
      benefit: 'You can see what changed without mistaking it for work you must do.',
      users: 'Every role.', roles: [{ role: 'All roles', does: 'Read, open the linked record.' }],
      stages: [{ icon: 'bell-01', title: 'Data enters', body: 'Created automatically when a workflow action succeeds.' }, { icon: 'arrow-right', title: 'What comes next', body: 'Marking an update read never completes a task.' }],
    }],
  },
}

export function explainerForPath(pathname: string): PageExplainer | null {
  const p = pathname.replace(/\/$/, '')
  if (/^\/contracts\/[^/]+$/.test(p) && !p.endsWith('/new')) return EXPLAINERS['contract-detail']
  if (/^\/briefs\/[^/]+$/.test(p) && !p.endsWith('/new')) return EXPLAINERS['brief-detail']
  if (/^\/concepts\/[^/]+$/.test(p)) return EXPLAINERS['concept-detail']
  if (/^\/cohorts\/[^/]+$/.test(p)) return EXPLAINERS.cohorts
  const key = p.split('/')[1]
  return EXPLAINERS[key] ?? null
}
