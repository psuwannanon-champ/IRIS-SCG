-- Operations that make every step of the ABC / BCD journeys executable in the platform.

create table if not exists public.lab_attendance (
  id text primary key, enrollment_id text not null references public.enrollments(id), lab_day int not null check (lab_day between 1 and 4),
  attended_at timestamptz not null default now(), reflection text, unique (enrollment_id, lab_day)
);
alter table public.lab_attendance enable row level security;
drop policy if exists "demo read" on public.lab_attendance; create policy "demo read" on public.lab_attendance for select to anon, authenticated using (true);

-- Lab day check-in with reflection (learner). Moves enrollment to in_labs on day 1.
create or replace function public.check_in_lab(p_actor text, p_enrollment text, p_lab_day int, p_reflection text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.enrollments where id = p_enrollment and persona_id = p_actor) then raise exception 'Only the learner checks in to their own lab day.'; end if;
  insert into public.lab_attendance(id, enrollment_id, lab_day, reflection) values (public._uid('la'), p_enrollment, p_lab_day, nullif(p_reflection,''))
  on conflict (enrollment_id, lab_day) do update set reflection = coalesce(nullif(excluded.reflection,''), public.lab_attendance.reflection);
  update public.enrollments set status = 'in_labs' where id = p_enrollment and status in ('invited','diagnosed');
end $$;

-- Expert Guidance raised a flag for the human coach during the coach chat.
create or replace function public.raise_ai_flag(p_actor text, p_flag text) returns void language plpgsql security definer set search_path = public as $$
declare e public.enrollments; l public.personas;
begin
  l := public._persona(p_actor);
  select * into e from public.enrollments where persona_id = p_actor and status not in ('graduated','withdrawn') and coach_id is not null order by id limit 1;
  if not found then return; end if;
  insert into public.coaching_notes(id, enrollment_id, coach_id, note, ai_flag) values (public._uid('cn'), e.id, e.coach_id, 'Flag raised by Expert Guidance during the coach chat.', p_flag);
  perform public._notify(e.coach_id, 'Expert Guidance flagged ' || l.full_name, p_flag, '/coaching');
end $$;

-- Week-14 outcomes: impact rating, top decile, BCD fast-track (manager, sponsor or program office).
create or replace function public.set_program_outcome(p_actor text, p_enrollment text, p_rating text, p_top_decile boolean, p_fast_track boolean) returns void language plpgsql security definer set search_path = public as $$
declare a public.personas; e public.enrollments;
begin
  a := public._persona(p_actor);
  select * into e from public.enrollments where id = p_enrollment;
  if not found then raise exception 'Enrollment not found.'; end if;
  if not (a.role = 'program_office' or e.manager_id = p_actor or e.sponsor_id = p_actor) then raise exception 'Only the line manager, sponsor or program office records program outcomes.'; end if;
  if p_rating is not null and p_rating not in ('exceptional','strong','on_track','needs_support') then raise exception 'Invalid impact rating.'; end if;
  update public.enrollments set impact_rating = p_rating, top_decile = p_top_decile, fast_track_bcd = p_fast_track where id = e.id;
  perform public._notify(e.persona_id, 'Program outcome recorded', 'Impact rating: ' || coalesce(p_rating,'not set') || case when p_top_decile then ' · top ~10%' else '' end || case when p_fast_track then ' · BCD fast-track' else '' end || '. This feeds your performance review and talent profile.', '/passport');
end $$;

-- BU head / sponsor sets a theme for the intake.
create or replace function public.save_theme(p_actor text, p_bu text, p_title text, p_description text, p_year int) returns text language plpgsql security definer set search_path = public as $$
declare a public.personas; v_id text;
begin
  a := public._persona(p_actor);
  if a.role not in ('bu_sponsor','program_office') then raise exception 'Only BU sponsors or the program office set themes.'; end if;
  if nullif(trim(coalesce(p_title,'')),'') is null then raise exception 'Give the theme a title.'; end if;
  v_id := public._uid('th');
  insert into public.challenge_themes(id, bu_id, title, description, set_by_id, year) values (v_id, p_bu, p_title, coalesce(p_description,''), p_actor, p_year);
  return v_id;
