import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { matchRole, personaName, type MatchState } from '@/domain/selectors'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Button, Dialog, Notice, DL, type Tone } from '@/components/ui'
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
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const roles = [...snap.marketplaceRoles].sort((a, b) => matchRole(snap, b, actor.id).percent - matchRole(snap, a, actor.id).percent)
  const mine = snap.marketplaceInterests.filter((i) => i.personaId === actor.id)
  return (
    <>
      <PageHeader title="Talent marketplace" description="Open roles, projects and gigs allocated by verified skills. Each requirement shows your evidence from the passport. The match percentage counts requirements you meet; it is directional, not a decision." />
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
            {actor.role !== 'learner' && <Notice tone="neutral" icon="info-circle">Expressing interest is available to employees in the learner persona. Posting owners see interest in their <Link to="/notifications">updates</Link>.</Notice>}
          </div>
        </Dialog>) })()}
    </>
  )
}
