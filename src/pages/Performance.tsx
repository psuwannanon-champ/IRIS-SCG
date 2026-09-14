import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { requestGuidance, buildPerformanceContext, type PerformanceOutput } from '@/features/guidance/api'
import { fmtDate } from '@/lib/format'
import { METRICS, computeMetrics, companyUnit, myUnit, unitsOf, rankOf, type Unit, type UnitKind, type UnitMetrics, type MetricDef } from '@/features/performance/metrics'
import { PageHeader, Section, LoadingBlock, ErrorBlock, Pill, Button, Notice, type Tone } from '@/components/ui'
import { fmtThb } from '@/lib/format'
import { Icon } from '@/icons/Icon'

const fmt = (v: number | null, unit: MetricDef['unit']) => v == null ? '—' : unit === '%' ? `${v}%` : unit === 'thb' ? fmtThb(v, true) : unit === 'days' ? `${v} d` : String(v)
const KIND_LABEL: Record<UnitKind, string> = { manager: 'Manager teams', bu: 'Business units', coach: 'Coach groups', cohort: 'Cohorts' }
const UNIT_WORD: Record<UnitKind, string> = { manager: 'manager team', bu: 'business unit', coach: 'coach group', cohort: 'cohort' }

interface ScorecardData { unit: Unit; teamM: UnitMetrics; companyM: UnitMetrics; kind: UnitKind; rows: { u: Unit; m: UnitMetrics }[] }
/** Only the rounded numbers already on screen go to the model, and the platform (not the model) picks
 *  the strength, weakness and the two focus measures, so the same screen always produces the same answer. */
function buildScorecard(d: ScorecardData, view: 'team' | 'company') {
  const list = METRICS.filter((m) => m.key !== 'healthScore')
  const cmp = (higher: boolean, a: number | null, b: number | null) => a == null || b == null ? 'no data' : (higher ? a >= b : a <= b) ? 'ahead' : 'behind'
  const rows = [
    { key: 'healthScore' as const, label: 'Program health score', unit: '%', higher: true, explain: 'Average of readiness, learning, labs, contracts and verified uplift.' },
    ...list.map((m) => ({ key: m.key, label: m.label, unit: m.unit === 'thb' ? 'THB' : m.unit === 'days' ? 'days (lower is better)' : m.unit === '%' ? '%' : 'count', higher: m.higherIsBetter, explain: m.explain })),
  ].map((r) => {
    const team = d.teamM[r.key] as number | null, company = d.companyM[r.key] as number | null
    const rel = team == null || company == null ? null : Math.round(((r.higher ? team - company : company - team) / Math.max(Math.abs(company), 1)) * 1000) / 1000
    return { measure: r.label, unit: r.unit, team, company, result: cmp(r.higher, team, company) as 'ahead' | 'behind' | 'no data', meaning: r.explain, rel }
  })
  const scored = rows.filter((r) => r.rel != null && r.measure !== 'Program health score' && r.unit !== 'THB')
  const byRel = [...scored].sort((a, b) => a.rel! - b.rel! || a.measure.localeCompare(b.measure))
  const weakness = byRel[0] ?? null
  const strength = byRel[byRel.length - 1] ?? null
  const focus = byRel.slice(0, 2).map((r) => r.measure)
  const rank = rankOf(d.rows.map((r) => ({ id: r.u.id, value: r.m.healthScore })), d.unit.id, true)
  const board = [...d.rows].sort((a, b) => (b.m.healthScore ?? -1) - (a.m.healthScore ?? -1)).map((r) => ({ name: r.u.name, healthScore: r.m.healthScore, isYou: r.u.id === d.unit.id }))
  const comparable = rows.filter((r) => r.measure !== 'Program health score' && r.result !== 'no data')

  if (view === 'company') {
    // The subject is SCG as a whole: report company values, and name the leading and trailing units.
    const scoredBoard = board.filter((b) => b.healthScore != null)
    const best = scoredBoard[0] ?? null, worst = scoredBoard[scoredBoard.length - 1] ?? null
    const companyRows = rows.filter((r) => r.measure !== 'Program health score').map((r) => ({ measure: r.measure, unit: r.unit, companyValue: r.company, meaning: r.meaning }))
    const weakest = rows.filter((r) => r.company != null && r.unit === '%' && r.measure !== 'Program health score').sort((a, b) => (a.company as number) - (b.company as number))
    const companyFocus = weakest.slice(0, 2).map((r) => `${r.measure} (company ${r.company}%)`)
    const ctx = buildPerformanceContext({
      view, unitName: 'SCG (all business units)', unitKind: UNIT_WORD[d.kind], learners: d.companyM.learners, companyLearners: d.companyM.learners,
      rank: null, measures: companyRows, healthScore: d.companyM.healthScore, aheadOfCompany: null,
      highlight: { strength: best ? `${best.name} leads at ${best.healthScore}%` : null, weakness: worst && worst !== best ? `${worst.name} trails at ${worst.healthScore}%` : null },
      focus: companyFocus.length ? companyFocus : [`${KIND_LABEL[d.kind]} spread`, 'Validated impact'],
      leaderboard: board,
    })
    return { contextId: `company:${d.kind}`, context: ctx, fingerprint: JSON.stringify(['company', d.kind, rows.map((r) => r.company), board.map((b) => b.healthScore)]) }
  }

  const context = buildPerformanceContext({ view, unitName: d.unit.name, unitKind: UNIT_WORD[d.kind], learners: d.teamM.learners, companyLearners: d.companyM.learners, rank, measures: rows.map(({ rel: _rel, ...m }) => m), healthScore: d.teamM.healthScore, aheadOfCompany: { count: comparable.filter((r) => r.result === 'ahead').length, of: comparable.length }, highlight: { strength: strength?.measure ?? null, weakness: weakness?.measure ?? null }, focus, leaderboard: undefined })
  const fingerprint = JSON.stringify([view, d.unit.id, rows.map((r) => [r.team, r.company]), rank])
  return { contextId: `${view}:${d.unit.id}`, context, fingerprint }
}

