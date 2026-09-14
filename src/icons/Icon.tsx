// Verified duocolor icons exported from Champ's Untitled UI Icons PRO v1.6 Figma library.
// Geometry is untouched; only colour attributes are mapped to tokens at render time.
// The "Accent" layer keeps its original 40% opacity and takes --icon-accent (defaults to currentColor).
import { useMemo } from 'react'

const files = import.meta.glob('./svg/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const registry = new Map<string, string>()
for (const [path, raw] of Object.entries(files)) {
  const name = path.replace('./svg/', '').replace('.svg', '')
  registry.set(name, raw)
}

export type IconName = string
export const iconNames = Array.from(registry.keys()).sort()

const cache = new Map<string, string>()
function prepare(name: string): string | null {
  if (cache.has(name)) return cache.get(name)!
  const raw = registry.get(name)
  if (!raw) return null
  let inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  // Accent layer → accent token; everything else → currentColor.
  inner = inner.replace(/(<(?:path|g|rect|circle)[^>]*id="Accent[^"]*"[^>]*)stroke="black"/g, '$1stroke="var(--icon-accent, currentColor)"')
  inner = inner.replace(/<g id="Accent([^"]*)" opacity="0.4">([\s\S]*?)<\/g>/g, (m: string, suffix: string, body: string) => `<g id="Accent${suffix}" opacity="0.4">${body.replace(/stroke="black"/g, 'stroke="var(--icon-accent, currentColor)"')}</g>`)
  inner = inner.replace(/stroke="black"/g, 'stroke="currentColor"').replace(/fill="black"/g, 'fill="currentColor"')
  cache.set(name, inner)
  return inner
}

interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  /** Accessible name. Omit for decorative icons (hidden from assistive technology). */
  label?: string
}

export function Icon({ name, size = 20, label, className, style, ...rest }: IconProps) {
  const inner = useMemo(() => prepare(name), [name])
  if (!inner) {
    if (import.meta.env.DEV) console.warn(`Icon "${name}" is not in the verified Untitled UI export set.`)
    return <span aria-hidden="true" style={{ display: 'inline-block', width: size, height: size }} />
  }
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false"
      className={className} style={{ flexShrink: 0, ...style }} dangerouslySetInnerHTML={{ __html: inner }} {...rest}
    />
  )
}
