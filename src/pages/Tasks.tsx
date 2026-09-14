import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { selectTasks, taskNavKey } from '@/domain/selectors'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pagination, usePagination, Button } from '@/components/ui'
import { TaskRow, TaskHeader } from '@/components/records'

const GROUPS: [string, string][] = [['', 'All'], ['contracts', 'Impact contracts'], ['briefs', 'Challenge briefs'], ['concepts', 'Concepts & gates'], ['ledger', 'Impact ledger'], ['journey', 'Journey'], ['learning', 'Learning plan'], ['coaching', 'Coaching']]

export function TasksPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const search = useSearch({ strict: false }) as { group?: string; page?: number }
  const nav = useNavigate()
  const [page, setPage] = useState(search.page ?? 1)
  const all = useMemo(() => (snap && actor ? selectTasks(snap, actor) : []), [snap, actor])
  const group = search.group ?? ''
  const filtered = group ? all.filter((t) => taskNavKey(t) === group) : all
  const pg = usePagination(filtered, 10, page, (p) => { setPage(p); nav({ to: '/tasks', search: { group, page: p } as never }) })
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const counts = Object.fromEntries(GROUPS.map(([k]) => [k, k ? all.filter((t) => taskNavKey(t) === k).length : all.length]))
  return (
    <>
      <PageHeader title="My tasks" description={`${all.length} action${all.length === 1 ? '' : 's'} you can take now. Each row names the record, the next action and who is responsible. Acting on the record clears the task.`} />
      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Task area">
        {GROUPS.filter(([k]) => !k || counts[k] > 0).map(([k, label]) => (
          <Button key={k} size="sm" variant={group === k ? 'primary' : 'secondary'} role="tab" aria-selected={group === k} onClick={() => { setPage(1); nav({ to: '/tasks', search: { group: k, page: 1 } as never }) }}>{label} · {counts[k]}</Button>
        ))}
      </div>
      <Section>
        {filtered.length === 0 ? <EmptyState icon="check-circle" title="No tasks in this area" body="Records waiting for someone else are not shown here; see Updates for what changed." /> : (
          <><TaskHeader /><ul className="divide-y divide-(--color-border)">{pg.slice.map((t) => <TaskRow key={t.key} t={t} wide />)}</ul><Pagination {...pg} /></>
        )}
      </Section>
    </>
  )
}
