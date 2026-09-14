// Guided introduction steps. Each step signs in a fictional persona, opens a real page and highlights one area.
export interface TourStep {
  id: string
  title: string
  personaId: string | null
  path: string
  target: string | null // data-tour attribute
  what: string
  why: string
  benefit: string
}

export const TOUR_STEPS: TourStep[] = [
  { id: 'purpose', title: 'Purpose, audience and benefits', personaId: null, path: '/login', target: null,
    what: 'This introduction walks through the SCG Capability Suite using fictional people and records. Use Next and Back, or pick a function from the list.',
    why: 'MTP 2027 asks for one modernised capability strategy: skills-first, project-based and AI-powered, scalable across SCG and wired to careers, rewards and P&L impact.',
    benefit: 'Learners see a personal path and a visible career payoff; managers approve rather than co-design; sponsors see validated THB impact; the People Committee gets an audited ledger.' },
  { id: 'personas', title: 'Roles in the platform', personaId: null, path: '/login', target: 'persona-nara',
    what: 'Choose a persona. Each role sees only the records and actions it owns: learner, line manager, BU sponsor, certified coach, Capability Investment Committee and program office.',
    why: 'Role scope keeps the work simple: a sponsor approves briefs and validates impact; a manager decides gates; the committee curates the portfolio.',
    benefit: 'Line managers spend hours, not weeks; the platform runs the rest.' },
  { id: 'home', title: 'Learner home and actionable tasks', personaId: 'per-nara', path: '/home', target: 'home-tasks',
    what: 'Nara, a regional sales lead in the CBM turnaround, sees the actions she can take now. Sidebar badges count the same records.',
    why: 'Tasks are derived from record status and cohort dates, not from unread messages, so nothing is counted twice.',
    benefit: 'Work is visible and clears only when the real action is saved.' },
  { id: 'journey', title: 'AI skill diagnostic and gap map', personaId: 'per-nara', path: '/journey', target: 'gap-map',
    what: 'The diagnostic maps the six ABC domains, states the evidence source per skill and ranks priority gaps for this program.',
    why: 'Learning starts from the value agenda and the learner\'s role, not from a fixed course list. Not assessed is never read as zero ability.',
    benefit: 'Personalised journeys close the prioritised gaps that matter for the CBM turnaround.' },
  { id: 'learning', title: 'Personal micro-learning path', personaId: 'per-nara', path: '/learning', target: 'learning-plan',
    what: 'Modules selected in order, including a B2B dealer variant and skipped modules with reasons. Status persists when Nara marks progress.',
    why: 'Flipped micro-learning frees the four lab days for applied practice with real AI tools.',
    benefit: 'Class time becomes 70% practice.' },
  { id: 'contract', title: 'Impact contract and 90-day sprint', personaId: 'per-nara', path: '/contracts/ic-nara', target: 'contract-evidence',
    what: 'Nara\'s impact contract: share-of-wallet objective, baseline, target, THB value and weekly sprint evidence, with actions at the bottom.',
    why: 'Targeted objectives are agreed on Lab Day 4 by learner, manager and sponsor, so ROI is measurable for every learner.',
    benefit: 'Micro-applications of new skills lift productivity in the flow of work and are tracked continuously.' },
  { id: 'manager', title: 'Manager decision at the mid-sprint gate', personaId: 'per-somsak', path: '/contracts/ic-tanawat', target: 'contract-actions',
    what: 'Somsak, a plant manager, reviews Tanawat\'s week-6 evidence and records scale, pivot or reset. The dialog explains what happens next.',
    why: 'Evidence review at week 6 keeps sprints honest and lets managers extend what works.',
    benefit: 'Management approves on evidence instead of co-designing programs.' },
  { id: 'ledger', title: 'Sponsor validation and the impact ledger', personaId: 'per-prasert', path: '/ledger', target: 'ledger-stats',
    what: 'Prasert, the CBM turnaround sponsor, validates claimed THB value. Validated entries are tracked 6–12 months and sample-audited.',
    why: 'Sponsor-validated value is the second verified currency, feeding reviews, recognition and value-linked incentives.',
    benefit: 'Capability pays for itself and the P&L feels it.' },
  { id: 'briefs', title: 'Challenge briefs for BCD', personaId: 'per-chatchai', path: '/briefs/cb-logistics', target: 'brief-actions',
    what: 'The Capability Investment Committee reviews sponsor-owned P&L briefs: approve, return with a note or reject.',
    why: 'Challenges are chosen before Day 1 and anchored to BU themes so the project is the journey.',
    benefit: 'A curated portfolio managed to a THB pipeline target.' },
  { id: 'gates', title: 'Concept gates 1–3', personaId: 'per-chatchai', path: '/concepts/cp-invoice', target: 'gate-2',
    what: 'Team Touchless submitted its Gate 2 pre-read and recorded pitch early; the committee records invest, small-scale, pivot or stop.',
    why: 'Concepts are gated like investments; pre-reads and recorded pitches cut man-days.',
    benefit: 'Gate-3 winners scale under SCG Start the Dot or as internal high-impact initiatives.' },
  { id: 'passport', title: 'Skill passport', personaId: 'per-arisa', path: '/passport', target: 'passport-list',
    what: 'Arisa\'s passport shows outcome-verified badges minted after her validated showcase, next to AI-inferred baseline levels.',
    why: 'Verification tiers (self-declared, AI-inferred, outcome-verified) make skills a trustworthy common currency.',
    benefit: 'Promotions cite passport evidence; the marketplace allocates key talent by verified skills.' },
  { id: 'marketplace', title: 'Talent marketplace and requirements', personaId: 'per-arisa', path: '/marketplace', target: 'market-row',
    what: 'Each posting shows its skill requirements against the person\'s evidence: meets, needs development, not assessed or not configured.',
    why: 'Transparent role-level requirements and open marketplace access are part of the published career deal.',
    benefit: 'Employees see the immediate payoff of verified skills; scarce skills are retained.' },
  { id: 'coaching', title: 'Coaching spine and AI coach', personaId: 'per-anong', path: '/coaching', target: null,
    what: 'Certified coaches run asynchronous clinics, respond to AI-coach flags and are measured on a quality scorecard. Learners also have an always-on AI coach in Thai and English (simulated here).',
    why: 'Fewer man-days with quality tracked, and frequent feedback for every learner.',
    benefit: 'Coaching quality becomes a managed asset.' },
  { id: 'governance', title: 'Impact dashboard for the People Committee', personaId: 'per-supattra', path: '/governance', target: 'gov-stats',
    what: 'The program office and committee see validated THB impact, pipeline, graduates with verified uplift, BUs onboarded and Gate-1 pass rate. Every number opens its records.',
    why: 'Quarterly impact governance with an audited ledger keeps reported ROI honest.',
    benefit: 'One evidence base for BU scorecards, the merit cycle and the MTP top KPI.' },
  { id: 'explain', title: 'Explain this page', personaId: 'per-supattra', path: '/governance', target: 'explain-fab',
    what: 'On every signed-in page the floating button opens a panel describing purpose, roles, data sources, hand-offs, decisions and limitations for that page.',
    why: 'Client walkthroughs need consistent, verified explanations tied to the real screen.',
    benefit: 'Anyone can present the platform without memorising the workflows.' },
]
