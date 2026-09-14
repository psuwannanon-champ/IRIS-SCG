import { Link } from '@tanstack/react-router'
import { Icon } from '@/icons/Icon'
import { Pill, type Tone } from '@/components/ui'
import type { Task, RecordEvent } from '@/domain/types'
import { ROLE_LABEL } from '@/domain/types'
import { fmtDate, relativeDue } from '@/lib/format'
import type { Snapshot } from '@/data/datasource'
import { personaName } from '@/domain/selectors'

export function TaskRow({ t, wide }: { t: Task; wide?: boolean }) {
  const tone: Tone = t.urgency === 'overdue' ? 'error' : t.urgency === 'due_soon' ? 'warning' : 'neutral'
  const due = t.dueDate ? <Pill tone={tone}>{relativeDue(t.dueDate)}</Pill> : <span className="text-[12px] text-(--color-faint)">No due date</span>
  if (wide) {
    return (
      <li>
        <Link to={t.link} className="row-link table-grid grid-cols-[minmax(0,1fr)_auto] px-3 py-2.5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_130px_130px_80px]">
          <div className="min-w-0">
            <div className="truncate font-medium">{t.title}</div>
            <div className="truncate text-[12px] text-(--color-muted)">{t.status}<span className="xl:hidden"> · Next: {t.nextAction} · {ROLE_LABEL[t.responsibleRole]}</span></div>
          </div>
          <div className="hidden truncate text-[13px] xl:block"><span className="text-(--color-muted)">Next: </span>{t.nextAction}</div>
          <div className="hidden truncate text-[13px] text-(--color-muted) xl:block">{ROLE_LABEL[t.responsibleRole]}</div>
          <div>{due}</div>
          <div className="hidden text-right text-[13px] font-medium text-(--color-accent) xl:block">Open</div>
        </Link>
      </li>
    )
  }
  return (
    <li>
      <Link to={t.link} className="row-link flex items-start justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate font-medium">{t.title}</div>
          <div className="truncate text-[12px] text-(--color-muted)"><span className="text-(--color-text)">Next: {t.nextAction}</span> · {ROLE_LABEL[t.responsibleRole]} · {t.status}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">{due}<Icon name="arrow-right" size={16} className="text-(--color-accent)" /></div>
      </Link>
    </li>
  )
}
export function TaskHeader() {
  return (
    <div className="table-grid hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_130px_130px_80px] px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint) xl:grid">
      <div>Record</div><div>Next action</div><div>Responsible</div><div>Due</div><div className="text-right">Actions</div>
    </div>
  )
}

export function History({ snap, events }: { snap: Snapshot; events: RecordEvent[] }) {
  if (!events.length) return <p className="text-[13px] text-(--color-muted)">No history yet.</p>
  return (
    <ol className="space-y-2">
      {[...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((e) => (
        <li key={e.id} className="flex gap-2 text-[13px]">
          <span className="mt-0.5 text-(--color-faint)"><Icon name="clock" size={14} /></span>
          <div className="min-w-0">
            <div><span className="font-medium">{personaName(snap, e.actorId)}</span> · {e.action.replace(/_/g, ' ')}{e.toStatus && <span className="text-(--color-muted)"> → {e.toStatus.replace(/_/g, ' ')}</span>}</div>
            {e.note && <div className="text-(--color-muted)">{e.note}</div>}
            <div className="text-[12px] text-(--color-faint)">{fmtDate(e.createdAt, true)}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function StatusLegend({ items }: { items: { label: string; tone: Tone }[] }) {
  return <div className="flex flex-wrap gap-1.5">{items.map((i) => <Pill key={i.label} tone={i.tone}>{i.label}</Pill>)}</div>
}

export function Money({ v }: { v: number | null | undefined }) {
  return <span className="tabular-nums">{v == null ? 'Not provided' : `THB ${v.toLocaleString('en-US')}`}</span>
}
