import { useState } from 'react'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { Button, Dialog, Field, Notice } from '@/components/ui'
import { personaName } from '@/domain/selectors'
import type { Cohort, ChallengeBrief } from '@/domain/types'

export function CreateCohortButton() {
  const { snap, actor } = useActor()
  const [open, setOpen] = useState(false)
  const [v, setV] = useState({ program: 'ABC' as 'ABC' | 'BCD', code: '', name: '', buId: '', startDate: '', seats: 30, pipeline: '', coachId: '' })
  const create = useAction((ds) => ds.createCohort(actor!.id, { program: v.program, code: v.code, name: v.name, buId: v.buId || null, startDate: v.startDate, seats: Number(v.seats), pipelineTargetThb: v.pipeline ? Number(v.pipeline) : null, coachId: v.coachId || null }), 'Cohort created from the playbook template.')
  if (!snap || actor?.role !== 'program_office') return null
  return (
    <>
      <Button variant="primary" icon="plus" onClick={() => setOpen(true)}>New cohort</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="New cohort" subtitle="Key dates, clinics and gates are generated from the ABC / BCD playbook so any BU can run the accelerator without redesign."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" busy={create.isPending} disabled={!v.code || !v.name || !v.startDate} onClick={async () => { await create.mutateAsync([]); setOpen(false) }}>Create cohort</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Program" required>{(id) => <select id={id} className="field-input" value={v.program} onChange={(e) => setV({ ...v, program: e.target.value as 'ABC' | 'BCD' })}><option value="ABC">ABC · skills-first accelerator (12 weeks)</option><option value="BCD">BCD · competitiveness accelerator (16 weeks)</option></select>}</Field>
          <Field label="Start date" required hint={v.program === 'ABC' ? 'Diagnostic opens; labs +2 weeks; sprint +3 weeks; showcase +15 weeks.' : 'Challenge sourcing; Gate 1 at +12 weeks; Gate 2 at +20 weeks.'}>{(id) => <input id={id} type="date" className="field-input" value={v.startDate} onChange={(e) => setV({ ...v, startDate: e.target.value })} />}</Field>
          <Field label="Code" required>{(id) => <input id={id} className="field-input" placeholder="ABC-2027-02" value={v.code} onChange={(e) => setV({ ...v, code: e.target.value })} data-autofocus />}</Field>
          <Field label="Name" required>{(id) => <input id={id} className="field-input" placeholder="ABC Batch 2/2027 · SCGP" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />}</Field>
          <Field label="Business unit" hint="Leave empty for a cross-BU cohort.">{(id) => <select id={id} className="field-input" value={v.buId} onChange={(e) => setV({ ...v, buId: e.target.value })}><option value="">Cross-BU</option>{snap.businessUnits.filter((b) => b.id !== 'bu-corp').map((b) => <option key={b.id} value={b.id}>{b.code} · {b.name}</option>)}</select>}</Field>
          <Field label="Seats">{(id) => <input id={id} type="number" min={1} className="field-input" value={v.seats} onChange={(e) => setV({ ...v, seats: Number(e.target.value) })} />}</Field>
          <Field label="THB pipeline target">{(id) => <input id={id} type="number" step="1000000" className="field-input" value={v.pipeline} onChange={(e) => setV({ ...v, pipeline: e.target.value })} />}</Field>
          <Field label="Certified coach" hint={v.program === 'ABC' ? 'Creates clinic 1 and 2 for this coach.' : 'Assigned when teams are formed.'}>{(id) => <select id={id} className="field-input" value={v.coachId} onChange={(e) => setV({ ...v, coachId: e.target.value })}><option value="">Not assigned yet</option>{snap.personas.filter((p) => p.role === 'coach').map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select>}</Field>
        </div>
      </Dialog>
    </>
  )
}

export function EnrollLearnerButton({ cohort }: { cohort: Cohort }) {
  const { snap, actor } = useActor()
  const [open, setOpen] = useState(false)
  const [v, setV] = useState({ personaId: '', sponsorId: '', coachId: '' })
  const enroll = useAction((ds) => ds.enrollLearner(actor!.id, cohort.id, v.personaId, v.sponsorId || null, v.coachId || null), 'Learner enrolled and invited to the assessment.')
  if (!snap || actor?.role !== 'program_office') return null
  const enrolled = new Set(snap.enrollments.filter((e) => e.cohortId === cohort.id).map((e) => e.personaId))
  const candidates = snap.personas.filter((p) => p.role === 'learner' && !enrolled.has(p.id) && (!cohort.buId || p.buId === cohort.buId))
  return (
    <>
      <Button size="sm" variant="primary" icon="user-plus-01" onClick={() => setOpen(true)}>Enrol learner</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Enrol learner · ${cohort.code}`} subtitle="Baseline the organisation in waves: the learner is invited and asked to complete the AI skill diagnostic."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" busy={enroll.isPending} disabled={!v.personaId} onClick={async () => { await enroll.mutateAsync([]); setOpen(false); setV({ personaId: '', sponsorId: '', coachId: '' }) }}>Enrol and invite</Button></>}>
        <div className="space-y-3">
          <Notice tone="info" icon="info-circle">{snap.enrollments.filter((e) => e.cohortId === cohort.id).length} of {cohort.seats} seats used. The learner's line manager is taken from the talent profile.</Notice>
          <Field label="Learner" required>{(id) => <select id={id} className="field-input" value={v.personaId} onChange={(e) => setV({ ...v, personaId: e.target.value })} data-autofocus><option value="">Choose a person</option>{candidates.map((p) => <option key={p.id} value={p.id}>{p.fullName} · {p.jobTitle}</option>)}</select>}</Field>
          <Field label="BU sponsor">{(id) => <select id={id} className="field-input" value={v.sponsorId} onChange={(e) => setV({ ...v, sponsorId: e.target.value })}><option value="">Not assigned</option>{snap.personas.filter((p) => p.role === 'bu_sponsor').map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select>}</Field>
          <Field label="Coach">{(id) => <select id={id} className="field-input" value={v.coachId} onChange={(e) => setV({ ...v, coachId: e.target.value })}><option value="">Not assigned</option>{snap.personas.filter((p) => p.role === 'coach').map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select>}</Field>
        </div>
      </Dialog>
    </>
  )
}

export function FormTeamButton({ brief }: { brief: ChallengeBrief }) {
  const { snap, actor } = useActor()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [members, setMembers] = useState<string[]>([])
  const [coachId, setCoachId] = useState('')
  const form = useAction((ds) => ds.formTeam(actor!.id, brief.id, name, members, coachId || null), 'Team formed. The concept is in Stage 1: frame.')
  if (!snap || actor?.role !== 'program_office' || brief.status !== 'assigned' || !brief.cohortId) return null
  if (snap.concepts.some((c) => c.briefId === brief.id)) return null
  const free = snap.enrollments.filter((e) => e.cohortId === brief.cohortId && !e.teamId && e.status !== 'withdrawn')
  return (
    <>
      <Button size="sm" variant="primary" icon="users-plus" onClick={() => setOpen(true)}>Form team</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Form team · ${brief.title}`} subtitle="Cross-BU team forms around the chosen challenge; the concept enters Stage 1 and Gate 1 / Gate 2 reviews are scheduled from the cohort calendar."
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" busy={form.isPending} disabled={!name.trim() || members.length === 0} onClick={async () => { await form.mutateAsync([]); setOpen(false) }}>Form team</Button></>}>
        <div className="space-y-3">
          <Field label="Team name" required>{(id) => <input id={id} className="field-input" value={name} onChange={(e) => setName(e.target.value)} data-autofocus />}</Field>
          <Field label="Members (enrolled learners without a team)" required>{() => free.length === 0 ? <p className="text-[13px] text-(--color-muted)">No free learners in this cohort. Enrol learners first.</p> : <ul className="grid gap-1 sm:grid-cols-2">{free.map((e) => { const p = snap.personas.find((x) => x.id === e.personaId)!; const on = members.includes(e.id); return <li key={e.id}><label className={`surface brand-ring flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] ${on ? 'bg-(--color-primary-soft)' : ''}`} data-selected={on}><input type="checkbox" checked={on} onChange={() => setMembers(on ? members.filter((m) => m !== e.id) : [...members, e.id])} />{p.fullName} <span className="text-(--color-muted)">· {snap.businessUnits.find((b) => b.id === p.buId)?.code}</span></label></li> })}</ul>}</Field>
          <Field label="Certified coach">{(id) => <select id={id} className="field-input" value={coachId} onChange={(e) => setCoachId(e.target.value)}><option value="">Not assigned</option>{snap.personas.filter((p) => p.role === 'coach').map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select>}</Field>
          <p className="text-[12px] text-(--color-faint)">Sponsor: {personaName(snap, brief.sponsorId)}. Members are notified and see the concept on Concepts &amp; gates.</p>
        </div>
      </Dialog>
    </>
  )
}
