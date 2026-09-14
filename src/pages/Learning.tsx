import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Button } from '@/components/ui'
import type { LearningPlanItem } from '@/domain/types'

const FORMAT: Record<string, string> = { micro_video: 'Micro video', reading: 'Reading', exercise: 'Exercise', simulation: 'Simulation' }

export function LearningPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const update = useAction((ds, id: string, s: LearningPlanItem['status']) => ds.updateLearningItem(actor!.id, id, s))
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const enrollments = snap.enrollments.filter((e) => e.personaId === actor.id)
  return (
    <>
      <PageHeader title="Learning plan" description="Your personal micro-learning path, selected by the personalisation engine from your diagnostic: which modules, in what order, and what to skip. Complete modules before the labs; status persists." />
      {enrollments.length === 0 && <EmptyState icon="book-open-01" title="No learning plan" body="A plan is built after your diagnostic." />}
      {enrollments.map((e) => {
        const cohort = snap.cohorts.find((c) => c.id === e.cohortId)!
        const plan = snap.learningPlanItems.filter((p) => p.enrollmentId === e.id).sort((a, b) => a.sequence - b.sequence)
        const done = plan.filter((p) => p.status === 'completed').length
        const minutes = plan.filter((p) => p.status !== 'skipped').reduce((a, p) => a + (snap.learningModules.find((m) => m.id === p.moduleId)?.durationMin ?? 0), 0)
        return (
          <Section key={e.id} title={cohort.name} icon="book-open-01" description={`${done} of ${plan.length} modules completed · about ${Math.round(minutes / 60 * 10) / 10} hours in total`} className="mb-4">
            {plan.length === 0 ? <EmptyState icon="target-04" title="Path not built yet" body="Run your diagnostic on My journey to build the personal path." /> : (
              <ol className="divide-y divide-(--color-border)" data-tour="learning-plan">
                {plan.map((p) => { const m = snap.learningModules.find((x) => x.id === p.moduleId)!; const sk = snap.skills.find((s) => s.id === m.skillId)!; return (
                  <li key={p.id} className="table-grid grid-cols-[28px_minmax(0,1fr)_auto] py-2.5 sm:grid-cols-[28px_minmax(0,2fr)_minmax(0,1.4fr)_120px_190px]">
                    <div className="text-[13px] text-(--color-faint)">{p.sequence}</div>
                    <div className="min-w-0"><div className="truncate font-medium">{m.code} · {m.title}</div><div className="truncate text-[12px] text-(--color-muted)">{sk.name}{m.variant ? ` · ${m.variant}` : ''} · {FORMAT[m.format]} · {m.durationMin} min</div></div>
                    <div className="hidden truncate text-[12px] text-(--color-muted) sm:block" title={p.reason ?? ''}>{p.reason ?? 'Selected by the engine'}</div>
                    <div><Pill tone={p.status === 'completed' ? 'success' : p.status === 'in_progress' ? 'info' : p.status === 'skipped' ? 'neutral' : 'warning'}>{p.status.replace('_', ' ')}</Pill></div>
                    <div className="col-span-3 flex flex-wrap gap-1 sm:col-span-1 sm:justify-end">
                      {p.status === 'planned' && <Button size="sm" onClick={() => update.mutate([p.id, 'in_progress'])}>Start</Button>}
                      {p.status === 'in_progress' && <Button size="sm" variant="primary" onClick={() => update.mutate([p.id, 'completed'])}>Mark completed</Button>}
                      {['planned', 'in_progress'].includes(p.status) && <Button size="sm" variant="ghost" onClick={() => update.mutate([p.id, 'skipped'])}>Skip</Button>}
                      {p.status === 'skipped' && <Button size="sm" variant="ghost" onClick={() => update.mutate([p.id, 'planned'])}>Restore</Button>}
                    </div>
                  </li>) })}
              </ol>
            )}
          </Section>
        )
      })}
    </>
  )
}
