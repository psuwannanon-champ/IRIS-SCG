-- Simulated integration connectors: each run is recorded with its payload so the hand-off is auditable.
create table if not exists public.integration_runs (
  id text primary key,
  system text not null check (system in ('hr_core','payroll_rewards','notifications','finance_actuals','start_the_dot')),
  direction text not null check (direction in ('outbound','inbound')),
  status text not null check (status in ('succeeded','failed')),
  records int not null default 0, summary text not null, payload jsonb not null default '[]'::jsonb,
  triggered_by text references public.personas(id), started_at timestamptz not null default now(), finished_at timestamptz not null default now()
);
alter table public.integration_runs enable row level security;
drop policy if exists "demo read" on public.integration_runs; create policy "demo read" on public.integration_runs for select to anon, authenticated using (true);

create or replace function public.record_integration_run(p_actor text, p_system text, p_direction text, p_status text, p_records int, p_summary text, p_payload jsonb) returns text language plpgsql security definer set search_path = public as $$
declare a public.personas; v_id text;
begin
  a := public._persona(p_actor);
  if a.role <> 'program_office' then raise exception 'Only the program office runs integrations.'; end if;
  v_id := public._uid('ir');
  insert into public.integration_runs(id, system, direction, status, records, summary, payload, triggered_by) values (v_id, p_system, p_direction, p_status, p_records, p_summary, coalesce(p_payload, '[]'::jsonb), p_actor);
  return v_id;
end $$;
grant execute on function public.record_integration_run(text, text, text, text, int, text, jsonb) to anon, authenticated;
