import { useState } from 'react'
import { useActor } from '@/app/actor'
import { PageHeader, Section, LoadingBlock, ErrorBlock, Pill, Button, Notice } from '@/components/ui'
import { Icon } from '@/icons/Icon'

export function TaxonomyPage() {
  const { snap, status, error, refetch } = useActor()
  const [program, setProgram] = useState<'ABC' | 'BCD'>('ABC')
  const [open, setOpen] = useState<string | null>(null)
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const domains = snap.skillDomains.filter((d) => d.program === program)
  return (
    <>
      <PageHeader title="Skills taxonomy" description="One enterprise taxonomy with four proficiency levels, AI-inferred from work data and validated by function experts. Governed centrally and refreshed quarterly. Read-only in the prototype." />
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
    </>
  )
}
