import { Link, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useActor } from '@/app/actor'
import { selectTasks, unreadNotifications, visibleContracts, visibleBriefs, visibleConcepts, selectGovernance, visibleLedger } from '@/domain/selectors'
import { ROLE_LABEL, CONTRACT_STATUS_LABEL, CONCEPT_STAGE_LABEL } from '@/domain/types'
import { PageHeader, Section, Stat, LoadingBlock, ErrorBlock, EmptyState, Pill } from '@/components/ui'
import { TaskRow } from '@/components/records'
import { fmtDate, fmtThb } from '@/lib/format'
import { contractTone, stageTone, ENROLLMENT_LABEL, enrollmentTone } from '@/domain/status'
import { useAction } from '@/app/data'
import { Icon } from '@/icons/Icon'

export function HomePage() {
  const { snap, actor, status, error, refetch } = useActor()
  const nav = useNavigate()
  const tasks = useMemo(() => (snap && actor ? selectTasks(snap, actor) : []), [snap, actor])
  const markRead = useAction((ds, id: string) => ds.markNotificationRead(actor!.id, id))
  if (status === 'loading') return <LoadingBlock label="Loading your home" />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? 'Unknown error'} onRetry={refetch} />
  const unread = unreadNotifications(snap, actor.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const bu = snap.businessUnits.find((b) => b.id === actor.buId)
  const overdue = tasks.filter((t) => t.urgency === 'overdue').length
  const dueSoon = tasks.filter((t) => t.urgency === 'due_soon').length

  return (
    <>
      <PageHeader kicker={`${ROLE_LABEL[actor.role]} · ${bu?.code ?? ''}`} title={`Good day, ${actor.fullName.split(' ')[0]}`}
        description={tasks.length ? `You have ${tasks.length} action${tasks.length === 1 ? '' : 's'} to take${overdue ? `, ${overdue} overdue` : ''}${dueSoon ? `, ${dueSoon} due within seven days` : ''}. Open a task to act on the record; it clears once the action is saved.` : 'Nothing is waiting for you right now. Updates from other roles appear below.'} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-tour="home-stats">
        <Stat label="Actionable tasks" value={tasks.length} hint="Only actions you can take now" onClick={() => nav({ to: '/tasks' })} tone={tasks.length ? 'primary' : undefined} />
        <Stat label="Unread updates" value={unread.length} hint="Informational, separate from tasks" onClick={() => nav({ to: '/notifications' })} />
        <RoleStats />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section title="Your tasks" icon="check-done-01" description="Ordered by urgency: overdue, due within seven days, then by due date." actions={tasks.length > 5 && <Link to="/tasks" className="btn btn-secondary btn-sm">All {tasks.length} tasks</Link>} id="home-tasks">
          <div data-tour="home-tasks">
            {tasks.length === 0 ? <EmptyState icon="check-circle" title="No actions waiting" body="When a record needs your decision or input it appears here and in the sidebar badge." /> : (
              <ul className="divide-y divide-(--color-border)">{tasks.slice(0, 5).map((t) => <TaskRow key={t.key} t={t} />)}</ul>
            )}
          </div>
        </Section>
        <Section title="Recent updates" icon="bell-01" description="What other roles did on records connected to you." actions={<Link to="/notifications" className="btn btn-ghost btn-sm">All updates</Link>}>
          {unread.length === 0 ? <EmptyState icon="bell-01" title="You are up to date" /> : (
            <ul className="divide-y divide-(--color-border)">
              {unread.slice(0, 5).map((n) => (
                <li key={n.id} className="py-2">
                  <Link to={n.link ?? '/notifications'} onClick={() => markRead.mutate([n.id])} className="row-link -mx-2 block px-2 py-1">
                    <div className="flex items-start gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-(--color-accent)" aria-hidden="true" /><div className="min-w-0"><div className="font-medium leading-snug">{n.title}</div><div className="truncate-2 text-[13px] text-(--color-muted)">{n.body}</div><div className="text-[12px] text-(--color-faint)">{fmtDate(n.createdAt, true)}</div></div></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
      <div className="mt-4"><RolePanel /></div>
    </>
  )
}

function RoleStats() {
  const { snap, actor } = useActor()
  const nav = useNavigate()
  if (!snap || !actor) return null
  switch (actor.role) {
    case 'learner': {
      const contracts = visibleContracts(snap, actor)
      const verified = snap.passportEntries.filter((p) => p.personaId === actor.id && p.tier === 'outcome_verified').length
      return <><Stat label="Impact contracts" value={contracts.length} hint={contracts[0] ? CONTRACT_STATUS_LABEL[contracts[0].status] : 'None yet'} onClick={() => nav({ to: '/contracts' })} /><Stat label="Outcome-verified badges" value={verified} hint="In your skill passport" onClick={() => nav({ to: '/passport' })} /></>
    }
    case 'line_manager': {
      const reports = snap.personas.filter((p) => p.managerId === actor.id)
      const inSprint = snap.impactContracts.filter((c) => c.managerId === actor.id && ['active', 'mid_gate_review'].includes(c.status)).length
      return <><Stat label="Direct reports in programs" value={reports.length} onClick={() => nav({ to: '/team' })} /><Stat label="Sprints active" value={inSprint} hint="Contracts in the 90-day sprint" onClick={() => nav({ to: '/contracts', search: { status: 'active' } as never })} /></>
    }
    case 'bu_sponsor': {
      const ledger = visibleLedger(snap, actor)
      const validated = ledger.filter((l) => ['validated', 'audited'].includes(l.status)).reduce((a, l) => a + (l.validatedValueThb ?? 0), 0)
      const briefs = visibleBriefs(snap, actor).filter((b) => b.sponsorId === actor.id)
      return <><Stat label="Validated impact (your BU)" value={fmtThb(validated, true)} hint="Sponsor-validated, in the ledger" onClick={() => nav({ to: '/ledger' })} /><Stat label="Your challenge briefs" value={briefs.length} hint={`${briefs.filter((b) => b.status === 'committee_review').length} with the committee`} onClick={() => nav({ to: '/briefs' })} /></>
    }
    case 'coach': {
      const learners = snap.enrollments.filter((e) => e.coachId === actor.id && !['graduated', 'withdrawn'].includes(e.status)).length
      const clinics = snap.coachingClinics.filter((c) => c.coachId === actor.id && c.scheduledAt >= new Date().toISOString()).length
      return <><Stat label="Learners coached" value={learners} onClick={() => nav({ to: '/coaching' })} /><Stat label="Upcoming clinics" value={clinics} onClick={() => nav({ to: '/coaching' })} /></>
    }
    case 'committee': {
      const g = selectGovernance(snap)
      return <><Stat label="Briefs in review" value={snap.challengeBriefs.filter((b) => b.status === 'committee_review').length} onClick={() => nav({ to: '/briefs', search: { status: 'committee_review' } as never })} /><Stat label="Concept pipeline" value={fmtThb(g.pipelineThb, true)} hint="Live concepts, not yet validated" onClick={() => nav({ to: '/concepts' })} /></>
    }
    case 'program_office': {
      const g = selectGovernance(snap)
      return <><Stat label="Active cohorts" value={snap.cohorts.filter((c) => !['completed', 'planned'].includes(c.status)).length} onClick={() => nav({ to: '/cohorts' })} /><Stat label="Validated impact" value={fmtThb(g.validatedThb, true)} hint="All BUs, ledger" onClick={() => nav({ to: '/governance' })} /></>
    }
  }
}

function RolePanel() {
  const { snap, actor } = useActor()
  if (!snap || !actor) return null
  if (actor.role === 'learner') {
    const enr = snap.enrollments.filter((e) => e.personaId === actor.id)
    return (
      <Section title="Your programs" icon="route" actions={<Link to="/journey" className="btn btn-secondary btn-sm">Open my journey</Link>}>
        {enr.length === 0 ? <EmptyState title="You are not enrolled in a program yet" body="The program office invites learners to cohorts. Your diagnostic and journey appear here once invited." /> : (
          <ul className="divide-y divide-(--color-border)">
            {enr.map((e) => { const c = snap.cohorts.find((x) => x.id === e.cohortId)!; const next = c.keyDates.find((k) => k.date >= new Date().toISOString().slice(0, 10)); return (
              <li key={e.id} className="table-grid grid-cols-[1fr_auto] py-2 sm:grid-cols-[minmax(0,2fr)_140px_minmax(0,1.5fr)]">
                <div className="min-w-0"><div className="truncate font-medium">{c.name}</div><div className="text-[12px] text-(--color-muted)">{c.program === 'ABC' ? 'Skills-first capability accelerator' : 'Business competitiveness accelerator'}</div></div>
                <div><Pill tone={enrollmentTone[e.status]}>{ENROLLMENT_LABEL[e.status]}</Pill></div>
                <div className="hidden text-[13px] sm:block">{next ? <><span className="text-(--color-muted)">Next: </span>{next.label} · {fmtDate(next.date)}</> : <span className="text-(--color-muted)">Program completed</span>}</div>
              </li>) })}
          </ul>
        )}
      </Section>
    )
  }
  if (actor.role === 'committee' || actor.role === 'program_office' || actor.role === 'bu_sponsor') {
    const concepts = visibleConcepts(snap, actor).filter((c) => !['stopped'].includes(c.stage))
    return (
      <Section title="Concept portfolio" icon="rocket-01" description="Live BCD concepts and their gate stage." actions={<Link to="/concepts" className="btn btn-secondary btn-sm">All concepts</Link>}>
        <ul className="divide-y divide-(--color-border)">
          {concepts.slice(0, 5).map((c) => (
            <li key={c.id}><Link to="/concepts/$id" params={{ id: c.id }} className="row-link table-grid grid-cols-[1fr_auto] px-2 py-2 sm:grid-cols-[minmax(0,2fr)_170px_140px_80px]">
              <div className="min-w-0"><div className="truncate font-medium">{c.title}</div><div className="truncate text-[12px] text-(--color-muted)">{snap.cohorts.find((x) => x.id === c.cohortId)?.code}</div></div>
              <div><Pill tone={stageTone[c.stage]}>{CONCEPT_STAGE_LABEL[c.stage]}</Pill></div>
              <div className="hidden text-[13px] sm:block">{fmtThb(c.validatedValueThb ?? c.pipelineValueThb, true)} <span className="text-(--color-faint)">{c.validatedValueThb ? 'validated' : 'pipeline'}</span></div>
              <div className="hidden text-right text-[13px] font-medium text-(--color-accent) sm:block">Open <Icon name="arrow-right" size={14} className="inline" /></div>
            </Link></li>
          ))}
        </ul>
      </Section>
    )
  }
  if (actor.role === 'line_manager') {
    const reports = snap.personas.filter((p) => p.managerId === actor.id)
    return (
      <Section title="Your team in programs" icon="users-01" actions={<Link to="/team" className="btn btn-secondary btn-sm">Open my team</Link>}>
        <ul className="divide-y divide-(--color-border)">
          {reports.map((p) => { const c = snap.impactContracts.find((x) => x.learnerId === p.id && !['withdrawn'].includes(x.status)); return (
            <li key={p.id} className="table-grid grid-cols-[1fr_auto] py-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)_160px]">
              <div className="min-w-0"><div className="truncate font-medium">{p.fullName}</div><div className="truncate text-[12px] text-(--color-muted)">{p.jobTitle}</div></div>
              <div className="hidden truncate text-[13px] sm:block">{c ? <Link to="/contracts/$id" params={{ id: c.id }}>{c.title}</Link> : <span className="text-(--color-muted)">No impact contract yet</span>}</div>
              <div>{c ? <Pill tone={contractTone[c.status]}>{CONTRACT_STATUS_LABEL[c.status]}</Pill> : <Pill>Not started</Pill>}</div>
            </li>) })}
        </ul>
      </Section>
    )
  }
  if (actor.role === 'coach') {
    const clinics = snap.coachingClinics.filter((c) => c.coachId === actor.id).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    return (
      <Section title="Your clinics" icon="message-chat-circle" actions={<Link to="/coaching" className="btn btn-secondary btn-sm">Open coaching workspace</Link>}>
        <ul className="divide-y divide-(--color-border)">
          {clinics.map((c) => (
            <li key={c.id} className="table-grid grid-cols-[1fr_auto] py-2 sm:grid-cols-[minmax(0,2fr)_150px_150px]">
              <div className="min-w-0"><div className="truncate font-medium">Clinic {c.clinicNo} · {snap.cohorts.find((x) => x.id === c.cohortId)?.code}</div><div className="truncate text-[12px] text-(--color-muted)">{c.topics}</div></div>
              <div className="text-[13px]">{fmtDate(c.scheduledAt)}</div>
              <div>{c.briefingReady ? <Pill tone="success">Briefing ready</Pill> : <Pill tone="warning">Briefing not ready</Pill>}</div>
            </li>
          ))}
        </ul>
      </Section>
    )
  }
  return null
}
