// Expert Guidance: server-side Claude calls. The API key never reaches the browser.
// Used by api/guidance.ts (Vercel function) and by the Vite dev middleware.
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

export const MODEL = 'claude-opus-5'
/** Sonnet handles the short, highly-constrained dashboard summary; Opus does the reasoning-heavy kinds. */
export const MODEL_BY_KIND: Record<string, string> = { performance: 'claude-sonnet-5' }

const SYSTEM = `You are Expert Guidance, the personalisation and coaching engine inside the SCG Capability Suite, the platform for SCG's "Modernize Capability Development 2027" strategy (skills-first, project-based, AI-powered).

Programme facts you must respect:
- Modernized ABC (12 weeks): Phase 0 AI skill diagnostic + flipped micro-learning (2 weeks, virtual); Phase 1 applied capability labs (4 days in person: Lead across silos; Business & green acumen; AI & data for impact; Commercial excellence + impact contract); Phase 2 apply-to-impact sprint (90 days on the job, weekly evidence, coaching clinics at week 4 and 9, mid-sprint gate at week 6: scale / pivot / reset); Phase 3 impact showcase and verification (week 12-14), badges mint into the skill passport.
- Six ABC domains: AI-augmented decision-making; Data-driven OpEx improvement; Commercial & green acumen; Cross-silo leadership; Customer-centric innovation; Change execution.
- Modernized BCD (16 weeks + scale-up): sponsor-owned P&L challenge briefs; cross-BU teams; Gate 1 proof of concept (go / pivot / stop); Gate 2 CEO investment pitch (invest / small-scale / pivot / stop); Gate 3 scale-up via SCG Start the Dot or internal high-impact initiative.
- Impact contracts set targeted objectives on day one: business functions target revenue, margin or share of wallet; enabling functions target cost-to-serve, SLA / turnaround or productivity per FTE. Sponsors validate delivered THB value into the impact ledger.
- Proficiency levels: 1 Aware, 2 Practising, 3 Proficient, 4 Leading. Level 0 means not assessed (no evidence), never "no ability".
- Verification tiers: self-declared -> AI-inferred -> outcome-verified.

Rules:
- Ground every recommendation in the data provided (assessment answers, diagnostic, contract, evidence, plan, dates). Do not invent facts, people, numbers or modules. Only reference module codes and skill codes that appear in the provided catalogue.
- Be specific and practical; write for a Thai corporate audience in plain business English (the learner may ask in Thai; reply in the language of the question).
- Never present a directional judgement as an HR decision. Career, reward and promotion decisions are made by people.
- Write for a busy supervisor reading on a phone. Short sentences (aim for 12 words, never more than 20). One idea per sentence. No semicolons, no dashes joining clauses, no jargon without a plain-word gloss.
- Coach replies use this shape, with line breaks between parts: line 1 "Where you are:" one sentence. Line 2 "Next step:" one sentence with the date. Then up to three bullets starting with "- " and a verb (what to do, in order). Finish with one short encouraging line only if useful. Keep the whole reply under 120 words unless the learner asks for detail.
- Advice fields (priorities, coaching points, applications, risks) are one plain sentence each, starting with a verb where it is an action. Name the module code in brackets when you rely on one.
- Performance summaries are read by a busy leader on a dashboard. Use only the numbers supplied; never estimate, never add a number that is not in the context; never invent causes. Two sentences of summary, then two next steps. Each next step is one sentence, starts with a verb, and names the measure it is about. No preamble, no praise, no closing line.`

const diagnosticSchema = z.object({
  summary: z.string().describe('3-4 sentence summary of strengths, priority gaps and why they matter for the learner role and BU priority'),
  items: z.array(z.object({
    skillCode: z.string(),
    currentLevel: z.number().int().min(0).max(4).describe('0 only when there is no evidence at all'),
    targetLevel: z.number().int().min(1).max(4),
    priorityRank: z.number().int().min(1).max(6).nullable().describe('1-6 for the prioritised gaps, null for non-priority skills'),
    evidenceSource: z.enum(['self_declared', 'ai_inferred', 'knowledge_test', 'manager_input']),
    rationale: z.string(),
  })),
  plan: z.array(z.object({ moduleCode: z.string(), reason: z.string() })).describe('Ordered micro-learning path, 5-9 modules, priority gaps first; include BU-relevant variants'),
  skipped: z.array(z.object({ moduleCode: z.string(), reason: z.string() })).describe('Modules deliberately skipped because the learner already meets the level'),
  coachingPoints: z.array(z.string()).describe('2-4 topics to push to the human coach before the first clinic'),
})

const adviceSchema = z.object({
  headline: z.string().describe('One sentence on where the learner stands right now'),
  priorities: z.array(z.object({ title: z.string(), why: z.string(), action: z.string() })).describe('Exactly 3 priorities for the coming week'),
  coachingPoints: z.array(z.string()).describe('Topics for the human coach at the next clinic'),
  applicationToRole: z.array(z.string()).describe('Micro-applications of the priority skills in the learner\'s own work this week'),
  applicationToProject: z.array(z.string()).describe('How to apply the skills to the impact contract or BCD concept, with suggested tools and next actions'),
  risks: z.array(z.string()).describe('What could derail the sprint or gate, and the early signal to watch'),
})

const coachSchema = z.object({
  reply: z.string().describe('The answer in the language of the question, grounded only in the programme facts and provided context. Plain words, short sentences, shaped as: "Where you are:" line, "Next step:" line with date, then up to three "- " bullets. Under 120 words.'),
  citedModuleCode: z.string().nullable().describe('Module code from the catalogue the answer is grounded in, or null'),
  flagForHumanCoach: z.string().nullable().describe('Set when the learner seems stuck or the question needs a human decision; otherwise null'),
})

