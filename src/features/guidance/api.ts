// Client for the server-side Expert Guidance endpoint plus context builders that gather what Claude needs from the snapshot.
import type { Snapshot } from '@/data/datasource'
import type { Persona, Enrollment, ImpactContract, AssessmentResponses, CoachingClinic, GuidanceKind, DiagnosticResult, BlueprintPlan, RoleBlueprint } from '@/domain/types'
import { knowledgeQuestions } from '@/data/assessment-content'
import { skillsForProgram, personaName } from '@/domain/selectors'

export interface DiagnosticOutput { summary: string; items: { skillCode: string; currentLevel: number; targetLevel: number; priorityRank: number | null; evidenceSource: 'self_declared' | 'ai_inferred' | 'knowledge_test' | 'manager_input'; rationale: string }[]; plan: { moduleCode: string; reason: string }[]; skipped: { moduleCode: string; reason: string }[]; coachingPoints: string[] }
export interface AdviceOutput { headline: string; priorities: { title: string; why: string; action: string }[]; coachingPoints: string[]; applicationToRole: string[]; applicationToProject: string[]; risks: string[] }
export interface CoachOutput { reply: string; citedModuleCode: string | null; flagForHumanCoach: string | null }
export interface PerformanceOutput { summary: string; nextSteps: string[] }
export interface BriefingOutput { headline: string; learners: { personaName: string; status: string; focus: string; suggestedQuestion: string }[]; agenda: string[] }

export class GuidanceUnavailable extends Error {}

