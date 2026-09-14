import { useNavigate } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { selectGovernance } from '@/domain/selectors'
import { PageHeader, Section, LoadingBlock, ErrorBlock, Stat, Pill, Notice } from '@/components/ui'
import { fmtThb, pct } from '@/lib/format'
import { CONCEPT_STAGE_LABEL } from '@/domain/types'
import { stageTone } from '@/domain/status'

export function GovernancePage() {
  const { snap, actor, status, error, refetch } = useActor()
  const nav = useNavigate()
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const g = selectGovernance(snap)
  const byBu = snap.businessUnits.filter((b) => b.id !== 'bu-corp').map((b) => {
    const ledger = snap.ledgerEntries.filter((l) => l.buId === b.id && ['validated', 'audited'].includes(l.status)).reduce((a, l) => a + (l.validatedValueThb ?? 0), 0)
    const learners = snap.enrollments.filter((e) => snap.personas.find((p) => p.id === e.personaId)?.buId === b.id)
    const graduates = learners.filter((e) => e.status === 'graduated')
    const critical = snap.personas.filter((p) => p.buId === b.id && p.role === 'learner')
    const ready = critical.filter((p) => snap.passportEntries.some((x) => x.personaId === p.id && x.tier === 'outcome_verified'))
    return { b, ledger, learners: learners.length, graduates: graduates.length, readyPct: pct(ready.length, critical.length), criticalN: critical.length }
  })
  return (
    <>
      <PageHeader title="Impact dashboard" description="Quarterly impact governance for MTP 2027: validated THB impact, pipeline, verified skill uplift, BU onboarding and gate outcomes. Every number opens the records behind it." />
      <Notice tone="warning" icon="alert-triangle">Figures are calculated from the fictional demo dataset and are illustrative. Targets are not configured in the prototype.</Notice>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-tour="gov-stats">
        <Stat label="Validated business impact" value={fmtThb(g.validatedThb, true)} hint={`Top KPI · ${g.validated.length} validated or audited ledger entries`} onClick={() => nav({ to: '/ledger', search: { status: 'validated' } as never })} tone="primary" />
        <Stat label="Pending sponsor validation" value={fmtThb(g.pendingThb, true)} hint="Claimed at showcase" onClick={() => nav({ to: '/ledger', search: { status: 'pending_validation' } as never })} />
        <Stat label="Concept pipeline (THB)" value={fmtThb(g.pipelineThb, true)} hint="Live BCD concepts, not yet validated" onClick={() => nav({ to: '/concepts', search: { program: 'live' } as never })} />
        <Stat label="Graduates with verified skill uplift" value={`${pct(g.graduatesVerified.length, g.graduates.length)}%`} hint={`${g.graduatesVerified.length} of ${g.graduates.length} graduates hold outcome-verified badges`} onClick={() => nav({ to: '/cohorts' })} />
        <Stat label="BUs onboarded to strategy and platform" value={`${pct(g.busOnboarded.length, g.bus.length)}%`} hint={`${g.busOnboarded.length} of ${g.bus.length} BUs · leads to Top KPI`} />
        <Stat label="Concepts passing Gate 1" value={`${pct(g.gate1Pass.length, g.gate1.length)}%`} hint={`${g.gate1Pass.length} of ${g.gate1.length} decided · target ≥70%`} onClick={() => nav({ to: '/concepts' })} />
        <Stat label="Learners in active journeys" value={g.activeLearners.length} hint="Diagnosed, in labs, in sprint or showcase" onClick={() => nav({ to: '/cohorts' })} />
        <Stat label="Prioritised skill gaps closed" value={`${pct(g.gapsClosed.length, g.closingGaps.length)}%`} hint={`${g.gapsClosed.length} of ${g.closingGaps.length} priority gaps verified at target level`} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section title="By business unit" icon="building-07" description="Validated ledger value, learners and share of enrolled critical-role holders with a verified skill.">
          <div className="table-grid grid-cols-[minmax(0,1.6fr)_96px_72px_80px_84px] px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint)"><div>BU</div><div>Validated</div><div>Learners</div><div>Graduates</div><div>Skill-ready</div></div>
          <ul className="divide-y divide-(--color-border)">
            {byBu.map((r) => (
              <li key={r.b.id} className="table-grid grid-cols-[minmax(0,1.6fr)_96px_72px_80px_84px] px-1 py-2 text-[13px]">
                <div className="min-w-0"><div className="truncate font-medium">{r.b.code} · {r.b.name}</div><div className="flex gap-1 pt-0.5"><Pill tone={r.b.strategyOnboarded ? 'success' : 'neutral'}>Strategy {r.b.strategyOnboarded ? 'yes' : 'no'}</Pill><Pill tone={r.b.platformOnboarded ? 'success' : 'neutral'}>Platform {r.b.platformOnboarded ? 'yes' : 'no'}</Pill></div></div>
                <div>{fmtThb(r.ledger, true)}</div><div>{r.learners}</div><div>{r.graduates}</div><div>{r.criticalN ? `${r.readyPct}%` : '—'}</div>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Concept portfolio by stage" icon="rocket-01">
          <ul className="space-y-1.5">
            {(Object.keys(CONCEPT_STAGE_LABEL) as (keyof typeof CONCEPT_STAGE_LABEL)[]).map((st) => { const rows = snap.concepts.filter((c) => c.stage === st); if (!rows.length) return null; return (
              <li key={st} className="flex items-center justify-between gap-2 text-[13px]"><Pill tone={stageTone[st]}>{CONCEPT_STAGE_LABEL[st]}</Pill><span>{rows.length} · {fmtThb(rows.reduce((a, c) => a + (c.validatedValueThb ?? c.pipelineValueThb ?? 0), 0), true)}</span></li>) })}
          </ul>
          <p className="mt-3 text-[12px] text-(--color-faint)">Career and rewards triggers (impact ratings, top decile, fast-track) are shown on each learner's passport. Merit-cycle and premium decisions happen in the People Committee.</p>
        </Section>
      </div>
    </>
  )
}
