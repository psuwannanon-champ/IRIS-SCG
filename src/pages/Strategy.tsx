import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { selectGovernance } from '@/domain/selectors'
import { SUB_PLANS, COMPONENTS, ENABLERS, ABC_FROM_TO, BCD_FROM_TO, WHY_IT_FITS } from '@/data/strategy-content'
import { useState } from 'react'
import { useAction } from '@/app/data'
import { Button, Dialog, Field } from '@/components/ui'
import { MILESTONE_LABEL, POLICY_STATUS_LABEL, type MilestoneStatus, type PlanMilestone, type PolicyItem } from '@/domain/types'
import { personaName } from '@/domain/selectors'
import { fmtDate } from '@/lib/format'
import { PageHeader, Section, LoadingBlock, ErrorBlock, Pill, Notice } from '@/components/ui'
import { fmtThb, pct } from '@/lib/format'
import { Icon } from '@/icons/Icon'

export function StrategyPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [ms, setMs] = useState<PlanMilestone | null>(null)
  const [msV, setMsV] = useState<{ status: MilestoneStatus; note: string }>({ status: 'on_track', note: '' })
  const [pol, setPol] = useState<PolicyItem | null>(null)
  const [polV, setPolV] = useState({ status: 'approved', effectiveFrom: '', resolutionRef: '', note: '' })
  const saveMs = useAction((ds, id: string, s: MilestoneStatus, note: string) => ds.setMilestoneStatus(actor!.id, id, s, note), 'Milestone updated.')
  const savePol = useAction((ds, id: string, s: PolicyItem['status'], eff: string | null, ref: string, note: string) => ds.decidePolicyItem(actor!.id, id, s, eff, ref, note), 'Policy item updated.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const canGovern = ['program_office', 'committee'].includes(actor.role)
  const g = selectGovernance(snap)
  const gate1Approved = snap.gateReviews.filter((x) => x.gateNo === 1 && x.decision === 'go').length
  const graduatesWithProfile = g.graduates.filter((e) => snap.passportEntries.some((p) => p.personaId === e.personaId)).length
  const kpi: Record<string, { value: string; hint: string }> = {
    bus_onboarded: { value: `${pct(g.busOnboarded.length, g.bus.length)}%`, hint: `${g.busOnboarded.length} of ${g.bus.length} BUs onboarded` },
    learners_closing_gaps: { value: `${pct(g.gapsClosed.length, g.closingGaps.length)}%`, hint: `${g.gapsClosed.length} of ${g.closingGaps.length} priority gaps closed · ${g.graduates.length} sprints completed` },
    concepts_gate_approved: { value: `${gate1Approved} approved`, hint: `${fmtThb(g.validatedThb, true)} validated · ${fmtThb(g.pipelineThb, true)} pipeline` },
    graduates_profiles: { value: `${pct(graduatesWithProfile, g.graduates.length)}%`, hint: `${graduatesWithProfile} of ${g.graduates.length} graduates with updated profiles · promotions citing verified skills: not tracked in prototype` },
  }
  return (
    <>
      <PageHeader title="Strategy roadmap" kicker="People strategic plan · MTP 2027" description="Theme: Modernize SCG Capability Development. Goal: deploy the modernised capability transformation strategy, skills-first, project-based, AI-powered, scalable across SCG, simple to run and wired to careers, rewards and P&L impact. Top KPI: THB value of validated business impact and % graduates with verified skill uplift." />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="surface px-3 py-2.5"><div className="text-xs font-medium text-(--color-muted)">Top KPI · validated business impact</div><div className="text-lg font-semibold text-(--color-primary)">{fmtThb(g.validatedThb, true)}</div><div className="text-xs text-(--color-faint)"><Link to="/ledger">Open impact ledger</Link></div></div>
        <div className="surface px-3 py-2.5"><div className="text-xs font-medium text-(--color-muted)">Top KPI · graduates with verified skill uplift</div><div className="text-lg font-semibold">{pct(g.graduatesVerified.length, g.graduates.length)}%</div><div className="text-xs text-(--color-faint)"><Link to="/governance">Open impact dashboard</Link></div></div>
      </div>
      <Section className="mt-4" title="Strategic plan · sub-plans and key actions" icon="compass-03" description="From the strategy deck (2 Aug 2026). KPI values are live where the platform tracks them.">
        <ul className="divide-y divide-(--color-border)">
          {SUB_PLANS.map((p) => (
            <li key={p.code} className="grid gap-3 py-3 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1.6fr)_120px]">
              <div className="min-w-0"><div className="font-medium">{p.code} {p.title}</div><ul className="mt-1 list-disc pl-4 text-[13px] text-(--color-muted)">{p.keyActions.map((a) => <li key={a}>{a}</li>)}</ul><div className="mt-1 text-[12px] text-(--color-faint)">Where to play: {p.whereToPlay.join(' · ')}</div></div>
              <div className="text-[13px]"><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">KPI</div><div>{p.kpi}</div>{p.kpiKey && <div className="mt-1"><span className="text-base font-semibold">{kpi[p.kpiKey].value}</span><div className="text-[12px] text-(--color-muted)">{kpi[p.kpiKey].hint}</div></div>}</div>
              <div className="text-[13px]"><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Expected outcome 2027</div><ul className="list-disc pl-4">{p.outcomes.map((o) => <li key={o}>{o}</li>)}</ul></div>
              <div className="text-[13px]">{(() => { const m = snap.planMilestones.find((x) => x.subPlan === p.code); const tone = m?.status === 'done' ? 'success' : m?.status === 'at_risk' ? 'error' : m?.status === 'on_track' ? 'info' : 'neutral'; return (<><Pill tone="accent">{p.milestone}</Pill>{m && <div className="mt-1"><Pill tone={tone}>{MILESTONE_LABEL[m.status]}</Pill></div>}<div className="mt-1 text-(--color-muted)">{p.owner}</div>{m?.note && <div className="mt-0.5 text-[12px] text-(--color-muted)">{m.note}</div>}{m && canGovern && <Button size="sm" variant="ghost" className="mt-1" onClick={() => { setMs(m); setMsV({ status: m.status, note: m.note ?? '' }) }}>Update status</Button>}</>) })()}</div>
            </li>
          ))}
        </ul>
      </Section>
      <Section className="mt-4" title="Why this fits SCG's turnaround" icon="compass-03" description="The three reasons the deck gives, and where each one is visible in the platform." tour="why-it-fits">
        <ul className="grid gap-3 md:grid-cols-3">
          {WHY_IT_FITS.map((w) => (
            <li key={w.title} className="surface p-3">
              <div className="flex items-center gap-2"><span className="text-(--color-primary)" style={{ ['--icon-accent' as string]: 'var(--color-accent)' }}><Icon name={w.icon} size={18} /></span><span className="font-medium">{w.title}</span></div>
              <p className="mt-1 text-[13px]">{w.body}</p>
              <p className="mt-1.5 text-[12px] text-(--color-muted)">In the platform: {w.evidence}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="mt-4" title="What changes: from content marathon to skills-first" icon="switch-horizontal-01" description="The transformation the modernised programmes deliver (deck pages 6 and 8)." tour="from-to">
        <div className="grid gap-4 lg:grid-cols-2">
          {([['Modernized ABC', ABC_FROM_TO], ['Modernized BCD', BCD_FROM_TO]] as const).map(([title, rows]) => (
            <div key={title}>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-(--color-faint)">{title}</div>
              <ul className="divide-y divide-(--color-border) rounded-md border border-(--color-border)">
                {rows.map((r) => (
                  <li key={r.from} className="grid items-center gap-2 px-3 py-2 text-[13px] sm:grid-cols-[minmax(0,1fr)_20px_minmax(0,1.4fr)]">
                    <div className="text-(--color-muted) line-through decoration-(--color-border)">{r.from}</div>
                    <div className="hidden justify-self-center text-(--color-primary) sm:block"><Icon name="arrow-right" size={14} /></div>
                    <div className="font-medium">{r.to}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section className="mt-4" title="Five core components · three high-impact actions each" icon="layers-three-01" description="Set the mechanism, deploy at scale, govern the results. The last column names where each action lives in the platform.">
        <div className="space-y-4">
          {COMPONENTS.map((c) => (
            <div key={c.n}>
              <div className="flex items-start gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-(--color-primary) text-[12px] font-semibold text-white">{c.n}</span><div><div className="font-medium">{c.title}</div><div className="text-[13px] text-(--color-muted)">{c.summary}</div></div></div>
              <ol className="mt-2 grid gap-2 md:grid-cols-3">
                {c.actions.map((a, i) => <li key={a.title} className="surface p-3 text-[13px]"><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Action {i + 1} · {['Set the mechanism', 'Deploy at scale', 'Govern the results'][i]}</div><div className="font-medium">{a.title}</div><ul className="mt-1 list-disc pl-4 text-(--color-muted)">{a.points.map((p) => <li key={p}>{p}</li>)}</ul><div className="mt-2 flex items-center gap-1 text-[12px] text-(--color-accent)"><Icon name="link-external-01" size={12} />{a.platform}</div></li>)}
              </ol>
            </div>
          ))}
        </div>
      </Section>
      <Section className="mt-4" title="Policy pack · People Committee resolution" icon="scales-01" description="ROI tracking, skills-based promotion criteria, premiums and value-linked incentives, effective from Batch 1/2027 before the first cohort graduates." tour="policy-pack">
        <ul className="divide-y divide-(--color-border)">
          {snap.policyItems.map((p) => (
            <li key={p.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] py-2.5 xl:grid-cols-[minmax(0,2fr)_170px_130px_minmax(0,1fr)_130px]">
              <div className="min-w-0"><div className="font-medium">{p.name}</div><div className="text-[12px] text-(--color-muted)">{p.description}</div></div>
              <div><Pill tone={p.status === 'approved' ? 'success' : p.status === 'submitted' ? 'warning' : p.status === 'deferred' ? 'error' : 'neutral'}>{POLICY_STATUS_LABEL[p.status]}</Pill></div>
              <div className="hidden text-[13px] xl:block">{p.effectiveFrom ? `From ${fmtDate(p.effectiveFrom)}` : 'No date'}</div>
              <div className="hidden text-[12px] text-(--color-muted) xl:block">{p.owner}{p.resolutionRef ? ` · ${p.resolutionRef}` : ''}{p.decidedAt ? ` · ${personaName(snap, p.decidedBy)} ${fmtDate(p.decidedAt)}` : ''}</div>
              <div className="flex xl:justify-end">{canGovern && <Button size="sm" onClick={() => { setPol(p); setPolV({ status: p.status, effectiveFrom: p.effectiveFrom ?? '', resolutionRef: p.resolutionRef ?? '', note: p.note ?? '' }) }}>Record decision</Button>}</div>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="mt-4" title="Governance cycles" icon="refresh-cw-01" description="The agenda refreshes annually within the MTP cycle, the taxonomy quarterly, and the People Committee refreshes the critical-skill list annually.">
        <ul className="divide-y divide-(--color-border)">
          {snap.governanceReviews.slice().sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt)).map((g) => (
            <li key={g.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] py-2 text-[13px] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_140px_140px]">
              <div className="font-medium">{g.area === 'taxonomy' ? 'Skills taxonomy' : g.area === 'critical_skills' ? 'Critical-skill list' : 'Capability agenda'}<div className="text-[12px] text-(--color-muted)">{g.cycle}</div></div>
              <div className="text-(--color-muted)">{g.note}</div>
              <div>{personaName(snap, g.reviewedBy)}<div className="text-[12px] text-(--color-muted)">{fmtDate(g.reviewedAt)}</div></div>
              <div>{g.nextDue ? <Pill tone={new Date(g.nextDue) < new Date() ? 'warning' : 'neutral'}>Next {fmtDate(g.nextDue)}</Pill> : null}</div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[12px] text-(--color-faint)">Reviews are recorded on the <Link to="/taxonomy">skills taxonomy</Link> and the <Link to="/agenda">capability agenda</Link>.</p>
      </Section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="Applications" icon="building-07">
          <div className="space-y-3 text-[13px]">
            <div><div className="font-medium">Turnaround priority · CBM</div><p className="text-(--color-muted)">New operating model means new role requirements. The platform reads CBM's roles and generates capability plans; line managers approve challenge briefs and validated impact; practical improvements and gated concepts convert capability spend into turnaround P&L from the first cohort.</p><Link to="/agenda" search={{ bu: 'bu-cbm' } as never}>CBM capability agenda</Link></div>
            <div><div className="font-medium">Shared services · CAFI</div><p className="text-(--color-muted)">Excellence targets in every impact contract: service levels up, cost-to-serve and turnaround down. Lab tools are the tools applied at work; proven improvements become micro-modules; verified skills and the marketplace make CAFI a talent engine.</p><Link to="/agenda" search={{ bu: 'bu-cafi' } as never}>CAFI capability agenda</Link></div>
          </div>
        </Section>
        <Section title="Enablers and timeline" icon="calendar">
          <ol className="space-y-1.5 text-[13px]">{ENABLERS.map((e) => <li key={e.what} className="flex gap-2"><Pill tone="neutral">{e.when}</Pill><span>{e.what}</span></li>)}</ol>
          <Notice tone="info" icon="info-circle">Policy approvals (ROI tracking, skills-based promotion criteria, premiums, value-linked incentives) are People Committee decisions outside the platform. The platform supplies the evidence: passport, ledger and impact dashboard.</Notice>
        </Section>
      </div>
      {ms && (
        <Dialog open onClose={() => setMs(null)} title="Update milestone" subtitle={ms.milestone}
          footer={<><Button variant="ghost" onClick={() => setMs(null)}>Cancel</Button><Button variant="primary" busy={saveMs.isPending} onClick={async () => { await saveMs.mutateAsync([ms.id, msV.status, msV.note]); setMs(null) }}>Save status</Button></>}>
          <div className="space-y-3">
            <Field label="Status" required>{(id) => <select id={id} className="field-input" value={msV.status} onChange={(e) => setMsV({ ...msV, status: e.target.value as MilestoneStatus })}>{(Object.keys(MILESTONE_LABEL) as MilestoneStatus[]).map((k) => <option key={k} value={k}>{MILESTONE_LABEL[k]}</option>)}</select>}</Field>
            <Field label="Note" hint="What is on track or at risk, in one line.">{(id) => <textarea id={id} className="field-input" value={msV.note} onChange={(e) => setMsV({ ...msV, note: e.target.value })} data-autofocus />}</Field>
          </div>
        </Dialog>
      )}
      {pol && (
        <Dialog open onClose={() => setPol(null)} title="Record a People Committee decision" subtitle={pol.name}
          footer={<><Button variant="ghost" onClick={() => setPol(null)}>Cancel</Button><Button variant="primary" busy={savePol.isPending} onClick={async () => { await savePol.mutateAsync([pol.id, polV.status as PolicyItem['status'], polV.effectiveFrom || null, polV.resolutionRef, polV.note]); setPol(null) }}>Save decision</Button></>}>
          <div className="space-y-3">
            <Field label="Status" required>{(id) => <select id={id} className="field-input" value={polV.status} onChange={(e) => setPolV({ ...polV, status: e.target.value })}>{(Object.keys(POLICY_STATUS_LABEL) as PolicyItem['status'][]).map((k) => <option key={k} value={k}>{POLICY_STATUS_LABEL[k]}</option>)}</select>}</Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Effective from">{(id) => <input id={id} type="date" className="field-input" value={polV.effectiveFrom} onChange={(e) => setPolV({ ...polV, effectiveFrom: e.target.value })} />}</Field>
              <Field label="Resolution reference">{(id) => <input id={id} className="field-input" placeholder="PC-2026-11" value={polV.resolutionRef} onChange={(e) => setPolV({ ...polV, resolutionRef: e.target.value })} />}</Field>
            </div>
            <Field label="Note">{(id) => <textarea id={id} className="field-input" value={polV.note} onChange={(e) => setPolV({ ...polV, note: e.target.value })} />}</Field>
          </div>
        </Dialog>
      )}
    </>
  )
}
