-- Write operations for the deck-closure records.

create or replace function public._require_role(p_actor text, p_roles text[]) returns public.personas language plpgsql as $$
declare a public.personas;
begin
  a := public._persona(p_actor);
  if not (a.role = any(p_roles)) then raise exception 'Your role cannot perform this action.'; end if;
  return a;
end $$;

-- 1 · Economics
create or replace function public.set_cohort_budget(p_actor text, p_cohort text, p_budget numeric) returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._require_role(p_actor, array['program_office']);
  update public.cohorts set budget_thb = p_budget where id = p_cohort;
  if not found then raise exception 'Cohort not found.'; end if;
end $$;

create or replace function public.add_cost_line(p_actor text, p_cohort text, p_category text, p_description text, p_amount numeric) returns text language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  perform public._require_role(p_actor, array['program_office']);
  if p_amount is null or p_amount < 0 then raise exception 'Enter an amount of zero or more.'; end if;
  if nullif(trim(coalesce(p_description,'')),'') is null then raise exception 'Describe the cost line.'; end if;
  v_id := public._uid('cl');
  insert into public.cost_lines(id, cohort_id, category, description, amount_thb, recorded_by) values (v_id, p_cohort, p_category, p_description, p_amount, p_actor);
  update public.cohorts set budget_thb = coalesce(budget_thb, 0) where id = p_cohort and budget_thb is null;
  return v_id;
end $$;

-- 2 · Role blueprints
create or replace function public.save_role_blueprint(p_actor text, p_input jsonb) returns text language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  perform public._require_role(p_actor, array['program_office','bu_sponsor']);
  if nullif(trim(coalesce(p_input->>'role_title','')),'') is null then raise exception 'Name the role.'; end if;
  v_id := public._uid('rb');
  insert into public.role_blueprints(id, bu_id, role_title, level, operating_model_change, responsibilities, headcount, created_by)
  values (v_id, p_input->>'bu_id', p_input->>'role_title', coalesce(p_input->>'level','L3'), coalesce(p_input->>'operating_model_change',''), coalesce(p_input->>'responsibilities',''), coalesce((p_input->>'headcount')::int, 1), p_actor);
  return v_id;
end $$;

create or replace function public.save_blueprint_plan(p_actor text, p_blueprint text, p_generated jsonb, p_model text) returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._require_role(p_actor, array['program_office','bu_sponsor']);
  update public.role_blueprints set generated = p_generated, model = p_model, status = 'generated' where id = p_blueprint;
  if not found then raise exception 'Blueprint not found.'; end if;
end $$;

-- Adopting a blueprint writes its skill requirements into the capability agenda as funded-decision-pending gaps.
create or replace function public.adopt_blueprint(p_actor text, p_blueprint text) returns int language plpgsql security definer set search_path = public as $$
declare b public.role_blueprints; r jsonb; n int := 0; v_skill text;
begin
  perform public._require_role(p_actor, array['program_office']);
  select * into b from public.role_blueprints where id = p_blueprint;
  if not found then raise exception 'Blueprint not found.'; end if;
  if b.status <> 'generated' then raise exception 'Generate the capability plan before adopting it.'; end if;
  for r in select * from jsonb_array_elements(coalesce(b.generated->'skills', '[]'::jsonb)) loop
    select id into v_skill from public.skills where code = r->>'skill_code';
    if v_skill is not null and not exists (select 1 from public.capability_gaps where bu_id = b.bu_id and skill_id = v_skill and critical_role = b.role_title) then
      insert into public.capability_gaps(id, bu_id, value_pool, critical_role, skill_id, future_skill_note, supply_fte, demand_fte, thb_value_at_risk, decision, funded)
      values (public._uid('gap'), b.bu_id, coalesce(b.generated->>'value_pool', b.operating_model_change), b.role_title, v_skill, coalesce(r->>'why',''), coalesce((r->>'supply_fte')::int, 0), coalesce((r->>'demand_fte')::int, b.headcount), coalesce((r->>'thb_value_at_risk')::numeric, 0), 'undecided', false);
      n := n + 1;
    end if;
  end loop;
  update public.role_blueprints set status = 'adopted', adopted_at = now() where id = b.id;
  return n;
