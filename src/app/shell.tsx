import { useMemo, useState, type ReactNode } from 'react'
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/app/session'
import { useData, useSnapshot } from '@/app/data'
import { navForRole } from '@/app/nav'
import { selectTasks, taskNavKey, unreadNotifications } from '@/domain/selectors'
import { ROLE_LABEL } from '@/domain/types'
import { Icon } from '@/icons/Icon'
import { Avatar, Button, Dialog, LoadingBlock, ErrorBlock, Pill } from '@/components/ui'
import { ExplainButton } from '@/features/explain/ExplainPanel'

export function AppShell() {
  const { personaId, signOut, sidebarCollapsed, toggleSidebar, signIn } = useSession()
  const { backend, reason } = useData()
  const snap = useSnapshot()
  const loc = useLocation()
  const nav = useNavigate()
  const [switching, setSwitching] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const persona = snap.data?.personas.find((p) => p.id === personaId) ?? null
  const tasks = useMemo(() => (snap.data && persona ? selectTasks(snap.data, persona) : []), [snap.data, persona])
  const badgeByKey = useMemo(() => {
    const m: Record<string, number> = {}
    for (const t of tasks) { const k = taskNavKey(t); m[k] = (m[k] ?? 0) + 1 }
    m['*'] = tasks.length
    return m
  }, [tasks])
  const unread = snap.data && persona ? unreadNotifications(snap.data, persona.id).length : 0

  if (snap.isLoading) return <div className="p-6"><LoadingBlock label="Loading workspace" /></div>
  if (snap.isError) return <div className="p-6"><ErrorBlock message={(snap.error as Error).message} onRetry={() => snap.refetch()} /></div>
  if (!persona) {
    return <div className="p-6"><ErrorBlock message="The selected demo persona does not exist in this dataset." onRetry={() => { signOut(); nav({ to: '/login' }) }} /></div>
  }
  const groups = navForRole(persona.role)

  const sidebar = (
    <nav aria-label="Main navigation" className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 py-3">
        <Link to="/home" className="flex min-w-0 items-center gap-2 text-(--color-text)" aria-label="SCG Capability Suite home">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-(--color-primary) text-white" aria-hidden="true"><Icon name="graduation-hat-01" size={18} style={{ ['--icon-accent' as string]: '#fff' }} /></span>
          {!sidebarCollapsed && <span className="min-w-0"><span className="block truncate text-[13px] font-semibold leading-tight">SCG Capability Suite</span><span className="block text-[11px] leading-tight text-(--color-faint)">Prototype · fictional data</span></span>}
        </Link>
      </div>
      <div className="scroll-y flex-1 px-2 pb-2">
        {groups.map((g) => {
          const groupCount = g.items.reduce((a, i) => a + (i.badgeKeys?.filter((k) => k !== '*').reduce((x, k) => x + (badgeByKey[k] ?? 0), 0) ?? 0), 0)
          return (
            <div key={g.label} className="mt-2">
              <div className="flex h-6 items-center justify-between px-2">
                {!sidebarCollapsed && <span className="text-[11px] font-semibold uppercase tracking-wide text-(--color-faint)">{g.label}</span>}
                {sidebarCollapsed && groupCount > 0 && <BadgeLink count={groupCount} to={`/tasks`} label={`${groupCount} tasks in ${g.label}`} />}
              </div>
              <ul className="mt-0.5 space-y-0.5">
                {g.items.map((it) => {
                  const active = loc.pathname === it.to || loc.pathname.startsWith(it.to + '/')
                  const count = it.badgeKeys?.reduce((a, k) => a + (badgeByKey[k] ?? 0), 0) ?? 0
                  return (
                    <li key={it.key} className="flex items-center">
                      <Link to={it.to} aria-current={active ? 'page' : undefined} onClick={() => setMobileOpen(false)} data-tour={`nav-${it.key}`}
                        className={`row-link flex h-9 min-w-0 flex-1 items-center gap-2.5 px-2 ${active ? 'bg-(--color-primary-soft) font-medium text-(--color-primary-strong)' : 'text-(--color-text)'}`}
                        style={active ? { ['--icon-accent' as string]: 'var(--color-accent)' } : undefined} title={sidebarCollapsed ? it.label : undefined}>
                        <Icon name={it.icon} size={18} />
                        {!sidebarCollapsed && <span className="truncate">{it.label}</span>}
                      </Link>
                      <span className="flex w-9 shrink-0 justify-center">{count > 0 && !sidebarCollapsed && <BadgeLink count={count} to={it.key === 'tasks' ? '/tasks' : `/tasks?group=${it.badgeKeys?.[0]}`} label={`${count} actionable ${it.label} task${count === 1 ? '' : 's'}`} />}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
      <div className="border-t border-(--color-border) p-2">
        <button type="button" onClick={toggleSidebar} className="row-link hidden h-9 w-full items-center gap-2 px-2 text-(--color-muted) lg:flex" aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}>
          <Icon name={sidebarCollapsed ? 'chevron-right' : 'chevron-left'} size={18} />{!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </nav>
  )

  return (
    <div className="flex h-full min-h-0">
      <aside className={`hidden shrink-0 border-r border-(--color-border) bg-(--color-surface) lg:block ${sidebarCollapsed ? 'w-[64px]' : 'w-[236px]'}`}>{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[rgba(20,24,33,0.4)] lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="h-full w-[260px] bg-(--color-surface)" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-(--color-border) bg-(--color-surface) px-3">
          <button type="button" className="btn btn-ghost btn-sm px-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Icon name="menu-01" size={20} /></button>
          <div className="min-w-0 flex-1" data-tour="backend-status">
            {backend === 'supabase'
              ? <Pill tone="success" icon="database-01" title="Reads and writes go to the connected Supabase project">Connected to Supabase</Pill>
              : <Pill tone="warning" icon="database-01" title={reason ?? undefined}>Local demo fixtures</Pill>}
          </div>
          <Link to="/notifications" className="btn btn-ghost btn-sm relative px-2" aria-label={`Updates, ${unread} unread`} data-tour="updates">
            <Icon name="bell-01" size={18} />
            {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-(--color-accent) px-1 text-[10px] font-semibold text-white">{unread}</span>}
          </Link>
          <button type="button" className="btn btn-ghost btn-sm gap-2 pl-1 pr-2" onClick={() => setSwitching(true)} data-tour="persona" aria-label={`Signed in as ${persona.fullName}. Switch persona`}>
            <Avatar initials={persona.initials} size={26} />
            <span className="hidden min-w-0 text-left sm:block"><span className="block max-w-[180px] truncate text-[13px] font-medium leading-tight">{persona.fullName}</span><span className="block text-[11px] leading-tight text-(--color-muted)">{ROLE_LABEL[persona.role]}</span></span>
            <Icon name="switch-horizontal-01" size={16} />
          </button>
        </header>
        <main id="main" className="scroll-y min-w-0 flex-1 px-4 py-4 sm:px-6"><div className="mx-auto max-w-[1240px]"><Outlet /></div></main>
      </div>
      <ExplainButton />
      <Dialog open={switching} onClose={() => setSwitching(false)} title="Switch demo persona" subtitle="Controlled prototype environment. All people are fictional.">
        <PersonaList onPick={(id) => { signIn(id); setSwitching(false); nav({ to: '/home' }) }} current={persona.id} />
        <div className="mt-4 flex justify-end"><Button variant="ghost" icon="log-out-01" onClick={() => { signOut(); nav({ to: '/login' }) }}>Sign out</Button></div>
      </Dialog>
    </div>
  )
}

function BadgeLink({ count, to, label }: { count: number; to: string; label: string }) {
  return <Link to={to} aria-label={label} className="grid h-5 min-w-5 place-items-center rounded-full bg-(--color-primary) px-1.5 text-[11px] font-semibold text-white hover:bg-(--color-primary-strong)">{count}</Link>
}

export function PersonaList({ onPick, current }: { onPick: (id: string) => void; current?: string | null }) {
  const snap = useSnapshot()
  if (!snap.data) return <LoadingBlock />
  const roles = ['learner', 'line_manager', 'bu_sponsor', 'coach', 'committee', 'program_office'] as const
  return (
    <div className="space-y-4">
      {roles.map((r) => (
        <div key={r}>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-(--color-faint)">{ROLE_LABEL[r]}</div>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {snap.data!.personas.filter((p) => p.role === r).map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => onPick(p.id)} data-selected={p.id === current} data-tour={`persona-${p.code}`}
                  className="surface brand-ring flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-[#F7F8FA]">
                  <Avatar initials={p.initials} size={32} />
                  <span className="min-w-0"><span className="block truncate text-[13px] font-medium">{p.fullName}</span><span className="block truncate text-[12px] text-(--color-muted)">{p.jobTitle}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function Guard({ allow, children }: { allow: (role: string) => boolean; children: ReactNode }) {
  const { personaId } = useSession()
  const snap = useSnapshot()
  const persona = snap.data?.personas.find((p) => p.id === personaId)
  if (!persona) return null
  if (!allow(persona.role)) {
    return (
      <div className="surface mx-auto mt-10 max-w-lg p-6 text-center">
        <span className="text-(--color-primary)"><Icon name="lock-01" size={28} /></span>
        <h1 className="mt-2 text-lg font-semibold">This page is not available for your role</h1>
        <p className="mt-1 text-(--color-muted)">{persona.fullName} is signed in as {ROLE_LABEL[persona.role]}. Ask the program office if you need access, or switch persona to walk through this function.</p>
        <Link to="/home" className="btn btn-secondary mt-4">Back to home</Link>
      </div>
    )
  }
  return <>{children}</>
}
