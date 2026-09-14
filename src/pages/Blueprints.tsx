import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { requestGuidance, buildBlueprintContext, type BlueprintOutput } from '@/features/guidance/api'
import { personaName } from '@/domain/selectors'
import { GAP_DECISION_LABEL, type RoleBlueprint } from '@/domain/types'
import { PageHeader, Section, LoadingBlock, ErrorBlock, EmptyState, Pill, Button, Dialog, Field, Notice } from '@/components/ui'
import { fmtDate, fmtThb } from '@/lib/format'
import { Icon } from '@/icons/Icon'

export function BlueprintsPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [open, setOpen] = useState(false)
  const [v, setV] = useState({ buId: '', roleTitle: '', level: 'L3', headcount: 5, operatingModelChange: '', responsibilities: '' })
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const save = useAction((ds) => ds.saveRoleBlueprint(actor!.id, { ...v, headcount: Number(v.headcount) }), 'Role captured. Generating the capability plan next.')
  const savePlan = useAction((ds, id: string, plan: BlueprintOutput, model: string) => ds.saveBlueprintPlan(actor!.id, id, plan, model))
  const adopt = useAction((ds, id: string) => ds.adoptBlueprint(actor!.id, id), 'Adopted into the capability agenda.')
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const rows = [...snap.roleBlueprints].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const generate = async (b: RoleBlueprint) => {
    setBusy(b.id); setErr(null)
    try {
      const r = await requestGuidance<BlueprintOutput>({ kind: 'role_blueprint', context: buildBlueprintContext(snap, b) })
      await savePlan.mutateAsync([b.id, r.output, r.model])
    } catch (e) { setErr((e as Error).message) } finally { setBusy(null) }
  }
  const current = detail ? rows.find((r) => r.id === detail) ?? null : null
  return (
    <>
      <PageHeader title="Role blueprints" kicker="Turnaround application · component 01" description="A new operating model means new role requirements, and the real risk is whether people can adjust fast. Describe the role once; the platform reads it against the skills taxonomy and the BU agenda and generates the capability plan: critical future skills, supply versus demand, THB at risk, build / buy / borrow / bot and the cohort plan. No lengthy co-design with management."
        actions={<Button variant="primary" icon="plus" onClick={() => setOpen(true)}>New role</Button>} />
      {err && <div className="mb-3"><Notice tone="error" icon="alert-circle">{err}</Notice></div>}
      <Section>
        {rows.length === 0 ? <EmptyState icon="user-square" title="No roles captured yet" body="Start with a role the new operating model changes most." /> : (
          <ul className="divide-y divide-(--color-border)">
            {rows.map((b) => (
              <li key={b.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] py-3 xl:grid-cols-[minmax(0,2fr)_110px_130px_150px_minmax(0,1fr)_190px]">
                <div className="min-w-0"><button type="button" className="block max-w-full truncate text-left font-medium text-(--color-accent) hover:text-(--color-primary)" onClick={() => setDetail(b.id)}>{b.roleTitle}</button><div className="truncate text-[12px] text-(--color-muted)">{snap.businessUnits.find((x) => x.id === b.buId)?.code} · {b.level} · {b.headcount} holders · {personaName(snap, b.createdBy)}</div></div>
                <div className="hidden xl:block"><Pill tone={b.status === 'adopted' ? 'success' : b.status === 'generated' ? 'accent' : 'neutral'}>{b.status === 'draft' ? 'Not generated' : b.status === 'generated' ? 'Plan ready' : 'Adopted'}</Pill></div>
                <div className="hidden text-[13px] xl:block">{b.generated?.skills ? `${b.generated.skills.length} skills` : '—'}</div>
                <div className="hidden text-[13px] xl:block">{b.generated?.skills ? fmtThb(b.generated.skills.reduce((a, s) => a + (s.thbValueAtRisk ?? 0), 0), true) : '—'}</div>
                <div className="hidden truncate text-[12px] text-(--color-muted) xl:block">{b.generated?.cohortPlan?.program ? `${b.generated.cohortPlan.program} · ${b.generated.cohortPlan.seats} seats · ${b.generated.cohortPlan.startQuarter}` : 'Awaiting plan'}</div>
                <div className="col-span-2 flex flex-wrap gap-1 xl:col-span-1 xl:justify-end">
                  {b.status === 'draft' && <Button size="sm" variant="primary" icon="stars-02" busy={busy === b.id} onClick={() => generate(b)}>Generate plan</Button>}
                  {b.status === 'generated' && <><Button size="sm" onClick={() => setDetail(b.id)}>Review</Button><Button size="sm" variant="primary" busy={adopt.isPending} onClick={() => adopt.mutate([b.id])}>Adopt into agenda</Button></>}
                  {b.status === 'adopted' && <Link to="/agenda" search={{ bu: b.buId } as never} className="btn btn-secondary btn-sm">Open agenda</Link>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Dialog open={open} onClose={() => setOpen(false)} title="Describe the role" subtitle="What the new operating model asks of this role. The plan is generated from this, the BU agenda and the taxonomy." width={760}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" busy={save.isPending} disabled={!v.buId || !v.roleTitle.trim() || !v.responsibilities.trim()} onClick={async () => { const id = String(await save.mutateAsync([])); setOpen(false); const b = { id, ...v, headcount: Number(v.headcount), status: 'draft' as const, generated: null, model: null, createdBy: actor.id, createdAt: new Date().toISOString(), adoptedAt: null }; await generate(b); setDetail(id) }}>Save and generate</Button></>}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Business unit" required>{(id) => <select id={id} className="field-input" value={v.buId} onChange={(e) => setV({ ...v, buId: e.target.value })} data-autofocus><option value="">Choose a BU</option>{snap.businessUnits.filter((b) => b.id !== 'bu-corp').map((b) => <option key={b.id} value={b.id}>{b.code} · {b.name}</option>)}</select>}</Field>
            <Field label="Role title" required>{(id) => <input id={id} className="field-input" placeholder="Plant Performance Lead" value={v.roleTitle} onChange={(e) => setV({ ...v, roleTitle: e.target.value })} />}</Field>
            <Field label="Level">{(id) => <select id={id} className="field-input" value={v.level} onChange={(e) => setV({ ...v, level: e.target.value })}>{['L2', 'L3', 'L4', 'L5'].map((l) => <option key={l} value={l}>{l}</option>)}</select>}</Field>
            <Field label="Holders of this role">{(id) => <input id={id} type="number" min={1} className="field-input" value={v.headcount} onChange={(e) => setV({ ...v, headcount: Number(e.target.value) })} />}</Field>
          </div>
          <Field label="What the new operating model changes" hint="The shift that makes today's capability insufficient.">{(id) => <textarea id={id} className="field-input" rows={3} value={v.operatingModelChange} onChange={(e) => setV({ ...v, operatingModelChange: e.target.value })} />}</Field>
          <Field label="Responsibilities in the new role" required hint="What this person owns and decides.">{(id) => <textarea id={id} className="field-input" rows={3} value={v.responsibilities} onChange={(e) => setV({ ...v, responsibilities: e.target.value })} />}</Field>
        </div>
      </Dialog>

      {current && (
        <Dialog open onClose={() => setDetail(null)} title={current.roleTitle} subtitle={`${snap.businessUnits.find((x) => x.id === current.buId)?.name} · ${current.level} · ${current.headcount} holders`} width={880}
          footer={<><Button variant="ghost" onClick={() => setDetail(null)}>Close</Button>{current.status === 'draft' && <Button variant="primary" icon="stars-02" busy={busy === current.id} onClick={() => generate(current)}>Generate plan</Button>}{current.status === 'generated' && <Button variant="primary" busy={adopt.isPending} onClick={async () => { await adopt.mutateAsync([current.id]); setDetail(null) }}>Adopt into agenda</Button>}</>}>
          <div className="space-y-4 text-[13px]">
            <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Operating model change</div><p>{current.operatingModelChange || 'Not provided'}</p></div>
            <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Responsibilities</div><p>{current.responsibilities}</p></div>
            {busy === current.id && <p className="text-(--color-muted)">Reading the role against the taxonomy, the BU agenda and verified supply…</p>}
            {current.generated?.skills && (
              <>
                <Notice tone="accent" icon="stars-02"><strong>{current.generated.valuePool}.</strong> {current.generated.summary}</Notice>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Critical future skills</div>
                  <ul className="divide-y divide-(--color-border) rounded-md border border-(--color-border)">
                    {(current.generated?.skills ?? []).map((s) => { const sk = snap.skills.find((k) => k.code === s.skillCode); return (
                      <li key={s.skillCode} className="grid gap-2 px-3 py-2 md:grid-cols-[minmax(0,1.6fr)_90px_110px_110px_120px]">
                        <div className="min-w-0"><div className="font-medium">{s.skillCode} · {sk?.name ?? 'unknown skill'}</div><div className="text-[12px] text-(--color-muted)">{s.why}</div></div>
                        <div><Pill tone="accent">Level {s.targetLevel}</Pill></div>
                        <div>{s.supplyFte} / {s.demandFte} FTE</div>
                        <div>{fmtThb(s.thbValueAtRisk, true)}</div>
                        <div><Pill tone={s.decision === 'build' ? 'success' : s.decision === 'bot' ? 'accent' : 'info'}>{GAP_DECISION_LABEL[s.decision]}</Pill></div>
                      </li>) })}
                  </ul>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Cohort plan</div><p>{current.generated.cohortPlan.program} · {current.generated.cohortPlan.seats} seats · {current.generated.cohortPlan.startQuarter}</p><p className="text-(--color-muted)">{current.generated.cohortPlan.rationale}</p></div>
                  <div><div className="text-xs font-semibold uppercase tracking-wide text-(--color-faint)">Risks</div><ul className="list-disc pl-4">{current.generated.risks.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
                </div>
                <p className="flex items-center gap-1 text-[12px] text-(--color-faint)"><Icon name="stars-02" size={12} />Generated by {current.model} from the role description, the BU agenda and the taxonomy. {current.adoptedAt ? `Adopted ${fmtDate(current.adoptedAt)}.` : 'Adopting writes these gaps into the capability agenda for a build / buy / borrow / bot decision.'}</p>
              </>
            )}
          </div>
        </Dialog>
      )}
    </>
  )
}
