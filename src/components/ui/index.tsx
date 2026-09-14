import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/icons/Icon'

/* ---------- Buttons ---------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
export function Button({ variant = 'secondary', size, icon, children, className = '', busy, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm'; icon?: string; busy?: boolean }) {
  return (
    <button type="button" className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`} disabled={rest.disabled || busy} aria-busy={busy || undefined} {...rest}>
      {busy ? <Spinner size={14} /> : icon ? <Icon name={icon} size={16} style={variant === 'primary' ? { ['--icon-accent' as string]: '#fff' } : undefined} /> : null}
      {children}
    </button>
  )
}

/* ---------- Status pill ---------- */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'accent' | 'primary'
const toneStyle: Record<Tone, React.CSSProperties> = {
  neutral: { background: '#F1F3F5', color: '#3F4752', borderColor: '#E1E5EA' },
  info: { background: 'var(--color-info-soft)', color: 'var(--color-info)', borderColor: '#C6DAF2' },
  success: { background: 'var(--color-success-soft)', color: 'var(--color-success)', borderColor: '#BFE3CC' },
  warning: { background: 'var(--color-warning-soft)', color: 'var(--color-warning)', borderColor: '#F3DDA6' },
  error: { background: 'var(--color-error-soft)', color: 'var(--color-error)', borderColor: '#F3C1C5' },
  accent: { background: 'var(--color-accent-soft)', color: 'var(--color-accent)', borderColor: '#C9D5E8' },
  primary: { background: 'var(--color-primary-soft)', color: 'var(--color-primary-strong)', borderColor: 'var(--color-primary-border)' },
}
export function Pill({ tone = 'neutral', children, icon, title }: { tone?: Tone; children: ReactNode; icon?: string; title?: string }) {
  return <span className="pill" style={toneStyle[tone]} title={title}>{icon && <Icon name={icon} size={12} />}{children}</span>
}