end $$;

-- Program office creates a cohort from the playbook template (key dates, clinics).
create or replace function public.create_cohort(p_actor text, p_program text, p_code text, p_name text, p_bu text, p_start date, p_seats int, p_pipeline numeric, p_coach text) returns text language plpgsql security definer set search_path = public as $$
declare a public.personas; v_id text; v_dates jsonb; v_end date;
begin
  a := public._persona(p_actor);
  if a.role <> 'program_office' then raise exception 'Only the program office creates cohorts.'; end if;
  if p_program not in ('ABC','BCD') then raise exception 'Program must be ABC or BCD.'; end if;
  if nullif(trim(coalesce(p_code,'')),'') is null or nullif(trim(coalesce(p_name,'')),'') is null then raise exception 'Code and name are required.'; end if;
  v_id := public._uid('coh');
  if p_program = 'ABC' then
    v_dates := jsonb_build_array(
      jsonb_build_object('label','AI skill diagnostic','date',p_start), jsonb_build_object('label','Flipped micro-learning','date',p_start),
      jsonb_build_object('label','Applied capability labs (4 days)','date',p_start + 14), jsonb_build_object('label','Impact sprint starts','date',p_start + 21),
      jsonb_build_object('label','Coaching clinic 1','date',p_start + 49), jsonb_build_object('label','Mid-sprint gate','date',p_start + 63),
      jsonb_build_object('label','Coaching clinic 2','date',p_start + 84), jsonb_build_object('label','Impact showcase','date',p_start + 105));
    v_end := p_start + 105;
  else
    v_dates := jsonb_build_array(
      jsonb_build_object('label','Challenge sourcing','date',p_start), jsonb_build_object('label','Onboard, diagnose & team up','date',p_start + 28),
      jsonb_build_object('label','Immersion camp (3 days)','date',p_start + 35), jsonb_build_object('label','Concept studio sprint','date',p_start + 42),
      jsonb_build_object('label','Field validation','date',p_start + 63), jsonb_build_object('label','Gate 1 · Proof of concept','date',p_start + 84),
      jsonb_build_object('label','Commercial build','date',p_start + 91), jsonb_build_object('label','Prototype & stress-test','date',p_start + 119),
      jsonb_build_object('label','Gate 2 · CEO investment pitch','date',p_start + 140));
    v_end := p_start + 140;
  end if;
  insert into public.cohorts(id, program, code, name, bu_id, status, start_date, end_date, key_dates, pipeline_target_thb, seats)
  values (v_id, p_program, p_code, p_name, nullif(p_bu,''), 'planned', p_start, v_end, v_dates, p_pipeline, coalesce(p_seats, 30));
  if p_program = 'ABC' and p_coach is not null then
    insert into public.coaching_clinics(id, cohort_id, clinic_no, scheduled_at, coach_id, topics) values (public._uid('cl'), v_id, 1, (p_start + 49)::timestamptz, p_coach, 'Baselines and weekly evidence');
    insert into public.coaching_clinics(id, cohort_id, clinic_no, scheduled_at, coach_id, topics) values (public._uid('cl'), v_id, 2, (p_start + 84)::timestamptz, p_coach, 'Showcase preparation and sustaining change');
  end if;
  return v_id;
end $$;

-- Program office enrols a learner into a cohort (assessment wave).
create or replace function public.enroll_learner(p_actor text, p_cohort text, p_persona text, p_sponsor text, p_coach text) returns text language plpgsql security definer set search_path = public as $$
declare a public.personas; l public.personas; c public.cohorts; v_id text;
begin
  a := public._persona(p_actor);
  if a.role <> 'program_office' then raise exception 'Only the program office enrols learners.'; end if;
  l := public._persona(p_persona);
  select * into c from public.cohorts where id = p_cohort;
  if not found then raise exception 'Cohort not found.'; end if;
  if exists (select 1 from public.enrollments where cohort_id = p_cohort and persona_id = p_persona) then raise exception 'This person is already enrolled in the cohort.'; end if;
  if (select count(*) from public.enrollments where cohort_id = p_cohort) >= c.seats then raise exception 'The cohort is full.'; end if;
  v_id := public._uid('enr');
  insert into public.enrollments(id, cohort_id, persona_id, status, manager_id, sponsor_id, coach_id) values (v_id, p_cohort, p_persona, 'invited', l.manager_id, nullif(p_sponsor,''), nullif(p_coach,''));
  insert into public.diagnostics(id, enrollment_id, status) values (public._uid('dx'), v_id, 'pending');
  perform public._notify(p_persona, 'You are invited to ' || c.name, 'Complete your AI skill diagnostic to build your personal path before the labs.', '/assessment');
  return v_id;