export function PerformancePage() {
  const { snap, actor, status, error, refetch } = useActor()
  const search = useSearch({ strict: false }) as { view?: string; unit?: string; kind?: string }
  const nav = useNavigate()
  const [tableView, setTableView] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const asked = useRef<Set<string>>(new Set())
  const saveSummary = useAction((ds, contextId: string, content: unknown, model: string) => ds.saveGuidance(actor!.id, actor!.id, 'performance', contextId, content, model))
  const data = useMemo(() => {
    if (!snap || !actor) return null
    const mine = myUnit(snap, actor)
    const canPick = ['program_office', 'committee'].includes(actor.role)
    const kind = (canPick && (search.kind as UnitKind)) || mine.kind
    const peers = canPick ? unitsOf(snap, kind) : mine.peers
    const unit = (canPick && peers.find((u) => u.id === search.unit)) || (canPick ? peers[0] : mine.unit) || null
    const company = companyUnit(snap)
    const rows = peers.map((u) => ({ u, m: computeMetrics(snap, u.personaIds) }))
    return { mine, canPick, kind, peers, unit, company, rows, teamM: unit ? computeMetrics(snap, unit.personaIds) : null, companyM: computeMetrics(snap, company.personaIds) }
  }, [snap, actor, search.kind, search.unit])
  const view: 'team' | 'company' = search.view === 'company' ? 'company' : 'team'
  const scorecard = data?.unit && data.teamM ? buildScorecard({ unit: data.unit, teamM: data.teamM, companyM: data.companyM, kind: data.kind, rows: data.rows }, view) : null
  const savedNote = snap && scorecard ? snap.guidanceNotes.filter((n) => n.kind === 'performance' && n.contextId === scorecard.contextId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null : null

  const runSummary = async () => {
    if (!scorecard || !actor) return
    setAiBusy(true); setAiError(null)
    try {
      const r = await requestGuidance<PerformanceOutput>({ kind: 'performance', context: scorecard.context })
      await saveSummary.mutateAsync([scorecard.contextId, { ...r.output, fingerprint: scorecard.fingerprint }, r.model])
    } catch (e) { setAiError((e as Error).message) } finally { setAiBusy(false) }
  }
  useEffect(() => {
    if (!scorecard || savedNote || aiBusy || asked.current.has(scorecard.contextId)) return
    asked.current.add(scorecard.contextId)
    void runSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorecard?.contextId, savedNote])

  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor || !data) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const setS = (patch: Record<string, unknown>) => nav({ to: '/performance', search: { view, unit: data.unit?.id ?? '', kind: data.kind, ...patch } as never })
  const { unit, teamM, companyM, rows } = data
  const visible = METRICS.filter((m) => m.key !== 'healthScore')
  const better = (m: MetricDef, a: number | null, b: number | null) => a == null || b == null ? null : m.higherIsBetter ? a >= b : a <= b
  const healthRank = unit ? rankOf(rows.map((r) => ({ id: r.u.id, value: r.m.healthScore })), unit.id, true) : null
  const wins = unit && teamM ? visible.filter((m) => better(m, teamM[m.key] as number | null, companyM[m.key] as number | null) === true).length : 0
  const comparable = unit && teamM ? visible.filter((m) => better(m, teamM[m.key] as number | null, companyM[m.key] as number | null) !== null).length : 0

  return (
    <>
      <PageHeader title="Performance dashboard" description="How your team is doing against the company on the capability program: readiness, execution, delivered impact and verified skills. Every measure has a one-line definition and opens the records behind it. Figures use the fictional demo dataset."
        actions={<div className="flex items-center gap-1" role="tablist" aria-label="View"><Button size="sm" role="tab" aria-selected={view === 'team'} variant={view === 'team' ? 'primary' : 'secondary'} onClick={() => setS({ view: 'team' })}>Team view</Button><Button size="sm" role="tab" aria-selected={view === 'company'} variant={view === 'company' ? 'primary' : 'secondary'} onClick={() => setS({ view: 'company' })}>Company view</Button><Button size="sm" variant="ghost" icon="list" aria-pressed={tableView} onClick={() => setTableView((v) => !v)}>{tableView ? 'Bars' : 'Table'}</Button></div>} />

      {data.canPick && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-[13px] text-(--color-muted)" htmlFor="kind">Compare</label>
          <select id="kind" className="field-input max-w-[180px]" value={data.kind} onChange={(e) => setS({ kind: e.target.value, unit: '' })}>{(Object.keys(KIND_LABEL) as UnitKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select>
          <label className="text-[13px] text-(--color-muted)" htmlFor="unit">Team</label>
          <select id="unit" className="field-input max-w-[260px]" value={unit?.id ?? ''} onChange={(e) => setS({ unit: e.target.value })}>{data.peers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        </div>
      )}

      {unit && teamM && scorecard && (
        <Section className="mb-4" title="AI summary" icon="stars-02" description={`Where ${view === 'company' ? 'SCG' : unit.name} stands right now and what to look at next. Generated from the numbers on this page.`} tour="perf-ai"
          actions={<Button size="sm" icon="refresh-cw-01" busy={aiBusy} onClick={runSummary}>{savedNote ? 'Refresh' : 'Generate'}</Button>}>
          {aiError && <div className="mb-2"><Notice tone="error" icon="alert-circle">{aiError}</Notice></div>}
          {aiBusy && !savedNote && <p className="text-[13px] text-(--color-muted)">Reading the scorecard…</p>}
          {!aiBusy && !savedNote && !aiError && <p className="text-[13px] text-(--color-muted)">No summary yet. Generate one to get two lines on performance and two things to do next.</p>}
          {savedNote && (() => { const c = savedNote.content as PerformanceOutput & { fingerprint?: string }; const stale = c.fingerprint !== scorecard.fingerprint; return (
            <div className="space-y-2.5">
              <p className="text-[15px] leading-relaxed">{c.summary}</p>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">What to do next or investigate</div>
                <ul className="mt-1 space-y-1">{c.nextSteps?.map((n, i) => <li key={i} className="flex items-start gap-2 text-[13px]"><span className="mt-0.5 shrink-0 text-(--color-primary)"><Icon name="arrow-right" size={14} /></span>{n}</li>)}</ul>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-(--color-faint)">
                <Pill tone="accent" icon="stars-02">Claude {savedNote.model.includes('sonnet') ? 'Sonnet' : savedNote.model}</Pill>
                <span>{fmtDate(savedNote.createdAt, true)}</span>
                {stale && <Pill tone="warning" icon="alert-triangle">Numbers changed since this summary</Pill>}
              </div>
            </div>) })()}
        </Section>
      )}

      {!unit || !teamM ? <Notice tone="warning" icon="alert-triangle">No team is linked to your persona yet. Managers see direct reports, sponsors their BU, coaches their learners.</Notice> : view === 'team' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-tour="perf-tiles">
            <Tile label="Program health score" value={fmt(teamM.healthScore, '%')} sub={healthRank ? `Rank ${healthRank.rank} of ${healthRank.of} ${KIND_LABEL[data.kind].toLowerCase()}` : 'Not ranked yet'} tone={healthRank && healthRank.rank <= Math.ceil(healthRank.of / 2) ? 'success' : 'warning'} hint="Average of readiness, learning, labs, contracts and verified uplift." />
            <Tile label="Better than company on" value={`${wins} of ${comparable}`} sub="measures with data" tone={wins * 2 >= comparable ? 'success' : 'warning'} hint="Counted only where both team and company have a value." />
            <Tile label="Validated impact" value={fmtThb(teamM.validatedThb, true)} sub={`Company ${fmtThb(companyM.validatedThb, true)}`} tone="primary" hint="Sponsor-validated THB for your learners." />
            <Tile label="Learners in programs" value={String(teamM.learners)} sub={`of ${companyM.learners} company-wide`} hint="Enrolled and not withdrawn." />
          </div>
          <Section className="mt-4" title={`${unit.name} vs company`} icon="bar-chart-square-02" description="Each row is one measure. Red is your team, blue is the company. Longer is better except decision time." tour="perf-compare">
            <div className="mb-2 flex flex-wrap items-center gap-3 text-[12px]"><span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--chart-team)' }} />Your team</span><span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--chart-company)' }} />Company</span></div>
            {tableView ? (
              <table className="w-full text-[13px]"><thead><tr className="text-left text-[11px] uppercase tracking-wide text-(--color-faint)"><th className="py-1 font-semibold">Measure</th><th className="py-1 font-semibold">Team</th><th className="py-1 font-semibold">Company</th><th className="py-1 font-semibold">Result</th></tr></thead><tbody>{visible.map((m) => { const t = teamM[m.key] as number | null, c = companyM[m.key] as number | null; const b = better(m, t, c); return <tr key={m.key} className="border-t border-(--color-border)"><td className="py-1.5">{m.label}</td><td>{fmt(t, m.unit)}</td><td>{fmt(c, m.unit)}</td><td>{b == null ? 'No data' : b ? 'Ahead' : 'Behind'}</td></tr> })}</tbody></table>
            ) : (
              <ul className="divide-y divide-(--color-border)">
                {visible.map((m) => { const t = teamM[m.key] as number | null, c = companyM[m.key] as number | null; const max = Math.max(t ?? 0, c ?? 0, m.unit === '%' ? 100 : 0) || 1; const b = better(m, t, c); return (
                  <li key={m.key} className="grid gap-x-4 gap-y-1 py-2.5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_110px]">
                    <div className="min-w-0"><div className="font-medium">{m.label}{m.program && <span className="ml-1 text-[11px] font-normal text-(--color-faint)">{m.program}</span>}</div><div className="text-[12px] text-(--color-muted)">{m.explain}</div></div>
                    <div className="space-y-1" role="img" aria-label={`${m.label}: team ${fmt(t, m.unit)}, company ${fmt(c, m.unit)}`}>
                      <Bar value={t} max={max} color="var(--chart-team)" label={fmt(t, m.unit)} />
                      <Bar value={c} max={max} color="var(--chart-company)" label={fmt(c, m.unit)} />
                    </div>
                    <div className="flex items-start md:justify-end">{b == null ? <Pill tone="neutral">No data yet</Pill> : b ? <Pill tone="success" icon="trend-up-01">Ahead</Pill> : <Pill tone="warning" icon="alert-triangle">Behind</Pill>}</div>
                  </li>) })}
              </ul>
            )}
          </Section>
          <Section className="mt-4" title="What to do next" icon="target-04" description="The measures where your team trails the company, with the page where the work happens.">
            <ul className="space-y-1.5 text-[13px]">
              {visible.filter((m) => better(m, teamM[m.key] as number | null, companyM[m.key] as number | null) === false).map((m) => <li key={m.key} className="flex items-start gap-2"><span className="mt-0.5 text-(--color-warning)"><Icon name="alert-triangle" size={14} /></span><span><span className="font-medium">{m.label}:</span> team {fmt(teamM[m.key] as number | null, m.unit)} vs company {fmt(companyM[m.key] as number | null, m.unit)}. {NEXT[m.key]}</span></li>)}
              {visible.every((m) => better(m, teamM[m.key] as number | null, companyM[m.key] as number | null) !== false) && <li className="text-(--color-muted)">Your team is at or above the company on every measure with data.</li>}
            </ul>
          </Section>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Company health score" value={fmt(companyM.healthScore, '%')} sub={`${rows.length} ${KIND_LABEL[data.kind].toLowerCase()} compared`} tone="primary" hint="Average of readiness, learning, labs, contracts and verified uplift." />
            <Tile label="Validated impact" value={fmtThb(companyM.validatedThb, true)} sub={`${fmtThb(companyM.validatedPerLearner ?? 0, true)} per learner`} hint="Sponsor-validated THB across all learners." />
            <Tile label="Verified skill uplift" value={fmt(companyM.verifiedUplift, '%')} sub="priority gaps closed by graduates" hint="Outcome-verified badge at target level." />
            <Tile label="Learners in programs" value={String(companyM.learners)} sub={`${unitsOf(snap, 'cohort').length} cohorts`} hint="Enrolled and not withdrawn." />
          </div>
          <Section className="mt-4" title={`Leaderboard · ${KIND_LABEL[data.kind]}`} icon="trophy-01" description="Ranked by program health score. Your team is highlighted. Click a name to open its team view." tour="perf-leaderboard">
            <div className="table-grid hidden grid-cols-[40px_minmax(0,1.6fr)_70px_120px_120px_110px_120px_110px] px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint) xl:grid"><div>#</div><div>Team</div><div>Learners</div><div>Health</div><div>Contracts active</div><div>Uplift</div><div>Validated THB</div><div>Decision time</div></div>
            <ol className="divide-y divide-(--color-border)">
              {[...rows].sort((a, b) => (b.m.healthScore ?? -1) - (a.m.healthScore ?? -1)).map((r, i) => { const me = r.u.id === unit.id; return (
                <li key={r.u.id} className={`table-grid grid-cols-[40px_minmax(0,1fr)_auto] rounded-md px-2 py-2 xl:grid-cols-[40px_minmax(0,1.6fr)_70px_120px_120px_110px_120px_110px] ${me ? 'bg-(--color-primary-soft)' : ''}`} aria-current={me ? 'true' : undefined}>
                  <div className="font-semibold">{i + 1}</div>
                  <div className="min-w-0"><button type="button" className="truncate text-left font-medium text-(--color-accent) hover:text-(--color-primary)" onClick={() => setS({ view: 'team', unit: r.u.id })}>{r.u.name}</button>{me && <span className="ml-1 text-[11px] text-(--color-primary)">you</span>}</div>
                  <div className="hidden text-[13px] xl:block">{r.m.learners}</div>
                  <div className="flex items-center gap-2 text-[13px]"><span className="hidden h-1.5 w-16 overflow-hidden rounded-sm bg-(--color-border) xl:block"><span className="block h-full" style={{ width: `${r.m.healthScore ?? 0}%`, background: me ? 'var(--chart-team)' : 'var(--chart-company)' }} /></span>{fmt(r.m.healthScore, '%')}</div>
                  <div className="hidden text-[13px] xl:block">{fmt(r.m.contractActivation, '%')}</div>
                  <div className="hidden text-[13px] xl:block">{fmt(r.m.verifiedUplift, '%')}</div>
                  <div className="hidden text-[13px] xl:block">{fmtThb(r.m.validatedThb, true)}</div>
                  <div className="hidden text-[13px] xl:block">{fmt(r.m.decisionDays, 'days')}</div>
                </li>) })}
            </ol>
          </Section>
          <Section className="mt-4" title="Company measures" icon="bar-chart-square-02" description="Every measure for SCG as a whole, with the best and weakest team on each.">
            <ul className="divide-y divide-(--color-border)">
              {visible.map((m) => { const c = companyM[m.key] as number | null; const withVal = rows.filter((r) => (r.m[m.key] as number | null) != null).sort((a, b) => m.higherIsBetter ? (b.m[m.key] as number) - (a.m[m.key] as number) : (a.m[m.key] as number) - (b.m[m.key] as number)); return (
                <li key={m.key} className="grid gap-x-4 gap-y-1 py-2 md:grid-cols-[minmax(0,1.4fr)_110px_minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="min-w-0"><div className="font-medium">{m.label}</div><div className="text-[12px] text-(--color-muted)">{m.explain}</div></div>
                  <div className="text-base font-semibold">{fmt(c, m.unit)}</div>
                  <div className="text-[13px]"><span className="text-(--color-muted)">Best: </span>{withVal[0] ? `${withVal[0].u.name} · ${fmt(withVal[0].m[m.key] as number, m.unit)}` : '—'}</div>
                  <div className="text-[13px]"><span className="text-(--color-muted)">Weakest: </span>{withVal.length > 1 ? `${withVal[withVal.length - 1].u.name} · ${fmt(withVal[withVal.length - 1].m[m.key] as number, m.unit)}` : '—'}</div>
                </li>) })}
            </ul>
          </Section>
        </>
      )}
      <p className="mt-4 text-[12px] text-(--color-faint)">Drill-downs: <Link to="/assessments">assessments</Link> · <Link to="/contracts">impact contracts</Link> · <Link to="/ledger">impact ledger</Link> · <Link to="/governance">impact dashboard</Link>. Figures update as records change; small teams swing quickly.</p>
    </>
  )
}

