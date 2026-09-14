import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { knowledgeQuestions, SELF_RATING_OPTIONS } from '@/data/assessment-content'
import { skillsForProgram } from '@/domain/selectors'
import { requestGuidance, buildDiagnosticContext, toDiagnosticResult, type DiagnosticOutput } from '@/features/guidance/api'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Button, Field, Notice, Pill } from '@/components/ui'
import type { AssessmentResponses, DiagnosticResult } from '@/domain/types'
import { useT } from '@/app/i18n'

const STEPS = ['Self-rating', 'Knowledge check', 'Your role context', 'Expert Guidance result']

export function AssessmentPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const nav = useNavigate()
  const t = useT()
  const [step, setStep] = useState(0)
  const [selfRatings, setSelfRatings] = useState<Record<string, number | null>>({})
  const [knowledge, setKnowledge] = useState<Record<string, number>>({})
  const [ctx, setCtx] = useState({ roleFocus: '', currentInitiatives: '', biggestChallenge: '', preferredFormat: 'mixed' as AssessmentResponses['preferredFormat'] })
  const [errText, setErrText] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ output: DiagnosticOutput; mapped: DiagnosticResult; model: string } | null>(null)
  const submitAssessment = useAction((ds, enrollmentId: string, responses: AssessmentResponses) => ds.submitAssessment(actor!.id, enrollmentId, responses))
  const complete = useAction((ds, enrollmentId: string, r: DiagnosticResult) => ds.completeDiagnostic(actor!.id, enrollmentId, r), 'Diagnostic completed. Your personal learning path is ready.')
  const saveGuidance = useAction((ds, content: unknown, model: string) => ds.saveGuidance(actor!.id, actor!.id, 'diagnostic', enrollment?.id ?? null, content, model))
  const simulated = useAction((ds, enrollmentId: string) => ds.runDiagnostic(actor!.id, enrollmentId), 'Simulated diagnostic completed.')

  const enrollment = useMemo(() => snap && actor ? snap.enrollments.find((e) => e.personaId === actor.id && !['graduated', 'withdrawn'].includes(e.status) && (snap.diagnostics.find((d) => d.enrollmentId === e.id)?.status ?? 'pending') === 'pending') ?? null : null, [snap, actor])
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  if (!enrollment) {
    const done = snap.enrollments.some((e) => e.personaId === actor.id)
    return (<><PageHeader title="Assessment" description="The AI skill diagnostic that starts every journey." /><EmptyState icon="clipboard-check" title={done ? 'Your diagnostic is already complete' : 'No program to assess for'} body={done ? 'Your gap map and personal path are on My journey. Re-assessment happens at the next program intake.' : 'The program office invites learners to cohorts; the assessment opens once you are enrolled.'} action={<Link to="/journey" className="btn btn-secondary">Open my journey</Link>} /></>)
  }
  const cohort = snap.cohorts.find((c) => c.id === enrollment.cohortId)!
  const skills = skillsForProgram(snap, cohort.program)
  const questions = knowledgeQuestions.filter((q) => q.program === cohort.program)
  const responses: AssessmentResponses = { selfRatings, knowledge, ...ctx }
  const ratedAll = skills.every((k) => k.id in selfRatings)
  const answeredAll = questions.every((q) => q.id in knowledge)

  const runDiagnostic = async () => {
    setBusy(true); setErrText(null)
    try {
      await submitAssessment.mutateAsync([enrollment.id, responses])
      const r = await requestGuidance<DiagnosticOutput>({ kind: 'diagnostic', context: buildDiagnosticContext(snap, actor, enrollment, responses) })
      setResult({ output: r.output, mapped: toDiagnosticResult(snap, r.output), model: r.model })
      setStep(3)
    } catch (e) { setErrText((e as Error).message) } finally { setBusy(false) }
  }
  const accept = async () => {
    if (!result) return
    setBusy(true)
    try {
      await complete.mutateAsync([enrollment.id, result.mapped])
      await saveGuidance.mutateAsync([result.output, result.model])
      nav({ to: '/journey' })
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader kicker={cohort.name} title={t('AI skill diagnostic')} description="About 20 minutes. Rate yourself on the critical skills, answer a short knowledge check and describe your role context. Expert Guidance then maps your gaps, ranks priorities by skill gap × role relevance × project need, and builds your personal micro-learning path." />
      <ol className="mb-4 flex flex-wrap gap-1.5" aria-label="Steps">{STEPS.map((s, i) => <li key={s}><Pill tone={i === step ? 'primary' : i < step ? 'success' : 'neutral'}>{i + 1}. {s}</Pill></li>)}</ol>

      {step === 0 && (
        <Section title="Self-rating" icon="user-check-01" description="Levels: 1 Aware · 2 Practising · 3 Proficient · 4 Leading. Choose Not sure when you have no basis; it is never read as zero ability." tour="assessment-self">
          <ul className="divide-y divide-(--color-border)">
            {skills.map((k) => (
              <li key={k.id} className="grid gap-2 py-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
                <div className="min-w-0"><div className="font-medium">{k.code} · {k.name}</div><div className="text-[13px] text-(--color-muted)">{k.description}</div></div>
                <fieldset className="flex flex-wrap gap-1.5"><legend className="sr-only">{k.name} level</legend>
                  {SELF_RATING_OPTIONS.map((o) => { const sel = k.id in selfRatings && selfRatings[k.id] === o.value; return (
                    <label key={String(o.value)} title={o.hint} className={`surface brand-ring cursor-pointer rounded-md px-2.5 py-1.5 text-[13px] ${sel ? 'bg-(--color-primary-soft) font-medium' : ''}`} data-selected={sel}>
                      <input type="radio" name={`sr-${k.id}`} className="sr-only" checked={sel} onChange={() => setSelfRatings({ ...selfRatings, [k.id]: o.value })} />{o.value ?? '?'} {o.label}
                    </label>) })}
                </fieldset>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between gap-2"><span className="text-[13px] text-(--color-muted)">{Object.keys(selfRatings).length} of {skills.length} rated</span><Button variant="primary" disabled={!ratedAll} onClick={() => setStep(1)}>Continue to knowledge check</Button></div>
        </Section>
      )}

      {step === 1 && (
        <Section title="Knowledge check" icon="clipboard-check" description="One question per domain. Answers are compared with the correct option to infer your current level.">
          <ol className="space-y-4">
            {questions.map((q, i) => (
              <li key={q.id} className="surface p-3">
                <div className="font-medium">{i + 1}. {q.question}</div>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {q.options.map((opt, oi) => { const sel = knowledge[q.id] === oi; return <label key={oi} className={`brand-ring cursor-pointer rounded-md border border-(--color-border) px-2.5 py-1.5 text-[13px] ${sel ? 'bg-(--color-primary-soft)' : ''}`} data-selected={sel}><input type="radio" name={q.id} className="mr-1.5" checked={sel} onChange={() => setKnowledge({ ...knowledge, [q.id]: oi })} />{opt}</label> })}
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex items-center justify-between gap-2"><Button variant="ghost" onClick={() => setStep(0)}>Back</Button><Button variant="primary" disabled={!answeredAll} onClick={() => setStep(2)}>Continue to role context</Button></div>
        </Section>
      )}

      {step === 2 && (
        <Section title="Your role context" icon="briefcase-01" description="Expert Guidance uses this to weight skills by role relevance and project need.">
          <div className="space-y-4">
            <Notice tone="info" icon="info-circle">Prefilled from your talent profile: {actor.jobTitle}, {snap.businessUnits.find((b) => b.id === actor.buId)?.name}. Career aspiration: {actor.careerAspiration ?? 'not provided'}.</Notice>
            <Field label="What does your role focus on in the next six months?" required>{(id) => <textarea id={id} className="field-input" rows={3} value={ctx.roleFocus} onChange={(e) => setCtx({ ...ctx, roleFocus: e.target.value })} data-autofocus />}</Field>
            <Field label="Live initiatives or projects you are part of" hint="Turnaround, automation or service initiatives count.">{(id) => <textarea id={id} className="field-input" rows={2} value={ctx.currentInitiatives} onChange={(e) => setCtx({ ...ctx, currentInitiatives: e.target.value })} />}</Field>
            <Field label="Biggest challenge in your work right now" required>{(id) => <textarea id={id} className="field-input" rows={2} value={ctx.biggestChallenge} onChange={(e) => setCtx({ ...ctx, biggestChallenge: e.target.value })} />}</Field>
            <Field label="Preferred learning format">{(id) => <select id={id} className="field-input max-w-xs" value={ctx.preferredFormat} onChange={(e) => setCtx({ ...ctx, preferredFormat: e.target.value as AssessmentResponses['preferredFormat'] })}><option value="mixed">Mixed</option><option value="micro_video">Micro video</option><option value="reading">Reading</option><option value="exercise">Exercise</option><option value="simulation">Simulation</option></select>}</Field>
            {errText && <Notice tone="error" icon="alert-circle">{errText} <Button size="sm" variant="ghost" className="ml-2" onClick={async () => { await simulated.mutateAsync([enrollment.id]); nav({ to: '/journey' }) }}>Use simulated result instead</Button></Notice>}
            <div className="flex items-center justify-between gap-2"><Button variant="ghost" onClick={() => setStep(1)}>Back</Button><Button variant="primary" icon="stars-02" busy={busy} disabled={!ctx.roleFocus.trim() || !ctx.biggestChallenge.trim()} onClick={runDiagnostic}>Submit and run Expert Guidance</Button></div>
            {busy && <p className="text-[13px] text-(--color-muted)">Expert Guidance is analysing your answers against the {skills.length} critical skills and the {cohort.program} module catalogue. This takes about a minute.</p>}
          </div>
        </Section>
      )}

      {step === 3 && result && (
        <div className="space-y-4">
          <Section title="Your gap map (draft)" icon="target-04" description="Review the result. Accepting writes AI-inferred levels to your passport and builds your learning path." tour="assessment-result">
            <Notice tone="accent" icon="stars-02"><strong>Expert Guidance summary:</strong> {result.output.summary}</Notice>
            <ul className="mt-3 divide-y divide-(--color-border)">
              {result.mapped.items.sort((a, b) => (a.priorityRank ?? 99) - (b.priorityRank ?? 99)).map((i) => { const sk = snap.skills.find((s) => s.id === i.skillId)!; return (
                <li key={i.skillId} className="table-grid grid-cols-[minmax(0,1fr)_auto] py-2 sm:grid-cols-[minmax(0,1.6fr)_100px_110px_minmax(0,2fr)]">
                  <div className="min-w-0 font-medium">{sk.name}</div>
                  <div>{i.priorityRank ? <Pill tone="primary">Priority {i.priorityRank}</Pill> : <span className="text-[12px] text-(--color-faint)">—</span>}</div>
                  <div><Pill tone={i.currentLevel === 0 ? 'neutral' : i.currentLevel >= i.targetLevel ? 'success' : 'warning'}>{i.currentLevel === 0 ? 'Not assessed' : `L${i.currentLevel} → L${i.targetLevel}`}</Pill></div>
                  <div className="hidden text-[12px] text-(--color-muted) sm:block">{i.rationale}</div>
                </li>) })}
            </ul>
          </Section>
          <Section title="Personal micro-learning path" icon="book-open-01">
            <ol className="space-y-1.5 text-[13px]">{result.mapped.plan.map((p, i) => { const m = snap.learningModules.find((x) => x.id === p.moduleId)!; return <li key={p.moduleId}><span className="font-medium">{i + 1}. {m.code} · {m.title}</span> <span className="text-(--color-muted)">· {p.reason}</span></li> })}</ol>
            {result.mapped.skipped.length > 0 && <div className="mt-2 text-[12px] text-(--color-muted)">Skipped: {result.mapped.skipped.map((p) => `${snap.learningModules.find((x) => x.id === p.moduleId)?.code} (${p.reason})`).join('; ')}</div>}
            {result.output.coachingPoints?.length > 0 && <div className="mt-3"><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Pushed to your coach before clinic 1</div><ul className="list-disc pl-4 text-[13px]">{result.output.coachingPoints.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
          </Section>
          <div className="flex items-center justify-between gap-2"><Button variant="ghost" onClick={() => setStep(2)}>Back to answers</Button><Button variant="primary" busy={busy} onClick={accept}>Accept and build my path</Button></div>
        </div>
      )}
    </>
  )
}
