import { runGuidance } from '../server/guidance'
const r = await runGuidance({ kind: 'coach', lang: 'en', question: 'What do I need to submit for the mid-sprint gate?', context: { learner: { name: 'Nara', role: 'Regional Sales Lead' }, cohort: { midGate: '2026-09-25' }, modules: [{ code: 'CHG-01.2', title: 'Weekly evidence cadence' }] } }, process.env.ANTHROPIC_API_KEY)
console.log(JSON.stringify(r, null, 1))
