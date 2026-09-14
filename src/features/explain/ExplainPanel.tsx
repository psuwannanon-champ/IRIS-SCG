import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { Icon } from '@/icons/Icon'
import { SidePanel, Notice } from '@/components/ui'
import { explainerForPath } from '@/features/explain/content'

export function ExplainButton() {
  const loc = useLocation()
  const page = explainerForPath(loc.pathname)
  const [open, setOpen] = useState(false)
  const [fn, setFn] = useState(0)
  useEffect(() => { setFn(0) }, [loc.pathname])
  if (!page) return null
  const f = page.functions[Math.min(fn, page.functions.length - 1)]
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Explain this page" title="Explain this page"
        className="fixed bottom-5 right-5 z-30 grid h-12 w-12 place-items-center rounded-full bg-(--color-primary) text-white shadow-(--shadow-panel) hover:bg-(--color-primary-strong)"
        style={{ ['--icon-accent' as string]: '#fff', marginBottom: 'env(safe-area-inset-bottom)' }} data-tour="explain-fab">
        <Icon name="book-open-01" size={22} />
      </button>
      <SidePanel open={open} onClose={() => setOpen(false)} title={`Explain this page · ${page.title}`} subtitle="What this page is for, who uses it and what happens next."
        headerExtra={page.functions.length > 1 ? (
          <div role="tablist" aria-label="Function" className="mt-2 flex flex-wrap gap-1">
            {page.functions.map((x, i) => (
              <button key={x.id} role="tab" aria-selected={i === fn} type="button" onClick={() => setFn(i)} className={`btn btn-sm ${i === fn ? 'btn-primary' : 'btn-secondary'}`}>{x.name}</button>
            ))}
          </div>
        ) : null}>
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold">{f.name}</h3>
            <p className="mt-1">{f.purpose}</p>
          </div>
          <Topic icon="trophy-01" title="Business benefit">{f.benefit}</Topic>
          <Topic icon="users-01" title="Who uses it">{f.users}</Topic>
          <Topic icon="user-check-01" title="What each role does">
            <ul className="mt-1 space-y-1">{f.roles.map((r) => <li key={r.role}><span className="font-medium">{r.role}:</span> {r.does}</li>)}</ul>
          </Topic>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-faint)">How the work flows</div>
            <ol className="relative space-y-4 border-l border-(--color-border) pl-0">
              {f.stages.map((s) => (
                <li key={s.title} className="relative ml-4 flex gap-3">
                  <span className="absolute -left-[26px] top-0 grid h-5 w-5 place-items-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-primary)" style={{ ['--icon-accent' as string]: 'var(--color-accent)' }}><Icon name={s.icon} size={13} /></span>
                  <div className="min-w-0"><div className="font-medium leading-5">{s.title}</div><p className="text-[13px] text-(--color-muted)">{s.body}</p></div>
                </li>
              ))}
            </ol>
          </div>
          {f.limitations?.length ? <Notice tone="warning" icon="alert-triangle"><span className="font-medium">Useful limitations</span><ul className="mt-0.5 list-disc pl-4">{f.limitations.map((l) => <li key={l}>{l}</li>)}</ul></Notice> : null}
        </div>
      </SidePanel>
    </>
  )
}
function Topic({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-(--color-primary)" style={{ ['--icon-accent' as string]: 'var(--color-accent)' }}><Icon name={icon} size={18} /></span>
      <div className="min-w-0"><div className="font-medium leading-5">{title}</div><div className="text-[13px] text-(--color-muted)">{children}</div></div>
    </div>
  )
}
