import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { ABC_LAB_DAYS, BCD_LAB_DAYS } from '@/data/labs-content'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Button, Dialog, Field, Notice } from '@/components/ui'
import { fmtDate } from '@/lib/format'
import { Icon } from '@/icons/Icon'

export function LabsPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [open, setOpen] = useState<{ enrollmentId: string; day: number } | null>(null)
  const [reflection, setReflection] = useState('')
  const checkIn = useAction((ds, enrollmentId: string, day: number, r: string) => ds.checkInLab(actor!.id, enrollmentId, day, r), 'Lab day recorded.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const enrollments = snap.enrollments.filter((e) => e.personaId === actor.id && e.status !== 'withdrawn')
  return (
    <>
      <PageHeader title="Applied capability labs" description="Phase 1: four in-person lab days (ABC) or the three-day immersion camp (BCD). Class time is 70% practice on live SCG cases with real AI tools. Check in each day and note what you take back to work; Lab Day 4 ends with your impact contract." />
      {enrollments.length === 0 && <EmptyState icon="users-01" title="No labs scheduled" body="Labs appear once you are enrolled in a cohort." />}
      {enrollments.map((e) => {
        const cohort = snap.cohorts.find((c) => c.id === e.cohortId)!
        const days = cohort.program === 'ABC' ? ABC_LAB_DAYS : BCD_LAB_DAYS
        const labStart = cohort.keyDates.find((k) => /labs|immersion/i.test(k.label))?.date ?? cohort.startDate
        const plan = snap.learningPlanItems.filter((p) => p.enrollmentId === e.id)
        const contract = snap.impactContracts.find((c) => c.enrollmentId === e.id && c.status !== 'withdrawn')
        return (
          <Section key={e.id} title={cohort.name} icon="users-01" description={`Labs start ${fmtDate(labStart)} · ${days.length} days in person`} className="mb-4">
            <ol className="grid gap-3 lg:grid-cols-2">
              {days.map((d) => {
                const att = snap.labAttendance.find((l) => l.enrollmentId === e.id && l.labDay === d.day)
                const date = new Date(labStart); date.setDate(date.getDate() + d.day - 1)
                const prework = d.prework.map((code) => { const m = snap.learningModules.find((x) => x.code === code); const p = m ? plan.find((x) => x.moduleId === m.id) : null; return { code, title: m?.title ?? code, status: p?.status ?? 'not in plan' } })
                return (
                  <li key={d.day} className="surface p-3" data-tour={`lab-${d.day}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Lab Day {d.day} · {fmtDate(date.toISOString().slice(0, 10))} · in person</div><div className="font-medium">{d.title}</div></div>
                      {att ? <Pill tone="success" icon="check-circle">Attended {fmtDate(att.attendedAt)}</Pill> : <Pill tone="neutral">Not checked in</Pill>}
                    </div>
                    <ul className="mt-2 list-disc pl-4 text-[13px]">{d.agenda.map((a) => <li key={a}>{a}</li>)}</ul>
                    <div className="mt-2 text-[13px]"><span className="font-medium">Live case: </span>{d.liveCase}</div>
                    <div className="mt-1 text-[13px]"><span className="font-medium">Tools: </span>{d.tools.join(' · ')}</div>
                    <div className="mt-1 text-[13px]"><span className="font-medium">Deliverable: </span>{d.deliverable}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-[12px]"><span className="text-(--color-muted)">Pre-work:</span>{prework.map((p) => <Pill key={p.code} tone={p.status === 'completed' ? 'success' : p.status === 'skipped' ? 'neutral' : 'warning'} title={p.title}>{p.code} · {p.status.replace('_', ' ')}</Pill>)}<Link to="/learning" className="ml-1">Open learning plan</Link></div>
                    {att?.reflection && <div className="mt-2 rounded-md bg-(--color-page) px-2.5 py-1.5 text-[13px]"><span className="text-(--color-muted)">Your takeaway: </span>{att.reflection}</div>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant={att ? 'secondary' : 'primary'} icon={att ? 'edit-05' : 'check-circle'} onClick={() => { setReflection(att?.reflection ?? ''); setOpen({ enrollmentId: e.id, day: d.day }) }}>{att ? 'Edit takeaway' : 'Check in'}</Button>
                      {cohort.program === 'ABC' && d.day === 4 && (contract ? <Link to="/contracts/$id" params={{ id: contract.id }} className="btn btn-secondary btn-sm">Open impact contract</Link> : <Link to="/contracts/new" className="btn btn-secondary btn-sm">Create impact contract</Link>)}
                    </div>
                  </li>
                )
              })}
            </ol>
          </Section>
        )
      })}
      <Notice tone="info" icon="info-circle">Labs are facilitated in person by certified coaches; the platform holds the agenda, pre-work status, attendance and your takeaways, and hands off to the impact contract and sprint.</Notice>
      {open && (
        <Dialog open onClose={() => setOpen(null)} title={`Lab Day ${open.day} · check in`} subtitle="Record attendance and the one thing you will take back to work."
          footer={<><Button variant="ghost" onClick={() => setOpen(null)}>Cancel</Button><Button variant="primary" busy={checkIn.isPending} onClick={async () => { await checkIn.mutateAsync([open.enrollmentId, open.day, reflection]); setOpen(null) }}>Save</Button></>}>
          <div className="space-y-3">
            <Notice tone="info" icon="info-circle"><Icon name="check-circle" size={14} className="mr-1 inline" />Checking in marks you present and moves your journey into the labs phase. Your coach sees the takeaway.</Notice>
            <Field label="What will you apply back at work?" hint="One or two sentences.">{(id) => <textarea id={id} className="field-input" rows={3} value={reflection} onChange={(e) => setReflection(e.target.value)} data-autofocus />}</Field>
          </div>
        </Dialog>
      )}
    </>
  )
}