/* ---------- Layout ---------- */
export function PageHeader({ title, state, description, actions, kicker }: { title: string; kicker?: string; state?: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3" data-tour="page-header">
      <div className="min-w-0">
        {kicker && <div className="text-xs font-medium uppercase tracking-wide text-(--color-faint)">{kicker}</div>}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold leading-tight">{title}</h1>
          {state}
        </div>
        {description && <p className="mt-1 max-w-3xl text-(--color-muted)">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
export function Section({ title, description, children, actions, icon, className = '', id, tour }: { title?: string; description?: ReactNode; children: ReactNode; actions?: ReactNode; icon?: string; className?: string; id?: string; tour?: string }) {
  return (
    <section id={id} data-tour={tour} className={`surface p-4 ${className}`}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            {icon && <span className="mt-0.5 text-(--color-primary)" style={{ ['--icon-accent' as string]: 'var(--color-accent)' }}><Icon name={icon} size={18} /></span>}
            <div className="min-w-0">
              {title && <h2 className="text-[15px] font-semibold leading-snug">{title}</h2>}
              {description && <p className="text-[13px] text-(--color-muted)">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
export function Stat({ label, value, hint, onClick, tone }: { label: string; value: ReactNode; hint?: string; onClick?: () => void; tone?: Tone }) {
  const body = (
    <>
      <div className="text-xs font-medium text-(--color-muted)">{label}</div>
      <div className="mt-0.5 text-lg font-semibold leading-tight" style={tone === 'primary' ? { color: 'var(--color-primary)' } : undefined}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-(--color-faint)">{hint}</div>}
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className="surface brand-ring relative rounded-lg px-3 py-2.5 pr-8 text-left transition hover:bg-[#F7F8FA]">{body}<span className="absolute right-2.5 top-2.5 text-(--color-faint)" aria-hidden="true"><Icon name="arrow-up-right" size={14} /></span></button>
  ) : (
    <div className="surface px-3 py-2.5">{body}</div>
  )
}
export function DL({ items, cols = 2 }: { items: { label: string; value: ReactNode }[]; cols?: 1 | 2 | 3 }) {
  return (
    <dl className={`grid gap-x-6 gap-y-3 ${cols === 3 ? 'sm:grid-cols-3' : cols === 2 ? 'sm:grid-cols-2' : ''}`}>
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="text-xs font-medium text-(--color-muted)">{it.label}</dt>
          <dd className="mt-0.5 break-words">{it.value ?? 'Not provided'}</dd>
        </div>
      ))}
    </dl>
  )
}
export function EmptyState({ title, body, action, icon = 'folder' }: { title: string; body?: ReactNode; action?: ReactNode; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-(--color-border-strong) px-4 py-8 text-center">
      <span className="text-(--color-faint)"><Icon name={icon} size={26} /></span>
      <div className="mt-2 font-medium">{title}</div>
      {body && <p className="mt-1 max-w-md text-[13px] text-(--color-muted)">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
export function Spinner({ size = 18 }: { size?: number }) {
  return <span role="status" aria-label="Loading" className="inline-block animate-spin rounded-full border-2 border-(--color-border-strong) border-t-(--color-primary)" style={{ width: size, height: size }} />
}
export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return <div className="flex items-center gap-2 py-8 text-(--color-muted)"><Spinner /> {label}…</div>
}
export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-(--color-error) bg-(--color-error-soft) p-3 text-(--color-error)">
      <div className="font-medium">Something did not load</div>
      <div className="text-[13px]">{message}</div>
      {onRetry && <Button size="sm" className="mt-2" onClick={onRetry}>Try again</Button>}
    </div>
  )
}
export function Notice({ tone = 'info', children, icon }: { tone?: Tone; children: ReactNode; icon?: string }) {
  const s = toneStyle[tone]
  return <div className="flex items-start gap-2 rounded-md border px-3 py-2 text-[13px]" style={{ background: s.background, borderColor: s.borderColor as string, color: 'var(--color-text)' }}>{icon && <span style={{ color: s.color }}><Icon name={icon} size={16} /></span>}<div className="min-w-0">{children}</div></div>
}

/* ---------- Pagination (10 per page default) ---------- */
export function paginate<T>(items: T[], pageSize = 10, page: number, setPage: (p: number) => void) {
  const total = items.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), pages)
  const start = (safePage - 1) * pageSize
  const slice = items.slice(start, start + pageSize)
  return { slice, total, pages, page: safePage, from: total === 0 ? 0 : start + 1, to: Math.min(start + pageSize, total), setPage }
}
export function Pagination({ from, to, total, page, pages, setPage }: { from: number; to: number; total: number; page: number; pages: number; setPage: (p: number) => void }) {
  if (total === 0) return null
  return (
    <nav aria-label="Pagination" className="mt-3 flex items-center justify-between gap-3 text-[13px] text-(--color-muted)">
      <span>Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" icon="chevron-left" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
        <span className="px-1">Page {page} of {pages}</span>
        <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next <Icon name="chevron-right" size={16} /></Button>
      </div>
    </nav>
  )
}

/* ---------- Form fields ---------- */
export function Field({ label, hint, error, required, children, id }: { label: string; hint?: ReactNode; error?: string; required?: boolean; children: (id: string, describedBy: string | undefined) => ReactNode; id?: string }) {
  const auto = useId()
  const fid = id ?? auto
  const hintId = hint ? `${fid}-hint` : undefined
  const errId = error ? `${fid}-err` : undefined
  return (
    <div className="min-w-0">
      <label htmlFor={fid} className="mb-1 block text-[13px] font-medium">{label}{required && <span aria-hidden="true" className="text-(--color-primary)"> *</span>}</label>
      {children(fid, [hintId, errId].filter(Boolean).join(' ') || undefined)}
      {hint && <p id={hintId} className="mt-1 text-xs text-(--color-muted)">{hint}</p>}
      {error && <p id={errId} role="alert" className="mt-1 text-xs text-(--color-error)">{error}</p>}
    </div>
  )
}

/* ---------- Focus trap ---------- */
function useFocusTrap(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!active) return
    const prev = document.activeElement as HTMLElement | null
    const el = ref.current
    const focusables = () => Array.from(el?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])') ?? [])
    const first = focusables()[0]
    ;(el?.querySelector<HTMLElement>('[data-autofocus]') ?? first)?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key === 'Tab') {
        const f = focusables(); if (!f.length) return
        const i = f.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus() }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; prev?.focus?.() }
  }, [active, onClose])
  return ref
}