end $$;

-- 3 · Retention and mobility
create or replace function public.set_employment_status(p_actor text, p_persona text, p_status text, p_left_at date) returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._require_role(p_actor, array['program_office']);
  if p_status not in ('active','left') then raise exception 'Invalid employment status.'; end if;
  update public.personas set employment_status = p_status, left_at = case when p_status = 'left' then coalesce(p_left_at, current_date) else null end where id = p_persona;
  if not found then raise exception 'Person not found.'; end if;
end $$;

create or replace function public.mark_interest_placed(p_actor text, p_interest text) returns void language plpgsql security definer set search_path = public as $$
declare i public.marketplace_interests; r public.marketplace_roles;
begin
  select * into i from public.marketplace_interests where id = p_interest;
  if not found then raise exception 'Interest not found.'; end if;
  select * into r from public.marketplace_roles where id = i.role_id;
  if r.owner_id <> p_actor then raise exception 'Only the posting owner records a placement.'; end if;
  update public.marketplace_interests set status = 'placed', placed_at = now() where id = i.id;
  perform public._notify(i.persona_id, 'You were placed', 'You were placed into "' || r.title || '" on verified skills. Internal mobility is recorded on the impact dashboard.', '/marketplace');
end $$;

-- 4 · Package a validated case as a micro-module
create or replace function public.package_case_as_module(p_actor text, p_contract text, p_input jsonb) returns text language plpgsql security definer set search_path = public as $$
declare c public.impact_contracts; l public.personas; v_id text; v_skill text; v_code text; n int;
begin
  perform public._require_role(p_actor, array['program_office','coach']);
  select * into c from public.impact_contracts where id = p_contract;
  if not found then raise exception 'Impact contract not found.'; end if;
  if c.status <> 'validated' then raise exception 'Only validated cases can be packaged.'; end if;
  if exists (select 1 from public.learning_modules where source_contract_id = c.id) then raise exception 'This case is already packaged as a module.'; end if;
  select id into v_skill from public.skills where code = p_input->>'skill_code';
  if v_skill is null then raise exception 'Choose a skill from the taxonomy.'; end if;
  l := public._persona(c.learner_id);
  select count(*) + 1 into n from public.learning_modules where origin = 'success_case';
  select code into v_code from public.skills where id = v_skill;
  v_id := public._uid('mod');
  insert into public.learning_modules(id, skill_id, code, title, duration_min, format, variant, origin, source_contract_id, bu_id, body)
  values (v_id, v_skill, v_code || '.C' || n, p_input->>'title', coalesce((p_input->>'duration_min')::int, 15), 'exercise', 'Proven at ' || (select code from public.business_units where id = l.bu_id), 'success_case', c.id, l.bu_id, p_input->'body');
  perform public._notify(c.learner_id, 'Your improvement is now a micro-module', 'The program office packaged "' || c.title || '" as a reusable module for other service teams.', '/learning');
  return v_id;
end $$;

-- 5 · Policy pack
create or replace function public.decide_policy_item(p_actor text, p_item text, p_status text, p_effective date, p_resolution text, p_note text) returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._require_role(p_actor, array['committee','program_office']);
  if p_status not in ('drafted','submitted','approved','deferred') then raise exception 'Invalid status.'; end if;
  update public.policy_items set status = p_status, effective_from = p_effective, resolution_ref = nullif(p_resolution,''), note = nullif(p_note,''), decided_by = p_actor, decided_at = now() where id = p_item;
  if not found then raise exception 'Policy item not found.'; end if;
end $$;

