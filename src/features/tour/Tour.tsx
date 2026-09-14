import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { createPortal } from 'react-dom'
import { TOUR_STEPS } from '@/features/tour/steps'
import { useSession } from '@/app/session'
import { Button } from '@/components/ui'
import { Icon } from '@/icons/Icon'

const STORAGE = 'scg-capability-suite.tour.active'

/** /tour?step=n: sets the persona, navigates to the step's page and mounts the overlay there. */
export function TourPage() {
  const { step } = useSearch({ strict: false }) as { step: number }
  const nav = useNavigate()
  const { signIn, signOut } = useSession()
  useEffect(() => {
    const s = TOUR_STEPS[Math.min(Math.max(step, 0), TOUR_STEPS.length - 1)]
    sessionStorage.setItem(STORAGE, String(step))
    if (s.personaId) signIn(s.personaId); else signOut()
    nav({ to: s.path, replace: true })
  }, [step, nav, signIn, signOut])
  return <div className="p-6 text-(--color-muted)">Opening the guided introduction…</div>
}

/** Mounted on every page; renders the overlay while a tour step is active. */
export function TourOverlay() {
  const nav = useNavigate()
  const [idx, setIdx] = useState<number | null>(() => { const v = sessionStorage.getItem(STORAGE); return v == null ? null : Number(v) })
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onStorage = () => { const v = sessionStorage.getItem(STORAGE); setIdx(v == null ? null : Number(v)) }
    window.addEventListener('tour-change', onStorage)
    return () => window.removeEventListener('tour-change', onStorage)
  }, [])
  const step = idx == null ? null : TOUR_STEPS[idx]
  useLayoutEffect(() => {
    if (!step) return
    let raf = 0
    const measure = () => {
      const el = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null
      if (el) { el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior }); setRect(el.getBoundingClientRect()) } else setRect(null)
    }
    const t = setTimeout(measure, 250)
    const loop = () => { const el = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null; if (el) setRect(el.getBoundingClientRect()); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [step])
  useEffect(() => {
    if (!step) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(idx! + 1); if (e.key === 'ArrowLeft') go(idx! - 1); if (e.key === 'Escape') exit() }
    document.addEventListener('keydown', onKey)
    cardRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  })
  if (!step || idx == null) return null
  const go = (n: number) => { if (n < 0 || n >= TOUR_STEPS.length) return; setListOpen(false); sessionStorage.setItem(STORAGE, String(n)); window.dispatchEvent(new Event('tour-change')); nav({ to: '/tour', search: { step: n } }) }
  const exit = () => { sessionStorage.removeItem(STORAGE); setIdx(null); window.dispatchEvent(new Event('tour-change')); nav({ to: '/login' }) }
  const pad = 8
  const vw = window.innerWidth, vh = window.innerHeight
  const cardW = Math.min(420, vw - 32)
  // Place the card where it does not cover the target: right of it if room, else left, else below/above.
  let left = 16, top = vh - 16
  let anchor: 'bottom' | 'free' = 'bottom'
  if (rect) {
    if (rect.right + pad + cardW + 16 < vw) { left = rect.right + pad + 8; top = Math.max(16, Math.min(rect.top, vh - 320)); anchor = 'free' }
    else if (rect.left - pad - cardW - 16 > 0) { left = rect.left - pad - cardW - 8; top = Math.max(16, Math.min(rect.top, vh - 320)); anchor = 'free' }
    else if (rect.bottom + 300 < vh) { left = Math.max(16, Math.min(rect.left, vw - cardW - 16)); top = rect.bottom + pad + 8; anchor = 'free' }
    else if (rect.top > 320) { left = Math.max(16, Math.min(rect.left, vw - cardW - 16)); top = rect.top - pad - 300; anchor = 'free' }
  }
  return createPortal(
    <div className="fixed inset-0 z-[70]" aria-live="polite">
      {rect ? (
        <>
          <div className="absolute inset-0" style={{ background: 'rgba(20,24,33,0.45)', clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${rect.top - pad}px, ${rect.left - pad}px ${rect.top - pad}px, ${rect.left - pad}px ${rect.bottom + pad}px, ${rect.right + pad}px ${rect.bottom + pad}px, ${rect.right + pad}px ${rect.top - pad}px, 0 ${rect.top - pad}px)` }} />
          <div className="pointer-events-none absolute rounded-lg" style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, border: '2px solid var(--color-primary)', boxShadow: '0 0 0 2px rgba(255,255,255,0.8)' }} />
        </>
      ) : <div className="absolute inset-0" style={{ background: 'rgba(20,24,33,0.35)' }} />}
      <div ref={cardRef} tabIndex={-1} role="dialog" aria-label={`Introduction step ${idx + 1} of ${TOUR_STEPS.length}: ${step.title}`}
        className="absolute flex flex-col rounded-lg bg-(--color-elevated) shadow-(--shadow-panel) outline-none"
        style={anchor === 'free' ? { left, top, width: cardW, maxHeight: vh - 32 } : { left: 16, bottom: 16, width: cardW, maxHeight: vh - 32 }}>
        <div className="flex items-start justify-between gap-2 border-b border-(--color-border) px-4 py-3">
          <div><div className="text-[11px] font-semibold uppercase tracking-wide text-(--color-primary)">Introduction · step {idx + 1} of {TOUR_STEPS.length}</div><h2 className="text-[15px] font-semibold leading-snug">{step.title}</h2></div>
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-ghost btn-sm px-2" aria-expanded={listOpen} aria-label="Choose a function" onClick={() => setListOpen((v) => !v)}><Icon name="list" size={16} /></button>
            <button type="button" className="btn btn-ghost btn-sm px-2" aria-label="Exit introduction" onClick={exit}><Icon name="x-close" size={16} /></button>
          </div>
        </div>
        <div className="scroll-y px-4 py-3 text-[13px]">
          {listOpen ? (
            <ol className="space-y-1">{TOUR_STEPS.map((s, i) => <li key={s.id}><button type="button" className={`row-link w-full px-2 py-1 text-left ${i === idx ? 'bg-(--color-primary-soft) font-medium' : ''}`} onClick={() => go(i)}>{i + 1}. {s.title}</button></li>)}</ol>
          ) : (
            <>
              <div className="mb-2"><div className="font-semibold">What to do</div><p>{step.what}</p></div>
              <div className="mb-2"><div className="font-semibold">Why</div><p>{step.why}</p></div>
              <div><div className="font-semibold">Benefit</div><p>{step.benefit}</p></div>
              {step.target && !rect && <p className="mt-2 text-(--color-warning)">The highlighted area is loading…</p>}
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-(--color-border) px-4 py-2.5">
          <Button size="sm" icon="chevron-left" disabled={idx === 0} onClick={() => go(idx - 1)}>Back</Button>
          {idx < TOUR_STEPS.length - 1 ? <Button size="sm" variant="primary" onClick={() => go(idx + 1)}>Next <Icon name="chevron-right" size={14} style={{ ['--icon-accent' as string]: '#fff' }} /></Button> : <Button size="sm" variant="primary" onClick={exit}>Finish</Button>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
