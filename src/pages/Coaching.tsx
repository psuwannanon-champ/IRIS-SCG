import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { personaName } from '@/domain/selectors'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Button, Dialog, Field, Notice, DL } from '@/components/ui'
import { fmtDate } from '@/lib/format'
import { requestGuidance, buildClinicContext, type BriefingOutput } from '@/features/guidance/api'
import type { CoachingClinic } from '@/domain/types'
import { CONTRACT_STATUS_LABEL } from '@/domain/types'
import { contractTone, ENROLLMENT_LABEL, enrollmentTone } from '@/domain/status'

export function CoachingPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [clinicId, setClinicId] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const ready = useAction((ds, id: string) => ds.markClinicBriefingReady(actor!.id, id), 'Clinic briefing marked ready.')
  const [briefingFor, setBriefingFor] = useState<CoachingClinic | null>(null)
  const [briefBusy, setBriefBusy] = useState(false)
  const [briefErr, setBriefErr] = useState<string | null>(null)
  const saveGuidance = useAction((ds, kind: 'clinic_briefing', contextId: string, content: unknown, model: string) => ds.saveGuidance(actor!.id, actor!.id, kind, contextId, content, model), 'Clinic briefing saved.')
  const nudge = useAction((ds) => ds.sendNudges(actor!.id))
  const [nudgeCount, setNudgeCount] = useState<number | null>(null)
  const addNote = useAction((ds, enrollmentId: string, n: string, cl: string | null) => ds.addCoachingNote(actor!.id, enrollmentId, n, cl), 'Coaching note saved and shared with the learner.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const clinics = snap.coachingClinics.filter((c) => c.coachId === actor.id).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const learners = snap.enrollments.filter((e) => e.coachId === actor.id)
  const flags = snap.coachingNotes.filter((n) => n.aiFlag && learners.some((e) => e.id === n.enrollmentId))
  const cards = snap.coachScorecards.filter((s) => s.coachId === actor.id)
  const todayIso = new Date().toISOString()
  return (
    <>
      <PageHeader title="Coaching workspace" description="Your clinics, learners and teams, the Expert Guidance flags that need follow-up, and your quality scorecard. Add a note or mark a briefing ready to clear a task."
        actions={<Button icon="bell-01" busy={nudge.isPending} onClick={async () => { const n = await nudge.mutateAsync([]); setNudgeCount(Number(n)) }}>Send deadline nudges</Button>} />
      {nudgeCount !== null && <div className="mb-3"><Notice tone="success" icon="check-circle">{nudgeCount} nudge{nudgeCount === 1 ? '' : 's'} sent to learners with a gate, showcase or diagnostic coming up.</Notice></div>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <Section title="Clinics" icon="calendar" description="Asynchronous small-group clinics. Mark the briefing ready once you have reviewed the AI flags and evidence.">
            <ul className="divide-y divide-(--color-border)">
              {clinics.map((c) => (
                <li key={c.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] py-2.5 sm:grid-cols-[minmax(0,2fr)_130px_150px_150px]">
                  <div className="min-w-0"><div className="font-medium">Clinic {c.clinicNo} · {snap.cohorts.find((k) => k.id === c.cohortId)?.code}</div><div className="truncate text-[12px] text-(--color-muted)">{c.topics}</div></div>
                  <div className="text-[13px]">{fmtDate(c.scheduledAt)}</div>
                  <div>{c.briefingReady ? <Pill tone="success">Briefing ready</Pill> : c.scheduledAt < todayIso ? <Pill>Held</Pill> : <Pill tone="warning">Briefing not ready</Pill>}</div>
                  <div className="flex flex-wrap justify-end gap-1"><Button size="sm" icon="stars-02" onClick={() => { setBriefErr(null); setBriefingFor(c) }}>{snap.guidanceNotes.some((n) => n.kind === 'clinic_briefing' && n.contextId === c.id) ? 'View briefing' : 'Prepare briefing'}</Button>{!c.briefingReady && c.scheduledAt >= todayIso && <Button size="sm" variant="primary" busy={ready.isPending} onClick={() => ready.mutate([c.id])}>Mark briefing ready</Button>}</div>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Learners and teams" icon="users-01">
            {learners.length === 0 ? <EmptyState icon="users-01" title="No learners assigned" /> : (
              <ul className="divide-y divide-(--color-border)">
                {learners.map((e) => { const p = snap.personas.find((x) => x.id === e.personaId)!; const ic = snap.impactContracts.find((x) => x.enrollmentId === e.id && x.status !== 'withdrawn'); const lastNote = snap.coachingNotes.filter((n) => n.enrollmentId === e.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]; return (
                  <li key={e.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] py-2.5 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.6fr)_110px_110px]">
                    <div className="min-w-0"><Link to="/passport" search={{ persona: p.id } as never} className="block truncate font-medium">{p.fullName}</Link><div className="truncate text-[12px] text-(--color-muted)">{snap.cohorts.find((k) => k.id === e.cohortId)?.code}{e.podId ? ` · ${snap.pods.find((x) => x.id === e.podId)?.name}` : ''} · <Pill tone={enrollmentTone[e.status]}>{ENROLLMENT_LABEL[e.status]}</Pill></div></div>
                    <div className="hidden min-w-0 text-[13px] sm:block">{ic ? <><Link to="/contracts/$id" params={{ id: ic.id }} className="block truncate">{ic.title}</Link><Pill tone={contractTone[ic.status]}>{CONTRACT_STATUS_LABEL[ic.status]}</Pill></> : e.teamId ? `Team ${snap.teams.find((t) => t.id === e.teamId)?.name}` : <span className="text-(--color-muted)">No contract yet</span>}</div>
                    <div className="hidden text-[12px] text-(--color-muted) sm:block">{lastNote ? `Note ${fmtDate(lastNote.createdAt)}` : 'No notes'}</div>
                    <div className="flex justify-end"><Button size="sm" onClick={() => { setNoteFor(e.id); setNote(''); setClinicId(''); setErr(null) }}>Add note</Button></div>
                  </li>) })}
              </ul>
            )}
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="AI-coach flags" icon="stars-02" description="Learners the AI coach flagged for follow-up (simulated).">
            {flags.length === 0 ? <p className="text-[13px] text-(--color-muted)">No open flags.</p> : <ul className="space-y-2">{flags.map((f) => { const e = learners.find((x) => x.id === f.enrollmentId)!; return <li key={f.id} className="text-[13px]"><div className="font-medium">{personaName(snap, e.personaId)}</div><div className="text-(--color-warning)">{f.aiFlag}</div><Button size="sm" variant="ghost" className="mt-1" onClick={() => { setNoteFor(e.id); setNote(''); setClinicId(''); setErr(null) }}>Respond with a note</Button></li> })}</ul>}
          </Section>
          <Section title="Coach scorecard" icon="speedometer-03" description="Coaching quality managed as an asset; certification renews against the scorecard.">
            {cards.length === 0 ? <p className="text-[13px] text-(--color-muted)">No scorecard yet.</p> : cards.map((s) => <div key={s.id} className="mb-3"><div className="text-[13px] font-medium">{snap.cohorts.find((k) => k.id === s.cohortId)?.code}</div><DL cols={3} items={[{ label: 'Feedback per learner per sprint', value: s.feedbackFrequency }, { label: 'Feedback quality (1–5)', value: s.feedbackQuality }, { label: 'Learner rating (1–5)', value: s.learnerRating }]} /><div className="mt-1"><Pill tone={s.certified ? 'success' : 'warning'}>{s.certified ? `Certified until ${fmtDate(s.certifiedUntil)}` : 'Not certified'}</Pill></div></div>)}
          </Section>
        </div>
      </div>
      {briefingFor && (() => { const note = snap.guidanceNotes.filter((n) => n.kind === 'clinic_briefing' && n.contextId === briefingFor.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]; const b = note?.content as BriefingOutput | undefined; const gen = async () => { setBriefBusy(true); setBriefErr(null); try { const r = await requestGuidance<BriefingOutput>({ kind: 'clinic_briefing', context: buildClinicContext(snap, briefingFor) }); await saveGuidance.mutateAsync(['clinic_briefing', briefingFor.id, r.output, r.model]) } catch (e) { setBriefErr((e as Error).message) } finally { setBriefBusy(false) } }; return (
        <Dialog open onClose={() => setBriefingFor(null)} title={`Clinic ${briefingFor.clinicNo} briefing · ${snap.cohorts.find((k) => k.id === briefingFor.cohortId)?.code}`} subtitle="Expert Guidance briefs the human coach before each clinic from learners' evidence, plans and flags." width={760}
          footer={<><Button variant="ghost" onClick={() => setBriefingFor(null)}>Close</Button><Button variant="primary" icon="stars-02" busy={briefBusy} onClick={gen}>{b ? 'Regenerate briefing' : 'Generate briefing'}</Button></>}>
          {briefErr && <Notice tone="error" icon="alert-circle">{briefErr}</Notice>}
          {briefBusy && <p className="text-[13px] text-(--color-muted)">Reading each learner's diagnostic, contract, evidence and notes…</p>}
          {!b && !briefBusy && <p className="text-[13px] text-(--color-muted)">No briefing yet. Generate one to get per-learner status, focus and a suggested question, plus the clinic agenda.</p>}
          {b && (<div className="space-y-4"><p className="font-medium">{b.headline}</p><Notice tone="info" icon="users-01">Line managers of these learners receive the same status summary before the clinic, so the manager and the coach act on one picture.</Notice><ul className="divide-y divide-(--color-border)">{b.learners.map((l, i) => <li key={i} className="py-2"><div className="font-medium">{l.personaName} <span className="font-normal text-(--color-muted)">· {l.status}</span></div><div className="text-[13px]"><span className="text-(--color-muted)">Focus: </span>{l.focus}</div><div className="text-[13px]"><span className="text-(--color-muted)">Ask: </span>{l.suggestedQuestion}</div></li>)}</ul><div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Agenda</div><ol className="list-decimal pl-4 text-[13px]">{b.agenda.map((a, i) => <li key={i}>{a}</li>)}</ol></div><p className="text-[12px] text-(--color-faint)">Generated {fmtDate(note!.createdAt, true)} · {note!.model}</p></div>)}
        </Dialog>) })()}
      <Dialog open={!!noteFor} onClose={() => setNoteFor(null)} title="Add coaching note" subtitle={noteFor ? personaName(snap, learners.find((e) => e.id === noteFor)?.personaId) : ''}
        footer={<><Button variant="ghost" onClick={() => setNoteFor(null)}>Cancel</Button><Button variant="primary" busy={addNote.isPending} onClick={async () => { if (!note.trim()) { setErr('Write the note.'); return } await addNote.mutateAsync([noteFor!, note, clinicId || null]); setNoteFor(null) }}>Save note</Button></>}>
        <div className="space-y-3">
          <Notice tone="info" icon="info-circle">The learner sees this note on their journey and receives an update.</Notice>
          <Field label="Clinic (optional)">{(id) => <select id={id} className="field-input" value={clinicId} onChange={(e) => setClinicId(e.target.value)}><option value="">Not linked to a clinic</option>{clinics.map((c) => <option key={c.id} value={c.id}>Clinic {c.clinicNo} · {snap.cohorts.find((k) => k.id === c.cohortId)?.code}</option>)}</select>}</Field>
          <Field label="Note" required error={err ?? undefined}>{(id) => <textarea id={id} className="field-input" rows={4} value={note} onChange={(e) => { setErr(null); setNote(e.target.value) }} data-autofocus />}</Field>
        </div>
      </Dialog>
    </>
  )
}
