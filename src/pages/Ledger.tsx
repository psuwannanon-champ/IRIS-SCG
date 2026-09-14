import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { visibleLedger, personaName } from '@/domain/selectors'
import { LEDGER_STATUS_LABEL, OBJECTIVE_LABEL, type LedgerEntry, type LedgerStatus } from '@/domain/types'
import { ledgerTone } from '@/domain/status'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pagination, paginate, Pill, Button, Dialog, Field, Notice, Stat, DL } from '@/components/ui'
import { Money, History } from '@/components/records'
import { fmtDate, fmtThb } from '@/lib/format'
import { lastSuccess } from '@/features/integrations/connectors'

export function LedgerPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const search = useSearch({ strict: false }) as { status?: string; page?: number }
  const nav = useNavigate()
  const [open, setOpen] = useState<{ entry: LedgerEntry; mode: 'view' | 'validate' | 'reject' | 'audit' } | null>(null)
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const review = useAction((ds, id: string, d: 'validate' | 'reject' | 'audit', v: number | null, n: string | null) => ds.reviewLedgerEntry(actor!.id, id, d, v, n), 'Ledger entry updated.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const all = visibleLedger(snap, actor)
  const filtered = all.filter((l) => !search.status || l.status === search.status)
  const actionable = (l: LedgerEntry) => (l.status === 'pending_validation' && l.sponsorId === actor.id) || (l.status === 'validated' && actor.role === 'program_office')
  const sorted = [...filtered].sort((a, b) => Number(actionable(b)) - Number(actionable(a)) || b.createdAt.localeCompare(a.createdAt))
  const pg = paginate(sorted, 10, search.page ?? 1, (p) => nav({ to: '/ledger', search: { status: search.status ?? '', page: p } as never }))
  const validated = all.filter((l) => ['validated', 'audited'].includes(l.status)).reduce((a, l) => a + (l.validatedValueThb ?? 0), 0)
  const pending = all.filter((l) => l.status === 'pending_validation').reduce((a, l) => a + l.claimedValueThb, 0)
  const setFilter = (s: string) => nav({ to: '/ledger', search: { status: s, page: 1 } as never })
  return (
    <>
      <PageHeader title="Impact ledger" description="Sponsor-validated project value per learner and concept, tracked 6–12 months after the program and sample-audited annually. Entries waiting for your validation are listed first." state={(() => { const fin = lastSuccess(snap, 'finance_actuals'); const pay = lastSuccess(snap, 'payroll_rewards'); return <span className="flex flex-wrap gap-1"><Pill tone={fin ? 'success' : 'neutral'} icon="bank">P&amp;L actuals {fin ? fmtDate(fin.finishedAt) : 'not imported'}</Pill><Pill tone={pay ? 'success' : 'neutral'} icon="coins-hand">Rewards export {pay ? fmtDate(pay.finishedAt) : 'not run'}</Pill></span> })()} />
      <div className="grid gap-3 sm:grid-cols-3" data-tour="ledger-stats">
        <Stat label="Validated impact" value={fmtThb(validated, true)} hint="Validated and audited entries in your scope" onClick={() => setFilter('validated')} tone="primary" />
        <Stat label="Pending validation" value={fmtThb(pending, true)} hint="Claimed at showcase, not yet confirmed" onClick={() => setFilter('pending_validation')} />
        <Stat label="Entries" value={all.length} hint={`${all.filter((l) => l.status === 'audited').length} audited`} onClick={() => setFilter('')} />
      </div>
      <div className="mb-3 mt-4 flex items-center gap-2">
        <select aria-label="Status" className="field-input max-w-[240px]" value={search.status ?? ''} onChange={(e) => setFilter(e.target.value)}><option value="">All statuses</option>{(Object.keys(LEDGER_STATUS_LABEL) as LedgerStatus[]).map((s) => <option key={s} value={s}>{LEDGER_STATUS_LABEL[s]}</option>)}</select>
        <span className="text-[13px] text-(--color-muted)">{filtered.length} of {all.length}</span>
      </div>
      <Section>
        {sorted.length === 0 ? <EmptyState icon="coins-stacked-01" title="No ledger entries" body="Entries are created when a learner submits a showcase claim or a concept passes Gate 3." /> : (
          <>
            <div className="table-grid hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px_120px_180px_110px] px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint) xl:grid"><div>Entry</div><div>Learner · sponsor</div><div>Claimed</div><div>Validated</div><div>Status</div><div className="text-right">Actions</div></div>
            <ul className="divide-y divide-(--color-border)">
              {pg.slice.map((l) => (
                <li key={l.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] px-3 py-2.5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px_120px_180px_110px]">
                  <div className="min-w-0"><button type="button" className="block max-w-full truncate text-left font-medium text-(--color-accent) hover:text-(--color-primary)" onClick={() => { setOpen({ entry: l, mode: 'view' }); setValue(String(l.claimedValueThb)); setNote(''); setErr(null) }}>{l.title}</button><div className="truncate text-[12px] text-(--color-muted)">{l.objectiveType ? OBJECTIVE_LABEL[l.objectiveType] : 'Concept value'} · {snap.businessUnits.find((b) => b.id === l.buId)?.code} · tracked until {fmtDate(l.trackingUntil)}</div></div>
                  <div className="hidden truncate text-[13px] xl:block">{personaName(snap, l.personaId)}<div className="text-[12px] text-(--color-muted)">Sponsor {personaName(snap, l.sponsorId)}</div></div>
                  <div className="hidden text-[13px] xl:block">{fmtThb(l.claimedValueThb, true)}</div>
                  <div className="hidden text-[13px] xl:block">{l.validatedValueThb != null ? fmtThb(l.validatedValueThb, true) : '—'}</div>
                  <div><Pill tone={ledgerTone[l.status]}>{LEDGER_STATUS_LABEL[l.status]}</Pill></div>
                  <div className="flex justify-end gap-1"><Button size="sm" onClick={() => { setOpen({ entry: l, mode: 'view' }); setValue(String(l.claimedValueThb)); setNote(''); setErr(null) }}>View details</Button></div>
                </li>
              ))}
            </ul>
            <Pagination {...pg} />
          </>
        )}
      </Section>
      {open && (() => { const l = open.entry; const canValidate = l.status === 'pending_validation' && l.sponsorId === actor.id; const canAudit = l.status === 'validated' && actor.role === 'program_office'; const events = snap.recordEvents.filter((e) => e.recordType === 'ledger_entry' && e.recordId === l.id); return (
        <Dialog open onClose={() => setOpen(null)} title={l.title} subtitle={`${LEDGER_STATUS_LABEL[l.status]} · ${personaName(snap, l.personaId)}`} width={720}
          footer={<>
            <Button variant="ghost" onClick={() => setOpen(null)}>Close</Button>
            {canValidate && open.mode === 'view' && <><Button variant="danger" onClick={() => setOpen({ entry: l, mode: 'reject' })}>Reject value</Button><Button variant="primary" onClick={() => setOpen({ entry: l, mode: 'validate' })}>Validate value</Button></>}
            {canAudit && open.mode === 'view' && <Button variant="primary" onClick={() => setOpen({ entry: l, mode: 'audit' })}>Record audit</Button>}
            {open.mode !== 'view' && <Button variant={open.mode === 'reject' ? 'danger' : 'primary'} busy={review.isPending} onClick={async () => {
              if (open.mode === 'validate' && value === '') { setErr('Enter the validated THB value.'); return }
              if (open.mode !== 'validate' && !note.trim()) { setErr(open.mode === 'reject' ? 'Explain why the value is rejected.' : 'Record the audit finding.'); return }
              await review.mutateAsync([l.id, open.mode as 'validate' | 'reject' | 'audit', open.mode === 'validate' ? Number(value) : null, note || null]); setOpen(null)
            }}>{open.mode === 'validate' ? 'Confirm validated value' : open.mode === 'reject' ? 'Confirm rejection' : 'Save audit finding'}</Button>}
          </>}>
          <div className="space-y-4">
            <DL cols={2} items={[
              { label: 'Learner', value: personaName(snap, l.personaId) }, { label: 'Sponsor', value: personaName(snap, l.sponsorId) },
              { label: 'Source', value: l.sourceType === 'impact_contract' ? <Link to="/contracts/$id" params={{ id: l.sourceId }}>Impact contract</Link> : <Link to="/concepts/$id" params={{ id: l.sourceId }}>Concept (Gate 3)</Link> }, { label: 'Objective type', value: l.objectiveType ? OBJECTIVE_LABEL[l.objectiveType] : 'Concept value' },
              { label: 'Claimed value', value: <Money v={l.claimedValueThb} /> }, { label: 'Validated value', value: l.validatedValueThb != null ? <Money v={l.validatedValueThb} /> : 'Not yet validated' },
              { label: 'Validated on', value: fmtDate(l.validatedAt) }, { label: 'Tracked until', value: fmtDate(l.trackingUntil) },
              { label: 'Audit / rejection note', value: l.auditNote ?? 'Not provided' }, { label: 'Created', value: fmtDate(l.createdAt) },
            ]} />
            {open.mode === 'validate' && <><Notice tone="info" icon="info-circle"><strong>What happens next:</strong> the value becomes validated, the source contract completes and outcome-verified badges mint to the learner's passport.</Notice><Field label="Validated value (THB, annualised)" required error={err ?? undefined}>{(id) => <input id={id} type="number" step="1000" className="field-input max-w-[260px]" value={value} onChange={(e) => { setErr(null); setValue(e.target.value) }} data-autofocus />}</Field><Field label="Note (optional)">{(id) => <textarea id={id} className="field-input" value={note} onChange={(e) => setNote(e.target.value)} />}</Field></>}
            {open.mode === 'reject' && <><Notice tone="error" icon="alert-circle"><strong>What happens next:</strong> the entry is marked rejected and the learner is notified with your reason. The contract stays in showcase review for the learner to add evidence.</Notice><Field label="Reason" required error={err ?? undefined}>{(id) => <textarea id={id} className="field-input" value={note} onChange={(e) => { setErr(null); setNote(e.target.value) }} data-autofocus />}</Field></>}
            {open.mode === 'audit' && <><Notice tone="info" icon="info-circle"><strong>What happens next:</strong> the entry is marked audited with your finding. Annual sample audits keep reported ROI honest.</Notice><Field label="Audit finding" required error={err ?? undefined}>{(id) => <textarea id={id} className="field-input" value={note} onChange={(e) => { setErr(null); setNote(e.target.value) }} data-autofocus />}</Field></>}
            {open.mode === 'view' && !canValidate && !canAudit && <p className="text-[13px] text-(--color-muted)">{l.status === 'pending_validation' ? `Waiting for ${personaName(snap, l.sponsorId)} (sponsor) to validate.` : l.status === 'validated' ? 'Validated. The program office records the annual sample audit.' : 'No further action.'}</p>}
            <div><div className="mb-1 text-[13px] font-medium">History</div><History snap={snap} events={events} /></div>
          </div>
        </Dialog>) })()}
    </>
  )
}
