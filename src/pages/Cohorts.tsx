import { Link, useParams } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { personaName } from '@/domain/selectors'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, DL, Notice } from '@/components/ui'
import { fmtDate, fmtThb } from '@/lib/format'
import { ENROLLMENT_LABEL, enrollmentTone, contractTone } from '@/domain/status'
import { CONTRACT_STATUS_LABEL, CONCEPT_STAGE_LABEL } from '@/domain/types'
import { stageTone } from '@/domain/status'
import { CreateCohortButton, EnrollLearnerButton, FormTeamButton } from '@/features/admin/CohortAdmin'
import { useActor as useActor2 } from '@/app/actor'
import { useAction } from '@/app/data'
import { useState } from 'react'
import { Button, Dialog, Field } from '@/components/ui'

const COHORT_STATUS: Record<string, string> = { planned: 'Planned', diagnosing: 'Diagnosing', labs: 'Labs', sprint: 'Impact sprint', showcase: 'Showcase', completed: 'Completed', framing: 'Framing', building: 'Building', validating: 'Validating', building_case: 'Building the case', scale_up: 'Scale-up' }

export function CohortsPage() {
  const { snap, status, error, refetch } = useActor()
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const rows = [...snap.cohorts].sort((a, b) => a.startDate.localeCompare(b.startDate))
  return (
    <>
      <PageHeader title="Cohorts" description="Cohort calendar for ABC and BCD: phases, seats, learners and THB pipeline targets. Industrialised playbooks let any BU run the accelerators without redesign." actions={<CreateCohortButton />} />
      <Section className="mt-3">
        <div className="table-grid hidden grid-cols-[minmax(0,2fr)_70px_130px_150px_90px_120px_90px] px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint) xl:grid"><div>Cohort</div><div>Program</div><div>Status</div><div>Dates</div><div>Learners</div><div>Pipeline target</div><div className="text-right">Actions</div></div>
        <ul className="divide-y divide-(--color-border)">
          {rows.map((c) => { const n = snap.enrollments.filter((e) => e.cohortId === c.id).length; return (
            <li key={c.id}><Link to="/cohorts/$id" params={{ id: c.id }} className="row-link table-grid grid-cols-[minmax(0,1fr)_auto] px-3 py-2.5 xl:grid-cols-[minmax(0,2fr)_70px_130px_150px_90px_120px_90px]">
              <div className="min-w-0"><div className="truncate font-medium">{c.name}</div><div className="text-[12px] text-(--color-muted)">{c.code} · {c.buId ? snap.businessUnits.find((b) => b.id === c.buId)?.code : 'Cross-BU'}</div></div>
              <div className="hidden xl:block"><Pill tone={c.program === 'ABC' ? 'info' : 'accent'}>{c.program}</Pill></div>
              <div><Pill tone={c.status === 'completed' ? 'success' : c.status === 'planned' ? 'neutral' : 'warning'}>{COHORT_STATUS[c.status]}</Pill></div>
              <div className="hidden text-[13px] xl:block">{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</div>
              <div className="hidden text-[13px] xl:block">{n} / {c.seats}</div>
              <div className="hidden text-[13px] xl:block">{fmtThb(c.pipelineTargetThb, true)}</div>
              <div className="hidden text-right text-[13px] font-medium text-(--color-accent) xl:block">View details</div>
            </Link></li>) })}
        </ul>
      </Section>
    </>
  )
}

export function CohortDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const { snap, actor, status, error, refetch } = useActor2()
  const [card, setCard] = useState<{ coachId: string; freq: string; quality: string; rating: string; certified: boolean; until: string } | null>(null)
  const saveCard = useAction((ds, coachId: string, freq: number, quality: number, rating: number, certified: boolean, until: string | null) => ds.updateCoachScorecard(actor!.id, coachId, id, freq, quality, rating, certified, until), 'Scorecard saved.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const c = snap.cohorts.find((x) => x.id === id)
  if (!c) return <EmptyState title="Cohort not found" action={<Link to="/cohorts" className="btn btn-secondary">Back to cohorts</Link>} />
  const enr = snap.enrollments.filter((e) => e.cohortId === c.id)
  const briefs = snap.challengeBriefs.filter((b) => b.cohortId === c.id)
  const concepts = snap.concepts.filter((k) => k.cohortId === c.id)
  const clinics = snap.coachingClinics.filter((k) => k.cohortId === c.id)
  const todayIso = new Date().toISOString().slice(0, 10)
  const coaches = Array.from(new Set([...enr.map((e) => e.coachId), ...clinics.map((k) => k.coachId)].filter(Boolean))) as string[]
  const cards = snap.coachScorecards.filter((s) => s.cohortId === c.id)
  return (
    <>
      <PageHeader kicker={<><Link to="/cohorts">Cohorts</Link> · {c.code}</> as unknown as string} title={c.name} state={<Pill tone={c.status === 'completed' ? 'success' : 'warning'}>{COHORT_STATUS[c.status]}</Pill>} description={`${c.program === 'ABC' ? 'Skills-first capability accelerator' : 'Business competitiveness accelerator'} · ${fmtDate(c.startDate)} to ${fmtDate(c.endDate)} · ${enr.length} of ${c.seats} seats · pipeline target ${fmtThb(c.pipelineTargetThb)}.`} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <Section title="Learners" icon="users-01" actions={<EnrollLearnerButton cohort={c} />}>
            {enr.length === 0 ? <EmptyState icon="users-01" title="No learners enrolled yet" /> : (
              <ul className="divide-y divide-(--color-border)">
                {enr.map((e) => { const p = snap.personas.find((x) => x.id === e.personaId)!; const ic = snap.impactContracts.find((x) => x.enrollmentId === e.id && x.status !== 'withdrawn'); return (
                  <li key={e.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] py-2 sm:grid-cols-[minmax(0,1.4fr)_120px_minmax(0,1.6fr)]">
                    <div className="min-w-0"><Link to="/passport" search={{ persona: p.id } as never} className="block truncate font-medium">{p.fullName}</Link><div className="truncate text-[12px] text-(--color-muted)">{p.jobTitle} · coach {personaName(snap, e.coachId)}</div></div>
                    <div><Pill tone={enrollmentTone[e.status]}>{ENROLLMENT_LABEL[e.status]}</Pill></div>
                    <div className="hidden text-[13px] sm:block">{ic ? <><Link to="/contracts/$id" params={{ id: ic.id }}>{ic.title}</Link> <Pill tone={contractTone[ic.status]}>{CONTRACT_STATUS_LABEL[ic.status]}</Pill></> : e.teamId ? `Team ${snap.teams.find((t) => t.id === e.teamId)?.name}` : <span className="text-(--color-muted)">No impact contract yet</span>}{c.program === 'ABC' && <div className="text-[12px] text-(--color-muted)">Labs attended: {snap.labAttendance.filter((l) => l.enrollmentId === e.id).length} of 4 · diagnostic {snap.diagnostics.find((d) => d.enrollmentId === e.id)?.status ?? 'pending'}</div>}</div>
                  </li>) })}
              </ul>
            )}
          </Section>
          {c.program === 'BCD' && (
            <Section title="Briefs and concepts" icon="rocket-01">
              {briefs.length === 0 ? <EmptyState icon="lightbulb-02" title="No briefs assigned yet" body="The program office assigns approved briefs to this cohort." /> : (
                <ul className="divide-y divide-(--color-border)">{briefs.map((b) => { const cp = concepts.find((k) => k.briefId === b.id); return <li key={b.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] py-2"><div className="min-w-0"><Link to="/briefs/$id" params={{ id: b.id }} className="block truncate font-medium">{b.title}</Link><div className="truncate text-[12px] text-(--color-muted)">{cp ? <Link to="/concepts/$id" params={{ id: cp.id }}>{cp.title}</Link> : 'Team not formed yet'}</div></div><div className="flex items-center gap-1">{cp ? <Pill tone={stageTone[cp.stage]}>{CONCEPT_STAGE_LABEL[cp.stage]}</Pill> : <FormTeamButton brief={b} />}</div></li> })}</ul>
              )}
            </Section>
          )}
        </div>
        <div className="space-y-4">
          <Section title="Key dates" icon="calendar">
            <ol className="space-y-1.5">{c.keyDates.map((k) => <li key={k.label} className={`flex items-center justify-between gap-2 text-[13px] ${k.date < todayIso ? 'text-(--color-muted)' : ''}`}><span>{k.label}</span><span className="tabular-nums">{fmtDate(k.date)}</span></li>)}</ol>
          </Section>
          <Section title="Coaching clinics" icon="message-chat-circle">
            {clinics.length === 0 ? <p className="text-[13px] text-(--color-muted)">No clinics scheduled.</p> : <ul className="space-y-1.5 text-[13px]">{clinics.map((k) => <li key={k.id} className="flex items-center justify-between gap-2"><span>Clinic {k.clinicNo} · {personaName(snap, k.coachId)}</span><span>{fmtDate(k.scheduledAt)}</span></li>)}</ul>}
          </Section>
          <Section title="Coach certification scorecard" icon="speedometer-03" description="Coaching quality managed as an asset; the program office records feedback frequency, quality and learner rating and renews certification." actions={actor?.role === 'program_office' && coaches.length > 0 && <Button size="sm" onClick={() => { const s = cards[0]; setCard({ coachId: coaches[0], freq: String(s?.feedbackFrequency ?? ''), quality: String(s?.feedbackQuality ?? ''), rating: String(s?.learnerRating ?? ''), certified: s?.certified ?? true, until: s?.certifiedUntil ?? '' }) }}>Record scorecard</Button>}>
            {cards.length === 0 ? <p className="text-[13px] text-(--color-muted)">No scorecard recorded for this cohort.</p> : <ul className="space-y-1 text-[13px]">{cards.map((s) => <li key={s.id}>{personaName(snap, s.coachId)}: feedback {s.feedbackFrequency}/learner/sprint · quality {s.feedbackQuality}/5 · rating {s.learnerRating}/5 · <Pill tone={s.certified ? 'success' : 'warning'}>{s.certified ? `Certified until ${fmtDate(s.certifiedUntil)}` : 'Not certified'}</Pill></li>)}</ul>}
          </Section>
          <Section title="Playbook" icon="book-open-01"><DL cols={1} items={[{ label: 'Program', value: c.program === 'ABC' ? 'Modernized ABC · 12 weeks, diagnostic to delivered impact' : 'Modernized BCD · 16 weeks plus scale-up runway' }, { label: 'Coaching spine', value: 'Certified coaches plus always-on AI coach, asynchronous clinics' }, { label: 'Impact contracted', value: c.program === 'ABC' ? 'Per learner, by function type' : 'Per cohort, THB pipeline of validated concept value' }]} /></Section>
        </div>
      </div>
      {card && (
        <Dialog open onClose={() => setCard(null)} title="Coach scorecard" subtitle={c.name}
          footer={<><Button variant="ghost" onClick={() => setCard(null)}>Cancel</Button><Button variant="primary" busy={saveCard.isPending} onClick={async () => { await saveCard.mutateAsync([card.coachId, Number(card.freq), Number(card.quality), Number(card.rating), card.certified, card.until || null]); setCard(null) }}>Save scorecard</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Coach">{(fid) => <select id={fid} className="field-input" value={card.coachId} onChange={(e) => setCard({ ...card, coachId: e.target.value })}>{coaches.map((k) => <option key={k} value={k}>{personaName(snap, k)}</option>)}</select>}</Field>
            <Field label="Feedback per learner per sprint">{(fid) => <input id={fid} type="number" step="0.1" className="field-input" value={card.freq} onChange={(e) => setCard({ ...card, freq: e.target.value })} />}</Field>
            <Field label="Feedback quality (1–5)">{(fid) => <input id={fid} type="number" step="0.1" min={1} max={5} className="field-input" value={card.quality} onChange={(e) => setCard({ ...card, quality: e.target.value })} />}</Field>
            <Field label="Learner rating (1–5)">{(fid) => <input id={fid} type="number" step="0.1" min={1} max={5} className="field-input" value={card.rating} onChange={(e) => setCard({ ...card, rating: e.target.value })} />}</Field>
            <Field label="Certified">{(fid) => <label htmlFor={fid} className="flex items-center gap-2 text-[13px]"><input id={fid} type="checkbox" checked={card.certified} onChange={(e) => setCard({ ...card, certified: e.target.checked })} />Certified against the quality scorecard</label>}</Field>
            <Field label="Certified until">{(fid) => <input id={fid} type="date" className="field-input" value={card.until} onChange={(e) => setCard({ ...card, until: e.target.value })} />}</Field>
          </div>
        </Dialog>
      )}
      {card && (
        <Dialog open onClose={() => setCard(null)} title="Coach scorecard" subtitle={c.name}
          footer={<><Button variant="ghost" onClick={() => setCard(null)}>Cancel</Button><Button variant="primary" busy={saveCard.isPending} onClick={async () => { await saveCard.mutateAsync([card.coachId, Number(card.freq), Number(card.quality), Number(card.rating), card.certified, card.until || null]); setCard(null) }}>Save scorecard</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Coach">{(fid) => <select id={fid} className="field-input" value={card.coachId} onChange={(e) => setCard({ ...card, coachId: e.target.value })}>{coaches.map((k) => <option key={k} value={k}>{personaName(snap, k)}</option>)}</select>}</Field>
            <Field label="Feedback per learner per sprint">{(fid) => <input id={fid} type="number" step="0.1" className="field-input" value={card.freq} onChange={(e) => setCard({ ...card, freq: e.target.value })} />}</Field>
            <Field label="Feedback quality (1–5)">{(fid) => <input id={fid} type="number" step="0.1" min={1} max={5} className="field-input" value={card.quality} onChange={(e) => setCard({ ...card, quality: e.target.value })} />}</Field>
            <Field label="Learner rating (1–5)">{(fid) => <input id={fid} type="number" step="0.1" min={1} max={5} className="field-input" value={card.rating} onChange={(e) => setCard({ ...card, rating: e.target.value })} />}</Field>
            <Field label="Certified">{(fid) => <label htmlFor={fid} className="flex items-center gap-2 text-[13px]"><input id={fid} type="checkbox" checked={card.certified} onChange={(e) => setCard({ ...card, certified: e.target.checked })} />Certified against the quality scorecard</label>}</Field>
            <Field label="Certified until">{(fid) => <input id={fid} type="date" className="field-input" value={card.until} onChange={(e) => setCard({ ...card, until: e.target.value })} />}</Field>
          </div>
        </Dialog>
      )}
    </>
  )
}
