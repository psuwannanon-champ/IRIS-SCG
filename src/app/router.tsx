import { createRootRoute, createRoute, createRouter, redirect, Outlet } from '@tanstack/react-router'
import { useSession } from '@/app/session'
import { AppShell, Guard } from '@/app/shell'
import { LoginPage } from '@/pages/Login'
import { HomePage } from '@/pages/Home'
import { TasksPage } from '@/pages/Tasks'
import { NotificationsPage } from '@/pages/Notifications'
import { JourneyPage } from '@/pages/Journey'
import { LearningPage } from '@/pages/Learning'
import { TeamPage } from '@/pages/Team'
import { ContractsPage, ContractDetailPage, ContractNewPage } from '@/pages/Contracts'
import { BriefsPage, BriefDetailPage, BriefNewPage } from '@/pages/Briefs'
import { ConceptsPage, ConceptDetailPage } from '@/pages/Concepts'
import { CohortsPage, CohortDetailPage } from '@/pages/Cohorts'
import { CoachingPage } from '@/pages/Coaching'
import { PassportPage } from '@/pages/Passport'
import { MarketplacePage } from '@/pages/Marketplace'
import { LedgerPage } from '@/pages/Ledger'
import { GovernancePage } from '@/pages/Governance'
import { TaxonomyPage } from '@/pages/Taxonomy'
import { AiCoachPage } from '@/pages/AiCoach'
import { AssessmentPage } from '@/pages/Assessment'
import { AssessmentsPage } from '@/pages/Assessments'
import { StrategyPage } from '@/pages/Strategy'
import { AgendaPage } from '@/pages/Agenda'
import { LabsPage } from '@/pages/Labs'
import { SuccessCasesPage } from '@/pages/SuccessCases'
import { TourPage, TourOverlay } from '@/features/tour/Tour'
import { NAV_GROUPS } from '@/app/nav'

const rootRoute = createRootRoute({ component: () => <><Outlet /><TourOverlay /></> })

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', beforeLoad: () => { throw redirect({ to: useSession.getState().personaId ? '/home' : '/login' }) } })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage })
const tourRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tour', component: TourPage, validateSearch: (s: Record<string, unknown>) => ({ step: Number(s.step ?? 0) || 0 }) })

const appRoute = createRoute({
  getParentRoute: () => rootRoute, id: 'app', component: AppShell,
  beforeLoad: () => { if (!useSession.getState().personaId) throw redirect({ to: '/login' }) },
})

const rolesFor = (key: string) => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === key)?.roles ?? []
const guarded = (key: string, Comp: () => React.JSX.Element) => () => <Guard allow={(r) => (rolesFor(key) as string[]).includes(r)}><Comp /></Guard>

const r = (path: string, component: () => React.JSX.Element, opts: Record<string, unknown> = {}) => createRoute({ getParentRoute: () => appRoute, path, component, ...opts })
const listSearch = (s: Record<string, unknown>) => ({ page: Number(s.page ?? 1) || 1, status: (s.status as string) ?? '', q: (s.q as string) ?? '', group: (s.group as string) ?? '', program: (s.program as string) ?? '', persona: (s.persona as string) ?? '' })

const routes = [
  r('/home', HomePage),
  r('/tasks', TasksPage, { validateSearch: listSearch }),
  r('/notifications', NotificationsPage, { validateSearch: listSearch }),
  r('/journey', guarded('journey', JourneyPage)),
  r('/learning', guarded('learning', LearningPage)),
  r('/assessment', guarded('assessment', AssessmentPage)),
  r('/assessments', guarded('assessments', AssessmentsPage), { validateSearch: listSearch }),
  r('/labs', guarded('labs', LabsPage)),
  r('/success-cases', SuccessCasesPage),
  r('/team', guarded('team', TeamPage)),
  r('/contracts', ContractsPage, { validateSearch: listSearch }),
  r('/contracts/new', ContractNewPage),
  r('/contracts/$id', ContractDetailPage),
  r('/briefs', guarded('briefs', BriefsPage), { validateSearch: listSearch }),
  r('/briefs/new', guarded('briefs', BriefNewPage)),
  r('/briefs/$id', BriefDetailPage),
  r('/concepts', ConceptsPage, { validateSearch: listSearch }),
  r('/concepts/$id', ConceptDetailPage),
  r('/cohorts', guarded('cohorts', CohortsPage), { validateSearch: listSearch }),
  r('/cohorts/$id', guarded('cohorts', CohortDetailPage)),
  r('/coaching', guarded('coaching', CoachingPage)),
  r('/passport', PassportPage, { validateSearch: listSearch }),
  r('/marketplace', guarded('marketplace', MarketplacePage)),
  r('/ledger', guarded('ledger', LedgerPage), { validateSearch: listSearch }),
  r('/governance', guarded('governance', GovernancePage)),
  r('/strategy', guarded('strategy', StrategyPage)),
  r('/agenda', guarded('agenda', AgendaPage), { validateSearch: (s: Record<string, unknown>) => ({ bu: (s.bu as string) ?? '' }) }),
  r('/taxonomy', guarded('taxonomy', TaxonomyPage), { validateSearch: listSearch }),
  r('/ai-coach', guarded('ai-coach', AiCoachPage)),
]

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, tourRoute, appRoute.addChildren(routes)])
export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true })
