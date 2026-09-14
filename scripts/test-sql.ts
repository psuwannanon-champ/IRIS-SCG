// Runs the migrations in an in-process Postgres (PGlite) and exercises the workflow functions.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

const db = new PGlite()
const sql = (q: string, params: unknown[] = []) => db.query(q, params)
const rpc = async (fn: string, args: Record<string, unknown>) => {
  const keys = Object.keys(args)
  const call = `select ${fn}(${keys.map((k, i) => `${k} := $${i + 1}`).join(', ')}) as r`
  return (await sql(call, keys.map((k) => (typeof args[k] === 'object' && args[k] !== null ? JSON.stringify(args[k]) : args[k])))).rows[0] as { r: unknown }
}
const expectFail = async (label: string, fn: () => Promise<unknown>) => {
  try { await fn(); console.log('  FAIL (no error):', label); process.exitCode = 1 } catch (e) { console.log('  ok (rejected):', label, '→', (e as Error).message.split('\n')[0]) }
}
const count = async (t: string, where = 'true') => Number((await sql(`select count(*)::int as n from ${t} where ${where}`)).rows[0]!['n' as never])

await db.exec('create role anon nologin; create role authenticated nologin;')
await db.exec(readFileSync('supabase/migrations/0001_schema.sql', 'utf8'))
console.log('schema applied')
await db.exec(readFileSync('supabase/migrations/0002_seed.sql', 'utf8'))
console.log('seed applied; personas =', await count('personas'), 'contracts =', await count('impact_contracts'))

console.log('Contract workflow')
await expectFail('manager cannot submit learner draft', () => rpc('transition_impact_contract', { p_actor: 'per-ratree', p_contract: 'ic-nok', p_action: 'submit', p_payload: {} }))
await rpc('transition_impact_contract', { p_actor: 'per-nok', p_contract: 'ic-nok', p_action: 'submit', p_payload: {} })
console.log('  nok submitted →', (await sql(`select status from impact_contracts where id='ic-nok'`)).rows[0])
await expectFail('return requires note', () => rpc('transition_impact_contract', { p_actor: 'per-ratree', p_contract: 'ic-nok', p_action: 'return', p_payload: {} }))
await rpc('transition_impact_contract', { p_actor: 'per-ratree', p_contract: 'ic-pim', p_action: 'manager_approve', p_payload: {} })
await rpc('transition_impact_contract', { p_actor: 'per-wanida', p_contract: 'ic-pim', p_action: 'sponsor_approve', p_payload: {} })
console.log('  pim →', (await sql(`select status from impact_contracts where id='ic-pim'`)).rows[0], 'notifications for pim =', await count('notifications', `persona_id='per-pim'`))
await rpc('add_sprint_evidence', { p_actor: 'per-nara', p_contract: 'ic-nara', p_input: { week_no: 5, title: 'Test evidence', note: 'n', metric_value: 33.9 } })
console.log('  evidence rows for nara =', await count('sprint_evidence', `contract_id='ic-nara'`))
await rpc('transition_impact_contract', { p_actor: 'per-somsak', p_contract: 'ic-tanawat', p_action: 'mid_gate_decide', p_payload: { mid_gate_decision: 'scale', note: 'Scale to Line 1.' } })
console.log('  tanawat →', (await sql(`select status, mid_gate_decision from impact_contracts where id='ic-tanawat'`)).rows[0])
await rpc('transition_impact_contract', { p_actor: 'per-prasert', p_contract: 'ic-jiraporn', p_action: 'validate', p_payload: { validated_value_thb: 1000000 } })
console.log('  jiraporn →', (await sql(`select status, validated_value_thb from impact_contracts where id='ic-jiraporn'`)).rows[0], 'ledger →', (await sql(`select status, validated_value_thb from ledger_entries where id='lg-jiraporn'`)).rows[0], 'badges =', await count('passport_entries', `persona_id='per-jiraporn' and tier='outcome_verified'`), 'enrollment →', (await sql(`select status from enrollments where id='enr-jiraporn'`)).rows[0])
const newId = (await rpc('save_impact_contract', { p_actor: 'per-boonchu', p_input: { enrollment_id: 'enr-boonchu', title: 'Second contract test title', objective_type: 'cost_to_serve', description: 'A description long enough for the test to pass validation.', baseline_value: 1, target_value: 2, unit: 'x', target_thb: 1000, tools_applied: null } })).r
console.log('  created contract id', newId)

