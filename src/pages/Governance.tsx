import { useNavigate } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { selectGovernance } from '@/domain/selectors'
import { computeMetrics, companyUnit } from '@/features/performance/metrics'
import { COST_CATEGORY_LABEL, type CostCategory } from '@/domain/types'
import { PageHeader, Section, LoadingBlock, ErrorBlock, Stat, Pill, Notice } from '@/components/ui'
import { fmtThb, pct } from '@/lib/format'
import { CONCEPT_STAGE_LABEL } from '@/domain/types'
import { stageTone } from '@/domain/status'
import { Link } from '@tanstack/react-router'
import { personaName } from '@/domain/selectors'

export function GovernancePage() {
  const { snap, actor, status, error, refetch } = useActor()
  const nav = useNavigate()
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const g = selectGovernance(snap)
  const company = computeMetrics(snap, companyUnit(snap).personaIds)
  const costByCategory = (Object.keys(COST_CATEGORY_LABEL) as CostCategory[]).map((c) => ({ c, total: snap.costLines.filter((l) => l.category === c).reduce((a, l) => a + l.amountThb, 0) })).filter((x) => x.total > 0)
  const totalCost = snap.costLines.reduce((a, l) => a + l.amountThb, 0)
  const leaders = snap.personas.filter((p) => p.leaderCohort)
  const leadersOnboarded = leaders.filter((p) => snap.enrollments.some((e) => e.personaId === p.id) || snap.passportEntries.some((x) => x.personaId === p.id))
  const population = snap.personas.filter((p) => p.role !== 'program_office' && p.role !== 'committee')
  const onboarded = population.filter((p) => snap.enrollments.some((e) => e.personaId === p.id))
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
        <Stat label="BUs onboarded to strategy and platform" value={`${pct(g.busOnboarded.length, g.bus.length)}%`} hint={`${g.busOnboarded.length} of ${g.bus.length} BUs · leads to Top KPI`} onClick={() => document.getElementById('by-bu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
        <Stat label="Concepts passing Gate 1" value={`${pct(g.gate1Pass.length, g.gate1.length)}%`} hint={`${g.gate1Pass.length} of ${g.gate1.length} decided · target ≥70%`} onClick={() => nav({ to: '/concepts' })} />
        <Stat label="Learners in active journeys" value={g.activeLearners.length} hint="Diagnosed, in labs, in sprint or showcase" onClick={() => nav({ to: '/cohorts' })} />
        <Stat label="Prioritised skill gaps closed" value={`${pct(g.gapsClosed.length, g.closingGaps.length)}%`} hint={`${g.gapsClosed.length} of ${g.closingGaps.length} priority gaps verified at target level`} onClick={() => nav({ to: '/taxonomy' })} />
      </div>
      <Section className="mt-4" title="Self-funding: does capability pay for itself?" icon="coins-hand" description="Programme cost against sponsor-validated impact. Cost is recorded per cohort on the cohort page; validated impact comes from the ledger." tour="gov-roi">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Programme cost to date" value={fmtThb(totalCost, true)} hint={`${snap.costLines.length} cost lines across ${new Set(snap.costLines.map((l) => l.cohortId)).size} cohorts`} onClick={() => nav({ to: '/cohorts' })} />
          <Stat label="Validated impact" value={fmtThb(g.validatedThb, true)} hint="Sponsor-validated, in the ledger" onClick={() => nav({ to: '/ledger', search: { status: 'validated' } as never })} tone="primary" />
          <Stat label="Return on capability spend" value={company.roiRatio != null ? `${company.roiRatio}×` : '—'} hint={company.roiRatio != null && company.roiRatio >= 1 ? 'Above 1.0: capability pays for itself' : 'Below 1.0 so far'} tone={company.roiRatio != null && company.roiRatio >= 1 ? 'success' : 'warning'} />
          <Stat label="Cost per learner" value={fmtThb(company.costPerLearner ?? 0, true)} hint={`${company.learners} learners in programmes`} />
        </div>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {costByCategory.map((x) => <li key={x.c} className="flex items-center justify-between gap-2 rounded-md border border-(--color-border) px-2.5 py-1.5 text-[13px]"><span className="truncate">{COST_CATEGORY_LABEL[x.c]}</span><span className="tabular-nums">{fmtThb(x.total, true)}</span></li>)}
        </ul>
        <p className="mt-2 text-[12px] text-(--color-faint)">Pipeline not yet validated adds {fmtThb(g.pipelineThb, true)}. ROI counts only sponsor-validated value, matched to P&amp;L actuals through the finance connector.</p>
      </Section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Internal mobility" value={company.mobilityRate != null ? `${company.mobilityRate}%` : '—'} hint="Learners placed on verified skills" onClick={() => nav({ to: '/marketplace' })} />
        <Stat label="Retention" value={company.retentionRate != null ? `${company.retentionRate}%` : '—'} hint="Programme learners still at SCG" />
        <Stat label="Time to proficiency" value={company.timeToProficiencyDays != null ? `${company.timeToProficiencyDays} days` : '—'} hint="Diagnostic to first verified badge" />
        <Stat label="AI-ready" value={company.aiReadyRate != null ? `${company.aiReadyRate}%` : '—'} hint="Verified AI skill at Level 2+" />
        <Stat label="Leaders onboarded first" value={`${pct(leadersOnboarded.length, leaders.length)}%`} hint={`${leadersOnboarded.length} of ${leaders.length} leaders and influencers`} />
        <Stat label="Critical mass (~25% target)" value={`${pct(onboarded.length, population.length)}%`} hint={`${onboarded.length} of ${population.length} people in programmes`} tone={pct(onboarded.length, population.length) >= 25 ? 'success' : undefined} />
        <Stat label="Sprint completion" value={company.sprintCompletion != null ? `${company.sprintCompletion}%` : '—'} hint="Finished the 90-day sprint" />
        <Stat label="Validation ageing" value={company.validationAgeingDays != null ? `${company.validationAgeingDays} days` : 'None waiting'} hint="Claims waiting for sponsor validation" onClick={() => nav({ to: '/ledger', search: { status: 'pending_validation' } as never })} tone={(company.validationAgeingDays ?? 0) > 21 ? 'warning' : undefined} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Section title="Before / after skill uplift" icon="trend-up-01" description="Per graduate: diagnostic level at entry versus verified level after the showcase or gate, for their priority skills.">
          {(() => { const rows = g.graduates.flatMap((e) => { const dx = snap.diagnostics.find((d) => d.enrollmentId === e.id); if (!dx) return []; return snap.diagnosticItems.filter((i) => i.diagnosticId === dx.id && i.priorityRank != null).map((i) => { const after = snap.passportEntries.filter((p) => p.personaId === e.personaId && p.skillId === i.skillId && p.tier === 'outcome_verified').sort((a, b) => b.level - a.level)[0]; return { personaId: e.personaId, skill: snap.skills.find((s) => s.id === i.skillId)!, before: i.currentLevel, target: i.targetLevel, after: after?.level ?? null } }) }); if (!rows.length) return <p className="text-[13px] text-(--color-muted)">No graduates yet.</p>; const uplift = rows.filter((r) => r.after != null && r.after > r.before).length; return (<>
            <div className="mb-2 text-[13px]"><span className="font-semibold">{uplift} of {rows.length}</span> priority skills show verified uplift · average +{(rows.filter((r) => r.after != null).reduce((a, r) => a + (r.after! - r.before), 0) / Math.max(1, rows.filter((r) => r.after != null).length)).toFixed(1)} level</div>
            <ul className="divide-y divide-(--color-border)">{rows.map((r, i) => <li key={i} className="flex items-center justify-between gap-2 py-1.5 text-[13px]"><div className="min-w-0"><Link to="/passport" search={{ persona: r.personaId } as never} className="font-medium">{personaName(snap, r.personaId)}</Link> <span className="text-(--color-muted)">· {r.skill.name}</span></div><div className="flex shrink-0 items-center gap-1"><Pill tone="neutral">{r.before ? `L${r.before}` : 'n/a'}</Pill><span className="text-(--color-faint)">→</span><Pill tone={r.after != null ? (r.after >= r.target ? 'success' : 'info') : 'warning'}>{r.after != null ? `L${r.after} verified` : 'Not yet verified'}</Pill></div></li>)}</ul></>) })()}
        </Section>
        <Section title="Career and rewards triggers" icon="trophy-01" description="Standing inputs to talent reviews, succession and the merit cycle. Decisions are made by people; the platform supplies the evidence.">
          {(() => { const rows: { personaId: string; trigger: string; basis: string; tone: 'success' | 'accent' | 'primary' | 'info' }[] = []
            for (const e of snap.enrollments) { const c = snap.cohorts.find((k) => k.id === e.cohortId)!; if (e.topDecile && c.program === 'ABC') rows.push({ personaId: e.personaId, trigger: 'ABC top ~10% → BCD fast-track and priority for stretch assignments', basis: `${c.code} · impact rating ${e.impactRating ?? 'n/a'}`, tone: 'primary' }); if (e.impactRating && c.program === 'ABC') rows.push({ personaId: e.personaId, trigger: 'Impact rating → performance review input and recognition award', basis: `${c.code} · ${e.impactRating}`, tone: 'info' }) }
            for (const gr of snap.gateReviews.filter((x) => x.gateNo === 2 && ['invest', 'small_scale'].includes(x.decision))) { const cp = snap.concepts.find((k) => k.id === gr.conceptId)!; for (const m of snap.enrollments.filter((x) => x.teamId === cp.teamId)) rows.push({ personaId: m.personaId, trigger: 'Gate-2 winner → incubation leadership role within 6 months + value-linked incentive', basis: cp.title, tone: 'accent' }) }
            for (const gr of snap.gateReviews.filter((x) => x.gateNo === 1 && x.decision !== 'pending')) { const cp = snap.concepts.find((k) => k.id === gr.conceptId)!; for (const m of snap.enrollments.filter((x) => x.teamId === cp.teamId)) rows.push({ personaId: m.personaId, trigger: 'Gate result → talent review data and L2 succession pool entry', basis: `${cp.title} · Gate 1 ${gr.decision}`, tone: 'info' }) }
            for (const p of snap.personas) { const prem = snap.passportEntries.filter((x) => x.personaId === p.id && x.tier === 'outcome_verified' && snap.skills.find((s) => s.id === x.skillId)?.premiumEligible); if (prem.length) rows.push({ personaId: p.id, trigger: 'Verified critical skill → skill-premium consideration in the merit cycle', basis: prem.map((x) => snap.skills.find((s) => s.id === x.skillId)?.code).join(', '), tone: 'success' }) }
            if (!rows.length) return <p className="text-[13px] text-(--color-muted)">No triggers yet.</p>
            return <ul className="divide-y divide-(--color-border)">{rows.map((r, i) => <li key={i} className="py-1.5 text-[13px]"><div className="flex flex-wrap items-center gap-1.5"><Link to="/passport" search={{ persona: r.personaId } as never} className="font-medium">{personaName(snap, r.personaId)}</Link><Pill tone={r.tone}>{r.trigger}</Pill></div><div className="text-[12px] text-(--color-muted)">Basis: {r.basis}</div></li>)}</ul> })()}
        </Section>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section id="by-bu" title="By business unit" icon="building-07" description="Validated ledger value, learners and share of enrolled critical-role holders with a verified skill.">
          <div className="table-grid hidden grid-cols-[minmax(0,1.6fr)_96px_72px_80px_84px] px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint) md:grid"><div>BU</div><div>Validated</div><div>Learners</div><div>Graduates</div><div>Skill-ready</div></div>
          <ul className="divide-y divide-(--color-border)">
            {byBu.map((r) => (
              <li key={r.b.id} className="table-grid grid-cols-1 px-1 py-2 text-[13px] md:grid-cols-[minmax(0,1.6fr)_96px_72px_80px_84px]">
                <div className="min-w-0"><div className="truncate font-medium">{r.b.code} · {r.b.name}</div><div className="flex flex-wrap gap-1 pt-0.5"><Pill tone={r.b.strategyOnboarded ? 'success' : 'neutral'}>Strategy {r.b.strategyOnboarded ? 'yes' : 'no'}</Pill><Pill tone={r.b.platformOnboarded ? 'success' : 'neutral'}>Platform {r.b.platformOnboarded ? 'yes' : 'no'}</Pill></div></div>
                <div><span className="text-(--color-muted) md:hidden">Validated </span>{fmtThb(r.ledger, true)}</div>
                <div><span className="text-(--color-muted) md:hidden">Learners </span>{r.learners}</div>
                <div><span className="text-(--color-muted) md:hidden">Graduates </span>{r.graduates}</div>
                <div><span className="text-(--color-muted) md:hidden">Skill-ready </span>{r.criticalN ? `${r.readyPct}%` : '—'}</div>
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
