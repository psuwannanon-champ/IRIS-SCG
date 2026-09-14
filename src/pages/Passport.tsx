import { Link, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useAction } from '@/app/data'
import { Button, Dialog, Field } from '@/components/ui'
import type { Enrollment } from '@/domain/types'
import { useActor } from '@/app/actor'
import { bestEntry } from '@/domain/selectors'
import { ROLE_LADDERS, nextLevel } from '@/data/strategy-content'
import { lastSuccess } from '@/features/integrations/connectors'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Notice, DL } from '@/components/ui'
import { TIER_LABEL, ROLE_LABEL } from '@/domain/types'
import { tierTone } from '@/domain/status'
import { fmtDate } from '@/lib/format'

export function PassportPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const search = useSearch({ strict: false }) as { persona?: string }
  const [outcome, setOutcome] = useState<{ e: Enrollment; rating: string; top: boolean; fast: boolean } | null>(null)
  const saveOutcome = useAction((ds, eid: string, rating: string | null, top: boolean, fast: boolean) => ds.setProgramOutcome(actor!.id, eid, rating, top, fast), 'Program outcome recorded and the learner notified.')
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
            {enr.length === 0 ? <p className="text-[13px] text-(--color-muted)">No programs yet.</p> : <ul className="space-y-2 text-[13px]">{enr.map((e) => { const c = snap.cohorts.find((k) => k.id === e.cohortId)!; const may = actor.role === 'program_office' || e.managerId === actor.id || e.sponsorId === actor.id; return <li key={e.id}><div className="flex items-center justify-between gap-2"><div className="font-medium">{c.name}</div>{may && ['showcase', 'graduated'].includes(e.status) && <Button size="sm" onClick={() => setOutcome({ e, rating: e.impactRating ?? '', top: e.topDecile, fast: e.fastTrackBcd })}>Record outcome</Button>}</div><div className="flex flex-wrap gap-1 pt-1">{e.impactRating && <Pill tone="success">Impact rating: {e.impactRating.replace('_', ' ')}</Pill>}{e.topDecile && <Pill tone="primary">Top ~10%</Pill>}{e.fastTrackBcd && <Pill tone="accent">BCD fast-track</Pill>}{!e.impactRating && !e.topDecile && <Pill>{e.status.replace('_', ' ')}</Pill>}</div></li> })}</ul>}
            {outcome && (
              <Dialog open onClose={() => setOutcome(null)} title="Record program outcome" subtitle="Week 14 system trigger: impact rating feeds the performance review; top ~10% are fast-tracked to BCD and prioritised for stretch assignments."
                footer={<><Button variant="ghost" onClick={() => setOutcome(null)}>Cancel</Button><Button variant="primary" busy={saveOutcome.isPending} onClick={async () => { await saveOutcome.mutateAsync([outcome.e.id, outcome.rating || null, outcome.top, outcome.fast]); setOutcome(null) }}>Save outcome</Button></>}>
                <div className="space-y-3">
                  <Field label="Impact rating">{(fid) => <select id={fid} className="field-input" value={outcome.rating} onChange={(e) => setOutcome({ ...outcome, rating: e.target.value })}><option value="">Not rated</option><option value="exceptional">Exceptional</option><option value="strong">Strong</option><option value="on_track">On track</option><option value="needs_support">Needs support</option></select>}</Field>
                  <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={outcome.top} onChange={(e) => setOutcome({ ...outcome, top: e.target.checked })} />Top ~10% of the cohort</label>
                  <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={outcome.fast} onChange={(e) => setOutcome({ ...outcome, fast: e.target.checked })} />Fast-track to BCD and priority for stretch assignments</label>
                </div>
              </Dialog>
            )}
          </Section>
          {(() => { const ladder = ROLE_LADDERS.find((l) => l.match(subject.jobTitle, subject.functionType)); const lvl = nextLevel(subject.level); const reqs = ladder?.levels[lvl]; return (
            <Section title={`Role requirements · next level ${lvl}`} icon="flag-01" description={ladder ? `Published skill requirements for ${ladder.family} at ${lvl} (proposed configuration, to be confirmed by CHR). Promotion cases cite passport evidence.` : 'No role ladder configured for this job family yet.'} tour="passport-requirements">
              {!reqs ? <p className="text-[13px] text-(--color-muted)">Requirements for {lvl} are not configured.</p> : (
                <ul className="divide-y divide-(--color-border)">
                  {reqs.map((r) => { const sk = snap.skills.find((s) => s.id === r.skillId)!; const best = bestEntry(entries, r.skillId); const state = !best ? 'Not assessed' : best.level >= r.minLevel && best.tier === 'outcome_verified' ? 'Meets requirement' : best.level >= r.minLevel ? 'Level met · verification pending' : 'Needs development'; const t = state === 'Meets requirement' ? 'success' : state === 'Not assessed' ? 'neutral' : state.startsWith('Level met') ? 'info' : 'warning'; return (
                    <li key={r.skillId} className="flex items-center justify-between gap-2 py-2 text-[13px]"><div className="min-w-0"><div className="truncate font-medium">{sk.name}</div><div className="text-[12px] text-(--color-muted)">Required L{r.minLevel} verified · you: {best ? `L${best.level} (${TIER_LABEL[best.tier]})` : 'no evidence'}</div></div><Pill tone={t}>{state}</Pill></li>) })}
                </ul>
              )}
              <p className="mt-2 text-[12px] text-(--color-faint)">Meets requirement needs an outcome-verified badge at or above the required level. Missing evidence is not a failure; close it through ABC / BCD or verification at work.</p>
            </Section>) })()}
          <Section title="Where this passport is used" icon="link-external-01">
            {(() => { const hr = lastSuccess(snap, 'hr_core'); const unsynced = verified.filter((r) => !hr || r.best.mintedAt > hr.finishedAt).length; return <ul className="space-y-1 text-[13px]"><li><Link to="/marketplace">Talent marketplace</Link>: roles, projects and gigs matched on verified skills.</li><li>Promotion cases cite passport evidence (policy pack, People Committee).</li><li>HR core talent profile: {hr ? <>last synced {fmtDate(hr.finishedAt)}{unsynced ? ` · ${unsynced} badge${unsynced === 1 ? '' : 's'} waiting for the next sync` : ' · up to date'}</> : 'not synced yet'} <span className="text-(--color-faint)">(simulated connector)</span>.</li></ul> })()}
          </Section>
        </div>
      </div>
    </>
  )
}
