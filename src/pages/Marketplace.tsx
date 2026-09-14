import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { matchRole, personaName, type MatchState } from '@/domain/selectors'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Button, Dialog, Notice, DL, Field, type Tone } from '@/components/ui'
import { fmtDate } from '@/lib/format'
import { TIER_LABEL } from '@/domain/types'
import type { MarketplaceRole } from '@/domain/types'

const STATE: Record<MatchState, { label: string; tone: Tone; icon: string }> = {
  meets: { label: 'Meets requirement', tone: 'success', icon: 'check-circle' },
  needs_development: { label: 'Needs development', tone: 'warning', icon: 'trend-up-01' },
  not_assessed: { label: 'Not assessed', tone: 'neutral', icon: 'help-circle' },
  not_configured: { label: 'Requirement not configured', tone: 'error', icon: 'alert-triangle' },
}
const KIND: Record<string, string> = { role: 'Role', project: 'Project', gig: 'Gig' }

export function MarketplacePage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [open, setOpen] = useState<MarketplaceRole | null>(null)
  const interest = useAction((ds, roleId: string) => ds.expressInterest(actor!.id, roleId), 'Interest recorded. The posting owner has been notified.')
  const decide = useAction((ds, interestId: string, s: 'shortlisted' | 'declined') => ds.updateInterest(actor!.id, interestId, s), 'Candidate updated and notified.')
  const place = useAction((ds, interestId: string) => ds.markInterestPlaced(actor!.id, interestId), 'Placement recorded. Internal mobility updates on the dashboard.')
  const [newOpen, setNewOpen] = useState(false)
  const [np, setNp] = useState<{ title: string; kind: 'role' | 'project' | 'gig'; description: string; openUntil: string; reqs: { skillId: string; minLevel: number }[] }>({ title: '', kind: 'role', description: '', openUntil: '', reqs: [] })
  const createRole = useAction((ds) => ds.createMarketplaceRole(actor!.id, { title: np.title, buId: actor!.buId, kind: np.kind, description: np.description, openUntil: np.openUntil, requirements: np.reqs }), 'Posting published.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const roles = [...snap.marketplaceRoles].sort((a, b) => matchRole(snap, b, actor.id).percent - matchRole(snap, a, actor.id).percent)
  const mine = snap.marketplaceInterests.filter((i) => i.personaId === actor.id)
  return (
    <>
      <PageHeader title="Talent marketplace" description="Open roles, projects and gigs allocated by verified skills. Each requirement shows your evidence from the passport. The match percentage counts requirements you meet; it is directional, not a decision." actions={['bu_sponsor', 'line_manager', 'program_office'].includes(actor.role) && <Button variant="primary" icon="plus" onClick={() => setNewOpen(true)}>New posting</Button>} />
      <Dialog open={newOpen} onClose={() => setNewOpen(false)} title="New marketplace posting" subtitle="Publish role-level skill requirements transparently; interest is matched on verified passport skills." width={720}
        footer={<><Button variant="ghost" onClick={() => setNewOpen(false)}>Cancel</Button><Button variant="primary" busy={createRole.isPending} disabled={!np.title.trim() || !np.openUntil || np.reqs.length === 0} onClick={async () => { await createRole.mutateAsync([]); setNewOpen(false) }}>Publish posting</Button></>}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Title" required>{(fid) => <input id={fid} className="field-input" value={np.title} onChange={(e) => setNp({ ...np, title: e.target.value })} data-autofocus />}</Field><Field label="Kind">{(fid) => <select id={fid} className="field-input" value={np.kind} onChange={(e) => setNp({ ...np, kind: e.target.value as 'role' | 'project' | 'gig' })}><option value="role">Role</option><option value="project">Project</option><option value="gig">Gig</option></select>}</Field></div>
          <Field label="Description">{(fid) => <textarea id={fid} className="field-input" value={np.description} onChange={(e) => setNp({ ...np, description: e.target.value })} />}</Field>
          <Field label="Open until" required>{(fid) => <input id={fid} type="date" className="field-input max-w-xs" value={np.openUntil} onChange={(e) => setNp({ ...np, openUntil: e.target.value })} />}</Field>
          <Field label="Skill requirements (verified level)" required hint="Pick the skills and minimum level; candidates see Meets / Needs development / Not assessed.">{() => <ul className="grid gap-1 sm:grid-cols-2">{snap.skills.map((s) => { const r = np.reqs.find((x) => x.skillId === s.id); return <li key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-(--color-border) px-2 py-1 text-[13px]"><label className="flex min-w-0 items-center gap-2"><input type="checkbox" checked={!!r} onChange={() => setNp({ ...np, reqs: r ? np.reqs.filter((x) => x.skillId !== s.id) : [...np.reqs, { skillId: s.id, minLevel: 3 }] })} /><span className="truncate">{s.code} · {s.name}</span></label>{r && <select aria-label="Minimum level" className="field-input h-7 w-16 px-1" value={r.minLevel} onChange={(e) => setNp({ ...np, reqs: np.reqs.map((x) => x.skillId === s.id ? { ...x, minLevel: Number(e.target.value) } : x) })}>{[1, 2, 3, 4].map((l) => <option key={l} value={l}>L{l}</option>)}</select>}</li> })}</ul>}</Field>
        </div>
      </Dialog>
      <Section>
        {roles.length === 0 ? <EmptyState icon="briefcase-01" title="No open postings" /> : (
          <ul className="divide-y divide-(--color-border)">
            {roles.map((r) => { const m = matchRole(snap, r, actor.id); const my = mine.find((i) => i.roleId === r.id); return (
              <li key={r.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] py-3 xl:grid-cols-[minmax(0,2.2fr)_90px_minmax(0,1.6fr)_140px_130px]" data-tour="market-row">
                <div className="min-w-0"><button type="button" className="text-left font-medium text-(--color-accent) hover:text-(--color-primary)" onClick={() => setOpen(r)}>{r.title}</button><div className="truncate text-[12px] text-(--color-muted)">{snap.businessUnits.find((b) => b.id === r.buId)?.code} · owner {personaName(snap, r.ownerId)} · open until {fmtDate(r.openUntil)}</div></div>
                <div className="hidden xl:block"><Pill>{KIND[r.kind]}</Pill></div>
                <div className="hidden flex-wrap gap-1 xl:flex">{m.rows.map((row) => <Pill key={row.requirement.skillId} tone={STATE[row.state].tone} icon={STATE[row.state].icon} title={`${row.skill?.name ?? 'Unknown skill'}: ${STATE[row.state].label}`}>{row.skill?.code ?? '?'} L{row.requirement.minLevel}</Pill>)}</div>
                <div className="text-[13px]"><span className="font-semibold">{m.meets} of {m.total}</span> met <span className="text-(--color-faint)">({m.percent}%)</span></div>
                <div className="col-span-2 flex flex-wrap justify-start gap-1 xl:col-span-1 xl:justify-end">
                  <Button size="sm" onClick={() => setOpen(r)}>View details</Button>
                  {my ? <Pill tone={my.status === 'shortlisted' ? 'success' : 'info'}>{my.status}</Pill> : null}
                </div>
              </li>) })}
          </ul>
        )}
      </Section>
      {open && (() => { const m = matchRole(snap, open, actor.id); const my = mine.find((i) => i.roleId === open.id); return (
        <Dialog open onClose={() => setOpen(null)} title={open.title} subtitle={`${KIND[open.kind]} · ${snap.businessUnits.find((b) => b.id === open.buId)?.name}`} width={720}
          footer={<><Button variant="ghost" onClick={() => setOpen(null)}>Close</Button>{!my && actor.role === 'learner' && <Button variant="primary" busy={interest.isPending} onClick={async () => { await interest.mutateAsync([open.id]); setOpen(null) }}>Express interest</Button>}</>}>
          <div className="space-y-4">
            <p>{open.description}</p>
            <DL cols={2} items={[{ label: 'Owner', value: personaName(snap, open.ownerId) }, { label: 'Open until', value: fmtDate(open.openUntil) }]} />
            <div>
              <div className="mb-1 text-[13px] font-medium">Requirements and your evidence</div>
              <ul className="divide-y divide-(--color-border) rounded-md border border-(--color-border)">
                {m.rows.map((row) => (
                  <li key={row.requirement.skillId} className="table-grid grid-cols-[minmax(0,1fr)_auto] px-3 py-2 sm:grid-cols-[minmax(0,1.6fr)_90px_minmax(0,1.4fr)_170px]">
                    <div className="min-w-0"><div className="truncate font-medium">{row.skill?.name ?? 'Unknown skill'}</div><div className="text-[12px] text-(--color-muted)">Required level {row.requirement.minLevel}</div></div>
                    <div className="text-[13px]">{row.best ? `Your L${row.best.level}` : '—'}</div>
                    <div className="hidden text-[12px] text-(--color-muted) sm:block">{row.best ? `${TIER_LABEL[row.best.tier]} · ${fmtDate(row.best.mintedAt)}` : 'No evidence in passport'}</div>
                    <div><Pill tone={STATE[row.state].tone} icon={STATE[row.state].icon}>{STATE[row.state].label}</Pill></div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12px] text-(--color-faint)">{m.meets} of {m.total} requirements met ({m.percent}%). {m.total - m.assessed > 0 ? `${m.total - m.assessed} not assessed: missing evidence is not treated as failure.` : ''} Missing levels can be closed through ABC / BCD or verified at work.</p>
            </div>
            {my && <Notice tone="info" icon="info-circle">You expressed interest on {fmtDate(my.createdAt)}. Status: {my.status}.</Notice>}
            {open.ownerId === actor.id && (() => { const cands = snap.marketplaceInterests.filter((i) => i.roleId === open.id); return (
              <div><div className="mb-1 text-[13px] font-medium">Candidates ({cands.length})</div>{cands.length === 0 ? <p className="text-[13px] text-(--color-muted)">No interest yet.</p> : <ul className="divide-y divide-(--color-border) rounded-md border border-(--color-border)">{cands.map((i) => { const mm = matchRole(snap, open, i.personaId); return <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[13px]"><div><Link to="/passport" search={{ persona: i.personaId } as never} className="font-medium">{personaName(snap, i.personaId)}</Link> <span className="text-(--color-muted)">· meets {mm.meets} of {mm.total} · {fmtDate(i.createdAt)}</span></div><div className="flex items-center gap-1"><Pill tone={i.status === 'shortlisted' ? 'success' : i.status === 'declined' ? 'error' : 'info'}>{i.status}</Pill>{i.status === 'expressed' && <><Button size="sm" variant="primary" onClick={() => decide.mutate([i.id, 'shortlisted'])}>Shortlist</Button><Button size="sm" variant="danger" onClick={() => decide.mutate([i.id, 'declined'])}>Decline</Button></>}{i.status === 'shortlisted' && <Button size="sm" variant="primary" busy={place.isPending} onClick={() => place.mutate([i.id])}>Record placement</Button>}</div></li> })}</ul>}</div>) })()}
            {actor.role !== 'learner' && <Notice tone="neutral" icon="info-circle">Expressing interest is available to employees in the learner persona. Posting owners see interest in their <Link to="/notifications">updates</Link>.</Notice>}
          </div>
        </Dialog>) })()}
    </>
  )
}
