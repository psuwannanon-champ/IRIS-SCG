import { Link, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useAction } from '@/app/data'
import { requestGuidance, buildTalentReviewContext, type TalentReviewOutput } from '@/features/guidance/api'
import { POOL_LABEL, RECOGNITION_LABEL, type SuccessionPool, type RecognitionKind } from '@/domain/types'
import { personaName } from '@/domain/selectors'
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
  const [rec, setRec] = useState<{ kind: RecognitionKind; note: string } | null>(null)
  const [pool, setPool] = useState<{ pool: SuccessionPool; basis: string; due: string } | null>(null)
  const [trBusy, setTrBusy] = useState(false)
  const [trErr, setTrErr] = useState<string | null>(null)
  const addRec = useAction((ds, kind: RecognitionKind, note: string) => ds.addRecognition(actor!.id, search.persona || actor!.id, kind, note), 'Recognition recorded.')
  const addPool = useAction((ds, p: SuccessionPool, basis: string, due: string | null) => ds.addSuccessionEntry(actor!.id, search.persona || actor!.id, p, basis, due), 'Added to the pool.')
  const fulfil = useAction((ds, id: string) => ds.fulfilSuccession(actor!.id, id), 'Marked fulfilled.')
  const saveTr = useAction((ds, personaId: string, cycle: string, content: TalentReviewOutput, model: string) => ds.saveTalentReview(actor!.id, personaId, cycle, content, model), 'Talent-review pack saved.')
  const setEmployment = useAction((ds, personaId: string, st: 'active' | 'left') => ds.setEmploymentStatus(actor!.id, personaId, st, null), 'Employment status updated.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const targetId = search.persona || actor.id
  const subject = snap.personas.find((p) => p.id === targetId)
  if (!subject) return <EmptyState title="Person not found" />
  const allowed = subject.id === actor.id || ['program_office', 'committee', 'bu_sponsor'].includes(actor.role) || (actor.role === 'line_manager' && subject.managerId === actor.id) || (actor.role === 'coach' && snap.enrollments.some((e) => e.personaId === subject.id && e.coachId === actor.id))
  if (!allowed) return <Notice tone="warning" icon="lock-01">You can open your own passport and those of people you manage, sponsor or coach.</Notice>
  const canGovern = ['program_office', 'committee', 'bu_sponsor'].includes(actor.role)
  const entries = snap.passportEntries.filter((p) => p.personaId === subject.id)
  const skillIds = Array.from(new Set(entries.map((e) => e.skillId)))
  const rows = skillIds.map((sid) => ({ skill: snap.skills.find((s) => s.id === sid)!, best: bestEntry(entries, sid)!, history: entries.filter((e) => e.skillId === sid).sort((a, b) => b.mintedAt.localeCompare(a.mintedAt)) }))
    .sort((a, b) => (b.best.tier === 'outcome_verified' ? 1 : 0) - (a.best.tier === 'outcome_verified' ? 1 : 0) || b.best.level - a.best.level)
  const verified = rows.filter((r) => r.best.tier === 'outcome_verified')
  const enr = snap.enrollments.filter((e) => e.personaId === subject.id)
  const bu = snap.businessUnits.find((b) => b.id === subject.buId)
  return (
    <>
      <PageHeader kicker={subject.id === actor.id ? 'Your skill passport' : 'Skill passport'} title={subject.fullName} description={`${subject.jobTitle} · ${bu?.code} · ${ROLE_LABEL[subject.role]}. Verified skills are the common currency for progression, key-talent allocation, project assignment and the marketplace.`}
        state={<span className="flex flex-wrap items-center gap-1">{subject.employmentStatus === 'left' ? <Pill tone="error">Left SCG{subject.leftAt ? ` ${fmtDate(subject.leftAt)}` : ''}</Pill> : <Pill tone="success">Active</Pill>}{actor.role === 'program_office' && <Button size="sm" variant="ghost" busy={setEmployment.isPending} onClick={() => setEmployment.mutate([subject.id, subject.employmentStatus === 'active' ? 'left' : 'active'])}>{subject.employmentStatus === 'active' ? 'Mark as left' : 'Mark as active'}</Button>}</span>} />
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
            <DL cols={1} items={[{ label: 'Level', value: subject.level }, { label: 'Function type', value: subject.functionType === 'business' ? 'Business function' : 'Enabling function' }, { label: 'Career aspiration', value: subject.careerAspiration ?? 'Not provided' }, { label: 'Role KPIs (engine input)', value: subject.kpis ?? 'Not provided' }, { label: 'Line manager', value: snap.personas.find((p) => p.id === subject.managerId)?.fullName ?? 'Not provided' }]} />
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
          <Section title="Recognition" icon="trophy-01" description="CEO recognition at showcases and Gate 2, impact awards and skill-premium consideration."
            actions={canGovern && <Button size="sm" icon="plus" onClick={() => setRec({ kind: 'ceo_showcase', note: '' })}>Add recognition</Button>}>
            {(() => { const rows = snap.recognitions.filter((r) => r.personaId === subject.id).sort((a, b) => b.givenAt.localeCompare(a.givenAt)); return rows.length === 0 ? <p className="text-[13px] text-(--color-muted)">No recognition recorded yet.</p> : (
              <ul className="space-y-2 text-[13px]">{rows.map((r) => <li key={r.id}><Pill tone="primary" icon="award-01">{RECOGNITION_LABEL[r.kind]}</Pill><div className="mt-0.5">{r.note}</div><div className="text-[12px] text-(--color-faint)">{personaName(snap, r.givenBy)} · {fmtDate(r.givenAt)}</div></li>)}</ul>) })()}
          </Section>

          <Section title="Succession and stretch roles" icon="git-branch-01" description="L2 and L3 pools require verified ABC / BCD skills; Gate-2 winners take incubation leadership within six months."
            actions={canGovern && <Button size="sm" icon="plus" onClick={() => setPool({ pool: 'L3', basis: '', due: '' })}>Add to a pool</Button>}>
            {(() => { const rows = snap.successionEntries.filter((r) => r.personaId === subject.id); return rows.length === 0 ? <p className="text-[13px] text-(--color-muted)">Not in a succession pool.</p> : (
              <ul className="space-y-2 text-[13px]">{rows.map((r) => <li key={r.id} className="flex items-start justify-between gap-2"><div><Pill tone={r.fulfilledAt ? 'success' : 'accent'}>{POOL_LABEL[r.pool]}</Pill><div className="mt-0.5">{r.basis}</div><div className="text-[12px] text-(--color-faint)">Entered {fmtDate(r.enteredAt)}{r.dueBy ? ` · due ${fmtDate(r.dueBy)}` : ''}{r.fulfilledAt ? ` · fulfilled ${fmtDate(r.fulfilledAt)}` : ''}</div></div>{canGovern && !r.fulfilledAt && <Button size="sm" busy={fulfil.isPending} onClick={() => fulfil.mutate([r.id])}>Mark fulfilled</Button>}</li>)}</ul>) })()}
          </Section>

          <Section title="Talent-review pack" icon="clipboard-check" description="Gate results and impact ratings auto-populate the pack that goes into the talent review."
            actions={canGovern && <Button size="sm" icon="stars-02" busy={trBusy} onClick={async () => { setTrBusy(true); setTrErr(null); try { const r = await requestGuidance<TalentReviewOutput>({ kind: 'talent_review', context: buildTalentReviewContext(snap, subject.id) }); await saveTr.mutateAsync([subject.id, `${new Date().getFullYear()} cycle`, r.output, r.model]) } catch (e) { setTrErr((e as Error).message) } finally { setTrBusy(false) } }}>Generate pack</Button>}>
            {trErr && <Notice tone="error" icon="alert-circle">{trErr}</Notice>}
            {(() => { const tr = snap.talentReviews.filter((t) => t.personaId === subject.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]; if (!tr) return <p className="text-[13px] text-(--color-muted)">{canGovern ? 'No pack yet. Generate one from the programme record.' : 'No talent-review pack yet.'}</p>
              const c = tr.content
              return (<div className="space-y-2 text-[13px]">
                <p className="font-medium">{c.headline}</p>
                <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Evidence</div><ul className="list-disc pl-4">{c.evidence.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Strengths</div><ul className="list-disc pl-4">{c.strengths.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                  <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Development</div><ul className="list-disc pl-4">{c.development.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                </div>
                <div><span className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Recommendation </span>{c.recommendation}</div>
                <p className="text-[12px] text-(--color-faint)">{tr.cycle} · generated {fmtDate(tr.createdAt, true)} by {personaName(snap, tr.createdBy)} · {tr.model}. An input to a human decision, never a decision.</p>
              </div>) })()}
          </Section>

          <Section title="Where this passport is used" icon="link-external-01">
            {(() => { const hr = lastSuccess(snap, 'hr_core'); const unsynced = verified.filter((r) => !hr || r.best.mintedAt > hr.finishedAt).length; return <ul className="space-y-1 text-[13px]"><li><Link to="/marketplace">Talent marketplace</Link>: roles, projects and gigs matched on verified skills.</li><li>Promotion cases cite passport evidence (policy pack, People Committee).</li><li>HR core talent profile: {hr ? <>last synced {fmtDate(hr.finishedAt)}{unsynced ? ` · ${unsynced} badge${unsynced === 1 ? '' : 's'} waiting for the next sync` : ' · up to date'}</> : 'not synced yet'} <span className="text-(--color-faint)">(simulated connector)</span>.</li></ul> })()}
          </Section>
        </div>
      </div>
      {rec && (
        <Dialog open onClose={() => setRec(null)} title="Record recognition" subtitle={subject.fullName}
          footer={<><Button variant="ghost" onClick={() => setRec(null)}>Cancel</Button><Button variant="primary" busy={addRec.isPending} disabled={!rec.note.trim()} onClick={async () => { await addRec.mutateAsync([rec.kind, rec.note]); setRec(null) }}>Record</Button></>}>
          <div className="space-y-3">
            <Field label="Kind" required>{(id) => <select id={id} className="field-input" value={rec.kind} onChange={(e) => setRec({ ...rec, kind: e.target.value as RecognitionKind })}>{(Object.keys(RECOGNITION_LABEL) as RecognitionKind[]).map((k) => <option key={k} value={k}>{RECOGNITION_LABEL[k]}</option>)}</select>}</Field>
            <Field label="What it is for" required>{(id) => <textarea id={id} className="field-input" value={rec.note} onChange={(e) => setRec({ ...rec, note: e.target.value })} data-autofocus />}</Field>
          </div>
        </Dialog>
      )}
      {pool && (
        <Dialog open onClose={() => setPool(null)} title="Add to a pool" subtitle={subject.fullName}
          footer={<><Button variant="ghost" onClick={() => setPool(null)}>Cancel</Button><Button variant="primary" busy={addPool.isPending} disabled={!pool.basis.trim()} onClick={async () => { await addPool.mutateAsync([pool.pool, pool.basis, pool.due || null]); setPool(null) }}>Add</Button></>}>
          <div className="space-y-3">
            <Field label="Pool" required>{(id) => <select id={id} className="field-input" value={pool.pool} onChange={(e) => setPool({ ...pool, pool: e.target.value as SuccessionPool })}>{(Object.keys(POOL_LABEL) as SuccessionPool[]).map((k) => <option key={k} value={k}>{POOL_LABEL[k]}</option>)}</select>}</Field>
            <Field label="Basis" required hint="The verified skills and outcomes behind the entry.">{(id) => <textarea id={id} className="field-input" value={pool.basis} onChange={(e) => setPool({ ...pool, basis: e.target.value })} data-autofocus />}</Field>
            <Field label="Due by" hint="Gate-2 winners take incubation leadership within six months.">{(id) => <input id={id} type="date" className="field-input max-w-[220px]" value={pool.due} onChange={(e) => setPool({ ...pool, due: e.target.value })} />}</Field>
          </div>
        </Dialog>
      )}
    </>
  )
}
