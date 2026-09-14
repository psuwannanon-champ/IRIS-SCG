import { useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { visibleBriefs, personaName } from '@/domain/selectors'
import { availableBriefActions } from '@/data/rules'
import { BRIEF_STATUS_LABEL, CHALLENGE_TYPE_LABEL, type BriefStatus, type ChallengeBrief, type ChallengeType } from '@/domain/types'
import { briefTone, briefResponsible } from '@/domain/status'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pagination, paginate, Pill, Button, Dialog, Field, DL, Notice } from '@/components/ui'
import { History, Money } from '@/components/records'
import { fmtDate, fmtThb, orNotProvided } from '@/lib/format'
import { Icon } from '@/icons/Icon'
import type { BriefAction, BriefActionPayload } from '@/data/datasource'

export function BriefsPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [themeOpen, setThemeOpen] = useState(false)
  const [theme, setTheme] = useState({ title: '', description: '' })
  const saveTheme = useAction((ds) => ds.saveTheme(actor!.id, actor!.buId, theme.title, theme.description, 2027), 'Theme set for the 2027 intake.')
  const search = useSearch({ strict: false }) as { status?: string; page?: number }
  const nav = useNavigate()
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const all = visibleBriefs(snap, actor)
  const filtered = all.filter((b) => !search.status || b.status === search.status)
  const rank = (b: ChallengeBrief) => (availableBriefActions(b, actor).length ? 0 : 1)
  const sorted = [...filtered].sort((a, b) => rank(a) - rank(b) || b.updatedAt.localeCompare(a.updatedAt))
  const pg = paginate(sorted, 10, search.page ?? 1, (p) => nav({ to: '/briefs', search: { status: search.status ?? '', page: p } as never }))
  const byStatus = (s: BriefStatus) => all.filter((b) => b.status === s).length
  return (
    <>
      <PageHeader title="Challenge briefs" description="Sponsor-owned P&L challenges for BCD cohorts: growth, cost, service or productivity. The Capability Investment Committee curates the portfolio; approved briefs are assigned to a cohort. Briefs needing your action are listed first."
        actions={actor.role === 'bu_sponsor' && <><Button icon="flag-01" onClick={() => setThemeOpen(true)}>Set BU theme</Button><Link to="/briefs/new" className="btn btn-primary" data-tour="new-brief"><Icon name="plus" size={16} />New challenge brief</Link></>} />
      {actor.role === 'bu_sponsor' && (() => { const mine = snap.challengeThemes.filter((t) => t.buId === actor.buId); return mine.length ? <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[13px]"><span className="text-(--color-muted)">BU themes:</span>{mine.map((t) => <Pill key={t.id} tone="accent" title={t.description}>{t.title} · {t.year}</Pill>)}</div> : null })()}
      <Dialog open={themeOpen} onClose={() => setThemeOpen(false)} title="Set a BU theme" subtitle="BU heads set themes (for example waste reduction, clean energy); sponsors submit briefs under them."
        footer={<><Button variant="ghost" onClick={() => setThemeOpen(false)}>Cancel</Button><Button variant="primary" busy={saveTheme.isPending} disabled={!theme.title.trim()} onClick={async () => { await saveTheme.mutateAsync([]); setThemeOpen(false); setTheme({ title: '', description: '' }) }}>Save theme</Button></>}>
        <div className="space-y-3"><Field label="Theme" required>{(fid) => <input id={fid} className="field-input" value={theme.title} onChange={(e) => setTheme({ ...theme, title: e.target.value })} data-autofocus />}</Field><Field label="Description">{(fid) => <textarea id={fid} className="field-input" value={theme.description} onChange={(e) => setTheme({ ...theme, description: e.target.value })} />}</Field></div>
      </Dialog>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select aria-label="Status" className="field-input max-w-[220px]" value={search.status ?? ''} onChange={(e) => nav({ to: '/briefs', search: { status: e.target.value, page: 1 } as never })}>
          <option value="">All statuses ({all.length})</option>{(Object.keys(BRIEF_STATUS_LABEL) as BriefStatus[]).map((s) => <option key={s} value={s}>{BRIEF_STATUS_LABEL[s]} ({byStatus(s)})</option>)}
        </select>
        <span className="text-[13px] text-(--color-muted)">{filtered.length} of {all.length}</span>
      </div>
      <Section>
        {sorted.length === 0 ? <EmptyState icon="lightbulb-02" title="No challenge briefs match" body={actor.role === 'bu_sponsor' ? 'Create a brief under one of your BU themes. Submit it before the intake deadline (30 Oct 2026).' : 'Briefs appear here once sponsors submit them.'} /> : (
          <>
            <div className="table-grid hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_100px_150px_130px_110px_80px] px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-faint) xl:grid"><div>Brief</div><div>Sponsor</div><div>Type</div><div>Status</div><div>Responsible now</div><div>THB target</div><div className="text-right">Actions</div></div>
            <ul className="divide-y divide-(--color-border)">
              {pg.slice.map((b) => (
                <li key={b.id}><Link to="/briefs/$id" params={{ id: b.id }} className="row-link table-grid grid-cols-[minmax(0,1fr)_auto] px-3 py-2.5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_100px_150px_130px_110px_80px]">
                  <div className="min-w-0"><div className="truncate font-medium">{b.title}</div><div className="truncate text-[12px] text-(--color-muted)">{snap.businessUnits.find((x) => x.id === b.buId)?.code} · {snap.challengeThemes.find((t) => t.id === b.themeId)?.title ?? 'No theme'} · updated {fmtDate(b.updatedAt)}</div></div>
                  <div className="hidden truncate text-[13px] xl:block">{personaName(snap, b.sponsorId)}</div>
                  <div className="hidden text-[13px] xl:block">{CHALLENGE_TYPE_LABEL[b.challengeType]}</div>
                  <div><Pill tone={briefTone[b.status]}>{BRIEF_STATUS_LABEL[b.status]}</Pill></div>
                  <div className="hidden text-[13px] xl:block">{briefResponsible[b.status]}</div>
                  <div className="hidden text-[13px] xl:block">{fmtThb(b.targetValueThb, true)}</div>
                  <div className="hidden text-right text-[13px] font-medium text-(--color-accent) xl:block">View details</div>
                </Link></li>
              ))}
            </ul>
            <Pagination {...pg} />
          </>
        )}
      </Section>
    </>
  )
}

const schema = z.object({
  themeId: z.string().nullable(),
  buId: z.string().min(1, 'Choose the BU whose P&L owns the benefit.'),
  title: z.string().min(8, 'Give the challenge a specific title.'),
  challengeType: z.enum(['growth', 'cost', 'service', 'productivity']),
  problemStatement: z.string().min(30, 'Describe the P&L problem and why it matters now (at least 30 characters).'),
  successMetric: z.string().min(3, 'Name the metric that proves success.'),
  targetValueThb: z.coerce.number().min(0).nullable(),
  constraints: z.string().nullable(),
})
type FormValues = z.output<typeof schema>
type FormInput = z.input<typeof schema>

function BriefForm({ existing, onDone }: { existing?: ChallengeBrief; onDone: (id: string) => void }) {
  const { snap, actor } = useActor()
  const save = useAction((ds, v: FormValues) => ds.saveBrief(actor!.id, { ...v, id: existing?.id, themeId: v.themeId || null }), existing ? 'Brief saved.' : 'Brief created as a draft.')
  const form = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: existing ? { themeId: existing.themeId, buId: existing.buId, title: existing.title, challengeType: existing.challengeType, problemStatement: existing.problemStatement, successMetric: existing.successMetric, targetValueThb: existing.targetValueThb, constraints: existing.constraints } : { themeId: null, buId: actor!.buId, title: '', challengeType: 'cost', problemStatement: '', successMetric: '', targetValueThb: null, constraints: '' } })
  const err = form.formState.errors
  const buId = form.watch('buId')
  const themes = snap!.challengeThemes.filter((t) => t.buId === buId)
  return (
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit(async (v) => { const id = await save.mutateAsync([v]); onDone(id as string) })}>
      <Notice tone="info" icon="info-circle">Briefs are anchored to a BU head theme and a P&L metric. The committee approves briefs that convert capability spend into P&L; unanchored requests are returned.</Notice>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business unit (P&L owner)" required error={err.buId?.message}>{(id) => <select id={id} className="field-input" {...form.register('buId')}>{snap!.businessUnits.filter((b) => b.id !== 'bu-corp').map((b) => <option key={b.id} value={b.id}>{b.code} · {b.name}</option>)}</select>}</Field>
        <Field label="BU theme" hint={themes.length ? 'Set by the BU head for this intake.' : 'No themes set for this BU yet; the brief can still be submitted.'}>{(id) => <select id={id} className="field-input" {...form.register('themeId')}><option value="">No theme</option>{themes.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>}</Field>
      </div>
      <Field label="Challenge title" required error={err.title?.message}>{(id) => <input id={id} className="field-input" {...form.register('title')} data-autofocus />}</Field>
      <Field label="Challenge type" required>{(id) => <select id={id} className="field-input max-w-xs" {...form.register('challengeType')}>{(Object.keys(CHALLENGE_TYPE_LABEL) as ChallengeType[]).map((k) => <option key={k} value={k}>{CHALLENGE_TYPE_LABEL[k]}</option>)}</select>}</Field>
      <Field label="Problem statement" required error={err.problemStatement?.message}>{(id) => <textarea id={id} className="field-input" rows={4} {...form.register('problemStatement')} />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Success metric" required error={err.successMetric?.message}>{(id) => <input id={id} className="field-input" {...form.register('successMetric')} />}</Field>
        <Field label="Target value (THB, annualised)" hint="Counts toward the cohort THB pipeline." error={err.targetValueThb?.message}>{(id) => <input id={id} type="number" step="100000" className="field-input" {...form.register('targetValueThb')} />}</Field>
      </div>
      <Field label="Constraints" hint="Capex limits, partners, timing.">{(id) => <textarea id={id} className="field-input" rows={2} {...form.register('constraints')} />}</Field>
      <div className="flex justify-end"><Button type="submit" variant="primary" busy={save.isPending}>{existing ? 'Save changes' : 'Save draft'}</Button></div>
    </form>
  )
}

export function BriefNewPage() {
  const nav = useNavigate()
  const { status, actor } = useActor()
  if (status !== 'ready') return <LoadingBlock />
  if (actor?.role !== 'bu_sponsor') return <Notice tone="warning">Only BU sponsors create challenge briefs.</Notice>
  return (<><PageHeader kicker="Challenge briefs" title="New challenge brief" description="Saved as a draft. Submit it to the committee from the brief page." /><Section className="max-w-3xl"><BriefForm onDone={(id) => nav({ to: '/briefs/$id', params: { id } })} /></Section></>)
}

export function BriefDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const { snap, actor, status, error, refetch } = useActor()
  const [dialog, setDialog] = useState<null | BriefAction | 'edit'>(null)
  const [note, setNote] = useState('')
  const [cohortId, setCohortId] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const transition = useAction((ds, action: BriefAction, payload: BriefActionPayload) => ds.transitionBrief(actor!.id, id, action, payload))
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const b = snap.challengeBriefs.find((x) => x.id === id)
  if (!b) return <EmptyState title="Brief not found" action={<Link to="/briefs" className="btn btn-secondary">Back to briefs</Link>} />
  if (!visibleBriefs(snap, actor).some((x) => x.id === id)) return <Notice tone="warning" icon="lock-01">You are not connected to this brief.</Notice>
  const actions = availableBriefActions(b, actor)
  const events = snap.recordEvents.filter((e) => e.recordType === 'challenge_brief' && e.recordId === b.id)
  const theme = snap.challengeThemes.find((t) => t.id === b.themeId)
  const cohort = snap.cohorts.find((c) => c.id === b.cohortId)
  const concept = snap.concepts.find((c) => c.briefId === b.id)
  const canEdit = b.sponsorId === actor.id && ['draft', 'returned'].includes(b.status)
  const bcdCohorts = snap.cohorts.filter((c) => c.program === 'BCD' && ['framing', 'planned'].includes(c.status))
  const next: Record<BriefStatus, string> = {
    draft: 'The sponsor completes and submits the brief to the committee.',
    committee_review: 'Waiting for the Capability Investment Committee to approve, return or reject.',
    approved: 'Approved. Waiting for the program office to assign it to a BCD cohort.',
    returned: 'Returned to the sponsor with a note. Edit and resubmit.',
    rejected: 'Rejected with a recorded reason. No further action in this intake.',
    assigned: `Assigned to ${cohort?.name ?? 'a cohort'}. A cross-BU team forms around it and the concept enters Stage 1.`,
    withdrawn: 'Withdrawn by the sponsor.',
  }
  const consequence: Record<BriefAction, string> = {
    submit: 'Committee members are notified and review the brief.',
    withdraw: 'The brief is closed as withdrawn; history stays visible.',
    approve: 'The sponsor is notified and the program office receives a task to assign the brief to a cohort.',
    return: 'The sponsor receives your note and can edit and resubmit.',
    reject: 'The brief is closed with your reason. The sponsor is notified.',
    assign: 'The brief joins the selected cohort portfolio; a team will be formed around it.',
  }
  return (
    <>
      <PageHeader kicker={<><Link to="/briefs">Challenge briefs</Link></> as unknown as string} title={b.title} state={<Pill tone={briefTone[b.status]}>{BRIEF_STATUS_LABEL[b.status]}</Pill>}
        description={<><span className="font-medium text-(--color-text)">Responsible now: {briefResponsible[b.status]}.</span> {next[b.status]}</>} />
      {b.committeeNote && ['returned', 'rejected', 'approved', 'assigned'].includes(b.status) && <div className="mb-4"><Notice tone={b.status === 'returned' || b.status === 'rejected' ? 'error' : 'success'} icon={b.status === 'returned' || b.status === 'rejected' ? 'alert-circle' : 'check-circle'}><strong>Committee note ({personaName(snap, b.reviewedById)}, {fmtDate(b.reviewedAt)}):</strong> {b.committeeNote}</Notice></div>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <Section title="Brief" icon="lightbulb-02" actions={canEdit && <Button size="sm" icon="edit-05" onClick={() => setDialog('edit')}>Edit</Button>}>
            <DL cols={2} items={[
              { label: 'Sponsor', value: personaName(snap, b.sponsorId) },
              { label: 'Business unit (P&L owner)', value: snap.businessUnits.find((x) => x.id === b.buId)?.name },
              { label: 'BU theme', value: theme ? theme.title : 'No theme' },
              { label: 'Challenge type', value: CHALLENGE_TYPE_LABEL[b.challengeType] },
              { label: 'Success metric', value: b.successMetric },
              { label: 'Target value (THB, annualised)', value: <Money v={b.targetValueThb} /> },
              { label: 'Constraints', value: orNotProvided(b.constraints) },
              { label: 'Created', value: fmtDate(b.createdAt) },
            ]} />
            <div className="mt-3"><div className="text-xs font-medium text-(--color-muted)">Problem statement</div><p className="mt-0.5 whitespace-pre-wrap">{b.problemStatement}</p></div>
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="Connected records" icon="git-branch-01">
            <DL cols={1} items={[
              { label: 'Cohort', value: cohort ? <Link to="/cohorts/$id" params={{ id: cohort.id }}>{cohort.name}</Link> : 'Not assigned' },
              { label: 'Concept', value: concept ? <Link to="/concepts/$id" params={{ id: concept.id }}>{concept.title}</Link> : 'No team formed yet' },
            ]} />
          </Section>
          <Section title="History" icon="clock"><History snap={snap} events={events} /></Section>
        </div>
      </div>
      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-(--color-border) bg-(--color-surface) px-4 py-3 sm:-mx-6 sm:px-6" data-tour="brief-actions">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 pr-16">
          <p className="text-[13px] text-(--color-muted)">{actions.length ? 'Decisions are recorded with your name and note.' : `No action for you now. Waiting for ${briefResponsible[b.status].toLowerCase()}.`}</p>
          <div className="flex flex-wrap gap-2">{actions.map((a) => <Button key={a.action} variant={a.negative ? 'danger' : 'primary'} onClick={() => { setNote(''); setErr(null); setDialog(a.action) }}>{a.label}</Button>)}</div>
        </div>
      </div>
      <Dialog open={dialog === 'edit'} onClose={() => setDialog(null)} title="Edit challenge brief" width={760}><BriefForm existing={b} onDone={() => setDialog(null)} /></Dialog>
      {actions.map((a) => (
        <Dialog key={a.action} open={dialog === a.action} onClose={() => setDialog(null)} title={a.label} subtitle={b.title}
          footer={<><Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button><Button variant={a.negative ? 'danger' : 'primary'} busy={transition.isPending} onClick={async () => {
            if (a.requiresNote && !note.trim()) { setErr('A note explaining the decision is required.'); return }
            if (a.action === 'assign' && !cohortId) { setErr('Choose a cohort.'); return }
            await transition.mutateAsync([a.action, { note: note || undefined, cohortId: cohortId || undefined }]); setDialog(null)
          }}>{a.label}</Button></>}>
          <div className="space-y-3">
            <Notice tone={a.negative ? 'error' : 'info'} icon="info-circle"><strong>What happens next:</strong> {consequence[a.action]}</Notice>
            {a.action === 'assign' && <Field label="BCD cohort" required error={err ?? undefined}>{(id) => <select id={id} className="field-input" value={cohortId} onChange={(e) => { setErr(null); setCohortId(e.target.value) }} data-autofocus><option value="">Choose a cohort</option>{bcdCohorts.map((c) => <option key={c.id} value={c.id}>{c.name} · starts {fmtDate(c.startDate)}</option>)}</select>}</Field>}
            {a.action !== 'assign' && <Field label={a.requiresNote ? 'Note to the sponsor' : 'Note (optional)'} required={a.requiresNote} error={err ?? undefined}>{(id) => <textarea id={id} className="field-input" value={note} onChange={(e) => { setErr(null); setNote(e.target.value) }} data-autofocus />}</Field>}
          </div>
        </Dialog>
      ))}
    </>
  )
}