-- 7 · Structured gate submission
create or replace function public.submit_gate_pack(p_actor text, p_gate text, p_summary text, p_evidence jsonb, p_case jsonb, p_attachments jsonb) returns void language plpgsql security definer set search_path = public as $$
declare g public.gate_reviews; cp public.concepts; m record; v_stage text;
begin
  select * into g from public.gate_reviews where id = p_gate for update;
  if not found then raise exception 'Gate review not found.'; end if;
  select * into cp from public.concepts where id = g.concept_id;
  if not exists (select 1 from public.enrollments where persona_id = p_actor and team_id = cp.team_id) then raise exception 'Only a member of the concept team can submit the evidence pack.'; end if;
  if g.decision <> 'pending' or g.submitted_at is not null then raise exception 'This gate already has an evidence pack.'; end if;
  if nullif(trim(coalesce(p_summary,'')),'') is null then raise exception 'Summarise the evidence pack.'; end if;
  if g.gate_no = 2 and coalesce(p_case->>'payback_months','') = '' then raise exception 'Gate 2 needs the business case: pricing, payback and best / worst case.'; end if;
  v_stage := 'gate' || g.gate_no;
  update public.gate_reviews set evidence_summary = p_summary, evidence = p_evidence, business_case = p_case, attachments = coalesce(p_attachments, '[]'::jsonb), submitted_at = now() where id = g.id;
  update public.concepts set stage = v_stage, updated_at = now() where id = cp.id;
  for m in select id from public.personas where role = 'committee' loop
    perform public._notify(m.id, 'Gate ' || g.gate_no || ' pack submitted', cp.title || ' · pre-read ready for review.', '/concepts/' || cp.id);
  end loop;
  perform public._event('concept', cp.id, p_actor, 'submit_gate_evidence', cp.stage, v_stage, 'Gate ' || g.gate_no || ' pack submitted.');
end $$;

-- 9 · Pods
create or replace function public.create_pod(p_actor text, p_cohort text, p_name text, p_coach text) returns text language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  perform public._require_role(p_actor, array['program_office','coach']);
  if nullif(trim(coalesce(p_name,'')),'') is null then raise exception 'Name the pod.'; end if;
  v_id := public._uid('pod');
  insert into public.pods(id, cohort_id, name, coach_id) values (v_id, p_cohort, p_name, nullif(p_coach,''));
  return v_id;
end $$;

create or replace function public.assign_pod(p_actor text, p_enrollment text, p_pod text) returns void language plpgsql security definer set search_path = public as $$
declare e public.enrollments;
begin
  perform public._require_role(p_actor, array['program_office','coach']);
  select * into e from public.enrollments where id = p_enrollment;
  if not found then raise exception 'Enrollment not found.'; end if;
  update public.enrollments set pod_id = nullif(p_pod,'') where id = e.id;
  if nullif(p_pod,'') is not null then
    perform public._notify(e.persona_id, 'You joined a peer pod', 'Your sprint pod is ' || (select name from public.pods where id = p_pod) || '. Pods review each other''s weekly evidence.', '/journey');
  end if;
end $$;

-- 11 · Practice sessions
create or replace function public.save_practice_session(p_actor text, p_scenario text, p_transcript jsonb, p_scores jsonb, p_overall numeric, p_model text) returns text language plpgsql security definer set search_path = public as $$
declare v_id text; e public.enrollments;
begin
  perform public._persona(p_actor);
  v_id := public._uid('ps');
  insert into public.practice_sessions(id, persona_id, scenario, transcript, scores, overall, model) values (v_id, p_actor, p_scenario, coalesce(p_transcript,'[]'::jsonb), p_scores, p_overall, p_model);
  select * into e from public.enrollments where persona_id = p_actor and coach_id is not null and status not in ('graduated','withdrawn') limit 1;
  if found and p_overall is not null and p_overall < 3 then
    insert into public.coaching_notes(id, enrollment_id, coach_id, note, ai_flag)
    values (public._uid('cn'), e.id, e.coach_id, 'Practice session scored below the rubric threshold: ' || p_scenario, 'Practice partner: overall ' || p_overall || '/5 on ' || p_scenario);
    perform public._notify(e.coach_id, 'Practice session needs follow-up', (select full_name from public.personas where id = p_actor) || ' scored ' || p_overall || '/5 on ' || p_scenario || '.', '/coaching');
  end if;
  return v_id;
