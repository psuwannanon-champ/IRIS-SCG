import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { requestGuidance, buildCoachContext, GuidanceUnavailable, type CoachOutput } from '@/features/guidance/api'
import { PageHeader, Section, LoadingBlock, ErrorBlock, Button, Notice, Pill } from '@/components/ui'
import { Icon } from '@/icons/Icon'
import { fmtDate } from '@/lib/format'

const MODES = [['Program navigator', 'Schedule, activities, deliverables and deadline nudges'], ['Activity guide', 'Step-by-step help for impact contracts, field research, gate prep'], ['Content expert', 'Answers grounded in the program content, citing the module'], ['Practice partner', 'Role-plays pitches and customer interviews against the rubric'], ['Progress mirror', 'Flags where you are stuck and briefs your coach and manager']]

export function AiCoachPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [text, setText] = useState('')
  const [lang, setLang] = useState<'th' | 'en'>('en')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const append = useAction((ds, content: string, l: 'th' | 'en', reply: string, moduleId: string | null) => ds.appendCoachExchange(actor!.id, content, l, reply, moduleId))
  const fallback = useAction((ds, content: string, l: 'th' | 'en') => ds.sendCoachMessage(actor!.id, content, l))
  const endRef = useRef<HTMLDivElement>(null)
  const msgs = snap && actor ? snap.coachMessages.filter((m) => m.personaId === actor.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : []
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs.length, pending])
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const submit = async () => {
    const t = text.trim(); if (!t || pending) return
    setText(''); setPending(true); setNotice(null)
    try {
      const r = await requestGuidance<CoachOutput>({ kind: 'coach', context: buildCoachContext(snap, actor), question: t, lang })
      const moduleId = r.output.citedModuleCode ? snap.learningModules.find((m) => m.code === r.output.citedModuleCode)?.id ?? null : null
      await append.mutateAsync([t, lang, r.output.reply, moduleId])
      if (r.output.flagForHumanCoach) setNotice(`Flagged for your human coach: ${r.output.flagForHumanCoach}`)
    } catch (e) {
      if (e instanceof GuidanceUnavailable) { setNotice(`${e.message} A scripted answer was used instead.`); await fallback.mutateAsync([t, lang]) }
      else setNotice((e as Error).message)
    } finally { setPending(false) }
  }
  return (
    <>
      <PageHeader title="Expert Guidance" description="Always-on coach in Thai and English, grounded in the program content and your own records: it navigates the program, guides each activity, answers content questions with the source module, rehearses pitches and mirrors your progress." state={<Pill tone="accent" icon="stars-02">Powered by Claude</Pill>} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section className="flex min-h-[420px] flex-col p-0">
          <div className="scroll-y flex-1 space-y-3 px-4 py-4" style={{ maxHeight: 460 }} data-tour="ai-coach-thread">
            {msgs.length === 0 && <p className="text-[13px] text-(--color-muted)">Ask about your schedule, the mid-sprint gate, your baseline, or rehearse a pitch.</p>}
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] ${m.sender === 'user' ? 'bg-(--color-accent-soft)' : 'border border-(--color-border) bg-(--color-surface)'}`} lang={m.lang}>
                  {m.sender === 'coach' && <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-primary)"><Icon name="stars-02" size={12} />Expert Guidance</div>}
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {m.citedModuleId && <div className="mt-1 text-[12px] text-(--color-muted)">Source: {snap.learningModules.find((x) => x.id === m.citedModuleId)?.code} · {snap.learningModules.find((x) => x.id === m.citedModuleId)?.title} · <Link to="/learning">open in learning plan</Link></div>}
                  <div className="mt-0.5 text-[11px] text-(--color-faint)">{fmtDate(m.createdAt, true)}</div>
                </div>
              </div>
            ))}
            {pending && <div className="flex items-center gap-2 text-[13px] text-(--color-muted)"><Icon name="stars-02" size={14} />Reading your journey and the program content…</div>}
            <div ref={endRef} />
          </div>
          {notice && <div className="px-3 pb-2"><Notice tone="warning" icon="alert-triangle">{notice}</Notice></div>}
          <form className="flex items-end gap-2 border-t border-(--color-border) px-3 py-3" onSubmit={(e) => { e.preventDefault(); submit() }}>
            <label className="sr-only" htmlFor="lang">Language</label>
            <select id="lang" className="field-input w-[92px]" value={lang} onChange={(e) => setLang(e.target.value as 'th' | 'en')}><option value="en">English</option><option value="th">ไทย</option></select>
            <label className="sr-only" htmlFor="msg">Message</label>
            <input id="msg" className="field-input flex-1" placeholder={lang === 'th' ? 'ถามเกี่ยวกับโปรแกรมของคุณ…' : 'Ask about your program…'} value={text} onChange={(e) => setText(e.target.value)} />
            <Button type="submit" variant="primary" busy={pending} icon="send-01">Send</Button>
          </form>
        </Section>
        <div className="space-y-4">
          <Section title="What Expert Guidance does" icon="stars-02"><ul className="space-y-2 text-[13px]">{MODES.map(([t, d]) => <li key={t}><span className="font-medium">{t}:</span> {d}</li>)}</ul></Section>
          <Section title="Where else it appears" icon="route"><ul className="list-disc space-y-1 pl-4 text-[13px]"><li><Link to="/assessment">Assessment</Link>: maps your gaps and builds the personal path.</li><li><Link to="/journey">My journey</Link>: weekly priorities, coaching points, application to role and project.</li><li>Impact contract: evidence review before the gate or showcase.</li><li>Coaching workspace: clinic briefing for the human coach.</li></ul></Section>
          <Section title="Guardrails" icon="shield-tick"><ul className="list-disc space-y-1 pl-4 text-[13px]"><li>Answers only from the approved program content and your own records; every answer cites the module it relied on.</li><li>Career, reward and promotion decisions stay with people; guidance is advisory.</li><li>The model key stays on the server; the browser never holds it. PDPA review is required before production data is used.</li></ul></Section>
        </div>
      </div>
    </>
  )
}
