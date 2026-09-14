// Generates authored study content for every learning module with Claude (build-time; output committed as JSON).
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { learningModules, skills, skillDomains } from '../src/data/fixtures'

const OUT = new URL('../src/data/module-content.json', import.meta.url)
const existing: Record<string, unknown> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {}
const client = new Anthropic()
const schema = z.object({
  modules: z.array(z.object({
    code: z.string(),
    summary: z.string().describe('2 sentences: what the module covers and why it matters at SCG'),
    objectives: z.array(z.string()).min(2).max(4).describe('Observable "you can..." statements'),
    keyPoints: z.array(z.string()).min(3).max(8),
    scgExample: z.string().describe('A concrete 3-4 sentence worked example in an SCG context (cement, packaging, chemicals, shared services or dealers), using realistic but fictional numbers'),
    practiceTask: z.string().describe('A 20-30 minute task the learner does on their own function data this week, with the expected output'),
    commonMistakes: z.array(z.string()).min(2).max(4),
    quickCheck: z.array(z.object({ question: z.string(), options: z.array(z.string()).min(3).max(5), correct: z.number().int().min(0).max(4), why: z.string() })).min(2).max(4),
    coachPrompt: z.string().describe('One question a coach can ask in the clinic to check the skill transferred to work'),
  })),
})

const todo = learningModules.filter((m) => !existing[m.code])
console.log(`modules to generate: ${todo.length} of ${learningModules.length}`)
for (let i = 0; i < todo.length; i += 6) {
  const batch = todo.slice(i, i + 6)
  const desc = batch.map((m) => { const sk = skills.find((s) => s.id === m.skillId)!; const dom = skillDomains.find((d) => d.id === sk.domainId)!; return { code: m.code, title: m.title, format: m.format, minutes: m.durationMin, variant: m.variant, skill: sk.name, skillDescription: sk.description, domain: dom.name, domainDescription: dom.description, levels: sk.levelDescriptors } })
  let res: Awaited<ReturnType<typeof client.messages.parse<typeof schema>>> | null = null
  for (let attempt = 1; attempt <= 4 && !res; attempt++) {
    try {
      res = await client.messages.parse({
    model: 'claude-opus-5', max_tokens: 16000,
    system: 'You write concise, practical micro-learning content for SCG (Thai industrial conglomerate: cement and building materials, packaging, chemicals, shared services) under the "Modernize Capability Development 2027" programme. Write in plain business English for supervisors and middle managers. Content must be specific to each module title and format, grounded in the skill description and proficiency levels, and use fictional but realistic SCG examples. No marketing tone.',
    messages: [{ role: 'user', content: `Write study content for these modules. Return one entry per module code, in the same order.\n${JSON.stringify(desc, null, 1)}` }],
    output_config: { format: zodOutputFormat(schema), effort: 'medium' },
      })
    } catch (e) {
      console.log(`batch ${i / 6 + 1} attempt ${attempt} failed: ${(e as Error).message.slice(0, 200)}`)
      await new Promise((r) => setTimeout(r, 15000 * attempt))
    }
  }
  if (!res) throw new Error('batch failed after retries')
  if (!res.parsed_output) throw new Error('no output')
  for (const m of res.parsed_output.modules) existing[m.code] = m
  writeFileSync(OUT, JSON.stringify(existing, null, 1))
  console.log(`saved ${Object.keys(existing).length} (batch ${i / 6 + 1}, ${res.usage.output_tokens} out tokens)`)
}
console.log('done')
