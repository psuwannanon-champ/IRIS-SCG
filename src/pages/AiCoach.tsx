import { useEffect, useRef, useState } from 'react'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { PageHeader, Section, LoadingBlock, ErrorBlock, Button, Notice, Pill } from '@/components/ui'
import { Icon } from '@/icons/Icon'
import { fmtDate } from '@/lib/format'

const MODES = [['Program navigator', 'Schedule, activities, deliverables and deadline nudges'], ['Activity guide', 'Step-by-step help for impact contracts, field research, gate prep'], ['Content expert', 'Answers grounded in the program content, citing the module'], ['Practice partner', 'Role-plays pitches and customer interviews against the rubric'], ['Progress mirror', 'Flags where you are stuck and briefs your coach and manager']]

export function AiCoachPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [text, setText] = useState('')
  const [lang, setLang] = useState<'th' | 'en'>('en')
  const send = useAction((ds, content: string, l: 'th' | 'en') => ds.sendCoachMessage(actor!.id, content, l))
  const endRef = useRef<HTMLDivElement>(null)
  const msgs = snap && actor ? snap.coachMessages.filter((m) => m.personaId === actor.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : []
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs.length])
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const submit = async () => { const t = text.trim(); if (!t) return; setText(''); await send.mutateAsync([t, lang]) }
  return (
    <>
      <PageHeader title="AI coach" description="Always-on in Thai and English. Answers only from the approved program content and cites the source module." state={<Pill tone="warning" icon="alert-triangle">Simulated</Pill>} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section className="flex min-h-[420px] flex-col p-0">
          <div className="scroll-y flex-1 space-y-3 px-4 py-4" style={{ maxHeight: 460 }} data-tour="ai-coach-thread">
            {msgs.length === 0 && <p className="text-[13px] text-(--color-muted)">Ask about your schedule, the mid-sprint gate, your baseline or how to prepare a pitch.</p>}
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] ${m.sender === 'user' ? 'bg-(--color-accent-soft)' : 'border border-(--color-border) bg-(--color-surface)'}`} lang={m.lang}>
                  {m.sender === 'coach' && <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-primary)"><Icon name="stars-02" size={12} />AI coach</div>}
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {m.citedModuleId && <div className="mt-1 text-[12px] text-(--color-muted)">Source: {snap.learningModules.find((x) => x.id === m.citedModuleId)?.code} · {snap.learningModules.find((x) => x.id === m.citedModuleId)?.title}</div>}
                  <div className="mt-0.5 text-[11px] text-(--color-faint)">{fmtDate(m.createdAt, true)}</div>
                </div>
              </div>
            ))}
            {send.isPending && <div className="text-[13px] text-(--color-muted)">AI coach is preparing a grounded answer…</div>}
            <div ref={endRef} />
          </div>
          <form className="flex items-end gap-2 border-t border-(--color-border) px-3 py-3" onSubmit={(e) => { e.preventDefault(); submit() }}>
            <label className="sr-only" htmlFor="lang">Language</label>
            <select id="lang" className="field-input w-[92px]" value={lang} onChange={(e) => setLang(e.target.value as 'th' | 'en')}><option value="en">English</option><option value="th">ไทย</option></select>
            <label className="sr-only" htmlFor="msg">Message</label>
            <input id="msg" className="field-input flex-1" placeholder={lang === 'th' ? 'ถามเกี่ยวกับโปรแกรมของคุณ…' : 'Ask about your program…'} value={text} onChange={(e) => setText(e.target.value)} />
            <Button type="submit" variant="primary" busy={send.isPending} icon="send-01">Send</Button>
          </form>
        </Section>
        <div className="space-y-4">
          <Section title="What the AI coach does" icon="stars-02"><ul className="space-y-2 text-[13px]">{MODES.map(([t, d]) => <li key={t}><span className="font-medium">{t}:</span> {d}</li>)}</ul></Section>
          <Section title="Guardrails" icon="shield-tick"><ul className="list-disc space-y-1 pl-4 text-[13px]"><li>Answers only from the approved content universe (retrieval-grounded).</li><li>PDPA-compliant; human in the loop for career decisions.</li><li>Content accumulates across every program a learner attends.</li></ul></Section>
          <Notice tone="warning" icon="alert-triangle">Prototype: replies come from a fixed program-grounded script and are saved to your history. No live AI service is connected.</Notice>
        </div>
      </div>
    </>
  )
}
