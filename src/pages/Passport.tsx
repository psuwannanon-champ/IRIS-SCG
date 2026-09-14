import { Link, useSearch } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { bestEntry } from '@/domain/selectors'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Notice, DL } from '@/components/ui'
import { TIER_LABEL, ROLE_LABEL } from '@/domain/types'
import { tierTone } from '@/domain/status'
import { fmtDate } from '@/lib/format'

export function PassportPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const search = useSearch({ strict: false }) as { persona?: string }
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const targetId = search.persona || actor.id
  const subject = snap.personas.find((p) => p.id === targetId)
  if (!subject) return <EmptyState title="Person not found" />
  const allowed = subject.id === actor.id || ['program_office', 'committee', 'bu_sponsor'].includes(actor.role) || (actor.role === 'line_manager' && subject.managerId === actor.id) || (actor.role === 'coach' && snap.enrollments.some((e) => e.personaId === subject.id && e.coachId === actor.id))
  if (!allowed) return <Notice tone="warning" icon="lock-01">You can open your own passport and those of people you manage, sponsor or coach.</Notice>
  const entries = snap.passportEntries.filter((p) => p.personaId === subject.id)
  const skillIds = Array.from(new Set(entries.map((e) => e.skillId)))
  const rows = skillIds.map((sid) => ({ skill: snap.skills.find((s) => s.id === sid)!, best: bestEntry(entries, sid)!, history: entries.filter((e) => e.skillId === sid).sort((a, b) => b.mintedAt.localeCompare(a.mintedAt)) }))
    .sort((a, b) => (b.best.tier === 'outcome_verified' ? 1 : 0) - (a.best.tier === 'outcome_verified' ? 1 : 0) || b.best.level - a.best.level)
  const verified = rows.filter((r) => r.best.tier === 'outcome_verified')
  const enr = snap.enrollments.filter((e) => e.personaId === subject.id)
  const bu = snap.businessUnits.find((b) => b.id === subject.buId)
  return (
    <>
      <PageHeader kicker={subject.id === actor.id ? 'Your skill passport' : 'Skill passport'} title={subject.fullName} description={`${subject.jobTitle} · ${bu?.code} · ${ROLE_LABEL[subject.role]}. Verified skills are the common currency for progression, key-talent allocation, project assignment and the marketplace.`} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface px-3 py-2.5"><div className="text-xs font-medium text-(--color-muted)">Outcome-verified skills</div><div className="text-lg font-semibold text-(--color-primary)">{verified.length}</div><div className="text-xs text-(--color-faint)">Minted from showcases and gates</div></div>
        <div className="surface px-3 py-2.5"><div className="text-xs font-medium text-(--color-muted)">AI-inferred or self-declared</div><div className="text-lg font-semibold">{rows.length - verified.length}</div><div className="text-xs text-(--color-faint)">Baseline from diagnostics</div></div>
        <div className="surface px-3 py-2.5"><div className="text-xs font-medium text-(--color-muted)">Premium-eligible verified skills</div><div className="text-lg font-semibold">{verified.filter((r) => r.skill.premiumEligible).length}</div><div className="text-xs text-(--color-faint)">Considered in the merit cycle (policy outside platform)</div></div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section title="Skills and verification tier" icon="award-01" description="Highest level held per skill. Outcome-verified badges come from sponsor-validated showcases and positive gate decisions." id="passport-skills">
          <div data-tour="passport-list">
          {rows.length === 0 ? <EmptyState icon="award-01" title="No skills recorded yet" body="Levels are written after the AI diagnostic; badges mint after a validated showcase or gate." /> : (
            <ul className="divide-y divide-(--color-border)">
              {rows.map((r) => (
                <li key={r.skill.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] py-2.5 sm:grid-cols-[minmax(0,2fr)_70px_150px_minmax(0,1.4fr)]">
                  <div className="min-w-0"><div className="truncate font-medium">{r.skill.name}</div><div className="truncate text-[12px] text-(--color-muted)">{snap.skillDomains.find((d) => d.id === r.skill.domainId)?.name}{r.skill.premiumEligible ? ' · premium-eligible' : ''}</div></div>
                  <div><Pill tone="accent">Level {r.best.level}</Pill></div>
                  <div><Pill tone={tierTone[r.best.tier]} icon={r.best.tier === 'outcome_verified' ? 'check-verified-01' : undefined}>{TIER_LABEL[r.best.tier]}</Pill></div>
                  <div className="hidden text-[12px] text-(--color-muted) sm:block">{r.best.badgeCode ? <>Badge {r.best.badgeCode} · {fmtDate(r.best.mintedAt)}</> : <>From {r.best.sourceType} · {fmtDate(r.best.mintedAt)}</>}{r.history.length > 1 && <> · {r.history.length} entries</>}</div>
                </li>
              ))}
            </ul>
          )}
          </div>
          <p className="mt-2 text-[12px] text-(--color-faint)">Tiers: self-declared → AI-inferred → outcome-verified. Levels: 1 Aware · 2 Practising · 3 Proficient · 4 Leading.</p>
        </Section>
        <div className="space-y-4">
          <Section title="Talent profile" icon="user-01">
            <DL cols={1} items={[{ label: 'Level', value: subject.level }, { label: 'Function type', value: subject.functionType === 'business' ? 'Business function' : 'Enabling function' }, { label: 'Career aspiration', value: subject.careerAspiration ?? 'Not provided' }, { label: 'Line manager', value: snap.personas.find((p) => p.id === subject.managerId)?.fullName ?? 'Not provided' }]} />
          </Section>
          <Section title="Program outcomes" icon="trophy-01" description="Standing inputs to talent reviews and succession.">
            {enr.length === 0 ? <p className="text-[13px] text-(--color-muted)">No programs yet.</p> : <ul className="space-y-2 text-[13px]">{enr.map((e) => { const c = snap.cohorts.find((k) => k.id === e.cohortId)!; return <li key={e.id}><div className="font-medium">{c.name}</div><div className="flex flex-wrap gap-1 pt-1">{e.impactRating && <Pill tone="success">Impact rating: {e.impactRating.replace('_', ' ')}</Pill>}{e.topDecile && <Pill tone="primary">Top ~10%</Pill>}{e.fastTrackBcd && <Pill tone="accent">BCD fast-track</Pill>}{!e.impactRating && !e.topDecile && <Pill>{e.status.replace('_', ' ')}</Pill>}</div></li> })}</ul>}
          </Section>
          <Section title="Where this passport is used" icon="link-external-01">
            <ul className="space-y-1 text-[13px]"><li><Link to="/marketplace">Talent marketplace</Link>: roles, projects and gigs matched on verified skills.</li><li>Promotion cases cite passport evidence (policy pack, People Committee).</li><li>Sync to the HR core talent profile: proposed integration, not connected in this prototype.</li></ul>
          </Section>
        </div>
      </div>
    </>
  )
}