console.log('Brief workflow')
await expectFail('learner cannot create brief', () => rpc('save_challenge_brief', { p_actor: 'per-nara', p_input: { bu_id: 'bu-cbm', title: 'x', challenge_type: 'cost', problem_statement: 'p', success_metric: 'm' } }))
await rpc('transition_challenge_brief', { p_actor: 'per-wanida', p_brief: 'cb-hrbot', p_action: 'submit', p_payload: {} })
await expectFail('sponsor cannot approve', () => rpc('transition_challenge_brief', { p_actor: 'per-wanida', p_brief: 'cb-hrbot', p_action: 'approve', p_payload: {} }))
await rpc('transition_challenge_brief', { p_actor: 'per-chatchai', p_brief: 'cb-hrbot', p_action: 'approve', p_payload: {} })
await expectFail('assign needs BCD cohort', () => rpc('transition_challenge_brief', { p_actor: 'per-supattra', p_brief: 'cb-hrbot', p_action: 'assign', p_payload: { cohort_id: 'coh-abc-l1' } }))
await rpc('transition_challenge_brief', { p_actor: 'per-supattra', p_brief: 'cb-hrbot', p_action: 'assign', p_payload: { cohort_id: 'coh-bcd-2027-1' } })
console.log('  hrbot →', (await sql(`select status, cohort_id from challenge_briefs where id='cb-hrbot'`)).rows[0])

console.log('Gate workflow')
await expectFail('non-committee cannot decide', () => rpc('decide_gate', { p_actor: 'per-prasert', p_gate: 'gr-invoice-2', p_decision: 'invest', p_note: 'x', p_value: null }))
await expectFail('invalid decision for gate 2', () => rpc('decide_gate', { p_actor: 'per-chatchai', p_gate: 'gr-invoice-2', p_decision: 'go', p_note: 'x', p_value: null }))
await rpc('decide_gate', { p_actor: 'per-chatchai', p_gate: 'gr-invoice-2', p_decision: 'invest', p_note: 'Invest THB 6M.', p_value: null })
console.log('  invoice →', (await sql(`select stage from concepts where id='cp-invoice'`)).rows[0], 'gate3 created =', await count('gate_reviews', `concept_id='cp-invoice' and gate_no=3`), 'mali badges =', await count('passport_entries', `persona_id='per-mali' and source_id='gr-invoice-2'`))
await expectFail('non-member cannot submit evidence', () => rpc('submit_gate_evidence', { p_actor: 'per-nara', p_gate: 'gr-fuel-2', p_summary: 'x' }))
await rpc('submit_gate_evidence', { p_actor: 'per-warit', p_gate: 'gr-fuel-2', p_summary: 'Pre-read and pitch.' })
console.log('  fuel →', (await sql(`select stage from concepts where id='cp-fuel'`)).rows[0])

console.log('Ledger, learning, coaching, marketplace')
await expectFail('only sponsor validates', () => rpc('review_ledger_entry', { p_actor: 'per-supattra', p_entry: 'lg-arisa', p_decision: 'validate', p_value: 1, p_note: null }))
await rpc('review_ledger_entry', { p_actor: 'per-supattra', p_entry: 'lg-arisa', p_decision: 'audit', p_value: null, p_note: 'Audited.' })
await rpc('update_learning_item', { p_actor: 'per-nara', p_item: 'lp-nara-6', p_status: 'completed' })
await rpc('run_diagnostic', { p_actor: 'per-nok', p_enrollment: 'enr-nok' })
console.log('  nok diagnostic items =', await count('diagnostic_items', `diagnostic_id='dx-nok'`), 'plan items =', await count('learning_plan_items', `enrollment_id='enr-nok'`))
await rpc('mark_clinic_briefing_ready', { p_actor: 'per-anong', p_clinic: 'cl-l1-2' })
await rpc('add_coaching_note', { p_actor: 'per-anong', p_enrollment: 'enr-nara', p_note: 'Good progress.', p_clinic: null })
await rpc('express_interest', { p_actor: 'per-nara', p_role: 'mr-dealer-analytics' })
await expectFail('duplicate interest', () => rpc('express_interest', { p_actor: 'per-nara', p_role: 'mr-dealer-analytics' }))
await rpc('mark_notification_read', { p_actor: 'per-nara', p_notification: 'nt-2' })
await rpc('append_coach_messages', { p_actor: 'per-nara', p_content: 'hi', p_lang: 'en', p_reply: 'reply', p_module: null })
console.log('  events =', await count('record_events'), 'notifications =', await count('notifications'))
await rpc('reset_demo', {})
console.log('reset_demo → contracts =', await count('impact_contracts'), 'events =', await count('record_events'))
console.log(process.exitCode ? 'SQL TESTS FAILED' : 'SQL TESTS PASSED')
