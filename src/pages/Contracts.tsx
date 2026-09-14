import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { visibleContracts, personaName, currentSprintWeek } from '@/domain/selectors'
import { availableContractActions } from '@/data/rules'
import { CONTRACT_STATUS_LABEL, OBJECTIVE_LABEL, type ContractStatus, type ImpactContract, type ObjectiveType } from '@/domain/types'
import { contractTone, contractResponsible } from '@/domain/status'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pagination, paginate, Pill, Button, Dialog, Field, DL, Notice } from '@/components/ui'
import { History, Money } from '@/components/records'
import { fmtDate, fmtNum, fmtThb, orNotProvided } from '@/lib/format'
import { Icon } from '@/icons/Icon'
import type { ContractAction, ContractActionPayload } from '@/data/datasource'

const STATUSES = Object.keys(CONTRACT_STATUS_LABEL) as ContractStatus[]

export function ContractsPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const search = useSearch({ strict: false }) as { status?: string; page?: number; q?: string }
  const nav = useNavigate()
  const [q, setQ] = useState(search.q ?? '')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const all = visibleContracts(snap, actor)
  const filtered = all.filter((c) => (!search.status || c.status === search.status) && (!q || `${c.title} ${personaName(snap, c.learnerId)}`.toLowerCase().includes(q.toLowerCase())))
  const rank = (c: ImpactContract) => (availableContractActions(c, actor.id).length ? 0 : 1)
  const sorted = [...filtered].sort((a, b) => rank(a) - rank(b) || b.updatedAt.localeCompare(a.updatedAt))
  const setSearch = (patch: Record<string, unknown>) => nav({ to: '/contracts', search: { status: search.status ?? '', page: 1, q, ...patch } as never })
  const pg = paginate(sorted, 10, search.page ?? 1, (p) => setSearch({ page: p }))
  const myEnrollment = snap.enrollments.find((e) => e.personaId === actor.id && snap.cohorts.find((c) => c.id === e.cohortId)?.program === 'ABC' && !['graduated', 'withdrawn'].includes(e.status))
  const canCreate = actor.role === 'learner' && myEnrollment && !all.some((c) => c.enrollmentId === myEnrollment.id && !['withdrawn', 'reset', 'validated'].includes(c.status))
  return (
    <>
      <PageHeader title="Impact contracts" description="Targeted objectives agreed by learner, manager and sponsor on Lab Day 4, tracked through the 90-day sprint to validated THB impact. Records needing your action are listed first."
        actions={canCreate && <Link to="/contracts/new" className="btn btn-primary" data-tour="new-contract"><Icon name="plus" size={16} />New impact contract</Link>} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" className="field-input max-w-xs" placeholder="Search title or learner" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setSearch({ q })} />
        <label className="sr-only" htmlFor="st">Status</label>
        <select id="st" className="field-input max-w-[220px]" value={search.status ?? ''} onChange={(e) => setSearch({ status: e.target.value })}>
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{CONTRACT_STATUS_LABEL[s]}</option>)}
        </select>
        <span className="text-[13px] text-(--color-muted)">{filtered.length} of {all.length}</span>
      </div>
      <Section>
        {sorted.length === 0 ? <EmptyState icon="file-check-02" title="No impact contracts match" body={all.length ? 'Change the filters to see more.' : actor.role === 'learner' ? 'Create your impact contract after Lab Day 4. Your manager and sponsor will review it here.' : 'Contracts appear here when learners in your scope create them.'} /> : (
          <>
            <div className="table-grid hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_150px_140px_110px_80px] px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint) xl:grid"><div>Contract</div><div>Learner</div><div>Status</div><div>Responsible now</div><div>Target</div><div className="text-right">Actions</div></div>
            <ul className="divide-y divide-(--color-border)">
              {pg.slice.map((c) => (
                <li key={c.id}><Link to="/contracts/$id" params={{ id: c.id }} className="row-link table-grid grid-cols-[minmax(0,1fr)_auto] px-3 py-2.5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_150px_140px_110px_80px]">
                  <div className="min-w-0"><div className="truncate font-medium">{c.title}</div><div className="truncate text-[12px] text-(--color-muted)">{OBJECTIVE_LABEL[c.objectiveType]} · updated {fmtDate(c.updatedAt)}</div></div>
                  <div className="hidden truncate text-[13px] xl:block">{personaName(snap, c.learnerId)}</div>
                  <div><Pill tone={contractTone[c.status]}>{CONTRACT_STATUS_LABEL[c.status]}</Pill></div>
                  <div className="hidden text-[13px] xl:block">{contractResponsible[c.status]}</div>
                  <div className="hidden text-[13px] xl:block">{fmtThb(c.targetThb, true)}</div>
                  <div className="hidden text-right text-[13px] font-medium text-(--color-accent) xl:block">View details</div>
                </Link></li>
              ))}
            </ul>
            <Pagination {...pg} />
          </>
        )}
      </Section>
    </>
  )
}