const NEXT: Record<string, string> = {
  diagnosticCompletion: 'Send reminders from Assessments.', learningProgress: 'Ask learners to finish pre-work modules before the next lab day.', labAttendance: 'Confirm lab check-ins with learners on Lab days.',
  contractActivation: 'Clear pending manager and sponsor approvals on Impact contracts.', evidenceCadence: 'Coach the weekly evidence habit; use Expert Guidance on each contract.', midGateScaleRate: 'Review returned or reset sprints with the coach.',
  decisionDays: 'Decide contracts within five working days of submission.', validatedThb: 'Validate showcase claims waiting in the ledger.', verifiedUplift: 'Make sure showcases are submitted and validated so badges mint.',
  badgesPerLearner: 'Verified badges follow validated showcases and gate decisions.', gatePassRate: 'Strengthen field validation before Gate 1.',
}

function Tile({ label, value, sub, tone, hint }: { label: string; value: string; sub: string; tone?: Tone; hint: string }) {
  const color = tone === 'success' ? 'var(--color-success)' : tone === 'warning' ? 'var(--color-warning)' : tone === 'primary' ? 'var(--color-primary)' : 'var(--color-text)'
  return <div className="surface px-3 py-2.5" title={hint}><div className="text-xs font-medium text-(--color-muted)">{label}</div><div className="text-lg font-semibold leading-tight" style={{ color }}>{value}</div><div className="text-xs text-(--color-faint)">{sub}</div></div>
}
function Bar({ value, max, color, label }: { value: number | null; max: number; color: string; label: string }) {
  const w = value == null ? 0 : Math.max(2, Math.round((value / max) * 100))
  return <div className="flex items-center gap-2"><div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-(--color-page)"><div className="h-full rounded-r-sm" style={{ width: `${w}%`, background: value == null ? 'transparent' : color }} /></div><span className="w-16 shrink-0 text-right text-[12px] tabular-nums">{label}</span></div>
}
