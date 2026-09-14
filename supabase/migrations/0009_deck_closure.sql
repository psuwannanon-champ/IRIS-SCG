-- Closes the deck gap list: economics, role blueprints, outcomes, knowledge reuse, governance records.

-- 1 · Programme economics (ROI, self-funding)
alter table public.cohorts add column if not exists budget_thb numeric;
create table if not exists public.cost_lines (
  id text primary key, cohort_id text not null references public.cohorts(id),
  category text not null check (category in ('design','delivery','coaching','platform','travel','other')),
  description text not null, amount_thb numeric not null, recorded_by text references public.personas(id), recorded_at timestamptz not null default now()
);

-- 2 · Role blueprints (AI reads a new role and generates the capability plan)
create table if not exists public.role_blueprints (
  id text primary key, bu_id text not null references public.business_units(id), role_title text not null, level text not null,
  operating_model_change text not null, responsibilities text not null, headcount int not null default 1,
  status text not null default 'draft' check (status in ('draft','generated','adopted')),
  generated jsonb, model text, created_by text references public.personas(id), created_at timestamptz not null default now(), adopted_at timestamptz
);

-- 3 · Outcomes: retention, mobility, leaders-first, learner KPIs
alter table public.personas add column if not exists employment_status text not null default 'active' check (employment_status in ('active','left'));
alter table public.personas add column if not exists left_at date;
alter table public.personas add column if not exists leader_cohort boolean not null default false;
alter table public.personas add column if not exists kpis text;
alter table public.marketplace_interests add column if not exists placed_at timestamptz;
alter table public.marketplace_interests drop constraint if exists marketplace_interests_status_check;
alter table public.marketplace_interests add constraint marketplace_interests_status_check check (status in ('expressed','shortlisted','declined','placed'));

-- 4 · Knowledge reuse: a validated case packaged as a micro-module
alter table public.learning_modules add column if not exists origin text not null default 'catalogue' check (origin in ('catalogue','success_case'));
alter table public.learning_modules add column if not exists source_contract_id text;
alter table public.learning_modules add column if not exists bu_id text references public.business_units(id);
alter table public.learning_modules add column if not exists body jsonb;

-- 5 · Policy pack (People Committee resolution)
create table if not exists public.policy_items (
  id text primary key, name text not null, description text not null,
  status text not null default 'drafted' check (status in ('drafted','submitted','approved','deferred')),
  effective_from date, resolution_ref text, owner text not null, decided_by text references public.personas(id), decided_at timestamptz, note text
);

-- 7 · Structured gate evidence, business case and attachments
alter table public.gate_reviews add column if not exists evidence jsonb;
alter table public.gate_reviews add column if not exists business_case jsonb;
alter table public.gate_reviews add column if not exists attachments jsonb not null default '[]'::jsonb;

-- 9 · Peer pods
create table if not exists public.pods (
  id text primary key, cohort_id text not null references public.cohorts(id), name text not null, coach_id text references public.personas(id)
);
alter table public.enrollments add column if not exists pod_id text;

-- 11 · Practice partner sessions scored against a rubric
create table if not exists public.practice_sessions (
  id text primary key, persona_id text not null references public.personas(id), scenario text not null,
  transcript jsonb not null default '[]'::jsonb, scores jsonb, overall numeric, model text, created_at timestamptz not null default now()
);

-- 13 · Talent review packs, succession pools, incubation roles
create table if not exists public.talent_reviews (
  id text primary key, persona_id text not null references public.personas(id), cycle text not null, content jsonb not null,
  model text, created_by text references public.personas(id), created_at timestamptz not null default now()
);
create table if not exists public.succession_entries (
  id text primary key, persona_id text not null references public.personas(id), pool text not null check (pool in ('L2','L3','incubation_lead')),
  basis text not null, entered_by text references public.personas(id), entered_at timestamptz not null default now(), due_by date, fulfilled_at timestamptz
);

-- 14 · Recognition
create table if not exists public.recognitions (
  id text primary key, persona_id text not null references public.personas(id),
  kind text not null check (kind in ('ceo_showcase','gate2','impact_award','skill_premium')),
  note text not null, given_by text references public.personas(id), given_at timestamptz not null default now()
);

-- 15 · Governance refresh cycles (taxonomy quarterly, critical-skill list and agenda annually)
create table if not exists public.governance_reviews (
  id text primary key, area text not null check (area in ('taxonomy','critical_skills','capability_agenda')),
  cycle text not null, note text not null, items_reviewed int not null default 0,
  reviewed_by text references public.personas(id), reviewed_at timestamptz not null default now(), next_due date
);

-- 22 · Management alignment before field validation
alter table public.concepts add column if not exists alignment_note text;
alter table public.concepts add column if not exists aligned_by text references public.personas(id);
alter table public.concepts add column if not exists aligned_at timestamptz;

-- 23 · Milestone status on the strategic plan
create table if not exists public.plan_milestones (
  id text primary key, sub_plan text not null, milestone text not null, owner text not null, due_quarter text not null,
  status text not null default 'not_started' check (status in ('not_started','on_track','at_risk','done')),
  note text, updated_by text references public.personas(id), updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  for t in select unnest(array['cost_lines','role_blueprints','policy_items','pods','practice_sessions','talent_reviews','succession_entries','recognitions','governance_reviews','plan_milestones'])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "demo read" on public.%I', t);
    execute format('create policy "demo read" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;
