import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { MODULE_FORMAT_GUIDE } from '@/data/labs-content'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Button, Dialog, Field, Notice } from '@/components/ui'
import type { LearningPlanItem } from '@/domain/types'

const FORMAT: Record<string, string> = { micro_video: 'Micro video', reading: 'Reading', exercise: 'Exercise', simulation: 'Simulation' }

export function LearningPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [open, setOpen] = useState<LearningPlanItem | null>(null)
  const [answer, setAnswer] = useState('')
  const update = useAction((ds, id: string, s: LearningPlanItem['status']) => ds.updateLearningItem(actor!.id, id, s))
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const enrollments = snap.enrollments.filter((e) => e.personaId === actor.id)
  return (
    <>
      <PageHeader title="Learning plan" description="Your personal micro-learning path, selected by Expert Guidance from your diagnostic: which modules, in what order, and what to skip. Open a module to study it and mark it complete; finish the pre-work before each lab day." actions={<Link to="/labs" className="btn btn-secondary">Lab days</Link>} />
      {enrollments.length === 0 && <EmptyState icon="book-open-01" title="No learning plan" body="A plan is built after your diagnostic." />}
      {enrollments.map((e) => {
        const cohort = snap.cohorts.find((c) => c.id === e.cohortId)!
        const plan = snap.learningPlanItems.filter((p) => p.enrollmentId === e.id).sort((a, b) => a.sequence - b.sequence)
        const done = plan.filter((p) => p.status === 'completed').length
        const minutes = plan.filter((p) => p.status !== 'skipped').reduce((a, p) => a + (snap.learningModules.find((m) => m.id === p.moduleId)?.durationMin ?? 0), 0)
        return (
          <Section key={e.id} title={cohort.name} icon="book-open-01" description={`${done} of ${plan.length} modules completed · about ${Math.round(minutes / 60 * 10) / 10} hours in total`} className="mb-4">
            {plan.length === 0 ? <EmptyState icon="target-04" title="Path not built yet" body="Complete the assessment to build your personal path." action={<Link to="/assessment" className="btn btn-primary btn-sm">Start assessment</Link>} /> : (
              <ol className="divide-y divide-(--color-border)" data-tour="learning-plan">
                {plan.map((p) => { const m = snap.learningModules.find((x) => x.id === p.moduleId)!; const sk = snap.skills.find((s) => s.id === m.skillId)!; return (
                  <li key={p.id} className="table-grid grid-cols-[28px_minmax(0,1fr)_auto] py-2.5 sm:grid-cols-[28px_minmax(0,2fr)_minmax(0,1.4fr)_120px_190px]">
                    <div className="text-[13px] text-(--color-faint)">{p.sequence}</div>
                    <div className="min-w-0"><button type="button" className="block max-w-full truncate text-left font-medium text-(--color-accent) hover:text-(--color-primary)" onClick={() => { setAnswer(''); setOpen(p) }}>{m.code} · {m.title}</button><div className="truncate text-[12px] text-(--color-muted)">{sk.name}{m.variant ? ` · ${m.variant}` : ''} · {FORMAT[m.format]} · {m.durationMin} min</div></div>
                    <div className="hidden truncate text-[12px] text-(--color-muted) sm:block" title={p.reason ?? ''}>{p.reason ?? 'Selected by Expert Guidance'}</div>
                    <div><Pill tone={p.status === 'completed' ? 'success' : p.status === 'in_progress' ? 'info' : p.status === 'skipped' ? 'neutral' : 'warning'}>{p.status.replace('_', ' ')}</Pill></div>
                    <div className="col-span-3 flex flex-wrap gap-1 sm:col-span-1 sm:justify-end">
                      {['planned', 'in_progress'].includes(p.status) && <Button size="sm" variant="primary" onClick={() => { setAnswer(''); setOpen(p) }}>Open module</Button>}
                      {['planned', 'in_progress'].includes(p.status) && <Button size="sm" variant="ghost" onClick={() => update.mutate([p.id, 'skipped'])}>Skip</Button>}
                      {p.status === 'skipped' && <Button size="sm" variant="ghost" onClick={() => update.mutate([p.id, 'planned'])}>Restore</Button>}
                      {p.status === 'completed' && <Button size="sm" variant="ghost" onClick={() => { setAnswer(''); setOpen(p) }}>Review</Button>}
                    </div>
                  </li>) })}
              </ol>
            )}
          </Section>
        )
      })}
      {open && (() => { const m = snap.learningModules.find((x) => x.id === open.moduleId)!; const sk = snap.skills.find((s) => s.id === m.skillId)!; const dom = snap.skillDomains.find((d) => d.id === sk.domainId); const guide = MODULE_FORMAT_GUIDE[m.format]; const dx = snap.diagnostics.find((d) => d.enrollmentId === open.enrollmentId); const item = dx ? snap.diagnosticItems.find((i) => i.diagnosticId === dx.id && i.skillId === sk.id) : null; return (
        <Dialog open onClose={() => setOpen(null)} title={`${m.code} · ${m.title}`} subtitle={`${dom?.name} · ${FORMAT[m.format]} · ${m.durationMin} min${m.variant ? ` · ${m.variant}` : ''}`} width={720}
          footer={<><Button variant="ghost" onClick={() => setOpen(null)}>Close</Button>{open.status !== 'completed' && <>{open.status === 'planned' && <Button onClick={async () => { await update.mutateAsync([open.id, 'in_progress']); setOpen({ ...open, status: 'in_progress' }) }}>Start</Button>}<Button variant="primary" busy={update.isPending} disabled={!answer.trim()} onClick={async () => { await update.mutateAsync([open.id, 'completed']); setOpen(null) }}>Mark completed</Button></>}</>}>
          <div className="space-y-4 text-[13px]">
            <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Why this module is in your path</div><p>{open.reason ?? 'Selected by Expert Guidance.'}{item ? ` Your diagnostic: ${item.currentLevel ? `Level ${item.currentLevel}` : 'not assessed'} → target Level ${item.targetLevel}${item.priorityRank ? ` (priority ${item.priorityRank})` : ''}.` : ''}</p></div>
            <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Learning objective</div><p>{sk.description} After this module you can work at: {sk.levelDescriptors[Math.min(3, Math.max(0, (item?.targetLevel ?? 2) - 1))]}</p></div>
            <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Key points</div><ul className="list-disc pl-4"><li>{sk.levelDescriptors[0]}</li><li>{sk.levelDescriptors[1]}</li><li>{sk.levelDescriptors[2]}</li></ul></div>
            <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">How to study it</div><p>{guide.how}</p></div>
            <Notice tone="info" icon="stars-02">Stuck? Ask <Link to="/ai-coach">Expert Guidance</Link> to explain this module with an example from your own role.</Notice>
            {open.status !== 'completed' && <Field label={`Check: ${guide.check}`} required hint="Required to mark the module complete. Your coach can see it.">{(id) => <textarea id={id} className="field-input" rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} data-autofocus />}</Field>}
            <p className="text-[12px] text-(--color-faint)">Module content in the prototype is generated from the taxonomy; production modules are authored per BU (for example B2B versus B2B2C variants).</p>
          </div>
        </Dialog>) })()}
    </>
  )
}
