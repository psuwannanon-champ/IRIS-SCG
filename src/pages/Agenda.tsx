import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { personaName } from '@/domain/selectors'
import { GAP_DECISION_LABEL, type CapabilityGap, type GapDecision } from '@/domain/types'
import { PageHeader, Section, LoadingBlock, ErrorBlock, Pill, Button, Dialog, Field, Notice, Stat, EmptyState, type Tone } from '@/components/ui'
import { fmtDate, fmtThb, pct } from '@/lib/format'

const tone = (d: GapDecision): Tone => (d === 'undecided' ? 'warning' : d === 'build' ? 'success' : d === 'bot' ? 'accent' : 'info')

export function AgendaPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const search = useSearch({ strict: false }) as { bu?: string }
  const nav = useNavigate()
  const [open, setOpen] = useState<CapabilityGap | null>(null)
  const [decision, setDecision] = useState<GapDecision>('build')
  const [funded, setFunded] = useState(false)
  const save = useAction((ds, id: string, d: GapDecision, f: boolean) => ds.setGapDecision(actor!.id, id, d, f), 'Decision recorded.')
  const [refresh, setRefresh] = useState<{ cycle: string; note: string; next: string } | null>(null)
  const record = useAction((ds, cycle: string, note: string, next: string | null) => ds.recordGovernanceReview(actor!.id, 'capability_agenda', cycle, note, 0, next), 'Cascade refresh recorded.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const bu = search.bu ?? ''
  const all = snap.capabilityGaps
  const rows = all.filter((g) => !bu || g.buId === bu).sort((a, b) => b.thbValueAtRisk - a.thbValueAtRisk)
  const canDecide = ['program_office', 'committee'].includes(actor.role)
  const atRisk = rows.reduce((a, g) => a + g.thbValueAtRisk, 0)
  const funded_ = rows.filter((g) => g.funded)
  const undecided = rows.filter((g) => g.decision === 'undecided')
  const supply = rows.reduce((a, g) => a + g.supplyFte, 0), demand = rows.reduce((a, g) => a + g.demandFte, 0)
  return (
    <>
      <PageHeader actions={canDecide && <Button icon="refresh-cw-01" onClick={() => setRefresh({ cycle: `MTP ${new Date().getFullYear() + 1} cycle`, note: '', next: '' })}>Record annual refresh</Button>} title="Capability agenda" kicker="Value-led · component 01" description="The value-to-skills cascade run with each BU head: value pools → critical roles → P&L-driven future skills, with three-year skill supply versus demand and THB value at stake per gap. The biggest value-at-risk gaps are funded first and decided as build, buy, borrow or bot, governed like capex. Refreshed annually within the MTP cycle." />
      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist">
        {[['', 'All BUs'], ...snap.businessUnits.filter((b) => b.id !== 'bu-corp').map((b) => [b.id, b.code])].map(([k, l]) => <Button key={k} size="sm" role="tab" aria-selected={bu === k} variant={bu === k ? 'primary' : 'secondary'} onClick={() => nav({ to: '/agenda', search: { bu: k } as never })}>{l}</Button>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="THB value at stake" value={fmtThb(atRisk, true)} hint="Sum across listed gaps (3-year view)" tone="primary" />
        <Stat label="Skill supply vs demand" value={`${supply} / ${demand} FTE`} hint={`${pct(supply, demand)}% of demand covered today`} />
        <Stat label="Funded gaps" value={`${funded_.length} of ${rows.length}`} hint={fmtThb(funded_.reduce((a, g) => a + g.thbValueAtRisk, 0), true) + ' at stake funded'} />
        <Stat label="Awaiting decision" value={undecided.length} hint="Build / buy / borrow / bot not yet recorded" tone={undecided.length ? 'primary' : undefined} />
      </div>
      <Section className="mt-4" title="Value-to-skills cascade" icon="target-02" description="Ordered by THB value at stake. Click a skill to see its levels in the taxonomy.">
        {rows.length === 0 ? <EmptyState icon="target-02" title="No gaps recorded for this BU" body="The value-to-skills cascade is run with the BU head at the start of the MTP cycle." /> : (
          <>
            <div className="table-grid hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1.6fr)_110px_110px_170px_90px] px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint) xl:grid"><div>Value pool</div><div>Critical role</div><div>Future skill</div><div>Supply / demand</div><div>THB at stake</div><div>Decision</div><div className="text-right">Actions</div></div>
            <ul className="divide-y divide-(--color-border)">
              {rows.map((g) => { const sk = snap.skills.find((s) => s.id === g.skillId)!; return (
                <li key={g.id} className="table-grid grid-cols-1 px-2 py-2.5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1.6fr)_110px_110px_170px_90px]">
                  <div className="min-w-0"><div className="font-medium">{g.valuePool}</div><div className="text-[12px] text-(--color-muted)">{snap.businessUnits.find((b) => b.id === g.buId)?.code}</div></div>
                  <div className="text-[13px]">{g.criticalRole}</div>
                  <div className="min-w-0 text-[13px]"><Link to="/taxonomy">{sk.code} · {sk.name}</Link><div className="truncate text-[12px] text-(--color-muted)" title={g.futureSkillNote}>{g.futureSkillNote}</div></div>
                  <div className="text-[13px]"><span className="xl:hidden text-(--color-muted)">Supply / demand: </span>{g.supplyFte} / {g.demandFte} FTE <span className="text-(--color-faint)">({pct(g.supplyFte, g.demandFte)}%)</span></div>
                  <div className="text-[13px] font-medium"><span className="xl:hidden font-normal text-(--color-muted)">At stake: </span>{fmtThb(g.thbValueAtRisk, true)}</div>
                  <div className="flex flex-wrap gap-1"><Pill tone={tone(g.decision)}>{GAP_DECISION_LABEL[g.decision]}</Pill>{g.funded && <Pill tone="success">Funded</Pill>}</div>
                  <div className="flex xl:justify-end">{canDecide ? <Button size="sm" onClick={() => { setOpen(g); setDecision(g.decision === 'undecided' ? 'build' : g.decision); setFunded(g.funded) }}>{g.decision === 'undecided' ? 'Decide' : 'Change'}</Button> : <span className="text-[12px] text-(--color-muted)">{g.decidedAt ? `Decided ${fmtDate(g.decidedAt)}` : 'Awaiting decision'}</span>}</div>
                </li>) })}
            </ul>
          </>
        )}
        <p className="mt-3 text-[12px] text-(--color-faint)">Build feeds ABC/BCD cohorts and the assessment waves; bot points to automation squads; buy and borrow go to talent acquisition and partners. Supply and demand figures are illustrative fixtures.</p>
      </Section>
      {open && (
        <Dialog open onClose={() => setOpen(null)} title={`Decide: ${open.valuePool}`} subtitle={`${open.criticalRole} · ${snap.skills.find((s) => s.id === open.skillId)?.name} · ${fmtThb(open.thbValueAtRisk)} at stake`}
          footer={<><Button variant="ghost" onClick={() => setOpen(null)}>Cancel</Button><Button variant="primary" busy={save.isPending} onClick={async () => { await save.mutateAsync([open.id, decision, funded]); setOpen(null) }}>Record decision</Button></>}>
          <div className="space-y-3">
            <Notice tone="info" icon="info-circle"><strong>What happens next:</strong> the decision and funding flag are recorded with your name. Build decisions steer cohort seats and assessment waves; funded gaps are reviewed quarterly on leader scorecards.</Notice>
            <fieldset><legend className="mb-1 text-[13px] font-medium">Decision</legend><div className="flex flex-wrap gap-2">{(['build', 'buy', 'borrow', 'bot'] as GapDecision[]).map((d) => <label key={d} className={`surface brand-ring cursor-pointer rounded-md px-3 py-2 text-[13px] ${decision === d ? 'bg-(--color-primary-soft)' : ''}`} data-selected={decision === d}><input type="radio" name="gd" className="mr-1.5" checked={decision === d} onChange={() => setDecision(d)} />{GAP_DECISION_LABEL[d]}</label>)}</div></fieldset>
            <Field label="Funding">{(id) => <label htmlFor={id} className="flex items-center gap-2 text-[13px]"><input id={id} type="checkbox" checked={funded} onChange={(e) => setFunded(e.target.checked)} />Funded in the 2027 capability budget (governed like capex)</label>}</Field>
            {open.decidedById && <p className="text-[12px] text-(--color-faint)">Last decided by {personaName(snap, open.decidedById)} on {fmtDate(open.decidedAt)}.</p>}
          </div>
        </Dialog>
      )}
      {refresh && (
        <Dialog open onClose={() => setRefresh(null)} title="Record the annual cascade refresh" subtitle="The agenda refreshes annually within the MTP cycle so it tracks strategy."
          footer={<><Button variant="ghost" onClick={() => setRefresh(null)}>Cancel</Button><Button variant="primary" busy={record.isPending} disabled={!refresh.note.trim()} onClick={async () => { await record.mutateAsync([refresh.cycle, refresh.note, refresh.next || null]); setRefresh(null) }}>Record refresh</Button></>}>
          <div className="space-y-3">
            <Field label="Cycle" required>{(id) => <input id={id} className="field-input" value={refresh.cycle} onChange={(e) => setRefresh({ ...refresh, cycle: e.target.value })} />}</Field>
            <Field label="What changed in the cascade" required hint="Which BU heads were run through, what moved.">{(id) => <textarea id={id} className="field-input" rows={3} value={refresh.note} onChange={(e) => setRefresh({ ...refresh, note: e.target.value })} data-autofocus />}</Field>
            <Field label="Next refresh due">{(id) => <input id={id} type="date" className="field-input max-w-[220px]" value={refresh.next} onChange={(e) => setRefresh({ ...refresh, next: e.target.value })} />}</Field>
          </div>
        </Dialog>
      )}
    </>
  )
}