end $$;

-- 13 · Talent reviews, succession, incubation
create or replace function public.save_talent_review(p_actor text, p_persona text, p_cycle text, p_content jsonb, p_model text) returns text language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  perform public._require_role(p_actor, array['program_office','committee','bu_sponsor','line_manager']);
  v_id := public._uid('tr');
  insert into public.talent_reviews(id, persona_id, cycle, content, model, created_by) values (v_id, p_persona, p_cycle, p_content, p_model, p_actor);
  return v_id;
end $$;

create or replace function public.add_succession_entry(p_actor text, p_persona text, p_pool text, p_basis text, p_due date) returns text language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  perform public._require_role(p_actor, array['program_office','committee','bu_sponsor']);
  if p_pool not in ('L2','L3','incubation_lead') then raise exception 'Invalid pool.'; end if;
  if exists (select 1 from public.succession_entries where persona_id = p_persona and pool = p_pool) then raise exception 'This person is already in that pool.'; end if;
  v_id := public._uid('se');
  insert into public.succession_entries(id, persona_id, pool, basis, entered_by, due_by) values (v_id, p_persona, p_pool, p_basis, p_actor, p_due);
  perform public._notify(p_persona, case when p_pool = 'incubation_lead' then 'Nominated for an incubation leadership role' else 'Added to the ' || p_pool || ' succession pool' end, p_basis, '/passport');
  return v_id;
end $$;

create or replace function public.fulfil_succession(p_actor text, p_entry text) returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._require_role(p_actor, array['program_office','committee','bu_sponsor']);
  update public.succession_entries set fulfilled_at = now() where id = p_entry;
  if not found then raise exception 'Entry not found.'; end if;
end $$;

-- 14 · Recognition
create or replace function public.add_recognition(p_actor text, p_persona text, p_kind text, p_note text) returns text language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  perform public._require_role(p_actor, array['program_office','committee','bu_sponsor']);
  if nullif(trim(coalesce(p_note,'')),'') is null then raise exception 'Say what the recognition is for.'; end if;
  v_id := public._uid('rc');
  insert into public.recognitions(id, persona_id, kind, note, given_by) values (v_id, p_persona, p_kind, p_note, p_actor);
  perform public._notify(p_persona, 'Recognition awarded', p_note, '/passport');
  return v_id;
end $$;

-- 15 · Governance refresh cycles
create or replace function public.record_governance_review(p_actor text, p_area text, p_cycle text, p_note text, p_items int, p_next date) returns text language plpgsql security definer set search_path = public as $$
declare v_id text;
begin
  perform public._require_role(p_actor, array['program_office','committee']);
  if nullif(trim(coalesce(p_note,'')),'') is null then raise exception 'Record what the review concluded.'; end if;
  v_id := public._uid('gv');
  insert into public.governance_reviews(id, area, cycle, note, items_reviewed, reviewed_by, next_due) values (v_id, p_area, p_cycle, p_note, coalesce(p_items,0), p_actor, p_next);
  return v_id;
end $$;

-- 22 · Management alignment before validation
create or replace function public.record_alignment(p_actor text, p_concept text, p_note text) returns void language plpgsql security definer set search_path = public as $$
declare cp public.concepts; b public.challenge_briefs;
begin
  select * into cp from public.concepts where id = p_concept;
  if not found then raise exception 'Concept not found.'; end if;
  select * into b from public.challenge_briefs where id = cp.brief_id;
  if not (b.sponsor_id = p_actor or (select role from public.personas where id = p_actor) in ('committee','program_office')) then raise exception 'Only the sponsor, committee or program office records management alignment.'; end if;
  if nullif(trim(coalesce(p_note,'')),'') is null then raise exception 'Record what was agreed.'; end if;
  update public.concepts set alignment_note = p_note, aligned_by = p_actor, aligned_at = now(), updated_at = now() where id = cp.id;
  perform public._event('concept', cp.id, p_actor, 'management_alignment', cp.stage, cp.stage, p_note);
