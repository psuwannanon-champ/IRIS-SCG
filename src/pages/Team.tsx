import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill } from '@/components/ui'
import { CONTRACT_STATUS_LABEL } from '@/domain/types'
import { contractTone, contractResponsible, ENROLLMENT_LABEL, enrollmentTone } from '@/domain/status'
import { fmtThb } from '@/lib/format'

export function TeamPage() {
  const { snap, actor, status, error, refetch } = useActor()
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const reports = snap.personas.filter((p) => p.managerId === actor.id)
  return (
    <>
      <PageHeader title="My team" description="Your direct reports in capability programs: program status, impact contract, latest evidence and verified skills. Open a contract to review or decide." />
      <Section>
        {reports.length === 0 ? <EmptyState icon="users-01" title="No direct reports in programs" /> : (
          <ul className="divide-y divide-(--color-border)">
            {reports.map((p) => {
              const enr = snap.enrollments.filter((e) => e.personaId === p.id)
              const c = snap.impactContracts.find((x) => x.learnerId === p.id && x.status !== 'withdrawn')
              const ev = c ? snap.sprintEvidence.filter((e) => e.contractId === c.id).sort((a, b) => b.weekNo - a.weekNo)[0] : null
              const verified = snap.passportEntries.filter((x) => x.personaId === p.id && x.tier === 'outcome_verified').length
              return (
                <li key={p.id} className="table-grid grid-cols-[minmax(0,1fr)] py-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_150px_minmax(0,1.2fr)_120px]">
                  <div className="min-w-0"><div className="font-medium">{p.fullName}</div><div className="truncate text-[12px] text-(--color-muted)">{p.jobTitle}</div><div className="mt-1 flex flex-wrap gap-1">{enr.map((e) => <Pill key={e.id} tone={enrollmentTone[e.status]}>{snap.cohorts.find((k) => k.id === e.cohortId)?.code} · {ENROLLMENT_LABEL[e.status]}</Pill>)}</div></div>
                  <div className="min-w-0 text-[13px]">{c ? <><Link to="/contracts/$id" params={{ id: c.id }} className="font-medium">{c.title}</Link><div className="text-[12px] text-(--color-muted)">Target {fmtThb(c.targetThb, true)} · responsible now: {contractResponsible[c.status]}</div></> : <span className="text-(--color-muted)">No impact contract yet</span>}</div>
                  <div>{c && <Pill tone={contractTone[c.status]}>{CONTRACT_STATUS_LABEL[c.status]}</Pill>}</div>
                  <div className="text-[12px] text-(--color-muted)">{ev ? <>Week {ev.weekNo}: {ev.title}</> : 'No evidence yet'}</div>
                  <div className="text-[13px]"><Link to="/passport" search={{ persona: p.id } as never}>{verified} verified badge{verified === 1 ? '' : 's'}</Link></div>
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </>
  )
}
