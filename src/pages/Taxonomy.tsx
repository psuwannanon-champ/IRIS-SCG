import { useState } from 'react'
import { useActor } from '@/app/actor'
import { PageHeader, Section, LoadingBlock, ErrorBlock, Pill, Button, Notice, Dialog, Field } from '@/components/ui'
import { useAction } from '@/app/data'
import { personaName } from '@/domain/selectors'
import { fmtDate } from '@/lib/format'
import { Icon } from '@/icons/Icon'

export function TaxonomyPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [review, setReview] = useState<{ area: 'taxonomy' | 'critical_skills'; cycle: string; note: string; next: string } | null>(null)
  const record = useAction((ds, area: 'taxonomy' | 'critical_skills', cycle: string, note: string, items: number, next: string | null) => ds.recordGovernanceReview(actor!.id, area, cycle, note, items, next), 'Review recorded.')
  const [program, setProgram] = useState<'ABC' | 'BCD'>('ABC')
  const [open, setOpen] = useState<string | null>(null)
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const canReview = ['program_office', 'committee'].includes(actor.role)
  const lastTax = snap.governanceReviews.filter((g) => g.area === 'taxonomy').sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))[0]
  const lastCrit = snap.governanceReviews.filter((g) => g.area === 'critical_skills').sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))[0]
  const q = `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`
  const domains = snap.skillDomains.filter((d) => d.program === program)
  return (
    <>
      <PageHeader title="Skills taxonomy" description="One enterprise taxonomy with four proficiency levels, AI-inferred from work data and validated by function experts. Governed centrally, refreshed quarterly, with the critical-skill list refreshed annually by the People Committee."
        actions={canReview && <><Button size="sm" icon="refresh-cw-01" onClick={() => setReview({ area: 'taxonomy', cycle: q, note: '', next: '' })}>Record quarterly review</Button><Button size="sm" icon="star-01" onClick={() => setReview({ area: 'critical_skills', cycle: `${new Date().getFullYear()} annual`, note: '', next: '' })}>Refresh critical-skill list</Button></>} />
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <div className="surface px-3 py-2 text-[13px]"><div className="text-xs font-medium text-(--color-muted)">Taxonomy last reviewed</div>{lastTax ? <>{lastTax.cycle} · {personaName(snap, lastTax.reviewedBy)} · {fmtDate(lastTax.reviewedAt)}<div className="text-[12px] text-(--color-muted)">{lastTax.note}</div>{lastTax.nextDue && <Pill tone={new Date(lastTax.nextDue) < new Date() ? 'warning' : 'neutral'}>Next due {fmtDate(lastTax.nextDue)}</Pill>}</> : 'Never'}</div>
        <div className="surface px-3 py-2 text-[13px]"><div className="text-xs font-medium text-(--color-muted)">Critical-skill list last refreshed</div>{lastCrit ? <>{lastCrit.cycle} · {personaName(snap, lastCrit.reviewedBy)} · {fmtDate(lastCrit.reviewedAt)}<div className="text-[12px] text-(--color-muted)">{lastCrit.note}</div>{lastCrit.nextDue && <Pill tone={new Date(lastCrit.nextDue) < new Date() ? 'warning' : 'neutral'}>Next due {fmtDate(lastCrit.nextDue)}</Pill>}</> : 'Never'}</div>
      </div>
      <Notice tone="info" icon="info-circle">Target state is about 100 critical skills. The prototype shows {snap.skills.length} skills across the six ABC domains and six BCD skill areas.</Notice>
      <div className="my-3 flex gap-1.5" role="tablist">{(['ABC', 'BCD'] as const).map((p) => <Button key={p} size="sm" role="tab" aria-selected={program === p} variant={program === p ? 'primary' : 'secondary'} onClick={() => setProgram(p)}>{p === 'ABC' ? 'ABC domains' : 'BCD skills'}</Button>)}</div>
      <div className="space-y-4">
        {domains.map((d) => (
          <Section key={d.id} title={d.name} description={d.description} icon="layers-three-01">
            <ul className="divide-y divide-(--color-border)">
              {snap.skills.filter((s) => s.domainId === d.id).map((s) => (
                <li key={s.id} className="py-2">
                  <div className="table-grid grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0"><div className="font-medium">{s.code} · {s.name}</div><div className="text-[13px] text-(--color-muted)">{s.description}</div><div className="mt-1 flex flex-wrap gap-1">{s.critical && <Pill tone="primary">Critical skill</Pill>}{s.premiumEligible && <Pill tone="accent">Premium-eligible</Pill>}<Pill>{snap.learningModules.filter((m) => m.skillId === s.id).length} modules</Pill></div></div>
                    <Button size="sm" variant="ghost" aria-expanded={open === s.id} aria-controls={`lv-${s.id}`} onClick={() => setOpen(open === s.id ? null : s.id)}>Levels <Icon name={open === s.id ? 'chevron-up' : 'chevron-down'} size={14} /></Button>
                  </div>
                  {open === s.id && <ol id={`lv-${s.id}`} className="mt-2 grid gap-2 rounded-md border border-(--color-border) p-3 text-[13px] sm:grid-cols-2">{s.levelDescriptors.map((l, i) => <li key={i}>{l}</li>)}</ol>}
                </li>
              ))}
            </ul>
          </Section>
        ))}
      </div>
      {review && (
        <Dialog open onClose={() => setReview(null)} title={review.area === 'taxonomy' ? 'Record quarterly taxonomy review' : 'Refresh the critical-skill list'} subtitle={review.area === 'taxonomy' ? 'Validated by function experts; governed centrally.' : 'The People Committee refreshes the list the MTP needs most: AI, green commercial, business building.'}
          footer={<><Button variant="ghost" onClick={() => setReview(null)}>Cancel</Button><Button variant="primary" busy={record.isPending} disabled={!review.note.trim()} onClick={async () => { await record.mutateAsync([review.area, review.cycle, review.note, snap.skills.length, review.next || null]); setReview(null) }}>Record review</Button></>}>
          <div className="space-y-3">
            <Field label="Cycle" required>{(id) => <input id={id} className="field-input" value={review.cycle} onChange={(e) => setReview({ ...review, cycle: e.target.value })} />}</Field>
            <Field label="What the review concluded" required>{(id) => <textarea id={id} className="field-input" rows={3} value={review.note} onChange={(e) => setReview({ ...review, note: e.target.value })} data-autofocus />}</Field>
            <Field label="Next review due">{(id) => <input id={id} type="date" className="field-input max-w-[220px]" value={review.next} onChange={(e) => setReview({ ...review, next: e.target.value })} />}</Field>
          </div>
        </Dialog>
      )}
    </>
  )
}
