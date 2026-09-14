import { useState } from 'react'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { requestGuidance, type AdviceOutput } from '@/features/guidance/api'
import { Section, Button, Notice, Pill } from '@/components/ui'
import { Icon } from '@/icons/Icon'
import { fmtDate } from '@/lib/format'
import type { GuidanceKind } from '@/domain/types'
import { personaName } from '@/domain/selectors'

/** Shows the latest saved Expert Guidance for a person + context and lets an authorised person request a fresh one. */
export function GuidancePanel({ personaId, kind, contextId, buildContext, title, description, canRequest, tour }: { personaId: string; kind: GuidanceKind; contextId: string | null; buildContext: () => unknown; title: string; description: string; canRequest: boolean; tour?: string }) {
  const { snap, actor } = useActor()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const save = useAction((ds, content: unknown, model: string) => ds.saveGuidance(actor!.id, personaId, kind, contextId, content, model), 'Expert Guidance saved.')
  if (!snap || !actor) return null
  const notes = snap.guidanceNotes.filter((n) => n.personaId === personaId && n.kind === kind && (n.contextId ?? null) === contextId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const latest = notes[0]
  const content = latest?.content as AdviceOutput | undefined
  const run = async () => {
    setBusy(true); setError(null)
    try {
      const r = await requestGuidance<AdviceOutput>({ kind, context: buildContext() })
      await save.mutateAsync([r.output, r.model])
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Section title={title} icon="stars-02" description={description} tour={tour}
      actions={canRequest && <Button variant="primary" icon="stars-02" busy={busy} onClick={run}>{latest ? 'Refresh guidance' : 'Get Expert Guidance'}</Button>}>
      {error && <div className="mb-3"><Notice tone="error" icon="alert-circle">{error}</Notice></div>}
      {busy && <p className="text-[13px] text-(--color-muted)">Expert Guidance is reading the diagnostic, contract, evidence and calendar…</p>}
      {!latest && !busy && <p className="text-[13px] text-(--color-muted)">{canRequest ? 'No guidance yet. Request it to get three priorities for the week, coaching points and how to apply the skills in role and project.' : 'No guidance has been requested for this record yet.'}</p>}
      {content && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-(--color-faint)"><Pill tone="accent" icon="stars-02">Expert Guidance</Pill><span>{fmtDate(latest.createdAt, true)} · requested by {personaName(snap, latest.createdBy)} · {latest.model}</span></div>
          <p className="font-medium">{content.headline}</p>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Priorities this week</div>
            <ol className="space-y-2">{content.priorities.map((p, i) => <li key={i} className="surface p-3"><div className="font-medium">{i + 1}. {p.title}</div><div className="text-[13px] text-(--color-muted)">{p.why}</div><div className="mt-1 flex items-start gap-1.5 text-[13px]"><span className="mt-0.5 text-(--color-primary)"><Icon name="arrow-right" size={14} /></span>{p.action}</div></li>)}</ol>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Block title="Application to role" icon="user-01" items={content.applicationToRole} />
            <Block title="Application to project" icon="rocket-01" items={content.applicationToProject} />
            <Block title="Coaching points for the next clinic" icon="message-chat-circle" items={content.coachingPoints} />
            <Block title="Risks to watch" icon="alert-triangle" items={content.risks} />
          </div>
          <p className="text-[12px] text-(--color-faint)">Guidance is generated from the records shown on this page. It informs the learner, coach and manager; it is not an HR decision.</p>
        </div>
      )}
    </Section>
  )
}
function Block({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  if (!items?.length) return null
  return <div><div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-(--color-faint)"><Icon name={icon} size={13} />{title}</div><ul className="list-disc space-y-1 pl-4 text-[13px]">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
}
