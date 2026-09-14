import type { Role } from '@/domain/types'

export interface NavItem { key: string; label: string; to: string; icon: string; roles: Role[]; badgeKeys?: string[] }
export interface NavGroup { label: string; items: NavItem[] }

const ALL: Role[] = ['learner', 'line_manager', 'bu_sponsor', 'coach', 'committee', 'program_office']

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Work',
    items: [
      { key: 'home', label: 'Home', to: '/home', icon: 'home-02', roles: ALL },
      { key: 'tasks', label: 'My tasks', to: '/tasks', icon: 'check-done-01', roles: ALL, badgeKeys: ['*'] },
    ],
  },
  {
    label: 'Programs',
    items: [
      { key: 'journey', label: 'My journey', to: '/journey', icon: 'route', roles: ['learner'] },
      { key: 'assessment', label: 'Assessment', to: '/assessment', icon: 'clipboard-check', roles: ['learner'], badgeKeys: ['journey'] },
      { key: 'assessments', label: 'Assessments', to: '/assessments', icon: 'clipboard-check', roles: ['line_manager', 'bu_sponsor', 'coach', 'committee', 'program_office'] },
      { key: 'learning', label: 'Learning plan', to: '/learning', icon: 'book-open-01', roles: ['learner'], badgeKeys: ['learning'] },
      { key: 'labs', label: 'Lab days', to: '/labs', icon: 'users-01', roles: ['learner'] },
      { key: 'team', label: 'My team', to: '/team', icon: 'users-01', roles: ['line_manager'] },
      { key: 'contracts', label: 'Impact contracts', to: '/contracts', icon: 'file-check-02', roles: ALL, badgeKeys: ['contracts'] },
      { key: 'briefs', label: 'Challenge briefs', to: '/briefs', icon: 'lightbulb-02', roles: ['bu_sponsor', 'committee', 'program_office'], badgeKeys: ['briefs'] },
      { key: 'concepts', label: 'Concepts & gates', to: '/concepts', icon: 'rocket-01', roles: ALL, badgeKeys: ['concepts'] },
      { key: 'cohorts', label: 'Cohorts', to: '/cohorts', icon: 'calendar', roles: ['program_office', 'coach', 'committee'] },
      { key: 'coaching', label: 'Coaching workspace', to: '/coaching', icon: 'message-chat-circle', roles: ['coach'], badgeKeys: ['coaching'] },
    ],
  },
  {
    label: 'Talent',
    items: [
      { key: 'passport', label: 'Skill passport', to: '/passport', icon: 'award-01', roles: ALL },
      { key: 'success-cases', label: 'Success cases', to: '/success-cases', icon: 'trophy-01', roles: ALL },
      { key: 'marketplace', label: 'Talent marketplace', to: '/marketplace', icon: 'briefcase-01', roles: ['learner', 'line_manager', 'bu_sponsor', 'program_office'] },
    ],
  },
  {
    label: 'Governance',
    items: [
      { key: 'performance', label: 'Performance dashboard', to: '/performance', icon: 'speedometer-03', roles: ['line_manager', 'bu_sponsor', 'coach', 'committee', 'program_office'] },
      { key: 'ledger', label: 'Impact ledger', to: '/ledger', icon: 'coins-stacked-01', roles: ['learner', 'line_manager', 'bu_sponsor', 'committee', 'program_office'], badgeKeys: ['ledger'] },
      { key: 'governance', label: 'Impact dashboard', to: '/governance', icon: 'bar-chart-square-02', roles: ['bu_sponsor', 'committee', 'program_office'] },
      { key: 'strategy', label: 'Strategy roadmap', to: '/strategy', icon: 'compass-03', roles: ['bu_sponsor', 'committee', 'program_office'] },
      { key: 'agenda', label: 'Capability agenda', to: '/agenda', icon: 'target-02', roles: ['bu_sponsor', 'committee', 'program_office'] },
      { key: 'blueprints', label: 'Role blueprints', to: '/blueprints', icon: 'user-square', roles: ['bu_sponsor', 'program_office'] },
      { key: 'taxonomy', label: 'Skills taxonomy', to: '/taxonomy', icon: 'layers-three-01', roles: ['program_office', 'committee', 'coach'] },
      { key: 'integrations', label: 'Integrations', to: '/integrations', icon: 'data', roles: ['program_office', 'committee'] },
    ],
  },
  {
    label: 'Support',
    items: [
      { key: 'ai-coach', label: 'Expert Guidance', to: '/ai-coach', icon: 'stars-02', roles: ['learner', 'coach'] },
      { key: 'notifications', label: 'Updates', to: '/notifications', icon: 'bell-01', roles: ALL },
    ],
  },
]

export function navForRole(role: Role): NavGroup[] {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) })).filter((g) => g.items.length)
}
