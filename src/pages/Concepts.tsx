import { useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { visibleConcepts, personaName } from '@/domain/selectors'
import { GATE_DECISIONS_BY_GATE } from '@/data/rules'
import { CONCEPT_STAGE_LABEL, GATE_DECISION_LABEL, CHALLENGE_TYPE_LABEL, type Concept, type GateDecision, type GateReview, type GateEvidence, type GateBusinessCase, type GateAttachment } from '@/domain/types'
import { stageTone, gateTone } from '@/domain/status'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pagination, paginate, Pill, Button, Dialog, Field, DL, Notice, Avatar } from '@/components/ui'
import { History, Money } from '@/components/records'
import { fmtDate, fmtThb } from '@/lib/format'

export function ConceptsPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const search = useSearch({ strict: false }) as { page?: number; program?: string }
  const nav = useNavigate()
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const all = visibleConcepts(snap, actor)
  const filter = search.program ?? ''
  const filtered = all.filter((c) => !filter || (filter === 'live' ? !['stopped', 'scaled'].includes(c.stage) : filter === 'scaled' ? c.stage === 'scaled' : c.stage === 'stopped'))
  const needs = (c: Concept) => snap.gateReviews.some((g) => g.conceptId === c.id && g.decision === 'pending' && ((actor.role === 'committee' && g.submittedAt) || (!g.submittedAt && snap.enrollments.some((e) => e.personaId === actor.id && e.teamId === c.teamId)))) ? 0 : 1
  const sorted = [...filtered].sort((a, b) => needs(a) - needs(b) || b.updatedAt.localeCompare(a.updatedAt))
  const pg = paginate(sorted, 10, search.page ?? 1, (p) => nav({ to: '/concepts', search: { program: filter, page: p } as never }))
  const pipeline = all.filter((c) => !['stopped', 'scaled'].includes(c.stage)).reduce((a, c) => a + (c.pipelineValueThb ?? 0), 0)
  return (
    <>
      <PageHeader title="Concepts & gates" description={`Live BCD concepts gated like investments: Gate 1 proof of concept, Gate 2 investment pitch, Gate 3 scale-up. Pipeline of live concepts: ${fmtThb(pipeline)}. Concepts waiting on you are listed first.`} />
      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist">
        {[['', 'All'], ['live', 'Live'], ['scaled', 'Scaled'], ['stopped', 'Stopped']].map(([k, l]) => <Button key={k} size="sm" role="tab" aria-selected={filter === k} variant={filter === k ? 'primary' : 'secondary'} onClick={() => nav({ to: '/concepts', search: { program: k, page: 1 } as never })}>{l}</Button>)}
      </div>
      <Section>
        {sorted.length === 0 ? <EmptyState icon="rocket-01" title="No concepts here" body="Concepts are created when an approved brief is assigned to a cohort and a team forms around it." /> : (
          <>
            <div className="table-grid hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_190px_130px_120px_80px] px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint) xl:grid"><div>Concept</div><div>Cohort · team</div><div>Stage</div><div>Next gate</div><div>Value</div><div className="text-right">Actions</div></div>
            <ul className="divide-y divide-(--color-border)">
              {pg.slice.map((c) => { const gate = snap.gateReviews.filter((g) => g.conceptId === c.id && g.decision === 'pending').sort((a, b) => a.gateNo - b.gateNo)[0]; const team = snap.teams.find((t) => t.id === c.teamId); return (
                <li key={c.id}><Link to="/concepts/$id" params={{ id: c.id }} className="row-link table-grid grid-cols-[minmax(0,1fr)_auto] px-3 py-2.5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_190px_130px_120px_80px]">
                  <div className="min-w-0"><div className="truncate font-medium">{c.title}</div><div className="truncate text-[12px] text-(--color-muted)">{snap.challengeBriefs.find((b) => b.id === c.briefId)?.title}</div></div>
                  <div className="hidden truncate text-[13px] xl:block">{snap.cohorts.find((k) => k.id === c.cohortId)?.code} · {team?.name}</div>
                  <div><Pill tone={stageTone[c.stage]}>{CONCEPT_STAGE_LABEL[c.stage]}</Pill></div>
                  <div className="hidden text-[13px] xl:block">{gate ? `Gate ${gate.gateNo} · ${fmtDate(gate.scheduledDate)}` : <span className="text-(--color-faint)">None</span>}</div>
                  <div className="hidden text-[13px] xl:block">{fmtThb(c.validatedValueThb ?? c.pipelineValueThb, true)} <span className="text-(--color-faint)">{c.validatedValueThb ? 'validated' : 'pipeline'}</span></div>
                  <div className="hidden text-right text-[13px] font-medium text-(--color-accent) xl:block">View details</div>
                </Link></li>) })}
            </ul>
            <Pagination {...pg} />
          </>
        )}
      </Section>
    </>
  )
}

