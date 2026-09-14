-- Value-led capability agenda: value pools, critical roles, skill supply vs demand, THB at risk, build / buy / borrow / bot decision
create table if not exists public.capability_gaps (
  id text primary key, bu_id text not null references public.business_units(id), value_pool text not null, critical_role text not null,
  skill_id text not null references public.skills(id), future_skill_note text not null, supply_fte int not null, demand_fte int not null,
  thb_value_at_risk numeric not null, decision text not null default 'undecided' check (decision in ('undecided','build','buy','borrow','bot')),
  funded boolean not null default false, decided_by_id text references public.personas(id), decided_at timestamptz
);
alter table public.capability_gaps enable row level security;
drop policy if exists "demo read" on public.capability_gaps; create policy "demo read" on public.capability_gaps for select to anon, authenticated using (true);

create or replace function public.set_gap_decision(p_actor text, p_gap text, p_decision text, p_funded boolean) returns void language plpgsql security definer set search_path = public as $$
declare a public.personas;
begin
  a := public._persona(p_actor);
  if a.role not in ('program_office','committee') then raise exception 'Only the program office or the committee records build / buy / borrow / bot decisions.'; end if;
  if p_decision not in ('undecided','build','buy','borrow','bot') then raise exception 'Invalid decision.'; end if;
  update public.capability_gaps set decision = p_decision, funded = p_funded, decided_by_id = p_actor, decided_at = now() where id = p_gap;
  if not found then raise exception 'Gap not found.'; end if;
end $$;
grant execute on function public.set_gap_decision(text, text, text, boolean) to anon, authenticated;
