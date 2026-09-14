import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { personaName } from '@/domain/selectors'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Button, Notice, DL } from '@/components/ui'
import { fmtDate } from '@/lib/format'
import { ENROLLMENT_LABEL, enrollmentTone, contractTone } from '@/domain/status'
import { CONTRACT_STATUS_LABEL } from '@/domain/types'
import { Icon } from '@/icons/Icon'
import type { Snapshot } from '@/data/datasource'
import type { Enrollment } from '@/domain/types'

export function JourneyPage() {
  const { snap, actor, status, error, refetch } = useActor()
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const enrollments = snap.enrollments.filter((e) => e.personaId === actor.id)
  return (
    <>
      <PageHeader title="My journey" description="Where you are in each program, your AI skill diagnostic and the gaps prioritised for you." />
      {enrollments.length === 0 ? <EmptyState icon="route" title="No program yet" body="The program office invites learners to cohorts. Once invited, your diagnostic and journey appear here." /> : enrollments.map((e) => <JourneyBlock key={e.id} snap={snap} e={e} actorId={actor.id} />)}
    </>
  )
}

function JourneyBlock({ snap, e, actorId }: { snap: Snapshot; e: Enrollment; actorId: string }) {
  const cohort = snap.cohorts.find((c) => c.id === e.cohortId)!
  const dx = snap.diagnostics.find((d) => d.enrollmentId === e.id)
  const items = dx ? snap.diagnosticItems.filter((i) => i.diagnosticId === dx.id).sort((a, b) => (a.priorityRank ?? 99) - (b.priorityRank ?? 99) || a.skillId.localeCompare(b.skillId)) : []
  const contract = snap.impactContracts.find((c) => c.enrollmentId === e.id && c.status !== 'withdrawn')
  const notes = snap.coachingNotes.filter((n) => n.enrollmentId === e.id)
  const run = useAction((ds) => ds.runDiagnostic(actorId, e.id), 'Diagnostic completed. Your personal learning path is ready.')
  const todayIso = new Date().toISOString().slice(0, 10)
  const concept = e.teamId ? snap.concepts.find((c) => c.teamId === e.teamId) : null
  return (
    <div className="mb-4 space-y-4" data-tour="journey">
      <Section title={cohort.name} icon={cohort.program === 'ABC' ? 'route' : 'rocket-01'} description={cohort.program === 'ABC' ? 'Modernized ABC: diagnose and personalise (2 weeks), applied capability labs (4 days), apply-to-impact sprint (90 days), showcase and verification (1 day).' : 'Modernized BCD: frame, build, validate (Gate 1), build the case (Gate 2), scale-up (Gate 3).'}
        actions={<Pill tone={enrollmentTone[e.status]}>{ENROLLMENT_LABEL[e.status]}</Pill>}>
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" data-tour="journey-phases">
          {cohort.keyDates.map((k) => { const past = k.date < todayIso; const isNext = !past && cohort.keyDates.find((x) => x.date >= todayIso)?.date === k.date; return (
            <li key={k.label} className={`surface flex items-start gap-2 p-2.5 ${isNext ? 'bg-(--color-primary-soft)' : ''}`} data-selected={isNext} aria-current={isNext ? 'step' : undefined}>
              <span className={past ? 'text-(--color-success)' : isNext ? 'text-(--color-primary)' : 'text-(--color-faint)'}><Icon name={past ? 'check-circle' : isNext ? 'flag-05' : 'calendar'} size={16} /></span>
              <div className="min-w-0"><div className="text-[13px] font-medium leading-snug">{k.label}</div><div className="text-[12px] text-(--color-muted)">{fmtDate(k.date)}{isNext ? ' · next' : ''}</div></div>
            </li>) })}
        </ol>
        <div className="mt-3"><DL cols={3} items={[{ label: 'Coach', value: personaName(snap, e.coachId) }, { label: 'Sponsor', value: personaName(snap, e.sponsorId) }, { label: 'Line manager', value: personaName(snap, e.managerId) }]} /></div>
        {(e.topDecile || e.fastTrackBcd || e.impactRating) && <div className="mt-3 flex flex-wrap gap-1.5">{e.impactRating && <Pill tone="success">Impact rating: {e.impactRating.replace('_', ' ')}</Pill>}{e.topDecile && <Pill tone="primary">Top ~10%</Pill>}{e.fastTrackBcd && <Pill tone="accent">BCD fast-track</Pill>}</div>}
      </Section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section title="AI skill diagnostic and gap map" icon="target-04" description="Current and target level per critical skill with the evidence source. Priority gaps drive your learning path and the skills verified at the showcase." id="gap-map">
          <div data-tour="gap-map">
          {!dx || dx.status === 'pending' ? (
            <EmptyState icon="target-04" title="Diagnostic not completed" body="The half-day virtual assessment maps the six domains; the AI then picks your priority skills and builds your personal path. In this prototype the result is simulated and clearly labelled." action={<Button variant="primary" icon="stars-02" busy={run.isPending} onClick={() => run.mutate([])}>Run simulated diagnostic</Button>} />
          ) : (
            <>
              <Notice tone="info" icon="stars-02"><strong>Summary (simulated AI):</strong> {dx.summary} <span className="text-(--color-faint)">Completed {fmtDate(dx.completedAt)}.</span></Notice>
              <div className="table-grid mt-3 hidden grid-cols-[minmax(0,2fr)_90px_120px_minmax(0,1.6fr)] px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint) sm:grid"><div>Skill</div><div>Priority</div><div>Level</div><div>Evidence</div></div>
              <ul className="divide-y divide-(--color-border)">
                {items.map((i) => { const sk = snap.skills.find((s) => s.id === i.skillId)!; const gap = i.currentLevel === 0 ? 'not_assessed' : i.currentLevel >= i.targetLevel ? 'meets' : 'gap'; return (
                  <li key={i.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] px-1 py-2 sm:grid-cols-[minmax(0,2fr)_90px_120px_minmax(0,1.6fr)]">
                    <div className="min-w-0"><div className="truncate font-medium">{sk.name}</div><div className="truncate text-[12px] text-(--color-muted)">{snap.skillDomains.find((d) => d.id === sk.domainId)?.name}</div></div>
                    <div>{i.priorityRank ? <Pill tone="primary">Priority {i.priorityRank}</Pill> : <span className="text-[12px] text-(--color-faint)">—</span>}</div>
                    <div><Pill tone={gap === 'meets' ? 'success' : gap === 'gap' ? 'warning' : 'neutral'} title={gap === 'not_assessed' ? 'No evidence; not interpreted as zero ability' : undefined}>{gap === 'not_assessed' ? 'Not assessed' : `L${i.currentLevel} → L${i.targetLevel}`}</Pill></div>
                    <div className="hidden text-[12px] text-(--color-muted) sm:block"><span className="font-medium text-(--color-text)">{i.evidenceSource ? i.evidenceSource.replace('_', ' ') : 'none'}</span>{i.rationale ? ` · ${i.rationale}` : ''}</div>
                  </li>) })}
              </ul>
              <p className="mt-2 text-[12px] text-(--color-faint)">Levels: 1 Aware · 2 Practising · 3 Proficient · 4 Leading. Not assessed means no evidence was available, not zero ability.</p>
            </>
          )}
          </div>
        </Section>
        <div className="space-y-4">
          <Section title={cohort.program === 'ABC' ? 'Impact contract' : 'Concept'} icon={cohort.program === 'ABC' ? 'file-check-02' : 'rocket-01'}>
            {cohort.program === 'ABC' ? (contract ? <><Link to="/contracts/$id" params={{ id: contract.id }} className="font-medium">{contract.title}</Link><div className="mt-1"><Pill tone={contractTone[contract.status]}>{CONTRACT_STATUS_LABEL[contract.status]}</Pill></div></> : <EmptyState icon="file-check-02" title="No impact contract yet" body="Agree practical improvements with your manager and sponsor on Lab Day 4." action={<Link to="/contracts/new" className="btn btn-primary btn-sm">Create impact contract</Link>} />)
              : concept ? <><Link to="/concepts/$id" params={{ id: concept.id }} className="font-medium">{concept.title}</Link><div className="mt-1 text-[13px] text-(--color-muted)">Team {snap.teams.find((t) => t.id === concept.teamId)?.name}</div></> : <p className="text-[13px] text-(--color-muted)">Team not formed yet.</p>}
          </Section>
          <Section title="Learning path" icon="book-open-01">
            {(() => { const plan = snap.learningPlanItems.filter((p) => p.enrollmentId === e.id); const done = plan.filter((p) => p.status === 'completed').length; return plan.length ? <><div className="text-[13px]">{done} of {plan.length} modules completed</div><div className="mt-1 h-2 overflow-hidden rounded-full bg-(--color-border)"><div className="h-full bg-(--color-primary)" style={{ width: `${(done / plan.length) * 100}%` }} /></div><Link to="/learning" className="mt-2 inline-block text-[13px] font-medium">Open learning plan</Link></> : <p className="text-[13px] text-(--color-muted)">Your path is built after the diagnostic.</p> })()}
          </Section>
          <Section title="Coaching notes" icon="message-chat-circle">
            {notes.length === 0 ? <p className="text-[13px] text-(--color-muted)">No notes yet.</p> : <ul className="space-y-2">{notes.map((n) => <li key={n.id} className="text-[13px]"><div>{n.note}</div><div className="text-[12px] text-(--color-faint)">{personaName(snap, n.coachId)} · {fmtDate(n.createdAt)}</div></li>)}</ul>}
          </Section>
        </div>
      </div>
    </div>
  )
}