export function ConceptDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const { snap, actor, status, error, refetch } = useActor()
  const [dialog, setDialog] = useState<null | { kind: 'submit' | 'decide'; gate: GateReview }>(null)
  const [summary, setSummary] = useState('')
  const [decision, setDecision] = useState<GateDecision>('go')
  const [note, setNote] = useState('')
  const [value, setValue] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const submit = useAction((ds, gateId: string, s: string, ev: GateEvidence | null, bc: GateBusinessCase | null, at: GateAttachment[]) => ds.submitGatePack(actor!.id, gateId, s, ev, bc, at), 'Evidence pack submitted. The committee has been notified.')
  const [ev, setEv] = useState<GateEvidence>({ customerInterviews: null, validatedNeeds: '', prototype: '', risks: '' })
  const [bc, setBc] = useState<GateBusinessCase>({ pricing: '', paybackMonths: null, baseCaseThb: null, bestCaseThb: null, worstCaseThb: null, ask: '' })
  const [atts, setAtts] = useState<GateAttachment[]>([])
  const [advance, setAdvance] = useState<string | null>(null)
  const [align, setAlign] = useState<string | null>(null)
  const recordAlign = useAction((ds, note: string) => ds.recordAlignment(actor!.id, id, note), 'Management alignment recorded.')
  const advanceStage = useAction((ds, n: string) => ds.advanceConceptStage(actor!.id, id, n), 'Concept moved to the next stage.')
  const decide = useAction((ds, gateId: string, d: GateDecision, n: string, v: number | null) => ds.decideGate(actor!.id, gateId, d, n, v), 'Gate decision recorded.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const c = snap.concepts.find((x) => x.id === id)
  if (!c) return <EmptyState title="Concept not found" action={<Link to="/concepts" className="btn btn-secondary">Back to concepts</Link>} />
  if (!visibleConcepts(snap, actor).some((x) => x.id === id)) return <Notice tone="warning" icon="lock-01">You are not connected to this concept.</Notice>
  const brief = snap.challengeBriefs.find((b) => b.id === c.briefId)!
  const team = snap.teams.find((t) => t.id === c.teamId)!
  const members = snap.enrollments.filter((e) => e.teamId === c.teamId).map((e) => snap.personas.find((p) => p.id === e.personaId)!)
  const isMember = members.some((m) => m.id === actor.id)
  const gates = snap.gateReviews.filter((g) => g.conceptId === c.id).sort((a, b) => a.gateNo - b.gateNo)
  const events = snap.recordEvents.filter((e) => e.recordType === 'concept' && e.recordId === c.id)
  const pending = gates.find((g) => g.decision === 'pending')
  const canSubmit = isMember && pending && !pending.submittedAt
  const canDecide = actor.role === 'committee' && pending && pending.submittedAt
  const cohort = snap.cohorts.find((k) => k.id === c.cohortId)
  const ledger = snap.ledgerEntries.filter((l) => l.sourceType === 'concept' && l.sourceId === c.id)
  const responsible = pending ? (pending.submittedAt ? 'Capability Investment Committee' : `${team.name} (evidence pack)`) : c.stage === 'scaled' ? 'Scaled · P&L owner' : c.stage === 'stopped' ? 'Closed' : 'Team'
  const gateExplain: Record<number, string> = { 1: 'Proof of concept on customer evidence: go, pivot or stop.', 2: 'CEO investment pitch: invest or small-scale implementation, pivot or stop. Pre-reads and recorded pitches replace live sessions.', 3: 'Scale-up runway: scale as a Start the Dot venture or internal high-impact initiative, hold or stop. Validated value enters the ledger.' }
  return (
    <>
      <PageHeader kicker={<><Link to="/concepts">Concepts & gates</Link> · {cohort?.code}</> as unknown as string} title={c.title} state={<Pill tone={stageTone[c.stage]}>{CONCEPT_STAGE_LABEL[c.stage]}</Pill>}
        description={<><span className="font-medium text-(--color-text)">Responsible now: {responsible}.</span> {pending ? (pending.submittedAt ? `Gate ${pending.gateNo} evidence pack is with the committee (scheduled ${fmtDate(pending.scheduledDate)}).` : `The team submits the Gate ${pending.gateNo} evidence pack before ${fmtDate(pending.scheduledDate)}.`) : c.stage === 'scaled' ? `Scaled via ${c.scaleRoute === 'start_the_dot' ? 'SCG Start the Dot' : 'an internal high-impact initiative'}; validated value is in the ledger.` : c.stage === 'stopped' ? 'Stopped at a gate; learning captured in the history.' : c.stage === 'pivot' ? 'Pivoting after a gate decision; the team re-validates before the next gate.' : 'Team is working toward the next gate.'}</>} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <Section title="Concept" icon="rocket-01">
            <p>{c.summary}</p>
            <div className="mt-3"><DL cols={2} items={[
              { label: 'Pipeline value (THB)', value: <Money v={c.pipelineValueThb} /> }, { label: 'Validated value (THB)', value: c.validatedValueThb != null ? <Money v={c.validatedValueThb} /> : 'Not yet validated' },
              { label: 'Scale route', value: c.scaleRoute ? (c.scaleRoute === 'start_the_dot' ? 'SCG Start the Dot' : 'Internal high-impact initiative') : 'Not decided' }, { label: 'Last updated', value: fmtDate(c.updatedAt) },
            ]} /></div>
          </Section>
          {isMember && ['frame', 'build', 'pivot'].includes(c.stage) && (
            <Section title={c.stage === 'frame' ? 'Stage 1 · Frame the challenge' : c.stage === 'build' ? 'Stage 2 · Concept studio sprint' : 'Pivot · re-validate'} icon="route" description={c.stage === 'frame' ? 'Immersion camp and problem framing with the sponsor. When the team has a shared hypothesis, move to Stage 2.' : c.stage === 'build' ? 'AI-intensified sprint on the live concept; align direction with SCG management, then move to field validation.' : 'Re-validate the pivoted hypothesis with customers before the next gate.'}>
              {advance === null ? <Button variant="primary" icon="arrow-right" onClick={() => setAdvance('')}>{c.stage === 'frame' ? 'Move to Stage 2 · Build' : 'Move to Stage 3 · Validate'}</Button> : (
                <div className="space-y-2"><Field label="What did the team complete in this stage?" required>{(fid) => <textarea id={fid} className="field-input" value={advance} onChange={(e) => setAdvance(e.target.value)} data-autofocus />}</Field><div className="flex gap-2"><Button variant="ghost" onClick={() => setAdvance(null)}>Cancel</Button><Button variant="primary" busy={advanceStage.isPending} disabled={!advance.trim()} onClick={async () => { await advanceStage.mutateAsync([advance]); setAdvance(null) }}>Confirm</Button></div></div>
              )}
            </Section>
          )}
          <Section title="Management alignment" icon="check-done-01" description="Teams align direction with SCG management before validation (Stage 2 to Stage 3)." >
            {c.alignmentNote ? (
              <div className="text-[13px]"><Pill tone="success" icon="check-circle">Aligned {fmtDate(c.alignedAt)}</Pill><p className="mt-1">{c.alignmentNote}</p><p className="text-[12px] text-(--color-faint)">Recorded by {personaName(snap, c.alignedBy)}.</p></div>
            ) : (() => { const may = brief.sponsorId === actor.id || ['committee', 'program_office'].includes(actor.role); return align === null ? (
              <div className="flex flex-wrap items-center gap-2 text-[13px]"><Pill tone="warning">Not yet aligned</Pill>{may ? <Button size="sm" onClick={() => setAlign('')}>Record alignment</Button> : <span className="text-(--color-muted)">The sponsor records this before field validation.</span>}</div>
            ) : (
              <div className="space-y-2"><Field label="What was agreed with management" required>{(fid) => <textarea id={fid} className="field-input" value={align} onChange={(e) => setAlign(e.target.value)} data-autofocus />}</Field><div className="flex gap-2"><Button variant="ghost" onClick={() => setAlign(null)}>Cancel</Button><Button variant="primary" busy={recordAlign.isPending} disabled={!align.trim()} onClick={async () => { await recordAlign.mutateAsync([align]); setAlign(null) }}>Save</Button></div></div>
            ) })()}
          </Section>
          <Section title="Gate reviews" icon="flag-05" description="Each gate needs an evidence pack from the team before the committee decides." id="gates">
            <ol className="space-y-3">
              {gates.map((g) => (
                <li key={g.id} className="surface p-3" data-tour={`gate-${g.gateNo}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">Gate {g.gateNo} · {g.gateNo === 1 ? 'Proof of concept' : g.gateNo === 2 ? 'CEO investment pitch' : 'Scale-up'} <span className="font-normal text-(--color-muted)">· {fmtDate(g.scheduledDate)}</span></div>
                    <Pill tone={gateTone[g.decision]}>{g.decision === 'pending' ? (g.submittedAt ? 'Evidence submitted · awaiting decision' : 'Awaiting evidence pack') : GATE_DECISION_LABEL[g.decision]}</Pill>
                  </div>
                  <p className="mt-1 text-[12px] text-(--color-muted)">{gateExplain[g.gateNo]}</p>
                  <div className="mt-2 text-[13px]"><span className="font-medium">Evidence pack: </span>{g.evidenceSummary ?? <span className="text-(--color-muted)">Not submitted</span>}{g.submittedAt && <span className="text-(--color-faint)"> · submitted {fmtDate(g.submittedAt)}</span>}</div>
                  {g.evidence && <div className="mt-1.5 grid gap-1 rounded-md bg-(--color-page) px-2.5 py-2 text-[12px] sm:grid-cols-2"><div><span className="text-(--color-muted)">Customer interviews: </span>{g.evidence.customerInterviews ?? '—'}</div><div><span className="text-(--color-muted)">Prototype: </span>{g.evidence.prototype}</div><div className="sm:col-span-2"><span className="text-(--color-muted)">Validated needs: </span>{g.evidence.validatedNeeds}</div><div className="sm:col-span-2"><span className="text-(--color-muted)">Risks: </span>{g.evidence.risks}</div></div>}
                  {g.businessCase && <div className="mt-1.5 grid gap-1 rounded-md bg-(--color-page) px-2.5 py-2 text-[12px] sm:grid-cols-2"><div><span className="text-(--color-muted)">Pricing: </span>{g.businessCase.pricing}</div><div><span className="text-(--color-muted)">Payback: </span>{g.businessCase.paybackMonths ?? '—'} months</div><div><span className="text-(--color-muted)">Base / best / worst: </span>{fmtThb(g.businessCase.baseCaseThb, true)} / {fmtThb(g.businessCase.bestCaseThb, true)} / {fmtThb(g.businessCase.worstCaseThb, true)}</div><div><span className="text-(--color-muted)">The ask: </span>{g.businessCase.ask}</div></div>}
                  {g.attachments?.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{g.attachments.map((a, i) => <Pill key={i} tone="neutral" icon={a.kind === 'recorded_pitch' ? 'presentation-chart-01' : 'file-02'} title={a.note}>{a.name}</Pill>)}</div>}
                  {g.decision !== 'pending' && <div className="mt-1 text-[13px]"><span className="font-medium">Decision: </span>{GATE_DECISION_LABEL[g.decision]} by {personaName(snap, g.decidedById)} on {fmtDate(g.decidedAt)}. {g.note}{g.validatedValueThb != null && <> Validated value <Money v={g.validatedValueThb} />.</>}</div>}
                  {g.decision === 'pending' && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {canSubmit && g.id === pending?.id && <Button size="sm" variant="primary" onClick={() => { setSummary(''); setErr(null); setDialog({ kind: 'submit', gate: g }) }}>Submit Gate {g.gateNo} evidence pack</Button>}
                      {canDecide && g.id === pending?.id && <Button size="sm" variant="primary" onClick={() => { setDecision(GATE_DECISIONS_BY_GATE[g.gateNo][0]); setNote(''); setValue(''); setErr(null); setDialog({ kind: 'decide', gate: g }) }}>Record Gate {g.gateNo} decision</Button>}
                      {!canSubmit && !canDecide && <span className="text-[12px] text-(--color-muted)">{g.submittedAt ? 'Waiting for the committee.' : `Waiting for ${team.name} to submit the evidence pack.`}</span>}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="Challenge brief" icon="lightbulb-02"><DL cols={1} items={[{ label: 'Brief', value: <Link to="/briefs/$id" params={{ id: brief.id }}>{brief.title}</Link> }, { label: 'Sponsor', value: personaName(snap, brief.sponsorId) }, { label: 'Type · THB target', value: `${CHALLENGE_TYPE_LABEL[brief.challengeType]} · ${fmtThb(brief.targetValueThb)}` }]} /></Section>
          <Section title={`Team · ${team.name}`} icon="users-01" description={`Coach: ${personaName(snap, team.coachId)}`}>
            <ul className="space-y-2">{members.map((m) => <li key={m.id} className="flex items-center gap-2 text-[13px]"><Avatar initials={m.initials} size={26} /><div className="min-w-0"><Link to="/passport" search={{ persona: m.id } as never} className="block truncate font-medium">{m.fullName}</Link><div className="truncate text-[12px] text-(--color-muted)">{m.jobTitle}</div></div></li>)}</ul>
          </Section>
          {ledger.length > 0 && <Section title="Ledger entries" icon="coins-stacked-01"><ul className="space-y-1 text-[13px]">{ledger.map((l) => <li key={l.id}>{personaName(snap, l.personaId)} · <Money v={l.validatedValueThb ?? l.claimedValueThb} /> · {l.status.replace('_', ' ')}</li>)}</ul></Section>}
          <Section title="History" icon="clock"><History snap={snap} events={events} /></Section>
        </div>
      </div>
      <Dialog open={dialog?.kind === 'submit'} onClose={() => setDialog(null)} title={`Submit Gate ${dialog?.gate.gateNo} pack`} subtitle={c.title} width={820}
        footer={<><Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button><Button variant="primary" busy={submit.isPending} onClick={async () => { if (!summary.trim()) { setErr('Summarise the evidence pack.'); return } if (dialog!.gate.gateNo === 2 && !bc.paybackMonths) { setErr('Gate 2 needs the payback period and the best / worst case.'); return } await submit.mutateAsync([dialog!.gate.id, summary, dialog!.gate.gateNo === 3 ? null : ev, dialog!.gate.gateNo === 1 ? null : bc, atts]); setDialog(null); setAtts([]) }}>Submit pack</Button></>}>
        {dialog && (
        <div className="space-y-3">
          <Notice tone="info" icon="info-circle"><strong>What happens next:</strong> the concept moves to the gate stage and committee members get the pre-read. Pre-reads and recorded pitches cut man-days at the gate itself.</Notice>
          <Field label="Summary" required hint="One paragraph the committee reads first." error={err ?? undefined}>{(fid) => <textarea id={fid} className="field-input" rows={3} value={summary} onChange={(e) => { setErr(null); setSummary(e.target.value) }} data-autofocus />}</Field>
          {dialog.gate.gateNo !== 3 && (
            <div className="rounded-md border border-(--color-border) p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Field evidence</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Customer interviews">{(fid) => <input id={fid} type="number" min={0} className="field-input" value={ev.customerInterviews ?? ''} onChange={(e) => setEv({ ...ev, customerInterviews: e.target.value === '' ? null : Number(e.target.value) })} />}</Field>
                <Field label="Prototype or test">{(fid) => <input id={fid} className="field-input" value={ev.prototype} onChange={(e) => setEv({ ...ev, prototype: e.target.value })} />}</Field>
              </div>
              <div className="mt-3 grid gap-3">
                <Field label="Validated needs" hint="What customers confirmed, not what you hoped.">{(fid) => <textarea id={fid} className="field-input" rows={2} value={ev.validatedNeeds} onChange={(e) => setEv({ ...ev, validatedNeeds: e.target.value })} />}</Field>
                <Field label="Risks and open questions">{(fid) => <textarea id={fid} className="field-input" rows={2} value={ev.risks} onChange={(e) => setEv({ ...ev, risks: e.target.value })} />}</Field>
              </div>
            </div>
          )}
          {dialog.gate.gateNo !== 1 && (
            <div className="rounded-md border border-(--color-border) p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Business case {dialog.gate.gateNo === 2 && <span className="text-(--color-primary)">· required</span>}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Pricing and unit economics">{(fid) => <input id={fid} className="field-input" value={bc.pricing} onChange={(e) => setBc({ ...bc, pricing: e.target.value })} />}</Field>
                <Field label="Payback (months)">{(fid) => <input id={fid} type="number" min={1} className="field-input" value={bc.paybackMonths ?? ''} onChange={(e) => setBc({ ...bc, paybackMonths: e.target.value === '' ? null : Number(e.target.value) })} />}</Field>
                <Field label="Base case (THB)">{(fid) => <input id={fid} type="number" step="100000" className="field-input" value={bc.baseCaseThb ?? ''} onChange={(e) => setBc({ ...bc, baseCaseThb: e.target.value === '' ? null : Number(e.target.value) })} />}</Field>
                <Field label="Best case (THB)">{(fid) => <input id={fid} type="number" step="100000" className="field-input" value={bc.bestCaseThb ?? ''} onChange={(e) => setBc({ ...bc, bestCaseThb: e.target.value === '' ? null : Number(e.target.value) })} />}</Field>
                <Field label="Worst case (THB)">{(fid) => <input id={fid} type="number" step="100000" className="field-input" value={bc.worstCaseThb ?? ''} onChange={(e) => setBc({ ...bc, worstCaseThb: e.target.value === '' ? null : Number(e.target.value) })} />}</Field>
                <Field label="The ask">{(fid) => <input id={fid} className="field-input" placeholder="THB 21M over 18 months for..." value={bc.ask} onChange={(e) => setBc({ ...bc, ask: e.target.value })} />}</Field>
              </div>
            </div>
          )}
          <div className="rounded-md border border-(--color-border) p-3">
            <div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Pre-read and attachments</span><Button size="sm" icon="plus" onClick={() => setAtts([...atts, { name: '', kind: 'pre_read', note: '' }])}>Add</Button></div>
            {atts.length === 0 ? <p className="text-[12px] text-(--color-muted)">Register the pre-read, the recorded pitch and the model so the committee knows what exists. Files live in the team workspace; the platform records the reference.</p> : (
              <ul className="space-y-2">
                {atts.map((a, i) => (
                  <li key={i} className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_150px_minmax(0,1.4fr)_40px]">
                    <input aria-label="Name" className="field-input" placeholder="Gate 2 pre-read (6 pages)" value={a.name} onChange={(e) => setAtts(atts.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                    <select aria-label="Kind" className="field-input" value={a.kind} onChange={(e) => setAtts(atts.map((x, j) => j === i ? { ...x, kind: e.target.value as GateAttachment['kind'] } : x))}><option value="pre_read">Pre-read</option><option value="recorded_pitch">Recorded pitch</option><option value="evidence_pack">Evidence pack</option><option value="model">Model</option><option value="other">Other</option></select>
                    <input aria-label="Note" className="field-input" placeholder="Where it lives / who presents" value={a.note} onChange={(e) => setAtts(atts.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} />
                    <Button size="sm" variant="ghost" onClick={() => setAtts(atts.filter((_, j) => j !== i))}>Remove</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        )}
      </Dialog>
      <Dialog open={dialog?.kind === 'decide'} onClose={() => setDialog(null)} title={`Record Gate ${dialog?.gate.gateNo} decision`} subtitle={c.title}
        footer={<><Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button><Button variant={['stop', 'pivot'].includes(decision) ? 'danger' : 'primary'} busy={decide.isPending} onClick={async () => { if (!note.trim()) { setErr('Record the reasoning for the decision.'); return } if (dialog!.gate.gateNo === 3 && decision === 'scale' && !value) { setErr('Enter the validated value.'); return } await decide.mutateAsync([dialog!.gate.id, decision, note, value ? Number(value) : null]); setDialog(null) }}>Record decision</Button></>}>
        {dialog && (
          <div className="space-y-3">
            <Notice tone="info" icon="info-circle"><strong>Evidence pack:</strong> {dialog.gate.evidenceSummary}</Notice>
            <fieldset><legend className="mb-1 text-[13px] font-medium">Decision</legend>
              <div className="flex flex-wrap gap-2">{GATE_DECISIONS_BY_GATE[dialog.gate.gateNo].map((d) => <label key={d} className={`surface brand-ring cursor-pointer rounded-md px-3 py-2 text-[13px] ${decision === d ? 'bg-(--color-primary-soft)' : ''}`} data-selected={decision === d}><input type="radio" name="gd" className="mr-1.5" checked={decision === d} onChange={() => setDecision(d)} />{GATE_DECISION_LABEL[d]}</label>)}</div>
            </fieldset>
            <p className="text-[12px] text-(--color-muted)">{dialog.gate.gateNo === 1 ? 'Go moves the concept to Stage 4 (build the case) and mints outcome-verified BCD badges for the team.' : dialog.gate.gateNo === 2 ? 'Invest or small-scale schedules Gate 3 in six months and mints badges; pivot or stop closes this pitch.' : 'Scale records the validated value in the ledger for every team member and marks the concept scaled.'}</p>
            {dialog.gate.gateNo === 3 && <Field label="Validated value (THB)" required={decision === 'scale'}>{(id) => <input id={id} type="number" step="100000" className="field-input max-w-[260px]" value={value} onChange={(e) => setValue(e.target.value)} />}</Field>}
            <Field label="Reasoning" required error={err ?? undefined}>{(id) => <textarea id={id} className="field-input" value={note} onChange={(e) => { setErr(null); setNote(e.target.value) }} data-autofocus />}</Field>
          </div>
        )}
      </Dialog>
    </>
  )
}
