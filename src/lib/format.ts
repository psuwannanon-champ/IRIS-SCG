import { format, parseISO, differenceInCalendarDays, isValid } from 'date-fns'
import { DEMO_TODAY } from '@/data/fixtures'

export const today = () => new Date()
export const demoToday = () => new Date(`${DEMO_TODAY}T09:00:00+07:00`)

export function fmtDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return 'Not provided'
  const d = parseISO(iso)
  if (!isValid(d)) return iso
  return format(d, withTime ? 'd MMM yyyy, HH:mm' : 'd MMM yyyy')
}
export function fmtThb(v: number | null | undefined, compact = false) {
  if (v == null) return 'Not provided'
  if (compact) {
    if (Math.abs(v) >= 1_000_000) return `THB ${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`
    if (Math.abs(v) >= 1_000) return `THB ${(v / 1_000).toFixed(0)}K`
  }
  return `THB ${v.toLocaleString('en-US')}`
}
export function fmtNum(v: number | null | undefined, unit?: string | null) {
  if (v == null) return 'Not provided'
  return `${v.toLocaleString('en-US')}${unit ? ` ${unit}` : ''}`
}
export function daysUntil(iso: string | null | undefined) {
  if (!iso) return null
  return differenceInCalendarDays(parseISO(iso), today())
}
export function relativeDue(iso: string | null | undefined) {
  const n = daysUntil(iso)
  if (n == null) return ''
  if (n < 0) return `${Math.abs(n)} day${Math.abs(n) === 1 ? '' : 's'} overdue`
  if (n === 0) return 'Due today'
  return `Due in ${n} day${n === 1 ? '' : 's'}`
}
export const orNotProvided = (v: string | null | undefined) => (v && v.trim() ? v : 'Not provided')
export const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100))
