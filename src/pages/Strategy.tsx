import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { selectGovernance } from '@/domain/selectors'
import { SUB_PLANS, COMPONENTS, ENABLERS } from '@/data/strategy-content'
import { PageHeader, Section, LoadingBlock, ErrorBlock, Pill, Notice } from '@/components/ui'
import { fmtThb, pct } from '@/lib/format'
import { Icon } from '@/icons/Icon'

export function StrategyPage() {
  const { snap, status, error, refetch } = useActor()
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
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
              <div className="text-[13px]"><Pill tone="accent">{p.milestone}</Pill><div className="mt-1 text-(--color-muted)">{p.owner}</div></div>
            </li>
          ))}
        </ul>
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
    </>
  )
}
