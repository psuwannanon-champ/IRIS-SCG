-- Assessment (learner questionnaire) and Expert Guidance notes
create table if not exists public.assessments (
  id text primary key, enrollment_id text not null references public.enrollments(id), persona_id text not null references public.personas(id),
  responses jsonb not null, submitted_at timestamptz not null default now()
);
create table if not exists public.guidance_notes (
  id text primary key, persona_id text not null references public.personas(id), kind text not null check (kind in ('diagnostic','journey','contract','coach','clinic_briefing')),
  context_id text, content jsonb not null, model text not null, created_by text references public.personas(id), created_at timestamptz not null default now()
);
alter table public.assessments enable row level security;
alter table public.guidance_notes enable row level security;
drop policy if exists "demo read" on public.assessments; create policy "demo read" on public.assessments for select to anon, authenticated using (true);
drop policy if exists "demo read" on public.guidance_notes; create policy "demo read" on public.guidance_notes for select to anon, authenticated using (true);

create or replace function public.submit_assessment(p_actor text, p_enrollment text, p_responses jsonb) returns text language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  if not exists (select 1 from public.enrollments where id = p_enrollment and persona_id = p_actor) then raise exception 'Only the learner can submit their own assessment.'; end if;
  v_id := public._uid('as');
  insert into public.assessments(id, enrollment_id, persona_id, responses) values (v_id, p_enrollment, p_actor, p_responses);
  return v_id;
end $$;

-- Writes the Expert Guidance diagnostic result: items, AI-inferred passport levels and the personal learning path.
create or replace function public.complete_diagnostic(p_actor text, p_enrollment text, p_result jsonb) returns void language plpgsql security definer set search_path = public as $$
declare d public.diagnostics; r jsonb; i int := 0; v_dx text;
begin
  if not exists (select 1 from public.enrollments where id = p_enrollment and persona_id = p_actor) then raise exception 'Only the learner can complete their diagnostic.'; end if;
  select * into d from public.diagnostics where enrollment_id = p_enrollment;
  if not found then
    v_dx := public._uid('dx');
    insert into public.diagnostics(id, enrollment_id, status) values (v_dx, p_enrollment, 'pending');
    select * into d from public.diagnostics where id = v_dx;
  end if;
  if d.status = 'completed' then raise exception 'The diagnostic is already completed.'; end if;
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
  delete from public.learning_plan_items where enrollment_id = p_enrollment;
  for r in select * from jsonb_array_elements(coalesce(p_result->'plan', '[]'::jsonb)) loop
    if exists (select 1 from public.learning_modules where id = r->>'module_id') then
      i := i + 1;
      insert into public.learning_plan_items(id, enrollment_id, module_id, sequence, status, reason) values (public._uid('lp'), p_enrollment, r->>'module_id', i, 'planned', r->>'reason');
    end if;
  end loop;
  for r in select * from jsonb_array_elements(coalesce(p_result->'skipped', '[]'::jsonb)) loop
    if exists (select 1 from public.learning_modules where id = r->>'module_id') then
      i := i + 1;
      insert into public.learning_plan_items(id, enrollment_id, module_id, sequence, status, reason) values (public._uid('lp'), p_enrollment, r->>'module_id', i, 'skipped', r->>'reason');
    end if;
  end loop;
  update public.enrollments set status = 'diagnosed' where id = p_enrollment and status = 'invited';
end $$;

create or replace function public.save_guidance(p_actor text, p_persona text, p_kind text, p_context text, p_content jsonb, p_model text) returns text language plpgsql security definer set search_path = public as $$
declare v_id text; a public.personas;
begin
  a := public._persona(p_actor);
  if p_actor <> p_persona and a.role not in ('coach','line_manager','bu_sponsor','program_office') then raise exception 'You can only save guidance for yourself or for people you support.'; end if;
  v_id := public._uid('gn');
  insert into public.guidance_notes(id, persona_id, kind, context_id, content, model, created_by) values (v_id, p_persona, p_kind, p_context, p_content, p_model, p_actor);
  return v_id;
end $$;

grant execute on function public.submit_assessment(text, text, jsonb) to anon, authenticated;
grant execute on function public.complete_diagnostic(text, text, jsonb) to anon, authenticated;
grant execute on function public.save_guidance(text, text, text, text, jsonb, text) to anon, authenticated;