/* ---------- Create / edit form ---------- */
const schema = z.object({
  title: z.string().min(8, 'Give the improvement a specific title (at least 8 characters).'),
  objectiveType: z.enum(['revenue_uplift', 'margin', 'share_of_wallet', 'cost_to_serve', 'sla_turnaround', 'productivity_per_fte']),
  description: z.string().min(30, 'Describe the practical improvement in your current role (at least 30 characters).'),
  baselineValue: z.coerce.number().nullable(),
  targetValue: z.coerce.number().nullable(),
  unit: z.string().nullable(),
  targetThb: z.coerce.number().min(0, 'Enter a THB value of zero or more.').nullable(),
  toolsApplied: z.string().nullable(),
})
type FormValues = z.output<typeof schema>
type FormInput = z.input<typeof schema>

export function ContractForm({ existing, onDone }: { existing?: ImpactContract; onDone: (id: string) => void }) {
  const { snap, actor } = useActor()
  const enrollment = existing ? snap!.enrollments.find((e) => e.id === existing.enrollmentId) : snap!.enrollments.find((e) => e.personaId === actor!.id && snap!.cohorts.find((c) => c.id === e.cohortId)?.program === 'ABC' && !['graduated', 'withdrawn'].includes(e.status))
  const save = useAction((ds, v: FormValues) => ds.saveContract(actor!.id, { ...v, id: existing?.id, enrollmentId: enrollment!.id }), existing ? 'Impact contract saved.' : 'Impact contract created as a draft.')
  const businessFn = actor!.functionType === 'business'
  const form = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: existing ? { title: existing.title, objectiveType: existing.objectiveType, description: existing.description, baselineValue: existing.baselineValue, targetValue: existing.targetValue, unit: existing.unit, targetThb: existing.targetThb, toolsApplied: existing.toolsApplied } : { title: '', objectiveType: businessFn ? 'revenue_uplift' : 'cost_to_serve', description: '', baselineValue: null, targetValue: null, unit: '', targetThb: null, toolsApplied: '' } })
  if (!enrollment) return <Notice tone="warning" icon="alert-triangle">You are not enrolled in an ABC cohort, so an impact contract cannot be created. The program office manages enrollments.</Notice>
  const manager = personaName(snap!, enrollment.managerId), sponsor = personaName(snap!, enrollment.sponsorId)
  const objectiveOptions = (Object.keys(OBJECTIVE_LABEL) as ObjectiveType[]).filter((k) => businessFn ? ['revenue_uplift', 'margin', 'share_of_wallet'].includes(k) : ['cost_to_serve', 'sla_turnaround', 'productivity_per_fte'].includes(k))
  const err = form.formState.errors
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (v) => { const id = await save.mutateAsync([v]); onDone(id as string) })} noValidate>
      <Notice tone="info" icon="info-circle">Your line manager <strong>{manager}</strong> reviews first, then sponsor <strong>{sponsor}</strong> approves. Objective types follow your function: {businessFn ? 'business functions target revenue, margin or share of wallet' : 'enabling functions target cost-to-serve, SLA / turnaround or productivity per FTE'}.</Notice>
      <Field label="Improvement title" required error={err.title?.message}>{(id, d) => <input id={id} className="field-input" aria-describedby={d} aria-invalid={!!err.title} {...form.register('title')} data-autofocus />}</Field>
      <Field label="Objective type" required hint="Set by function type so ROI is measurable for every learner." error={err.objectiveType?.message}>{(id) => <select id={id} className="field-input" {...form.register('objectiveType')}>{objectiveOptions.map((k) => <option key={k} value={k}>{OBJECTIVE_LABEL[k]}</option>)}</select>}</Field>
      <Field label="Practical improvement in your current role" required hint="What you will change, who is involved and what tools you will apply in the flow of work." error={err.description?.message}>{(id, d) => <textarea id={id} className="field-input" rows={4} aria-describedby={d} aria-invalid={!!err.description} {...form.register('description')} />}</Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Baseline value" hint="Confirmed starting point." error={err.baselineValue?.message}>{(id) => <input id={id} type="number" step="any" className="field-input" {...form.register('baselineValue')} />}</Field>
        <Field label="Target value" error={err.targetValue?.message}>{(id) => <input id={id} type="number" step="any" className="field-input" {...form.register('targetValue')} />}</Field>
        <Field label="Unit of measure" hint="For example % share of wallet, hours per month.">{(id) => <input id={id} className="field-input" {...form.register('unit')} />}</Field>
      </div>
      <Field label="Target business value (THB, annualised)" hint="Used for the THB pipeline and validated by your sponsor at the showcase." error={err.targetThb?.message}>{(id) => <input id={id} type="number" step="1000" className="field-input" {...form.register('targetThb')} />}</Field>
      <Field label="AI tools and methods applied" hint="The same tools mastered in the labs.">{(id) => <input id={id} className="field-input" {...form.register('toolsApplied')} />}</Field>
      <div className="flex justify-end gap-2"><Button type="submit" variant="primary" busy={save.isPending}>{existing ? 'Save changes' : 'Save draft'}</Button></div>
    </form>
  )
}

