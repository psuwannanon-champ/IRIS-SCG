import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { personaName } from '@/domain/selectors'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Button, Stat, Pagination, paginate } from '@/components/ui'
import { fmtDate, pct } from '@/lib/format'
import type { Enrollment, Persona } from '@/domain/types'

export function AssessmentsPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const search = useSearch({ strict: false }) as { status?: string; page?: number; program?: string }
  const nav = useNavigate()
  const [sent, setSent] = useState<Record<string, boolean>>({})
  const remind = useAction((ds, enrollmentId: string) => ds.remindAssessment(actor!.id, enrollmentId), 'Reminder sent to the learner.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const inScope = (e: Enrollment, p: Persona) => {
    switch (actor.role) {
      case 'line_manager': return p.managerId === actor.id
      case 'bu_sponsor': return p.buId === actor.buId || e.sponsorId === actor.id
      case 'coach': return e.coachId === actor.id
      default: return true
    }
  }
  const rows = snap.enrollments.map((e) => { const p = snap.personas.find((x) => x.id === e.personaId)!; const dx = snap.diagnostics.find((d) => d.enrollmentId === e.id); const c = snap.cohorts.find((x) => x.id === e.cohortId)!; const items = dx ? snap.diagnosticItems.filter((i) => i.diagnosticId === dx.id && i.priorityRank != null).sort((a, b) => a.priorityRank! - b.priorityRank!) : []; const assessment = snap.assessments.filter((a) => a.enrollmentId === e.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]; return { e, p, dx, c, items, assessment, done: dx?.status === 'completed' } }).filter((r) => inScope(r.e, r.p) && r.e.status !== 'withdrawn')
  const filtered = rows.filter((r) => (!search.status || (search.status === 'completed' ? r.done : !r.done)) && (!search.program || r.c.id === search.program))
  const sorted = [...filtered].sort((a, b) => Number(a.done) - Number(b.done) || a.c.startDate.localeCompare(b.c.startDate))
  const pg = paginate(sorted, 10, search.page ?? 1, (p) => nav({ to: '/assessments', search: { ...search, page: p } as never }))
  const completed = rows.filter((r) => r.done).length
  const setS = (patch: Record<string, unknown>) => nav({ to: '/assessments', search: { status: search.status ?? '', program: search.program ?? '', page: 1, ...patch } as never })
  const waves = snap.cohorts.filter((c) => rows.some((r) => r.c.id === c.id)).map((c) => { const w = rows.filter((r) => r.c.id === c.id); return { c, total: w.length, done: w.filter((r) => r.done).length } })
  return (
    <>
      <PageHeader title="Assessments" description="Org-wide AI skill assessment run in waves by cohort, starting with CBM and CAFI. Each learner completes the diagnostic themselves; Expert Guidance turns it into a gap map and personal path. Learners who have not completed appear first." />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Completion in your scope" value={`${pct(completed, rows.length)}%`} hint={`${completed} of ${rows.length} learners completed`} onClick={() => setS({ status: '' })} tone="primary" />
        <Stat label="Pending diagnostics" value={rows.length - completed} hint="Send a reminder from the list" onClick={() => setS({ status: 'pending' })} />
        <Stat label="Assessment waves" value={waves.length} hint="Cohorts with enrolled learners" onClick={() => document.getElementById('waves')?.scrollIntoView({ behavior: 'smooth' })} />
      </div>
      <Section id="waves" className="mt-4" title="Waves by cohort" icon="calendar" description="Baseline the organisation in waves; passport from day one.">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {waves.map((w) => (
            <li key={w.c.id}><button type="button" className="surface brand-ring w-full rounded-lg px-3 py-2.5 text-left" data-selected={search.program === w.c.id} onClick={() => setS({ program: search.program === w.c.id ? '' : w.c.id })}>
              <div className="truncate text-[13px] font-medium">{w.c.name}</div>
              <div className="text-[12px] text-(--color-muted)">{w.c.code} · diagnostic window from {fmtDate(w.c.keyDates.find((k) => /diagnos/i.test(k.label))?.date ?? w.c.startDate)}</div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-(--color-border)"><div className="h-full bg-(--color-primary)" style={{ width: `${pct(w.done, w.total)}%` }} /></div>
              <div className="mt-0.5 text-[12px]">{w.done} of {w.total} completed</div>
            </button></li>
          ))}
        </ul>
      </Section>
      <div className="mb-3 mt-4 flex flex-wrap items-center gap-2">
        <select aria-label="Status" className="field-input max-w-[200px]" value={search.status ?? ''} onChange={(e) => setS({ status: e.target.value })}><option value="">All learners</option><option value="pending">Not completed</option><option value="completed">Completed</option></select>
        {search.program && <Button size="sm" variant="ghost" onClick={() => setS({ program: '' })}>Clear cohort filter</Button>}
        <span className="text-[13px] text-(--color-muted)">{filtered.length} of {rows.length}</span>
      </div>
      <Section>
        {sorted.length === 0 ? <EmptyState icon="clipboard-check" title="No learners match" /> : (
          <>
            <div className="table-grid hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_150px_minmax(0,1.8fr)_150px] px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint) xl:grid"><div>Learner</div><div>Cohort</div><div>Status</div><div>Priority gaps</div><div className="text-right">Actions</div></div>
            <ul className="divide-y divide-(--color-border)">
              {pg.slice.map((r) => (
                <li key={r.e.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] px-2 py-2.5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_150px_minmax(0,1.8fr)_150px]">
                  <div className="min-w-0"><Link to="/passport" search={{ persona: r.p.id } as never} className="block truncate font-medium">{r.p.fullName}</Link><div className="truncate text-[12px] text-(--color-muted)">{r.p.jobTitle} · {snap.businessUnits.find((b) => b.id === r.p.buId)?.code}</div></div>
                  <div className="hidden text-[13px] xl:block">{r.c.code}<div className="text-[12px] text-(--color-muted)">coach {personaName(snap, r.e.coachId)}</div></div>
                  <div>{r.done ? <Pill tone="success">Completed {fmtDate(r.dx!.completedAt)}</Pill> : r.assessment ? <Pill tone="info">Submitted, awaiting result</Pill> : <Pill tone="warning">Not completed</Pill>}</div>
                  <div className="hidden flex-wrap gap-1 xl:flex">{r.items.slice(0, 3).map((i) => <Pill key={i.id} tone="primary" title={snap.skills.find((s) => s.id === i.skillId)?.name}>{snap.skills.find((s) => s.id === i.skillId)?.code} L{i.currentLevel || '–'}→{i.targetLevel}</Pill>)}{r.done && r.items.length === 0 && <span className="text-[12px] text-(--color-faint)">No priority gaps recorded</span>}</div>
                  <div className="col-span-2 flex justify-start gap-1 xl:col-span-1 xl:justify-end">
                    {r.done ? <Link to="/passport" search={{ persona: r.p.id } as never} className="btn btn-secondary btn-sm">View passport</Link> : <Button size="sm" variant="primary" icon="bell-01" disabled={!!sent[r.e.id]} busy={remind.isPending && remind.variables?.[0] === r.e.id} onClick={async () => { await remind.mutateAsync([r.e.id]); setSent({ ...sent, [r.e.id]: true }) }}>{sent[r.e.id] ? 'Reminder sent' : 'Send reminder'}</Button>}
                  </div>
                </li>
              ))}
            </ul>
            <Pagination {...pg} />
          </>
        )}
      </Section>
    </>
  )
}