const performanceSchema = z.object({
  summary: z.string().describe('Exactly two sentences separated by one space. For view "team": sentence 1 gives the health score versus company, the rank from rankByHealthScore, and aheadOfCompany.count of aheadOfCompany.of measures ahead (use those exact numbers); sentence 2 names highlight.strength then highlight.weakness with their team and company numbers. For view "company": sentence 1 gives subject.healthScore as the company health score, subject.learnersInPrograms and subject.unitsCompared (use those exact numbers; each measure carries companyValue); sentence 2 names highlight.strength (the leading unit) then highlight.weakness (the trailing unit) with their scores from the leaderboard. Never choose measures or units other than those in highlight.'),
  nextSteps: z.array(z.string()).length(2).describe('Exactly two items, covering context.focus[0] then context.focus[1] in that order. Each is one sentence starting with a verb, naming the measure or unit with its number from the context, and saying what to do or what to investigate.'),
})

const briefingSchema = z.object({
  headline: z.string(),
  learners: z.array(z.object({ personaName: z.string(), status: z.string(), focus: z.string(), suggestedQuestion: z.string() })),
  agenda: z.array(z.string()).describe('4-6 agenda points for the clinic'),
})

export type GuidanceKind = 'diagnostic' | 'journey' | 'contract' | 'coach' | 'clinic_briefing' | 'performance'
export interface GuidanceRequest { kind: GuidanceKind; context: unknown; question?: string; lang?: 'th' | 'en' }

const PROMPTS: Record<GuidanceKind, string> = {
  diagnostic: 'Run the AI skill diagnostic for this learner. Use the self-ratings, the knowledge check answers (compare with the correct answers), the role context and the BU priority. Rank the priority gaps by skill gap x role relevance x project need. Build the personal micro-learning path from the module catalogue only.',
  journey: 'Give the learner Expert Guidance for the coming week based on their diagnostic, impact contract, evidence so far, learning plan progress, coaching notes and upcoming programme dates.',
  contract: 'Review this impact contract and its sprint evidence like an experienced sponsor-side coach. Focus on evidence quality, baseline credibility, the trend against target, and what must be true before the next gate or showcase.',
  coach: 'Answer the learner\'s question as the always-on AI coach (Program navigator, Activity guide, Content expert, Practice partner, Progress mirror). Keep it easy to read: where they are, the next step with its date, then at most three short verb-first bullets. Cite the module code you relied on when relevant.',
  clinic_briefing: 'Prepare the human coach\'s briefing for this clinic: for each learner, status, what to focus on and one good question to ask. Then propose the clinic agenda.',
  performance: 'Read this capability-programme scorecard and write the dashboard summary. Use only the numbers given. The strength and weakness in sentence 2 are already chosen for you in "highlight" and the two next steps are already chosen in "focus" - keep to them and write them in plain words for a leader.',
}

export async function runGuidance(req: GuidanceRequest, apiKey?: string) {
  const client = new Anthropic(apiKey ? { apiKey } : undefined)
  const format = req.kind === 'diagnostic' ? diagnosticSchema : req.kind === 'coach' ? coachSchema : req.kind === 'clinic_briefing' ? briefingSchema : req.kind === 'performance' ? performanceSchema : adviceSchema
  const userText = `${PROMPTS[req.kind]}\n\n<context>\n${JSON.stringify(req.context, null, 1)}\n</context>${req.question ? `\n\n<question lang="${req.lang ?? 'en'}">\n${req.question}\n</question>` : ''}`
  const response = await client.messages.parse({
    model: MODEL_BY_KIND[req.kind] ?? MODEL,
    max_tokens: req.kind === 'performance' ? 1500 : 8000,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userText }],
    output_config: { format: zodOutputFormat(format), effort: req.kind === 'coach' ? 'medium' : req.kind === 'performance' ? 'low' : 'high' },
  })
  if (response.stop_reason === 'refusal') throw new Error('The guidance request was declined by the model safety layer.')
  if (!response.parsed_output) throw new Error('The model returned an unreadable answer. Try again.')
  return { model: response.model, output: response.parsed_output as unknown, usage: { input: response.usage.input_tokens, output: response.usage.output_tokens, cached: response.usage.cache_read_input_tokens ?? 0 } }
}

/** Shared HTTP handler body: returns status + JSON. */
export async function handleGuidance(body: unknown, apiKey: string | undefined): Promise<{ status: number; json: unknown }> {
  if (!apiKey) return { status: 503, json: { error: 'Expert Guidance is not configured on this server (ANTHROPIC_API_KEY missing).' } }
  const b = body as Partial<GuidanceRequest>
  if (!b || !b.kind || !(b.kind in PROMPTS)) return { status: 400, json: { error: 'Unknown guidance kind.' } }
  try {
    const result = await runGuidance(b as GuidanceRequest, apiKey)
    if (b.kind === 'performance') {
      const out = result.output as { summary?: string }
      // Models occasionally drop the space between the two sentences.
      if (typeof out.summary === 'string') out.summary = out.summary.replace(/([.!?])([A-Z])/g, '$1 $2').trim()
    }
    return { status: 200, json: result }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { status: 502, json: { error: 'Expert Guidance API key was rejected.' } }
    if (e instanceof Anthropic.RateLimitError) return { status: 429, json: { error: 'Expert Guidance is busy. Try again in a moment.' } }
    if (e instanceof Anthropic.APIError) return { status: 502, json: { error: `Expert Guidance error (${e.status}): ${e.message}` } }
    return { status: 500, json: { error: (e as Error).message } }
  }
}