end $$;

-- Program office forms a cross-BU team around an assigned brief: team, concept (Stage 1) and Gate 1 / Gate 2 reviews.
create or replace function public.form_team(p_actor text, p_brief text, p_name text, p_members text[], p_coach text) returns text language plpgsql security definer set search_path = public as $$
declare a public.personas; b public.challenge_briefs; c public.cohorts; v_team text; v_concept text; g1 date; g2 date; m text;
begin
  a := public._persona(p_actor);
  if a.role <> 'program_office' then raise exception 'Only the program office forms teams.'; end if;
  select * into b from public.challenge_briefs where id = p_brief;
  if not found or b.status <> 'assigned' or b.cohort_id is null then raise exception 'The brief must be assigned to a cohort first.'; end if;
  if exists (select 1 from public.concepts where brief_id = b.id) then raise exception 'A team already works on this brief.'; end if;
  if array_length(p_members, 1) is null then raise exception 'Choose at least one team member.'; end if;
  select * into c from public.cohorts where id = b.cohort_id;
  v_team := public._uid('team'); v_concept := public._uid('cp');
  insert into public.teams(id, cohort_id, name, brief_id, coach_id) values (v_team, c.id, p_name, b.id, nullif(p_coach,''));
  insert into public.concepts(id, team_id, brief_id, cohort_id, title, summary, stage, pipeline_value_thb) values (v_concept, v_team, b.id, c.id, b.title, 'Concept framing in progress: ' || b.problem_statement, 'frame', b.target_value_thb);
  select (kd->>'date')::date into g1 from jsonb_array_elements(c.key_dates) kd where kd->>'label' ilike 'Gate 1%' limit 1;
  select (kd->>'date')::date into g2 from jsonb_array_elements(c.key_dates) kd where kd->>'label' ilike 'Gate 2%' limit 1;
  insert into public.gate_reviews(id, concept_id, gate_no, scheduled_date, decision) values (public._uid('gr'), v_concept, 1, coalesce(g1, c.start_date + 84), 'pending');
  insert into public.gate_reviews(id, concept_id, gate_no, scheduled_date, decision) values (public._uid('gr'), v_concept, 2, coalesce(g2, c.start_date + 140), 'pending');
  foreach m in array p_members loop
    if not exists (select 1 from public.enrollments where id = m and cohort_id = c.id and team_id is null) then raise exception 'Every member must be enrolled in the cohort and not already in a team.'; end if;
    update public.enrollments set team_id = v_team, sponsor_id = coalesce(sponsor_id, b.sponsor_id), coach_id = coalesce(nullif(p_coach,''), coach_id) where id = m;
    perform public._notify((select persona_id from public.enrollments where id = m), 'You joined ' || p_name, 'Your team works on "' || b.title || '". Stage 1: frame the challenge.', '/concepts/' || v_concept);
  end loop;
  perform public._notify(b.sponsor_id, 'Team formed for your brief', p_name || ' now works on "' || b.title || '".', '/concepts/' || v_concept);
  perform public._event('concept', v_concept, p_actor, 'form_team', null, 'frame', p_name || ' formed with ' || array_length(p_members,1) || ' members.');
  return v_concept;
end $$;

