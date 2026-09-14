import { useState } from 'react'
import { useActor } from '@/app/actor'
import { useAction } from '@/app/data'
import { CONNECTORS, lastRun } from '@/features/integrations/connectors'
import { PageHeader, Section, LoadingBlock, ErrorBlock, Pill, Button, Dialog, Notice, EmptyState } from '@/components/ui'
import { fmtDate } from '@/lib/format'
import { personaName } from '@/domain/selectors'
import type { IntegrationRun } from '@/domain/types'
import { Icon } from '@/icons/Icon'

export function IntegrationsPage() {
  const { snap, actor, status, error, refetch } = useActor()
  const [open, setOpen] = useState<IntegrationRun | null>(null)
  const [running, setRunning] = useState<string | null>(null)
  const record = useAction((ds, run: Parameters<typeof ds.recordIntegrationRun>[1]) => ds.recordIntegrationRun(actor!.id, run))
  if (status === 'loading') return <LoadingBlock />
  if (status === 'error' || !snap || !actor) return <ErrorBlock message={error ?? ''} onRetry={refetch} />
  const canRun = actor.role === 'program_office'
  const runs = [...snap.integrationRuns].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
  const run = async (system: string) => {
    const c = CONNECTORS.find((x) => x.system === system)!
    setRunning(system)
    try { const r = c.buildRun(snap); await new Promise((res) => setTimeout(res, 900)); await record.mutateAsync([r]) } finally { setRunning(null) }
  }
  return (
    <>
      <PageHeader title="Integrations" description="One integrated stack on one skills data model, with HR core as the single source of truth. Every connector below is simulated for the prototype: it builds its payload from live platform records and logs the run, but nothing leaves the platform." state={<Pill tone="warning" icon="alert-triangle">Simulated connectors</Pill>} />
      <div className="grid gap-3 lg:grid-cols-2">
        {CONNECTORS.map((c) => { const last = lastRun(snap, c.system); return (
          <Section key={c.system} title={c.name} icon={c.icon} description={c.purpose} tour={`integration-${c.system}`}
            actions={canRun && <Button size="sm" variant="primary" icon="refresh-cw-01" busy={running === c.system} onClick={() => run(c.system)}>{c.direction === 'inbound' ? 'Import now' : 'Sync now'}</Button>}>
            <div className="grid gap-x-4 gap-y-2 text-[13px] sm:grid-cols-2">
              <div><div className="text-xs font-medium text-(--color-muted)">System</div>{c.vendorHint}</div>
              <div><div className="text-xs font-medium text-(--color-muted)">Direction · cadence</div>{c.direction === 'inbound' ? 'Inbound' : 'Outbound'} · {c.cadence}</div>
              <div><div className="text-xs font-medium text-(--color-muted)">Owner</div>{c.owner}</div>
              <div><div className="text-xs font-medium text-(--color-muted)">Last run</div>{last ? <button type="button" className="text-left text-(--color-accent) hover:text-(--color-primary)" onClick={() => setOpen(last)}>{fmtDate(last.finishedAt, true)} · <Pill tone={last.status === 'succeeded' ? 'success' : 'error'}>{last.status}</Pill> · {last.records} records</button> : <span className="text-(--color-muted)">Never</span>}</div>
            </div>
            {last && <p className="mt-2 text-[13px] text-(--color-muted)">{last.summary}</p>}
          </Section>) })}
      </div>
      <Section className="mt-4" title="Run history" icon="clock" description="Auditable log of every hand-off with its payload.">
        {runs.length === 0 ? <EmptyState icon="clock" title="No runs yet" /> : (
          <ul className="divide-y divide-(--color-border)">
            {runs.slice(0, 20).map((r) => { const c = CONNECTORS.find((x) => x.system === r.system)!; return (
              <li key={r.id} className="table-grid grid-cols-[minmax(0,1fr)_auto] py-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_150px_110px]">
                <div className="min-w-0"><div className="truncate font-medium">{c.name}</div><div className="text-[12px] text-(--color-muted)">{fmtDate(r.finishedAt, true)} · {personaName(snap, r.triggeredBy)}</div></div>
                <div className="hidden truncate text-[13px] sm:block">{r.summary}</div>
                <div><Pill tone={r.status === 'succeeded' ? 'success' : 'error'}>{r.status}</Pill> <span className="text-[12px] text-(--color-muted)">{r.records} rec.</span></div>
                <div className="flex justify-end"><Button size="sm" onClick={() => setOpen(r)}>View payload</Button></div>
              </li>) })}
          </ul>
        )}
      </Section>
      <div className="mt-4"><Notice tone="info" icon="info-circle"><strong>Production design:</strong> outbound syncs run from a scheduled server job with per-system credentials held in the server vault; inbound actuals arrive by SFTP or API and are matched by ledger entry id. Field mappings are documented in the hand-off. None of this is connected in the prototype.</Notice></div>
      {open && (() => { const c = CONNECTORS.find((x) => x.system === open.system)!; const PRIORITY = ['employee', 'employeeId', 'person', 'to', 'entry', 'concept', 'channel', 'businessUnit', 'badge', 'skill', 'level', 'title', 'route', 'team', 'sponsor', 'validatedThb', 'actualThb', 'variance', 'flag', 'skillPremiumEligible', 'validatedImpactThb', 'impactRating', 'topDecile', 'recognition', 'mintedAt', 'email', 'line', 'delivered', 'failed']; const cols = open.payload.length ? Object.keys(open.payload[0]).sort((a, b) => (PRIORITY.indexOf(a) + 1 || 99) - (PRIORITY.indexOf(b) + 1 || 99)) : []; return (
        <Dialog open onClose={() => setOpen(null)} title={`${c.name} · ${fmtDate(open.finishedAt, true)}`} subtitle={open.summary} width={860} footer={<Button variant="ghost" onClick={() => setOpen(null)}>Close</Button>}>
          {open.payload.length === 0 ? <p className="text-[13px] text-(--color-muted)">Empty payload.</p> : (
            <div className="overflow-x-auto rounded-md border border-(--color-border)">
              <table className="w-full text-[13px]"><thead><tr className="bg-(--color-page) text-left text-[11px] uppercase tracking-wide text-(--color-faint)">{cols.map((k) => <th key={k} className="px-2 py-1.5 font-semibold">{k.replace(/([A-Z])/g, ' $1')}</th>)}</tr></thead>
                <tbody>{open.payload.map((row, i) => <tr key={i} className="border-t border-(--color-border)">{cols.map((k) => <td key={k} className="px-2 py-1.5 align-top">{String(row[k] ?? '')}</td>)}</tr>)}</tbody></table>
            </div>
          )}
          <p className="mt-2 flex items-center gap-1 text-[12px] text-(--color-faint)"><Icon name="lock-01" size={12} />Payload built from platform records at run time; no external system received it.</p>
        </Dialog>) })()}
    </>
  )
}