export async function requestGuidance<T>(req: { kind: GuidanceKind; context: unknown; question?: string; lang?: 'th' | 'en' }): Promise<{ model: string; output: T }> {
  let res: Response
  try {
    res = await fetch('/api/guidance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) })
  } catch {
    throw new GuidanceUnavailable('Expert Guidance could not be reached. Check your connection and try again.')
  }
  const json = (await res.json().catch(() => ({}))) as { error?: string; model?: string; output?: T }
  if (!res.ok || !json.output) throw new GuidanceUnavailable(json.error ?? `Expert Guidance failed (${res.status}).`)
  return { model: json.model ?? 'claude', output: json.output }
}

const learnerCard = (s: Snapshot, p: Persona) => ({ name: p.fullName, jobTitle: p.jobTitle, level: p.level, functionType: p.functionType, businessUnit: s.businessUnits.find((b) => b.id === p.buId)?.name, careerAspiration: p.careerAspiration })
const catalogue = (s: Snapshot, program: 'ABC' | 'BCD') => {
  const skills = skillsForProgram(s, program)
  return {
    skills: skills.map((k) => ({ code: k.code, name: k.name, domain: s.skillDomains.find((d) => d.id === k.domainId)?.name, description: k.description, critical: k.critical, premiumEligible: k.premiumEligible, levels: k.levelDescriptors })),
    modules: s.learningModules.filter((m) => skills.some((k) => k.id === m.skillId)).map((m) => ({ code: m.code, title: m.title, skillCode: skills.find((k) => k.id === m.skillId)?.code, minutes: m.durationMin, format: m.format, variant: m.variant })),
  }
}
const buPriority = (s: Snapshot, buId: string) => s.challengeThemes.filter((t) => t.buId === buId).map((t) => `${t.title}: ${t.description}`)
const cohortDates = (s: Snapshot, cohortId: string) => { const c = s.cohorts.find((x) => x.id === cohortId); return c ? { cohort: c.name, program: c.program, keyDates: c.keyDates, today: new Date().toISOString().slice(0, 10) } : null }

export function buildDiagnosticContext(s: Snapshot, actor: Persona, enrollment: Enrollment, responses: AssessmentResponses) {
  const cohort = s.cohorts.find((c) => c.id === enrollment.cohortId)!
  const program = cohort.program
  const cat = catalogue(s, program)
  const skillById = new Map(s.skills.map((k) => [k.id, k.code]))
  return {
    learner: learnerCard(s, actor),
    program, cohort: cohortDates(s, cohort.id), buPriorities: buPriority(s, actor.buId),
    managerInput: s.coachingNotes.filter((n) => n.enrollmentId === enrollment.id).map((n) => n.note),
    selfRatings: Object.fromEntries(Object.entries(responses.selfRatings).map(([id, v]) => [skillById.get(id) ?? id, v === null ? 'not sure' : v])),
    knowledgeCheck: knowledgeQuestions.filter((q) => q.program === program).map((q) => ({ id: q.id, skillCode: q.skillCode, question: q.question, chosen: responses.knowledge[q.id] != null ? q.options[responses.knowledge[q.id]] : 'not answered', correct: q.options[q.correct], isCorrect: responses.knowledge[q.id] === q.correct })),
    roleContext: { roleFocus: responses.roleFocus, currentInitiatives: responses.currentInitiatives, biggestChallenge: responses.biggestChallenge, preferredFormat: responses.preferredFormat },
    catalogue: cat,
  }
}

/** Maps skill/module codes returned by the model back to record ids; drops anything not in the catalogue. */
export function toDiagnosticResult(s: Snapshot, out: DiagnosticOutput): DiagnosticResult {
  const skillByCode = new Map(s.skills.map((k) => [k.code, k.id]))
  const moduleByCode = new Map(s.learningModules.map((m) => [m.code, m.id]))
  return {
    summary: out.summary,
    items: out.items.filter((i) => skillByCode.has(i.skillCode)).map((i) => ({ skillId: skillByCode.get(i.skillCode)!, currentLevel: i.currentLevel, targetLevel: i.targetLevel, priorityRank: i.priorityRank, evidenceSource: i.currentLevel === 0 ? null : i.evidenceSource, rationale: i.rationale })),
    plan: out.plan.filter((p) => moduleByCode.has(p.moduleCode)).map((p) => ({ moduleId: moduleByCode.get(p.moduleCode)!, reason: p.reason })),
    skipped: out.skipped.filter((p) => moduleByCode.has(p.moduleCode)).map((p) => ({ moduleId: moduleByCode.get(p.moduleCode)!, reason: p.reason })),
  }
}

function journeyBundle(s: Snapshot, actor: Persona, enrollment: Enrollment) {
  const cohort = s.cohorts.find((c) => c.id === enrollment.cohortId)!
  const dx = s.diagnostics.find((d) => d.enrollmentId === enrollment.id)
  const items = dx ? s.diagnosticItems.filter((i) => i.diagnosticId === dx.id).map((i) => ({ skill: s.skills.find((k) => k.id === i.skillId)?.name, skillCode: s.skills.find((k) => k.id === i.skillId)?.code, currentLevel: i.currentLevel, targetLevel: i.targetLevel, priorityRank: i.priorityRank, rationale: i.rationale })) : []
  const plan = s.learningPlanItems.filter((p) => p.enrollmentId === enrollment.id).map((p) => ({ module: s.learningModules.find((m) => m.id === p.moduleId)?.code, title: s.learningModules.find((m) => m.id === p.moduleId)?.title, status: p.status, reason: p.reason }))
  const contract = s.impactContracts.find((c) => c.enrollmentId === enrollment.id && c.status !== 'withdrawn')
  const evidence = contract ? s.sprintEvidence.filter((e) => e.contractId === contract.id).map((e) => ({ week: e.weekNo, title: e.title, note: e.note, value: e.metricValue, date: e.createdAt.slice(0, 10) })) : []
  const concept = enrollment.teamId ? s.concepts.find((c) => c.teamId === enrollment.teamId) : null
  const gates = concept ? s.gateReviews.filter((g) => g.conceptId === concept.id).map((g) => ({ gate: g.gateNo, date: g.scheduledDate, decision: g.decision, evidenceSubmitted: !!g.submittedAt, note: g.note })) : []
  return {
    learner: learnerCard(s, actor), cohort: cohortDates(s, cohort.id), enrollmentStatus: enrollment.status, diagnosticSummary: dx?.summary ?? null, diagnosticItems: items, learningPlan: plan,
    impactContract: contract ? { title: contract.title, objectiveType: contract.objectiveType, description: contract.description, baseline: contract.baselineValue, target: contract.targetValue, unit: contract.unit, targetThb: contract.targetThb, status: contract.status, midGate: contract.midGateDecision, midGateNote: contract.midGateNote, tools: contract.toolsApplied } : null,
    evidence, concept: concept ? { title: concept.title, stage: concept.stage, summary: concept.summary, gates } : null,
    coachingNotes: s.coachingNotes.filter((n) => n.enrollmentId === enrollment.id).map((n) => ({ note: n.note, aiFlag: n.aiFlag, date: n.createdAt.slice(0, 10) })),
    buPriorities: buPriority(s, actor.buId), catalogue: catalogue(s, cohort.program),
  }
}
export const buildJourneyContext = journeyBundle

export function buildContractContext(s: Snapshot, contract: ImpactContract) {
  const learner = s.personas.find((p) => p.id === contract.learnerId)!
  const enrollment = s.enrollments.find((e) => e.id === contract.enrollmentId)!
  return { ...journeyBundle(s, learner, enrollment), reviewers: { manager: personaName(s, contract.managerId), sponsor: personaName(s, contract.sponsorId) } }
}

export function buildCoachContext(s: Snapshot, actor: Persona) {
  const enr = s.enrollments.filter((e) => e.personaId === actor.id)
  const history = s.coachMessages.filter((m) => m.personaId === actor.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-8).map((m) => ({ from: m.sender, text: m.content }))
  return { journeys: enr.map((e) => journeyBundle(s, actor, e)), recentConversation: history }
}

export function buildClinicContext(s: Snapshot, clinic: CoachingClinic) {
  const cohort = s.cohorts.find((c) => c.id === clinic.cohortId)!
  const learners = s.enrollments.filter((e) => e.cohortId === clinic.cohortId && e.coachId === clinic.coachId).map((e) => { const p = s.personas.find((x) => x.id === e.personaId)!; return journeyBundle(s, p, e) })
  return { clinic: { number: clinic.clinicNo, date: clinic.scheduledAt.slice(0, 10), topics: clinic.topics, cohort: cohort.name }, learners: learners.map((l) => ({ learner: l.learner, enrollmentStatus: l.enrollmentStatus, diagnosticItems: l.diagnosticItems.filter((i) => i.priorityRank), learningPlan: l.learningPlan, impactContract: l.impactContract, evidence: l.evidence, coachingNotes: l.coachingNotes })) }
}

/** Compact, deterministic scorecard for the dashboard summary: only rounded numbers the page already shows. */
export function buildPerformanceContext(input: {
  view: 'team' | 'company'
  unitName: string
  unitKind: string
  learners: number
  companyLearners: number
  rank: { rank: number; of: number } | null
  measures: { measure: string; unit: string; meaning: string; team?: number | null; company?: number | null; companyValue?: number | null; result?: 'ahead' | 'behind' | 'no data' }[]
  healthScore?: number | null
  aheadOfCompany: { count: number; of: number } | null
  highlight: { strength: string | null; weakness: string | null }
  focus: string[]
  leaderboard?: { name: string; healthScore: number | null; isYou: boolean }[]
}) {
  return {
    programme: 'Modernize SCG Capability Development 2027 (ABC and BCD accelerators)',
    view: input.view,
    /** Who the summary is about: one unit (team view) or the whole company (company view). */
    subject: input.view === 'company' ? { name: input.unitName, scope: 'whole company', healthScore: input.healthScore == null ? null : `${input.healthScore}%`, learnersInPrograms: input.learners, unitsCompared: input.leaderboard?.length ?? 0 } : { name: input.unitName, scope: `one ${input.unitKind}`, healthScore: input.healthScore == null ? null : `${input.healthScore}%`, learnersInPrograms: input.learners, companyLearners: input.companyLearners },
    rankByHealthScore: input.rank,
    measures: input.measures,
    /** Counted by the platform: sentence 1 must use exactly this count. */
    aheadOfCompany: input.aheadOfCompany,
    /** Chosen by the platform, not by the model: sentence 2 must name these two measures. */
    highlight: input.highlight,
    /** The two measures the next steps must cover, in this order. */
    focus: input.focus,
    leaderboard: input.leaderboard ?? null,
    note: 'Percentages are shares of the unit\'s own learners, so they compare fairly. THB figures are absolute totals, so a small unit is naturally below the company total; never call that a weakness. Decision time is in days and lower is better.',
  }
}

/* ---------- Role blueprint, practice partner, talent review ---------- */
export interface PracticeOutput { reply: string; scores: { criterion: string; score: number; comment: string }[]; overall: number; advice: string; done: boolean }
export interface TalentReviewOutput { headline: string; evidence: string[]; strengths: string[]; development: string[]; recommendation: string }
export type BlueprintOutput = BlueprintPlan

export function buildBlueprintContext(s: Snapshot, b: RoleBlueprint) {
  const bu = s.businessUnits.find((x) => x.id === b.buId)
  const existing = s.capabilityGaps.filter((g) => g.buId === b.buId).map((g) => ({ valuePool: g.valuePool, role: g.criticalRole, skill: s.skills.find((k) => k.id === g.skillId)?.code, supplyFte: g.supplyFte, demandFte: g.demandFte, thbValueAtRisk: g.thbValueAtRisk, decision: g.decision }))
  const passportInBu = s.personas.filter((p) => p.buId === b.buId).flatMap((p) => s.passportEntries.filter((e) => e.personaId === p.id && e.tier === 'outcome_verified').map((e) => ({ skill: s.skills.find((k) => k.id === e.skillId)?.code, level: e.level })))
  return {
    role: { title: b.roleTitle, level: b.level, headcount: b.headcount, operatingModelChange: b.operatingModelChange, responsibilities: b.responsibilities },
    businessUnit: { code: bu?.code, name: bu?.name, kind: bu?.kind },
    buThemes: s.challengeThemes.filter((t) => t.buId === b.buId).map((t) => `${t.title}: ${t.description}`),
    existingAgenda: existing,
    verifiedSupplyInBu: passportInBu,
    taxonomy: s.skills.map((k) => ({ code: k.code, name: k.name, domain: s.skillDomains.find((d) => d.id === k.domainId)?.name, description: k.description, critical: k.critical, levels: k.levelDescriptors })),
    cohortOptions: s.cohorts.filter((c) => c.status === 'planned' || c.status === 'framing').map((c) => ({ code: c.code, program: c.program, start: c.startDate, seats: c.seats })),
  }
}

export const PRACTICE_SCENARIOS: { id: string; title: string; brief: string; rubric: string[] }[] = [
  { id: 'gate2', title: 'Gate 2 · CEO investment pitch', brief: 'You have six minutes with the Capability Investment Committee to ask for funding for your concept.', rubric: ['Problem and value stated first', 'Customer evidence quality', 'Business case with best / worst case', 'The ask: amount, what it buys, by when', 'Handles the hard question'] },
  { id: 'customer', title: 'Customer discovery interview', brief: 'You are interviewing a dealer or an internal customer to validate a need, not to sell.', rubric: ['Asks about the last real occurrence', 'Quantifies the cost of the problem', 'Avoids leading and pitching', 'Captures a testable need'] },
  { id: 'sponsor', title: 'Impact contract conversation with your sponsor', brief: 'You are agreeing the targeted objective, baseline and THB value for your 90-day sprint.', rubric: ['States a confirmed baseline and source', 'Target is specific and time-bound', 'THB value is defensible', 'Agrees the evidence cadence'] },
  { id: 'midgate', title: 'Mid-sprint gate: scale, pivot or reset', brief: 'You are presenting week-6 evidence to your manager and sponsor and recommending a call.', rubric: ['Baseline versus current with the trend', 'Honest about what is not working', 'Clear recommendation with reasoning', 'Names what changes next week'] },
]

export function buildPracticeContext(s: Snapshot, personaId: string, scenarioId: string, transcript: { role: 'learner' | 'partner'; text: string }[]) {
  const sc = PRACTICE_SCENARIOS.find((x) => x.id === scenarioId)!
  const p = s.personas.find((x) => x.id === personaId)!
  const enr = s.enrollments.filter((e) => e.personaId === personaId)
  const contract = s.impactContracts.find((c) => c.learnerId === personaId && c.status !== 'withdrawn')
  const concept = enr.find((e) => e.teamId) ? s.concepts.find((c) => c.teamId === enr.find((e) => e.teamId)!.teamId) : null
  return {
    scenario: { id: sc.id, title: sc.title, brief: sc.brief, rubric: sc.rubric },
    learner: { name: p.fullName, role: p.jobTitle, bu: s.businessUnits.find((b) => b.id === p.buId)?.code, functionType: p.functionType },
    theirContract: contract ? { title: contract.title, objectiveType: contract.objectiveType, baseline: contract.baselineValue, target: contract.targetValue, unit: contract.unit, targetThb: contract.targetThb } : null,
    theirConcept: concept ? { title: concept.title, summary: concept.summary, stage: concept.stage, pipelineThb: concept.pipelineValueThb } : null,
    transcript,
  }
}

export function buildTalentReviewContext(s: Snapshot, personaId: string) {
  const p = s.personas.find((x) => x.id === personaId)!
  const enr = s.enrollments.filter((e) => e.personaId === personaId)
  return {
    person: { name: p.fullName, role: p.jobTitle, level: p.level, bu: s.businessUnits.find((b) => b.id === p.buId)?.code, aspiration: p.careerAspiration, kpis: p.kpis },
    programmes: enr.map((e) => { const c = s.cohorts.find((k) => k.id === e.cohortId)!; return { cohort: c.name, program: c.program, status: e.status, impactRating: e.impactRating, topDecile: e.topDecile, fastTrackBcd: e.fastTrackBcd } }),
    verifiedSkills: s.passportEntries.filter((x) => x.personaId === personaId && x.tier === 'outcome_verified').map((x) => ({ skill: s.skills.find((k) => k.id === x.skillId)?.name, code: s.skills.find((k) => k.id === x.skillId)?.code, level: x.level, badge: x.badgeCode, mintedAt: x.mintedAt.slice(0, 10) })),
    validatedImpact: s.ledgerEntries.filter((l) => l.personaId === personaId).map((l) => ({ title: l.title, claimedThb: l.claimedValueThb, validatedThb: l.validatedValueThb, status: l.status })),
    gateOutcomes: s.concepts.filter((c) => enr.some((e) => e.teamId === c.teamId)).flatMap((c) => s.gateReviews.filter((g) => g.conceptId === c.id && g.decision !== 'pending').map((g) => ({ concept: c.title, gate: g.gateNo, decision: g.decision }))),
    recognition: s.recognitions.filter((r) => r.personaId === personaId).map((r) => r.note),
    succession: s.successionEntries.filter((x) => x.personaId === personaId).map((x) => ({ pool: x.pool, basis: x.basis, fulfilled: !!x.fulfilledAt })),
    marketplace: s.marketplaceInterests.filter((i) => i.personaId === personaId).map((i) => ({ role: s.marketplaceRoles.find((r) => r.id === i.roleId)?.title, status: i.status })),
  }
}
