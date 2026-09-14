import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAction } from '@/app/data'
import { Button, Dialog, Field, Notice } from '@/components/ui'
import { useActor } from '@/app/actor'
import { personaName } from '@/domain/selectors'
import { OBJECTIVE_LABEL } from '@/domain/types'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Stat } from '@/components/ui'
import { fmtDate, fmtThb } from '@/lib/format'

export function SuccessCasesPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [pack, setPack] = useState<{ contractId: string; title: string; skillCode: string; durationMin: number; whatChanged: string; howToRepeat: string; provenResult: string } | null>(null)
  const packageCase = useAction((ds, contractId: string, input: { title: string; skillCode: string; durationMin: number; body: { whatChanged: string; howToRepeat: string[]; provenResult: string } }) => ds.packageCaseAsModule(actor!.id, contractId, input), 'Packaged as a micro-module for every service team.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const canPackage = ['program_office', 'coach'].includes(actor.role)
  const contracts = snap.impactContracts.filter((c) => c.status === 'validated').sort((a, b) => (b.validatedAt ?? '').localeCompare(a.validatedAt ?? ''))
  const scaled = snap.concepts.filter((c) => ['scaled', 'incubating'].includes(c.stage))
  const total = contracts.reduce((a, c) => a + (c.validatedValueThb ?? 0), 0) + scaled.reduce((a, c) => a + (c.validatedValueThb ?? 0), 0)
  return (
    <>
      <PageHeader title="Success cases" description="Every validated improvement and funded concept, logged on the platform and 100% tracked. Proof stories make the career deal visible: passport-cited badges, funded concepts and scale-up roles." />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Validated impact logged" value={fmtThb(total, true)} tone="primary" />
        <Stat label="ABC improvements validated" value={contracts.length} hint="Sponsor-validated showcase cases" />
        <Stat label="BCD concepts funded or scaled" value={scaled.length} hint="Gate 2 invest or Gate 3 scale" />
      </div>
      <Section className="mt-4" title="ABC · practical improvements in current roles" icon="trophy-01">
        {contracts.length === 0 ? <EmptyState icon="trophy-01" title="No validated cases yet" /> : (
          <ul className="grid gap-3 md:grid-cols-2">
            {contracts.map((c) => { const learner = snap.personas.find((p) => p.id === c.learnerId)!; const badges = snap.passportEntries.filter((p) => p.personaId === c.learnerId && p.sourceId === c.id); return (
              <li key={c.id} className="surface p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">{snap.businessUnits.find((b) => b.id === learner.buId)?.code} · {OBJECTIVE_LABEL[c.objectiveType]}</div>
                <Link to="/contracts/$id" params={{ id: c.id }} className="mt-0.5 block font-medium">{c.title}</Link>
                <div className="text-[13px] text-(--color-muted)"><Link to="/passport" search={{ persona: learner.id } as never}>{learner.fullName}</Link> · {learner.jobTitle}</div>
                <p className="mt-2 text-[13px]">{c.showcaseSummary}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5"><Pill tone="success">{fmtThb(c.validatedValueThb)} validated</Pill><Pill tone="neutral">{fmtDate(c.validatedAt)}</Pill>{badges.map((b) => <Pill key={b.id} tone="accent" icon="award-01">{snap.skills.find((s) => s.id === b.skillId)?.code} L{b.level}</Pill>)}</div>
                <div className="mt-1 text-[12px] text-(--color-faint)">Validated by {personaName(snap, c.sponsorId)} · tools: {c.toolsApplied ?? 'not provided'}</div>
                {(() => { const mod = snap.learningModules.find((m) => m.sourceContractId === c.id); return mod ? <div className="mt-2"><Pill tone="accent" icon="book-open-01">Packaged as {mod.code} · {mod.title}</Pill></div> : canPackage ? <Button size="sm" className="mt-2" icon="book-open-01" onClick={() => setPack({ contractId: c.id, title: c.title, skillCode: '', durationMin: 15, whatChanged: c.showcaseSummary ?? '', howToRepeat: '', provenResult: `${fmtThb(c.validatedValueThb)} validated at ${snap.businessUnits.find((b) => b.id === learner.buId)?.code}` })}>Package as micro-module</Button> : null })()}
              </li>) })}
          </ul>
        )}
      </Section>
      <Section className="mt-4" title="BCD · concepts funded and scaled" icon="rocket-01">
        {scaled.length === 0 ? <EmptyState icon="rocket-01" title="No funded concepts yet" /> : (
          <ul className="grid gap-3 md:grid-cols-2">
            {scaled.map((c) => { const team = snap.teams.find((t) => t.id === c.teamId); const members = snap.enrollments.filter((e) => e.teamId === c.teamId); return (
              <li key={c.id} className="surface p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">{snap.cohorts.find((k) => k.id === c.cohortId)?.code} · {team?.name}</div>
                <Link to="/concepts/$id" params={{ id: c.id }} className="mt-0.5 block font-medium">{c.title}</Link>
                <p className="mt-1 text-[13px]">{c.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5"><Pill tone={c.stage === 'scaled' ? 'success' : 'accent'}>{c.stage === 'scaled' ? `Scaled · ${c.scaleRoute === 'start_the_dot' ? 'SCG Start the Dot' : 'internal high impact'}` : 'Incubating after Gate 2'}</Pill>{c.validatedValueThb != null && <Pill tone="success">{fmtThb(c.validatedValueThb, true)} validated</Pill>}</div>
                <div className="mt-1 text-[12px] text-(--color-faint)">Team: {members.map((m) => personaName(snap, m.personaId)).join(', ') || 'not recorded'}</div>
              </li>) })}
          </ul>
        )}
      </Section>
      {pack && (
        <Dialog open onClose={() => setPack(null)} title="Package as a micro-module" subtitle="Best practices captured once, scaled everywhere: proven improvements become modules for every service team." width={720}
          footer={<><Button variant="ghost" onClick={() => setPack(null)}>Cancel</Button><Button variant="primary" busy={packageCase.isPending} disabled={!pack.title.trim() || !pack.skillCode || !pack.howToRepeat.trim()} onClick={async () => { await packageCase.mutateAsync([pack.contractId, { title: pack.title, skillCode: pack.skillCode, durationMin: Number(pack.durationMin), body: { whatChanged: pack.whatChanged, howToRepeat: pack.howToRepeat.split('\n').map((x) => x.trim()).filter(Boolean), provenResult: pack.provenResult } }]); setPack(null) }}>Publish module</Button></>}>
          <div className="space-y-3">
            <Notice tone="info" icon="info-circle">The module joins the catalogue with a "proven at" label and can be selected into other learners' paths.</Notice>
            <Field label="Module title" required>{(id) => <input id={id} className="field-input" value={pack.title} onChange={(e) => setPack({ ...pack, title: e.target.value })} data-autofocus />}</Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Skill it teaches" required>{(id) => <select id={id} className="field-input" value={pack.skillCode} onChange={(e) => setPack({ ...pack, skillCode: e.target.value })}><option value="">Choose a skill</option>{snap.skills.map((k) => <option key={k.id} value={k.code}>{k.code} · {k.name}</option>)}</select>}</Field>
              <Field label="Duration (minutes)">{(id) => <input id={id} type="number" min={5} className="field-input" value={pack.durationMin} onChange={(e) => setPack({ ...pack, durationMin: Number(e.target.value) })} />}</Field>
            </div>
            <Field label="What changed" required>{(id) => <textarea id={id} className="field-input" rows={2} value={pack.whatChanged} onChange={(e) => setPack({ ...pack, whatChanged: e.target.value })} />}</Field>
            <Field label="How another team repeats it" required hint="One step per line.">{(id) => <textarea id={id} className="field-input" rows={4} value={pack.howToRepeat} onChange={(e) => setPack({ ...pack, howToRepeat: e.target.value })} />}</Field>
            <Field label="Proven result">{(id) => <input id={id} className="field-input" value={pack.provenResult} onChange={(e) => setPack({ ...pack, provenResult: e.target.value })} />}</Field>
          </div>
        </Dialog>
      )}
    </>
  )
}