export function ContractNewPage() {
  const nav = useNavigate()
  const { status, actor } = useActor()
  if (status !== 'ready') return <LoadingBlock />
  if (actor?.role !== 'learner') return <Notice tone="warning">Only learners create impact contracts.</Notice>
  return (
    <>
      <PageHeader kicker="Impact contracts" title="New impact contract" description="Saved as a draft first. Submit it for manager review from the contract page when it is complete." />
      <Section className="max-w-3xl"><ContractForm onDone={(id) => nav({ to: '/contracts/$id', params: { id } })} /></Section>
    </>
  )
}

/* ---------- Detail ---------- */
export function ContractDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const { snap, actor, status, error, refetch } = useActor()
  const [dialog, setDialog] = useState<null | ContractAction | 'edit' | 'evidence'>(null)
  const transition = useAction((ds, action: ContractAction, payload: ContractActionPayload) => ds.transitionContract(actor!.id, id, action, payload))
  const addEvidence = useAction((ds, input: { weekNo: number; title: string; note: string; metricValue: number | null }) => ds.addEvidence(actor!.id, id, input), 'Evidence logged.')
  const c = snap?.impactContracts.find((x) => x.id === id)
  const visible = useMemo(() => (snap && actor ? visibleContracts(snap, actor).some((x) => x.id === id) : false), [snap, actor, id])
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  if (!c) return <EmptyState icon="file-02" title="Impact contract not found" body="It may have been removed or the link is incorrect." action={<Link to="/contracts" className="btn btn-secondary">Back to impact contracts</Link>} />
  if (!visible) return <Notice tone="warning" icon="lock-01">You are not connected to this impact contract. Only the learner, their manager, sponsor and coach, the program office and the committee can open it.</Notice>
  const enrollment = snap.enrollments.find((e) => e.id === c.enrollmentId)
  const cohort = snap.cohorts.find((k) => k.id === enrollment?.cohortId)
  const sprintStart = cohort?.keyDates.find((k) => k.label.startsWith('Impact sprint'))?.date ?? null
  const week = currentSprintWeek(sprintStart)
  const evidence = snap.sprintEvidence.filter((e) => e.contractId === c.id).sort((a, b) => a.weekNo - b.weekNo)
  const events = snap.recordEvents.filter((e) => e.recordType === 'impact_contract' && e.recordId === c.id)
  const notes = snap.coachingNotes.filter((n) => n.enrollmentId === c.enrollmentId)
  const ledger = snap.ledgerEntries.find((l) => l.sourceType === 'impact_contract' && l.sourceId === c.id)
  const actions = availableContractActions(c, actor.id)
  const isLearner = c.learnerId === actor.id
  const canEdit = isLearner && ['draft', 'returned'].includes(c.status)
  const canLog = isLearner && ['active', 'mid_gate_review'].includes(c.status)
  const dx = snap.diagnostics.find((d) => d.enrollmentId === c.enrollmentId)
  const priority = dx ? snap.diagnosticItems.filter((i) => i.diagnosticId === dx.id && i.priorityRank != null).sort((a, b) => a.priorityRank! - b.priorityRank!).slice(0, 3) : []
  const latest = evidence[evidence.length - 1]

  const nextStep: Record<ContractStatus, string> = {
    draft: 'The learner completes the contract and submits it. The line manager reviews next.',
    manager_review: `Waiting for ${personaName(snap, c.managerId)} (line manager) to approve or return. On approval it goes to the sponsor.`,
    sponsor_review: `Waiting for ${personaName(snap, c.sponsorId)} (BU sponsor) to approve. On approval the sprint becomes active.`,
    active: `Sprint active. The learner logs weekly evidence; at week 6 the manager or sponsor records scale, pivot or reset; at week 12 the learner submits the showcase for validation.`,
    mid_gate_review: `Waiting for ${personaName(snap, c.managerId)} or ${personaName(snap, c.sponsorId)} to record the mid-sprint gate decision.`,
    showcase_review: `Waiting for ${personaName(snap, c.sponsorId)} to validate the claimed THB value. Validation writes the ledger and mints badges.`,
    validated: 'Completed. Value is in the impact ledger, badges are in the passport and the impact rating feeds the performance review.',
    returned: `Returned to the learner with a note. Edit and resubmit; the review restarts with the line manager.`,
    withdrawn: 'Withdrawn by the learner. No further action.',
    reset: 'The mid-sprint gate reset this scope. The learner agrees a new scope with the manager and creates a new contract.',
  }

  return (
    <>
      <PageHeader kicker={<><Link to="/contracts">Impact contracts</Link> · {cohort?.code}</> as unknown as string} title={c.title} state={<Pill tone={contractTone[c.status]}>{CONTRACT_STATUS_LABEL[c.status]}</Pill>}
        description={<><span className="font-medium text-(--color-text)">Responsible now: {contractResponsible[c.status]}.</span> {nextStep[c.status]}</>} />
      {c.status === 'returned' && c.returnReason && <div className="mb-4"><Notice tone="error" icon="alert-circle"><strong>Returned for changes:</strong> {c.returnReason}</Notice></div>}
      {c.midGateDecision && <div className="mb-4"><Notice tone={c.midGateDecision === 'reset' ? 'error' : 'accent'} icon="flag-05"><strong>Mid-sprint gate: {c.midGateDecision}.</strong> {c.midGateNote}</Notice></div>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <Section title="Contract" icon="file-check-02" actions={canEdit && <Button size="sm" icon="edit-05" onClick={() => setDialog('edit')}>Edit</Button>} id="contract-fields">
            <DL cols={2} items={[
              { label: 'Learner', value: <Link to="/passport" search={{ persona: c.learnerId } as never}>{personaName(snap, c.learnerId)}</Link> },
              { label: 'Objective type', value: OBJECTIVE_LABEL[c.objectiveType] },
              { label: 'Line manager', value: personaName(snap, c.managerId) },
              { label: 'BU sponsor', value: personaName(snap, c.sponsorId) },
              { label: 'Baseline value', value: fmtNum(c.baselineValue, c.unit) },
              { label: 'Target value', value: fmtNum(c.targetValue, c.unit) },
              { label: 'Target business value (THB, annualised)', value: <Money v={c.targetThb} /> },
              { label: 'Latest measured value', value: latest?.metricValue != null ? `${fmtNum(latest.metricValue, c.unit)} (week ${latest.weekNo})` : 'No evidence logged yet' },
              { label: 'AI tools and methods applied', value: orNotProvided(c.toolsApplied) },
              { label: 'Created', value: fmtDate(c.createdAt) },
            ]} />
            <div className="mt-3"><div className="text-xs font-medium text-(--color-muted)">Practical improvement in current role</div><p className="mt-0.5 whitespace-pre-wrap">{c.description}</p></div>
            {c.showcaseSummary && <div className="mt-3"><div className="text-xs font-medium text-(--color-muted)">Showcase summary</div><p className="mt-0.5">{c.showcaseSummary}</p></div>}
            {c.validatedValueThb != null && <div className="mt-3"><DL cols={2} items={[{ label: 'Validated value', value: <Money v={c.validatedValueThb} /> }, { label: 'Validated on', value: fmtDate(c.validatedAt) }]} /></div>}
          </Section>

          <Section title={`Sprint evidence · week ${Math.min(Math.max(week, 0), 12)} of 12`} icon="activity" description="Weekly micro-applications of the new skills, tracked continuously. Latest first."
            actions={canLog && <Button size="sm" variant="primary" icon="plus" onClick={() => setDialog('evidence')} data-tour="log-evidence">Log evidence</Button>} tour="contract-evidence">
            {evidence.length === 0 ? <EmptyState icon="activity" title="No evidence logged yet" body={c.status === 'active' ? 'Log what you applied this week and the current measured value.' : 'Evidence is logged once the sprint is active.'} /> : (
              <ol className="divide-y divide-(--color-border)">
                {[...evidence].reverse().map((e) => (
                  <li key={e.id} className="table-grid grid-cols-[56px_minmax(0,1fr)_auto] py-2">
                    <div className="text-[13px] font-medium">Wk {e.weekNo}</div>
                    <div className="min-w-0"><div className="font-medium">{e.title}</div><div className="text-[13px] text-(--color-muted)">{e.note}</div><div className="text-[12px] text-(--color-faint)">{fmtDate(e.createdAt)}</div></div>
                    <div className="text-right text-[13px] tabular-nums">{e.metricValue != null ? fmtNum(e.metricValue, c.unit) : <span className="text-(--color-faint)">No value</span>}</div>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="Priority skills being verified" icon="target-04" description="From the AI diagnostic. Outcome-verified badges mint for these at target level when the sponsor validates the showcase.">
            {priority.length === 0 ? <p className="text-[13px] text-(--color-muted)">Diagnostic not completed; no priority skills yet.</p> : (
              <ul className="space-y-1.5">{priority.map((p) => { const sk = snap.skills.find((s) => s.id === p.skillId)!; return <li key={p.id} className="flex items-center justify-between gap-2 text-[13px]"><span className="truncate">{sk.name}</span><Pill tone="info">L{p.currentLevel || '–'} → L{p.targetLevel}</Pill></li> })}</ul>
            )}
          </Section>
          <Section title="Coaching notes" icon="message-chat-circle">
            {notes.length === 0 ? <p className="text-[13px] text-(--color-muted)">No coaching notes yet.</p> : <ul className="space-y-2">{notes.map((n) => <li key={n.id} className="text-[13px]"><div>{n.note}</div>{n.aiFlag && <div className="text-(--color-warning)">{n.aiFlag}</div>}<div className="text-[12px] text-(--color-faint)">{personaName(snap, n.coachId)} · {fmtDate(n.createdAt)}</div></li>)}</ul>}
          </Section>
          {ledger && <Section title="Connected ledger entry" icon="coins-stacked-01"><DL cols={1} items={[{ label: 'Claimed', value: <Money v={ledger.claimedValueThb} /> }, { label: 'Validated', value: ledger.validatedValueThb != null ? <Money v={ledger.validatedValueThb} /> : 'Pending sponsor validation' }, { label: 'Tracked until', value: fmtDate(ledger.trackingUntil) }]} /><Link to="/ledger" className="mt-2 inline-block text-[13px] font-medium">Open impact ledger</Link></Section>}
          <Section title="History" icon="clock"><History snap={snap} events={events} /></Section>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-(--color-border) bg-(--color-surface) px-4 py-3 sm:-mx-6 sm:px-6" data-tour="contract-actions">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 pr-16">
          <p className="text-[13px] text-(--color-muted)">{actions.length ? 'After your action the record moves to the next responsible role and they are notified.' : `No action for you now. ${contractResponsible[c.status] === 'Completed' ? 'This contract is complete.' : `Waiting for ${contractResponsible[c.status].toLowerCase()}.`}`}</p>
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => <Button key={a.action} variant={a.negative ? 'danger' : 'primary'} onClick={() => setDialog(a.action)}>{a.label}</Button>)}
          </div>
        </div>
      </div>

      <Dialog open={dialog === 'edit'} onClose={() => setDialog(null)} title="Edit impact contract" width={760}><ContractForm existing={c} onDone={() => setDialog(null)} /></Dialog>
      <EvidenceDialog open={dialog === 'evidence'} onClose={() => setDialog(null)} week={Math.min(Math.max(week, 1), 12)} unit={c.unit} busy={addEvidence.isPending} onSubmit={async (v) => { await addEvidence.mutateAsync([v]); setDialog(null) }} />
      {actions.map((a) => (
        <ActionDialog key={a.action} open={dialog === a.action} onClose={() => setDialog(null)} action={a.action} label={a.label} negative={!!a.negative} requiresNote={!!a.requiresNote} busy={transition.isPending}
          onSubmit={async (payload) => { await transition.mutateAsync([a.action, payload]); setDialog(null) }} contract={c} />
      ))}
    </>
  )
}

function EvidenceDialog({ open, onClose, week, unit, onSubmit, busy }: { open: boolean; onClose: () => void; week: number; unit: string | null; onSubmit: (v: { weekNo: number; title: string; note: string; metricValue: number | null }) => Promise<void>; busy: boolean }) {
  const [v, setV] = useState({ weekNo: week, title: '', note: '', metricValue: '' })
  const [err, setErr] = useState<string | null>(null)
  return (
    <Dialog open={open} onClose={onClose} title={`Log sprint evidence · week ${v.weekNo}`} subtitle="Visible to your manager, sponsor and coach."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" busy={busy} onClick={async () => { if (!v.title.trim()) { setErr('Give the evidence a title.'); return } await onSubmit({ weekNo: v.weekNo, title: v.title, note: v.note, metricValue: v.metricValue === '' ? null : Number(v.metricValue) }); setV({ weekNo: week, title: '', note: '', metricValue: '' }) }}>Save evidence</Button></>}>
      <div className="space-y-3">
        <Field label="Week" required>{(id) => <input id={id} type="number" min={1} max={12} className="field-input max-w-[120px]" value={v.weekNo} onChange={(e) => setV({ ...v, weekNo: Number(e.target.value) })} />}</Field>
        <Field label="What you applied" required error={err ?? undefined}>{(id) => <input id={id} className="field-input" value={v.title} onChange={(e) => { setErr(null); setV({ ...v, title: e.target.value }) }} data-autofocus />}</Field>
        <Field label="Detail" hint="What changed in the flow of work and who was involved.">{(id) => <textarea id={id} className="field-input" value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} />}</Field>
        <Field label={`Current measured value${unit ? ` (${unit})` : ''}`} hint="Leave empty if not measured this week.">{(id) => <input id={id} type="number" step="any" className="field-input max-w-[200px]" value={v.metricValue} onChange={(e) => setV({ ...v, metricValue: e.target.value })} />}</Field>
      </div>
    </Dialog>
  )
}

function ActionDialog({ open, onClose, action, label, negative, requiresNote, onSubmit, busy, contract }: { open: boolean; onClose: () => void; action: ContractAction; label: string; negative: boolean; requiresNote: boolean; onSubmit: (p: ContractActionPayload) => Promise<void>; busy: boolean; contract: ImpactContract }) {
  const [note, setNote] = useState('')
  const [dec, setDec] = useState<'scale' | 'pivot' | 'reset'>('scale')
  const [summary, setSummary] = useState('')
  const [value, setValue] = useState<string>(contract.targetThb != null ? String(contract.targetThb) : '')
  const [err, setErr] = useState<string | null>(null)
  const consequences: Record<ContractAction, string> = {
    submit: 'Your line manager is notified and reviews the contract. You can still withdraw while it is in review.',
    withdraw: 'The contract is closed as withdrawn. This does not delete it; the history stays visible.',
    manager_approve: 'The contract goes to the BU sponsor for approval. The learner is notified.',
    return: 'The learner receives your note, edits the contract and resubmits. The review restarts with the line manager.',
    sponsor_approve: 'The sprint becomes active. The learner logs weekly evidence and the mid-sprint gate is scheduled from the cohort calendar.',
    submit_mid_gate: 'Your manager and sponsor review the evidence and record scale, pivot or reset.',
    mid_gate_decide: 'Scale or pivot keeps the sprint active with your note. Reset closes this scope; the learner agrees a new one.',
    submit_showcase: 'A ledger entry is created with your claimed value. Your sponsor validates the THB value; badges mint on validation.',
    validate: 'The ledger entry becomes validated, the enrollment is marked graduated and outcome-verified badges mint to the learner\'s passport.',
  }
  return (
    <Dialog open={open} onClose={onClose} title={label} subtitle={contract.title}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={negative ? 'danger' : 'primary'} busy={busy} onClick={async () => {
        if (requiresNote && !note.trim()) { setErr('A note explaining the decision is required.'); return }
        if (action === 'mid_gate_decide' && !note.trim()) { setErr('Explain the decision in a note.'); return }
        if (action === 'submit_showcase' && (!summary.trim() || !value)) { setErr('Describe the delivered improvement and enter the claimed THB value.'); return }
        if (action === 'validate' && value === '') { setErr('Enter the validated THB value.'); return }
        await onSubmit({ note: note || undefined, midGateDecision: action === 'mid_gate_decide' ? dec : undefined, showcaseSummary: action === 'submit_showcase' ? summary : undefined, claimedValueThb: action === 'submit_showcase' ? Number(value) : undefined, validatedValueThb: action === 'validate' ? Number(value) : undefined })
      }}>{label}</Button></>}>
      <div className="space-y-3">
        <Notice tone={negative ? 'error' : 'info'} icon="info-circle"><strong>What happens next:</strong> {consequences[action]}</Notice>
        {action === 'mid_gate_decide' && (
          <fieldset><legend className="mb-1 text-[13px] font-medium">Decision</legend>
            <div className="flex flex-wrap gap-2">{(['scale', 'pivot', 'reset'] as const).map((d) => <label key={d} className={`surface brand-ring cursor-pointer rounded-md px-3 py-2 text-[13px] ${dec === d ? 'bg-(--color-primary-soft)' : ''}`} data-selected={dec === d}><input type="radio" name="dec" className="mr-1.5" checked={dec === d} onChange={() => setDec(d)} />{d === 'scale' ? 'Scale: evidence supports extending the improvement' : d === 'pivot' ? 'Pivot: keep the objective, change the approach' : 'Reset: stop this scope and agree a new one'}</label>)}</div>
          </fieldset>
        )}
        {action === 'submit_showcase' && <Field label="Delivered improvement" required hint="What was delivered, measured against the baseline.">{(id) => <textarea id={id} className="field-input" value={summary} onChange={(e) => setSummary(e.target.value)} data-autofocus />}</Field>}
        {(action === 'submit_showcase' || action === 'validate') && <Field label={action === 'validate' ? 'Validated business value (THB, annualised)' : 'Claimed business value (THB, annualised)'} required hint={action === 'validate' ? `Learner claimed ${fmtThb(contract.targetThb)} as target. Enter the value you can confirm against evidence.` : undefined}>{(id) => <input id={id} type="number" step="1000" className="field-input max-w-[260px]" value={value} onChange={(e) => setValue(e.target.value)} />}</Field>}
        {action !== 'submit_showcase' && <Field label={requiresNote || action === 'mid_gate_decide' ? 'Note to the learner' : 'Note (optional)'} required={requiresNote || action === 'mid_gate_decide'} error={err ?? undefined}>{(id) => <textarea id={id} className="field-input" value={note} onChange={(e) => { setErr(null); setNote(e.target.value) }} data-autofocus={action !== 'mid_gate_decide' || undefined} />}</Field>}
        {action === 'submit_showcase' && err && <p role="alert" className="text-xs text-(--color-error)">{err}</p>}
      </div>
    </Dialog>
  )
}