end $$;

-- 23 · Milestone status
create or replace function public.set_milestone_status(p_actor text, p_milestone text, p_status text, p_note text) returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._require_role(p_actor, array['program_office','committee']);
  if p_status not in ('not_started','on_track','at_risk','done') then raise exception 'Invalid status.'; end if;
  update public.plan_milestones set status = p_status, note = nullif(p_note,''), updated_by = p_actor, updated_at = now() where id = p_milestone;
  if not found then raise exception 'Milestone not found.'; end if;
end $$;

-- 12 · Deadline nudges (Program Navigator)
create or replace function public.send_nudges(p_actor text) returns int language plpgsql security definer set search_path = public as $$
declare n int := 0; r record; v_date date;
begin
  perform public._require_role(p_actor, array['program_office','coach']);
  -- mid-sprint gate and showcase for active contracts
  for r in
    select c.id, c.learner_id, c.title, c.status, e.cohort_id from public.impact_contracts c join public.enrollments e on e.id = c.enrollment_id where c.status = 'active'
  loop
    select (kd->>'date')::date into v_date from public.cohorts co, jsonb_array_elements(co.key_dates) kd where co.id = r.cohort_id and kd->>'label' ilike 'Mid-sprint gate%' limit 1;
    if v_date is not null and v_date between current_date and current_date + 14 then
      perform public._notify(r.learner_id, 'Mid-sprint gate in ' || (v_date - current_date) || ' days', 'Submit the evidence pack for "' || r.title || '" before ' || to_char(v_date, 'DD Mon YYYY') || '.', '/contracts/' || r.id);
      n := n + 1;
    end if;
    select (kd->>'date')::date into v_date from public.cohorts co, jsonb_array_elements(co.key_dates) kd where co.id = r.cohort_id and kd->>'label' ilike 'Impact showcase%' limit 1;
    if v_date is not null and v_date between current_date and current_date + 14 then
      perform public._notify(r.learner_id, 'Impact showcase in ' || (v_date - current_date) || ' days', 'Prepare the showcase claim for "' || r.title || '".', '/contracts/' || r.id);
      n := n + 1;
    end if;
  end loop;
  -- pending gate evidence packs
  for r in
    select g.id as gate_id, g.gate_no, g.scheduled_date, cp.id as concept_id, cp.title, e.persona_id
    from public.gate_reviews g join public.concepts cp on cp.id = g.concept_id join public.enrollments e on e.team_id = cp.team_id
    where g.decision = 'pending' and g.submitted_at is null and g.scheduled_date between current_date and current_date + 21
  loop
    perform public._notify(r.persona_id, 'Gate ' || r.gate_no || ' in ' || (r.scheduled_date - current_date) || ' days', 'Submit the evidence pack for "' || r.title || '" before ' || to_char(r.scheduled_date, 'DD Mon YYYY') || '.', '/concepts/' || r.concept_id);
    n := n + 1;
  end loop;
  -- pending diagnostics
  for r in
    select e.persona_id, c.name from public.enrollments e join public.diagnostics d on d.enrollment_id = e.id join public.cohorts c on c.id = e.cohort_id
    where d.status = 'pending' and e.status not in ('withdrawn','graduated')
  loop
    perform public._notify(r.persona_id, 'Your diagnostic is still open', 'Complete the assessment for ' || r.name || ' so your personal path is ready.', '/assessment');
    n := n + 1;
  end loop;
  return n;
end $$;

grant execute on all functions in schema public to anon, authenticated;