-- Team advances the concept through the non-gate stages with a note.
create or replace function public.advance_concept_stage(p_actor text, p_concept text, p_note text) returns void language plpgsql security definer set search_path = public as $$
declare cp public.concepts; v_next text;
begin
  select * into cp from public.concepts where id = p_concept for update;
  if not found then raise exception 'Concept not found.'; end if;
  if not exists (select 1 from public.enrollments where persona_id = p_actor and team_id = cp.team_id) then raise exception 'Only a team member advances the concept.'; end if;
  if nullif(trim(coalesce(p_note,'')),'') is null then raise exception 'Describe what the team completed in this stage.'; end if;
  v_next := case cp.stage when 'frame' then 'build' when 'build' then 'validate' when 'pivot' then 'validate' else null end;
  if v_next is null then raise exception 'This stage moves on through a gate review, not manually.'; end if;
  update public.concepts set stage = v_next, updated_at = now() where id = cp.id;
  perform public._event('concept', cp.id, p_actor, 'advance_stage', cp.stage, v_next, p_note);
end $$;

-- Program office records / renews the coach quality scorecard.
create or replace function public.update_coach_scorecard(p_actor text, p_coach text, p_cohort text, p_freq numeric, p_quality numeric, p_rating numeric, p_certified boolean, p_until date) returns void language plpgsql security definer set search_path = public as $$
declare a public.personas;
begin
  a := public._persona(p_actor);
  if a.role <> 'program_office' then raise exception 'Only the program office maintains coach scorecards.'; end if;
  if exists (select 1 from public.coach_scorecards where coach_id = p_coach and cohort_id = p_cohort) then
    update public.coach_scorecards set feedback_frequency = p_freq, feedback_quality = p_quality, learner_rating = p_rating, certified = p_certified, certified_until = p_until where coach_id = p_coach and cohort_id = p_cohort;
  else
    insert into public.coach_scorecards(id, coach_id, cohort_id, feedback_frequency, feedback_quality, learner_rating, certified, certified_until) values (public._uid('cs'), p_coach, p_cohort, p_freq, p_quality, p_rating, p_certified, p_until);
  end if;
  perform public._notify(p_coach, 'Coach scorecard updated', 'Quality ' || p_quality || '/5 · learner rating ' || p_rating || '/5 · ' || case when p_certified then 'certified until ' || coalesce(p_until::text,'') else 'not certified' end, '/coaching');
end $$;

-- Marketplace: owner creates a posting; owner shortlists or declines interest.
create or replace function public.create_marketplace_role(p_actor text, p_input jsonb) returns text language plpgsql security definer set search_path = public as $$
declare a public.personas; v_id text;
begin
  a := public._persona(p_actor);
  if a.role not in ('bu_sponsor','line_manager','program_office') then raise exception 'Only sponsors, managers or the program office publish postings.'; end if;
  if nullif(trim(coalesce(p_input->>'title','')),'') is null then raise exception 'Give the posting a title.'; end if;
  v_id := public._uid('mr');
  insert into public.marketplace_roles(id, title, bu_id, kind, description, open_until, owner_id, requirements)
  values (v_id, p_input->>'title', coalesce(nullif(p_input->>'bu_id',''), a.bu_id), coalesce(p_input->>'kind','role'), coalesce(p_input->>'description',''), (p_input->>'open_until')::date, p_actor, coalesce(p_input->'requirements','[]'::jsonb));
  return v_id;
end $$;

create or replace function public.update_interest(p_actor text, p_interest text, p_status text) returns void language plpgsql security definer set search_path = public as $$
declare i public.marketplace_interests; r public.marketplace_roles;
begin
  select * into i from public.marketplace_interests where id = p_interest;
  if not found then raise exception 'Interest not found.'; end if;
  select * into r from public.marketplace_roles where id = i.role_id;
  if r.owner_id <> p_actor then raise exception 'Only the posting owner shortlists or declines.'; end if;
  if p_status not in ('shortlisted','declined','expressed') then raise exception 'Invalid status.'; end if;
  update public.marketplace_interests set status = p_status where id = i.id;
  perform public._notify(i.persona_id, case when p_status = 'shortlisted' then 'You were shortlisted' else 'Update on your marketplace interest' end, '"' || r.title || '": ' || p_status || '. Decision based on verified passport skills; the owner will contact you.', '/marketplace');
end $$;

grant execute on all functions in schema public to anon, authenticated;
