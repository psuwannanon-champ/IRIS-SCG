-- Deck p4/p5/p10: "Launchable SCG org-wide: mass assessment and personalised learning for every
-- employee" and "Baseline the organization in waves; Passport from day one."
-- Until now the diagnostic was reachable only through a cohort enrolment, so a non-enrolled
-- employee had no passport. A baseline diagnostic belongs to the person, not to a programme.

alter table public.diagnostics alter column enrollment_id drop not null;
alter table public.diagnostics add column if not exists persona_id text references public.personas(id);
alter table public.assessments alter column enrollment_id drop not null;
create unique index if not exists diagnostics_baseline_one_per_person on public.diagnostics(persona_id) where enrollment_id is null;

-- Anyone may baseline themselves. No enrolment is required and none is created.
create or replace function public.submit_baseline_assessment(p_actor text, p_responses jsonb) returns text language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  if not exists (select 1 from public.personas where id = p_actor) then raise exception 'Unknown persona.'; end if;
  v_id := public._uid('as');
  insert into public.assessments(id, enrollment_id, persona_id, responses) values (v_id, null, p_actor, p_responses);
  return v_id;
end $$;

-- Writes the baseline result: diagnostic items plus AI-inferred passport entries. No learning plan:
-- a personal path needs a cohort, and the baseline exists to make the passport and the gap real first.
create or replace function public.complete_baseline_diagnostic(p_actor text, p_result jsonb) returns void language plpgsql security definer set search_path = public as $$
declare d public.diagnostics; r jsonb; v_dx text;
begin
  if not exists (select 1 from public.personas where id = p_actor) then raise exception 'Unknown persona.'; end if;
  select * into d from public.diagnostics where persona_id = p_actor and enrollment_id is null;
  if not found then
    v_dx := public._uid('dx');
    insert into public.diagnostics(id, enrollment_id, persona_id, status) values (v_dx, null, p_actor, 'pending');
    select * into d from public.diagnostics where id = v_dx;
  end if;
  if d.status = 'completed' then raise exception 'Your baseline is already complete.'; end if;
  update public.diagnostics set status = 'completed', completed_at = now(), summary = p_result->>'summary' where id = d.id;
  delete from public.diagnostic_items where diagnostic_id = d.id;
  for r in select * from jsonb_array_elements(coalesce(p_result->'items', '[]'::jsonb)) loop
    if exists (select 1 from public.skills where id = r->>'skill_id') then
      insert into public.diagnostic_items(id, diagnostic_id, skill_id, current_level, target_level, priority_rank, evidence_source, rationale)
      values (public._uid('dxi'), d.id, r->>'skill_id', coalesce((r->>'current_level')::int, 0), coalesce((r->>'target_level')::int, 3), (r->>'priority_rank')::int, nullif(r->>'evidence_source',''), r->>'rationale');
      if coalesce((r->>'current_level')::int, 0) > 0 then
        insert into public.passport_entries(id, persona_id, skill_id, level, tier, source_type, source_id)
        values (public._uid('pp'), p_actor, r->>'skill_id', (r->>'current_level')::int, case when r->>'evidence_source' = 'self_declared' then 'self_declared' else 'ai_inferred' end, 'diagnostic', d.id);
      end if;
    end if;
  end loop;
  perform public._notify(p_actor, 'Your skill baseline is ready', 'Your passport now holds AI-inferred levels. A personal learning path opens when you join an ABC or BCD cohort.', '/passport');
  perform public._event('persona', p_actor, p_actor, 'baseline_diagnostic', 'none', 'baselined', 'Org-wide skill baseline completed.');
end $$;
