import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pagination, paginate, Button } from '@/components/ui'
import { fmtDate } from '@/lib/format'

export function NotificationsPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [page, setPage] = useState(1)
  const markRead = useAction((ds, id: string) => ds.markNotificationRead(actor!.id, id))
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const items = snap.notifications.filter((n) => n.personaId === actor.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const unread = items.filter((n) => !n.readAt)
  const pg = paginate(items, 10, page, setPage)
  return (
    <>
      <PageHeader title="Updates" description={`${unread.length} unread. Updates tell you what other roles did on records connected to you. Reading an update does not complete a task; your actions are under My tasks.`}
        actions={unread.length > 0 && <Button size="sm" onClick={async () => { for (const n of unread) await markRead.mutateAsync([n.id]) }}>Mark all as read</Button>} />
      <Section>
        {items.length === 0 ? <EmptyState icon="bell-01" title="No updates yet" /> : (
          <>
            <ul className="divide-y divide-(--color-border)">
              {pg.slice.map((n) => (
                <li key={n.id} className="table-grid grid-cols-[12px_minmax(0,1fr)_auto] py-2.5">
                  <span className={`h-2 w-2 rounded-full ${n.readAt ? 'bg-transparent' : 'bg-(--color-accent)'}`} aria-label={n.readAt ? 'Read' : 'Unread'} />
                  <div className="min-w-0"><div className="font-medium leading-snug">{n.title}</div><div className="text-[13px] text-(--color-muted)">{n.body}</div><div className="text-[12px] text-(--color-faint)">{fmtDate(n.createdAt, true)}</div></div>
                  <div className="flex items-center gap-1">
                    {n.link && <Link to={n.link} className="btn btn-secondary btn-sm" onClick={() => { if (!n.readAt) markRead.mutate([n.id]) }}>Open record</Link>}
                    {!n.readAt && <Button size="sm" variant="ghost" onClick={() => markRead.mutate([n.id])}>Mark read</Button>}
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
