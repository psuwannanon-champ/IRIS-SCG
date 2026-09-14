// Pure workflow rules shared by the local data source and mirrored in the Supabase RPCs.
import type { ContractStatus, BriefStatus, Role } from '@/domain/types'
import type { ContractAction, BriefAction } from '@/data/datasource'

export interface ContractTransition {
  action: ContractAction
  from: ContractStatus[]
  to: ContractStatus | 'decided'
  /** who may perform it relative to the contract */
  by: ('learner' | 'manager' | 'sponsor')[]
  label: string
  negative?: boolean
  requiresNote?: boolean
}

export const CONTRACT_TRANSITIONS: ContractTransition[] = [
  { action: 'submit', from: ['draft', 'returned'], to: 'manager_review', by: ['learner'], label: 'Submit for manager review' },
  { action: 'withdraw', from: ['draft', 'returned', 'manager_review', 'sponsor_review'], to: 'withdrawn', by: ['learner'], label: 'Withdraw contract', negative: true },
  { action: 'manager_approve', from: ['manager_review'], to: 'sponsor_review', by: ['manager'], label: 'Approve and send to sponsor' },
  { action: 'return', from: ['manager_review', 'sponsor_review', 'showcase_review'], to: 'returned', by: ['manager', 'sponsor'], label: 'Return for changes', negative: true, requiresNote: true },
  { action: 'sponsor_approve', from: ['sponsor_review'], to: 'active', by: ['sponsor'], label: 'Approve impact contract' },
  { action: 'submit_mid_gate', from: ['active'], to: 'mid_gate_review', by: ['learner'], label: 'Submit mid-sprint evidence pack' },
  { action: 'mid_gate_decide', from: ['mid_gate_review'], to: 'decided', by: ['manager', 'sponsor'], label: 'Record mid-sprint gate decision' },
  { action: 'submit_showcase', from: ['active'], to: 'showcase_review', by: ['learner'], label: 'Submit showcase for validation' },
  { action: 'validate', from: ['showcase_review'], to: 'validated', by: ['sponsor'], label: 'Validate impact' },
]

export function contractRelation(c: { learnerId: string; managerId: string; sponsorId: string }, actorId: string): ('learner' | 'manager' | 'sponsor')[] {
  const rel: ('learner' | 'manager' | 'sponsor')[] = []
  if (c.learnerId === actorId) rel.push('learner')
  if (c.managerId === actorId) rel.push('manager')
  if (c.sponsorId === actorId) rel.push('sponsor')
  return rel
}

export function availableContractActions(c: { status: ContractStatus; learnerId: string; managerId: string; sponsorId: string }, actorId: string) {
  const rel = contractRelation(c, actorId)
  return CONTRACT_TRANSITIONS.filter((t) => t.from.includes(c.status) && t.by.some((b) => rel.includes(b)))
    // a returned showcase goes back to the learner as "active" with a note, handled in transition
}

export interface BriefTransition {
  action: BriefAction
  from: BriefStatus[]
  to: BriefStatus
  by: ('sponsor' | 'committee' | 'program_office')[]
  label: string
  negative?: boolean
  requiresNote?: boolean
}

export const BRIEF_TRANSITIONS: BriefTransition[] = [
  { action: 'submit', from: ['draft', 'returned'], to: 'committee_review', by: ['sponsor'], label: 'Submit to committee' },
  { action: 'withdraw', from: ['draft', 'returned', 'committee_review'], to: 'withdrawn', by: ['sponsor'], label: 'Withdraw brief', negative: true },
  { action: 'approve', from: ['committee_review'], to: 'approved', by: ['committee'], label: 'Approve brief' },
  { action: 'return', from: ['committee_review'], to: 'returned', by: ['committee'], label: 'Return for changes', negative: true, requiresNote: true },
  { action: 'reject', from: ['committee_review'], to: 'rejected', by: ['committee'], label: 'Reject brief', negative: true, requiresNote: true },
  { action: 'assign', from: ['approved'], to: 'assigned', by: ['program_office'], label: 'Assign to cohort' },
]

export function briefRelation(b: { sponsorId: string }, actor: { id: string; role: Role }): ('sponsor' | 'committee' | 'program_office')[] {
  const rel: ('sponsor' | 'committee' | 'program_office')[] = []
  if (b.sponsorId === actor.id) rel.push('sponsor')
  if (actor.role === 'committee') rel.push('committee')
  if (actor.role === 'program_office') rel.push('program_office')
  return rel
}

export function availableBriefActions(b: { status: BriefStatus; sponsorId: string }, actor: { id: string; role: Role }) {
  const rel = briefRelation(b, actor)
  return BRIEF_TRANSITIONS.filter((t) => t.from.includes(b.status) && t.by.some((x) => rel.includes(x)))
}

export const GATE_DECISIONS_BY_GATE: Record<1 | 2 | 3, ('go' | 'pivot' | 'stop' | 'invest' | 'small_scale' | 'scale' | 'hold')[]> = {
  1: ['go', 'pivot', 'stop'],
  2: ['invest', 'small_scale', 'pivot', 'stop'],
  3: ['scale', 'hold', 'stop'],
}
