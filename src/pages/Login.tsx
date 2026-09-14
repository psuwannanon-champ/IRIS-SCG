import { Link, useNavigate } from '@tanstack/react-router'
import { useSession } from '@/app/session'
import { useData } from '@/app/data'
import { PersonaList } from '@/app/shell'
import { Icon } from '@/icons/Icon'
import { Pill } from '@/components/ui'

export function LoginPage() {
  const { signIn } = useSession()
  const { backend } = useData()
  const nav = useNavigate()
  return (
    <div className="min-h-full bg-(--color-page)">
      <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:py-14">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-(--color-primary) text-white" aria-hidden="true"><Icon name="graduation-hat-01" size={22} style={{ ['--icon-accent' as string]: '#fff' }} /></span>
            <div><div className="text-base font-semibold leading-tight">SCG Capability Suite</div><div className="text-[12px] text-(--color-muted)">Modernize SCG Capability Development 2027 · prototype</div></div>
          </div>
          <h1 className="mt-6 text-2xl font-semibold leading-snug">Skills-first, project-based, AI-powered capability development in one platform</h1>
          <p className="mt-3 text-(--color-muted)">AI diagnostics personalise each journey, impact contracts turn learning into measured P&L results, gated concepts scale into ventures, and verified skills mint into one passport wired to careers and rewards.</p>
          <ul className="mt-5 space-y-2 text-[13px]">
            {[
              ['target-04', 'Modernized ABC: 12-week skills-first accelerator with a 90-day impact sprint'],
              ['rocket-01', 'Modernized BCD: sponsor-owned challenges gated like investments (Gates 1–3)'],
              ['award-01', 'Skill passport and impact ledger: two verified currencies for careers and rewards'],
              ['stars-02', 'Personalisation engine and always-on AI coach (simulated in this prototype)'],
            ].map(([icon, text]) => (
              <li key={text} className="flex items-start gap-2"><span className="mt-0.5 text-(--color-primary)" style={{ ['--icon-accent' as string]: 'var(--color-accent)' }}><Icon name={icon} size={18} /></span><span>{text}</span></li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link to="/tour" search={{ step: 0 }} className="btn btn-primary" data-tour="intro-button"><Icon name="presentation-chart-01" size={16} style={{ ['--icon-accent' as string]: '#fff' }} />Introduction to platform</Link>
            <Pill tone={backend === 'supabase' ? 'success' : 'warning'} icon="database-01">{backend === 'supabase' ? 'Connected to Supabase' : 'Local demo fixtures'}</Pill>
          </div>
          <p className="mt-6 text-[12px] text-(--color-faint)">Prototype environment. All people, business units, numbers and outcomes are fictional. Persona switching replaces sign-in; no passwords are stored in the browser.</p>
        </div>
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Choose a demo persona to walk through</h2>
          <p className="mb-4 text-[13px] text-(--color-muted)">Each persona sees only the records and actions their role owns. Start with Nara (learner) for the ABC journey or Prasert (sponsor) for approvals and BCD briefs.</p>
          <PersonaList onPick={(id) => { signIn(id); nav({ to: '/home' }) }} />
        </div>
      </div>
    </div>
  )
}