/* ---------- Dialog (fits 1280×720; body scrolls; footer sticky) ---------- */
export function Dialog({ open, onClose, title, subtitle, children, footer, width = 640 }: { open: boolean; onClose: () => void; title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  const ref = useFocusTrap(open, onClose)
  const tid = useId()
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,24,33,0.45)] p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={tid} className="flex max-h-[min(92vh,680px)] w-full flex-col rounded-lg bg-(--color-elevated) shadow-(--shadow-panel)" style={{ maxWidth: width }}>
        <div className="flex items-start justify-between gap-3 border-b border-(--color-border) px-5 py-3">
          <div className="min-w-0">
            <h2 id={tid} className="text-base font-semibold leading-snug">{title}</h2>
            {subtitle && <div className="text-[13px] text-(--color-muted)">{subtitle}</div>}
          </div>
          <button type="button" className="btn btn-ghost btn-sm -mr-2 px-2" onClick={onClose} aria-label="Close dialog"><Icon name="x-close" size={18} /></button>
        </div>
        <div className="scroll-y flex-1 px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-(--color-border) px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ---------- Side panel (right, ~50% desktop, near full on phones) ---------- */
export function SidePanel({ open, onClose, title, subtitle, children, headerExtra, width = '52vw' }: { open: boolean; onClose: () => void; title: string; subtitle?: ReactNode; children: ReactNode; headerExtra?: ReactNode; width?: string }) {
  const ref = useFocusTrap(open, onClose)
  const tid = useId()
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 bg-[rgba(20,24,33,0.25)]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={tid} className="absolute inset-y-0 right-0 flex w-[min(100vw-16px,var(--panel-w))] flex-col bg-(--color-elevated) shadow-(--shadow-panel)" style={{ ['--panel-w' as string]: width }}>
        <div className="border-b border-(--color-border) px-5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={tid} className="text-base font-semibold leading-snug">{title}</h2>
              {subtitle && <div className="text-[13px] text-(--color-muted)">{subtitle}</div>}
            </div>
            <button type="button" className="btn btn-ghost btn-sm -mr-2 px-2" onClick={onClose} aria-label="Close panel"><Icon name="x-close" size={18} /></button>
          </div>
          {headerExtra}
        </div>
        <div className="scroll-y flex-1 overflow-x-hidden px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/* ---------- Toasts ---------- */
type Toast = { id: number; tone: Tone; message: string }
let pushToast: ((t: Omit<Toast, 'id'>) => void) | null = null
export const toast = {
  success: (message: string) => pushToast?.({ tone: 'success', message }),
  error: (message: string) => pushToast?.({ tone: 'error', message }),
  info: (message: string) => pushToast?.({ tone: 'info', message }),
}
export function Toaster() {
  const [items, setItems] = useState<Toast[]>([])
  useEffect(() => {
    pushToast = (t) => {
      const id = Date.now() + Math.random()
      setItems((s) => [...s, { ...t, id }])
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 4500)
    }
    return () => { pushToast = null }
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex max-w-md items-center gap-2 rounded-md border bg-(--color-elevated) px-3 py-2 text-[13px] shadow-(--shadow-panel)" style={{ borderColor: toneStyle[t.tone].borderColor as string }}>
          <span style={{ color: toneStyle[t.tone].color }}><Icon name={t.tone === 'success' ? 'check-circle' : t.tone === 'error' ? 'alert-circle' : 'info-circle'} size={16} /></span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

/* ---------- Avatar ---------- */
export function Avatar({ initials, size = 28 }: { initials: string; size?: number }) {
  return <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) font-semibold text-(--color-accent)" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</span>
}
