-- SCG Capability Suite · prototype schema
-- Text primary keys keep the fictional demo data deterministic and easy to reset.
-- Identity note: the prototype uses persona switching (no Supabase Auth). Every write goes through a
-- SECURITY DEFINER function that checks the acting persona's role and relationship to the record.

create table if not exists public.business_units (
  id text primary key, code text not null, name text not null,
  kind text not null check (kind in ('turnaround','shared_service','business')),
  strategy_onboarded boolean not null default false, platform_onboarded boolean not null default false
);
create table if not exists public.personas (
  id text primary key, code text not null unique, full_name text not null, email text not null,
  role text not null check (role in ('learner','line_manager','bu_sponsor','coach','committee','program_office')),
  bu_id text not null references public.business_units(id), function_type text not null check (function_type in ('business','enabling')),
  job_title text not null, level text not null, manager_id text references public.personas(id) deferrable initially deferred, initials text not null, career_aspiration text
);
create table if not exists public.skill_domains (
  id text primary key, code text not null, name text not null, program text not null check (program in ('ABC','BCD')), description text not null
);
create table if not exists public.skills (
  id text primary key, domain_id text not null references public.skill_domains(id), code text not null, name text not null, description text not null,
  level_descriptors jsonb not null, critical boolean not null default true, premium_eligible boolean not null default false
);
create table if not exists public.learning_modules (
  id text primary key, skill_id text not null references public.skills(id), code text not null, title text not null, duration_min int not null,
  format text not null check (format in ('micro_video','reading','exercise','simulation')), variant text
);
create table if not exists public.cohorts (
  id text primary key, program text not null check (program in ('ABC','BCD')), code text not null, name text not null, bu_id text references public.business_units(id),
  status text not null, start_date date not null, end_date date not null, key_dates jsonb not null default '[]'::jsonb, pipeline_target_thb numeric, seats int not null default 0
);
create table if not exists public.enrollments (
  id text primary key, cohort_id text not null references public.cohorts(id), persona_id text not null references public.personas(id),
  status text not null check (status in ('invited','diagnosed','in_labs','in_sprint','showcase','graduated','withdrawn')),
  team_id text, coach_id text references public.personas(id), sponsor_id text references public.personas(id), manager_id text references public.personas(id),
  impact_rating text check (impact_rating in ('exceptional','strong','on_track','needs_support')), top_decile boolean not null default false, fast_track_bcd boolean not null default false
);
create table if not exists public.diagnostics (
  id text primary key, enrollment_id text not null references public.enrollments(id), completed_at timestamptz, summary text,
  status text not null check (status in ('pending','completed'))
);
create table if not exists public.diagnostic_items (
  id text primary key, diagnostic_id text not null references public.diagnostics(id), skill_id text not null references public.skills(id),
  current_level int not null default 0, target_level int not null, priority_rank int, evidence_source text, rationale text
);
create table if not exists public.learning_plan_items (
  id text primary key, enrollment_id text not null references public.enrollments(id), module_id text not null references public.learning_modules(id),
  sequence int not null, status text not null check (status in ('planned','in_progress','completed','skipped')), reason text
);
create table if not exists public.impact_contracts (
  id text primary key, enrollment_id text not null references public.enrollments(id), learner_id text not null references public.personas(id),
  manager_id text not null references public.personas(id), sponsor_id text not null references public.personas(id), title text not null,
  objective_type text not null check (objective_type in ('revenue_uplift','margin','share_of_wallet','cost_to_serve','sla_turnaround','productivity_per_fte')),
  description text not null, baseline_value numeric, target_value numeric, unit text, target_thb numeric, tools_applied text,
  status text not null check (status in ('draft','manager_review','sponsor_review','active','mid_gate_review','showcase_review','validated','returned','withdrawn','reset')),
  return_reason text, mid_gate_decision text check (mid_gate_decision in ('scale','pivot','reset')), mid_gate_note text, showcase_summary text,
  validated_value_thb numeric, validated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sprint_evidence (
  id text primary key, contract_id text not null references public.impact_contracts(id), week_no int not null, title text not null, note text not null,
  metric_value numeric, created_by text not null references public.personas(id), created_at timestamptz not null default now()
);
create table if not exists public.challenge_themes (
  id text primary key, bu_id text not null references public.business_units(id), title text not null, description text not null,
  set_by_id text not null references public.personas(id), year int not null
);
create table if not exists public.challenge_briefs (
  id text primary key, theme_id text references public.challenge_themes(id), bu_id text not null references public.business_units(id),
  sponsor_id text not null references public.personas(id), title text not null, challenge_type text not null check (challenge_type in ('growth','cost','service','productivity')),
  problem_statement text not null, success_metric text not null, target_value_thb numeric, constraints text,
  status text not null check (status in ('draft','committee_review','approved','returned','rejected','assigned','withdrawn')),
  cohort_id text references public.cohorts(id), committee_note text, reviewed_by_id text references public.personas(id), reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.teams (
  id text primary key, cohort_id text not null references public.cohorts(id), name text not null, brief_id text references public.challenge_briefs(id), coach_id text references public.personas(id)
);
create table if not exists public.concepts (
  id text primary key, team_id text not null references public.teams(id), brief_id text not null references public.challenge_briefs(id), cohort_id text not null references public.cohorts(id),
  title text not null, summary text not null,
  stage text not null check (stage in ('frame','build','validate','gate1','build_case','gate2','incubating','gate3','scaled','pivot','stopped')),
  pipeline_value_thb numeric, validated_value_thb numeric, scale_route text check (scale_route in ('start_the_dot','internal_high_impact')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.gate_reviews (
  id text primary key, concept_id text not null references public.concepts(id), gate_no int not null check (gate_no in (1,2,3)), scheduled_date date not null,
  evidence_summary text, submitted_at timestamptz,
  decision text not null check (decision in ('pending','go','pivot','stop','invest','small_scale','scale','hold')),
  decided_by_id text references public.personas(id), decided_at timestamptz, note text, validated_value_thb numeric
);
create table if not exists public.coaching_clinics (
  id text primary key, cohort_id text not null references public.cohorts(id), clinic_no int not null, scheduled_at timestamptz not null,
  coach_id text not null references public.personas(id), topics text not null, briefing_ready boolean not null default false
);
create table if not exists public.coaching_notes (
  id text primary key, enrollment_id text not null references public.enrollments(id), coach_id text not null references public.personas(id),
  clinic_id text references public.coaching_clinics(id), note text not null, ai_flag text, created_at timestamptz not null default now()
);
create table if not exists public.coach_scorecards (
  id text primary key, coach_id text not null references public.personas(id), cohort_id text not null references public.cohorts(id),
  feedback_frequency numeric not null, feedback_quality numeric not null, learner_rating numeric not null, certified boolean not null, certified_until date
);
create table if not exists public.passport_entries (
  id text primary key, persona_id text not null references public.personas(id), skill_id text not null references public.skills(id), level int not null,
  tier text not null check (tier in ('self_declared','ai_inferred','outcome_verified')),
  source_type text not null check (source_type in ('diagnostic','showcase','gate','manager')), source_id text, badge_code text, minted_at timestamptz not null default now()
);
create table if not exists public.ledger_entries (
  id text primary key, persona_id text not null references public.personas(id), bu_id text not null references public.business_units(id),
  source_type text not null check (source_type in ('impact_contract','concept')), source_id text not null, title text not null, objective_type text,
  claimed_value_thb numeric not null, validated_value_thb numeric, sponsor_id text not null references public.personas(id),
  status text not null check (status in ('pending_validation','validated','rejected','audited')), validated_at timestamptz, tracking_until date not null,
  audit_note text, created_at timestamptz not null default now()
);
create table if not exists public.marketplace_roles (
  id text primary key, title text not null, bu_id text not null references public.business_units(id), kind text not null check (kind in ('role','project','gig')),
  description text not null, open_until date not null, owner_id text not null references public.personas(id), requirements jsonb not null default '[]'::jsonb
);
create table if not exists public.marketplace_interests (
  id text primary key, role_id text not null references public.marketplace_roles(id), persona_id text not null references public.personas(id),
  created_at timestamptz not null default now(), status text not null check (status in ('expressed','shortlisted','declined'))
);
create table if not exists public.notifications (
  id text primary key, persona_id text not null references public.personas(id), kind text not null default 'update', title text not null, body text not null,
  link text, read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.coach_messages (
  id text primary key, persona_id text not null references public.personas(id), sender text not null check (sender in ('user','coach')),
  lang text not null check (lang in ('th','en')), content text not null, cited_module_id text references public.learning_modules(id), created_at timestamptz not null default now()
);
create table if not exists public.record_events (
  id text primary key, record_type text not null, record_id text not null, actor_id text references public.personas(id), action text not null,
  from_status text, to_status text, note text, created_at timestamptz not null default now()
);

create index if not exists idx_contracts_learner on public.impact_contracts(learner_id);
create index if not exists idx_contracts_manager on public.impact_contracts(manager_id);
create index if not exists idx_contracts_sponsor on public.impact_contracts(sponsor_id);
create index if not exists idx_notifications_persona on public.notifications(persona_id);
create index if not exists idx_events_record on public.record_events(record_type, record_id);

-- Row level security: the publishable key may READ demo data; every WRITE goes through a checked function.
do $$
declare t text;
begin
  for t in select unnest(array['business_units','personas','skill_domains','skills','learning_modules','cohorts','enrollments','diagnostics','diagnostic_items',
    'learning_plan_items','impact_contracts','sprint_evidence','challenge_themes','challenge_briefs','teams','concepts','gate_reviews','coaching_clinics',
    'coaching_notes','coach_scorecards','passport_entries','ledger_entries','marketplace_roles','marketplace_interests','notifications','coach_messages','record_events'])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "demo read" on public.%I', t);
    execute format('create policy "demo read" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- ---------- helpers ----------
create or replace function public._uid(prefix text) returns text language sql volatile as $$
  select prefix || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 9)
$$;

create or replace function public._notify(p_persona text, p_title text, p_body text, p_link text) returns void language plpgsql as $$
begin
  if p_persona is null then return; end if;
  insert into public.notifications(id, persona_id, kind, title, body, link) values (public._uid('nt'), p_persona, 'update', p_title, p_body, p_link);
end $$;

create or replace function public._event(p_type text, p_record text, p_actor text, p_action text, p_from text, p_to text, p_note text) returns void language plpgsql as $$
begin
  insert into public.record_events(id, record_type, record_id, actor_id, action, from_status, to_status, note)
  values (public._uid('rev'), p_type, p_record, p_actor, p_action, p_from, p_to, p_note);
end $$;

create or replace function public._persona(p_id text) returns public.personas language plpgsql as $$
declare p public.personas;
begin
  select * into p from public.personas where id = p_id;
  if not found then raise exception 'Acting user not found.'; end if;
  return p;
end $$;

-- Mint outcome-verified badges for the learner's top three priority skills at target level.
create or replace function public._mint_from_diagnostic(p_enrollment text, p_persona text, p_source_type text, p_source_id text) returns void language plpgsql as $$
declare r record; v_cohort_code text;
begin
  select c.code into v_cohort_code from public.enrollments e join public.cohorts c on c.id = e.cohort_id where e.id = p_enrollment;
  for r in
    select di.skill_id, di.target_level, s.code
    from public.diagnostics d join public.diagnostic_items di on di.diagnostic_id = d.id join public.skills s on s.id = di.skill_id
    where d.enrollment_id = p_enrollment and di.priority_rank is not null
    order by di.priority_rank limit 3
  loop
    if not exists (select 1 from public.passport_entries where persona_id = p_persona and skill_id = r.skill_id and tier = 'outcome_verified' and source_id = p_source_id) then
      insert into public.passport_entries(id, persona_id, skill_id, level, tier, source_type, source_id, badge_code)
      values (public._uid('pp'), p_persona, r.skill_id, r.target_level, 'outcome_verified', p_source_type, p_source_id, coalesce(v_cohort_code, 'SCG') || '-' || r.code || '-L' || r.target_level);
    end if;
  end loop;
end $$;

-- ---------- impact contracts ----------
create or replace function public.save_impact_contract(p_actor text, p_input jsonb) returns text language plpgsql security definer set search_path = public as $$
declare e public.enrollments; l public.personas; c public.impact_contracts; v_id text;
begin
  select * into e from public.enrollments where id = p_input->>'enrollment_id';
  if not found then raise exception 'Enrollment not found.'; end if;
  if e.persona_id <> p_actor then raise exception 'Only the learner can edit their own impact contract.'; end if;
  l := public._persona(p_actor);
  if coalesce(p_input->>'id','') <> '' then
    select * into c from public.impact_contracts where id = p_input->>'id';
    if not found then raise exception 'Impact contract not found.'; end if;
    if c.status not in ('draft','returned') then raise exception 'Only draft or returned contracts can be edited.'; end if;
    update public.impact_contracts set title = p_input->>'title', objective_type = p_input->>'objective_type', description = p_input->>'description',
      baseline_value = (p_input->>'baseline_value')::numeric, target_value = (p_input->>'target_value')::numeric, unit = p_input->>'unit',
      target_thb = (p_input->>'target_thb')::numeric, tools_applied = p_input->>'tools_applied', updated_at = now() where id = c.id;
    return c.id;
  end if;
  v_id := public._uid('ic');
  insert into public.impact_contracts(id, enrollment_id, learner_id, manager_id, sponsor_id, title, objective_type, description, baseline_value, target_value, unit, target_thb, tools_applied, status)
  values (v_id, e.id, p_actor, coalesce(e.manager_id, l.manager_id), e.sponsor_id, p_input->>'title', p_input->>'objective_type', p_input->>'description',
    (p_input->>'baseline_value')::numeric, (p_input->>'target_value')::numeric, p_input->>'unit', (p_input->>'target_thb')::numeric, p_input->>'tools_applied', 'draft');
  return v_id;
end $$;

create or replace function public.transition_impact_contract(p_actor text, p_contract text, p_action text, p_payload jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare c public.impact_contracts; a public.personas; l public.personas; v_from text; v_note text; v_dec text; v_claim numeric; v_val numeric;
  is_learner boolean; is_manager boolean; is_sponsor boolean;
begin
  select * into c from public.impact_contracts where id = p_contract for update;
  if not found then raise exception 'Impact contract not found.'; end if;
  a := public._persona(p_actor); l := public._persona(c.learner_id);
  is_learner := c.learner_id = p_actor; is_manager := c.manager_id = p_actor; is_sponsor := c.sponsor_id = p_actor;
  v_from := c.status; v_note := nullif(trim(coalesce(p_payload->>'note','')), '');

  if p_action = 'submit' then
    if not is_learner then raise exception 'You are not the responsible person for this action.'; end if;
    if v_from not in ('draft','returned') then raise exception 'This action is not available while the contract is "%".', v_from; end if;
    update public.impact_contracts set status = 'manager_review', return_reason = null, updated_at = now() where id = c.id;
    perform public._notify(c.manager_id, 'Impact contract waiting for your review', l.full_name || ' submitted "' || c.title || '".', '/contracts/' || c.id);
  elsif p_action = 'withdraw' then
    if not is_learner then raise exception 'You are not the responsible person for this action.'; end if;
    if v_from not in ('draft','returned','manager_review','sponsor_review') then raise exception 'This action is not available while the contract is "%".', v_from; end if;
    update public.impact_contracts set status = 'withdrawn', updated_at = now() where id = c.id;
  elsif p_action = 'manager_approve' then
    if not is_manager then raise exception 'You are not the responsible person for this action.'; end if;
    if v_from <> 'manager_review' then raise exception 'This action is not available while the contract is "%".', v_from; end if;
    update public.impact_contracts set status = 'sponsor_review', updated_at = now() where id = c.id;
    perform public._notify(c.sponsor_id, 'Impact contract waiting for sponsor approval', l.full_name || ': "' || c.title || '" was approved by the line manager.', '/contracts/' || c.id);
  elsif p_action = 'return' then
    if not ((is_manager and v_from = 'manager_review') or (is_sponsor and v_from in ('sponsor_review','showcase_review')) or (is_manager and v_from = 'sponsor_review')) then
      raise exception 'You are not the responsible person for this action.'; end if;
    if v_note is null then raise exception 'A note explaining the decision is required.'; end if;
    update public.impact_contracts set status = case when v_from = 'showcase_review' then 'active' else 'returned' end, return_reason = v_note, updated_at = now() where id = c.id;
    perform public._notify(c.learner_id, 'Impact contract returned for changes', a.full_name || ': ' || v_note, '/contracts/' || c.id);
  elsif p_action = 'sponsor_approve' then
    if not is_sponsor then raise exception 'You are not the responsible person for this action.'; end if;
    if v_from <> 'sponsor_review' then raise exception 'This action is not available while the contract is "%".', v_from; end if;
    update public.impact_contracts set status = 'active', updated_at = now() where id = c.id;
    update public.enrollments set status = 'in_sprint' where id = c.enrollment_id and status in ('invited','diagnosed','in_labs');
    perform public._notify(c.learner_id, 'Impact contract approved by sponsor', a.full_name || ' approved "' || c.title || '". Your sprint is active.', '/contracts/' || c.id);
    perform public._notify(c.manager_id, 'Impact contract approved by sponsor', '"' || c.title || '" for ' || l.full_name || ' is now active.', '/contracts/' || c.id);
  elsif p_action = 'submit_mid_gate' then
    if not is_learner then raise exception 'You are not the responsible person for this action.'; end if;
    if v_from <> 'active' then raise exception 'This action is not available while the contract is "%".', v_from; end if;
    update public.impact_contracts set status = 'mid_gate_review', updated_at = now() where id = c.id;
    perform public._notify(c.manager_id, 'Mid-sprint evidence pack submitted', l.full_name || ' asks for a scale / pivot / reset decision.', '/contracts/' || c.id);
    perform public._notify(c.sponsor_id, 'Mid-sprint evidence pack submitted', l.full_name || ' asks for a scale / pivot / reset decision.', '/contracts/' || c.id);
  elsif p_action = 'mid_gate_decide' then
    if not (is_manager or is_sponsor) then raise exception 'You are not the responsible person for this action.'; end if;
    if v_from <> 'mid_gate_review' then raise exception 'This action is not available while the contract is "%".', v_from; end if;
    v_dec := p_payload->>'mid_gate_decision';
    if v_dec not in ('scale','pivot','reset') then raise exception 'Choose scale, pivot or reset.'; end if;
    if v_note is null then raise exception 'Explain the decision in a note.'; end if;
    update public.impact_contracts set mid_gate_decision = v_dec, mid_gate_note = v_note, status = case when v_dec = 'reset' then 'reset' else 'active' end, updated_at = now() where id = c.id;
    perform public._notify(c.learner_id, 'Mid-sprint gate decision: ' || v_dec, a.full_name || ': ' || v_note, '/contracts/' || c.id);
  elsif p_action = 'submit_showcase' then
    if not is_learner then raise exception 'You are not the responsible person for this action.'; end if;
    if v_from <> 'active' then raise exception 'This action is not available while the contract is "%".', v_from; end if;
    if nullif(trim(coalesce(p_payload->>'showcase_summary','')),'') is null then raise exception 'Describe the delivered improvement.'; end if;
    v_claim := (p_payload->>'claimed_value_thb')::numeric;
    if v_claim is null or v_claim <= 0 then raise exception 'Enter the THB value you are claiming.'; end if;
    update public.impact_contracts set status = 'showcase_review', showcase_summary = p_payload->>'showcase_summary', updated_at = now() where id = c.id;
    insert into public.ledger_entries(id, persona_id, bu_id, source_type, source_id, title, objective_type, claimed_value_thb, sponsor_id, status, tracking_until)
    values (public._uid('lg'), c.learner_id, l.bu_id, 'impact_contract', c.id, c.title, c.objective_type, v_claim, c.sponsor_id, 'pending_validation', (now() + interval '12 months')::date);
    update public.enrollments set status = 'showcase' where id = c.enrollment_id;
    perform public._notify(c.sponsor_id, 'Showcase submitted for validation', l.full_name || ' claims THB ' || to_char(v_claim, 'FM999,999,999,999') || ' for "' || c.title || '".', '/contracts/' || c.id);
  elsif p_action = 'validate' then
    if not is_sponsor then raise exception 'You are not the responsible person for this action.'; end if;
    if v_from <> 'showcase_review' then raise exception 'This action is not available while the contract is "%".', v_from; end if;
    v_val := (p_payload->>'validated_value_thb')::numeric;
    if v_val is null or v_val < 0 then raise exception 'Enter the validated THB value.'; end if;
    update public.impact_contracts set status = 'validated', validated_value_thb = v_val, validated_at = now(), updated_at = now() where id = c.id;
    update public.ledger_entries set status = 'validated', validated_value_thb = v_val, validated_at = now() where source_type = 'impact_contract' and source_id = c.id;
    update public.enrollments set status = 'graduated', impact_rating = coalesce(impact_rating, 'strong') where id = c.enrollment_id;
    perform public._mint_from_diagnostic(c.enrollment_id, c.learner_id, 'showcase', c.id);
    perform public._notify(c.learner_id, 'Impact validated and badges minted', a.full_name || ' validated THB ' || to_char(v_val, 'FM999,999,999,999') || '. Outcome-verified badges were minted to your skill passport.', '/passport');
  else
    raise exception 'Unknown action.';
  end if;
  select status into v_dec from public.impact_contracts where id = c.id;
  perform public._event('impact_contract', c.id, p_actor, p_action, v_from, v_dec, coalesce(v_note, p_payload->>'showcase_summary'));
end $$;

create or replace function public.add_sprint_evidence(p_actor text, p_contract text, p_input jsonb) returns void language plpgsql security definer set search_path = public as $$
declare c public.impact_contracts; l public.personas;
begin
  select * into c from public.impact_contracts where id = p_contract;
  if not found then raise exception 'Impact contract not found.'; end if;
  if c.learner_id <> p_actor then raise exception 'Only the learner can log sprint evidence.'; end if;
  if c.status not in ('active','mid_gate_review') then raise exception 'Evidence can be logged while the sprint is active.'; end if;
  if nullif(trim(coalesce(p_input->>'title','')),'') is null then raise exception 'Give the evidence a title.'; end if;
  l := public._persona(p_actor);
  insert into public.sprint_evidence(id, contract_id, week_no, title, note, metric_value, created_by)
  values (public._uid('ev'), c.id, (p_input->>'week_no')::int, p_input->>'title', coalesce(p_input->>'note',''), (p_input->>'metric_value')::numeric, p_actor);
  perform public._notify(c.manager_id, l.full_name || ' logged week ' || (p_input->>'week_no') || ' evidence', p_input->>'title', '/contracts/' || c.id);
end $$;

-- ---------- challenge briefs ----------
create or replace function public.save_challenge_brief(p_actor text, p_input jsonb) returns text language plpgsql security definer set search_path = public as $$
declare a public.personas; b public.challenge_briefs; v_id text;
begin
  a := public._persona(p_actor);
  if a.role <> 'bu_sponsor' then raise exception 'Only BU sponsors can create challenge briefs.'; end if;
  if coalesce(p_input->>'id','') <> '' then
    select * into b from public.challenge_briefs where id = p_input->>'id';
    if not found then raise exception 'Brief not found.'; end if;
    if b.sponsor_id <> p_actor then raise exception 'Only the sponsoring owner can edit this brief.'; end if;
    if b.status not in ('draft','returned') then raise exception 'Only draft or returned briefs can be edited.'; end if;
    update public.challenge_briefs set theme_id = nullif(p_input->>'theme_id',''), bu_id = p_input->>'bu_id', title = p_input->>'title', challenge_type = p_input->>'challenge_type',
      problem_statement = p_input->>'problem_statement', success_metric = p_input->>'success_metric', target_value_thb = (p_input->>'target_value_thb')::numeric,
      constraints = p_input->>'constraints', updated_at = now() where id = b.id;
    return b.id;
  end if;
  v_id := public._uid('cb');
  insert into public.challenge_briefs(id, theme_id, bu_id, sponsor_id, title, challenge_type, problem_statement, success_metric, target_value_thb, constraints, status)
  values (v_id, nullif(p_input->>'theme_id',''), p_input->>'bu_id', p_actor, p_input->>'title', p_input->>'challenge_type', p_input->>'problem_statement', p_input->>'success_metric',
    (p_input->>'target_value_thb')::numeric, p_input->>'constraints', 'draft');
  return v_id;
end $$;

create or replace function public.transition_challenge_brief(p_actor text, p_brief text, p_action text, p_payload jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare b public.challenge_briefs; a public.personas; v_from text; v_note text; co public.cohorts; m record;
begin
  select * into b from public.challenge_briefs where id = p_brief for update;
  if not found then raise exception 'Brief not found.'; end if;
  a := public._persona(p_actor); v_from := b.status; v_note := nullif(trim(coalesce(p_payload->>'note','')), '');
  if p_action = 'submit' then
    if b.sponsor_id <> p_actor then raise exception 'You are not the responsible role for this action.'; end if;
    if v_from not in ('draft','returned') then raise exception 'This action is not available while the brief is "%".', v_from; end if;
    update public.challenge_briefs set status = 'committee_review', updated_at = now() where id = b.id;
    for m in select id from public.personas where role = 'committee' loop
      perform public._notify(m.id, 'Challenge brief submitted for review', a.full_name || ': "' || b.title || '"', '/briefs/' || b.id);
    end loop;
  elsif p_action = 'withdraw' then
    if b.sponsor_id <> p_actor then raise exception 'You are not the responsible role for this action.'; end if;
    if v_from not in ('draft','returned','committee_review') then raise exception 'This action is not available while the brief is "%".', v_from; end if;
    update public.challenge_briefs set status = 'withdrawn', updated_at = now() where id = b.id;
  elsif p_action in ('approve','return','reject') then
    if a.role <> 'committee' then raise exception 'You are not the responsible role for this action.'; end if;
    if v_from <> 'committee_review' then raise exception 'This action is not available while the brief is "%".', v_from; end if;
    if p_action <> 'approve' and v_note is null then raise exception 'A note explaining the decision is required.'; end if;
    update public.challenge_briefs set status = case p_action when 'approve' then 'approved' when 'return' then 'returned' else 'rejected' end,
      reviewed_by_id = p_actor, reviewed_at = now(), committee_note = coalesce(v_note, 'Approved.'), updated_at = now() where id = b.id;
    if p_action = 'approve' then
      perform public._notify(b.sponsor_id, 'Challenge brief approved', 'The committee approved "' || b.title || '".', '/briefs/' || b.id);
      for m in select id from public.personas where role = 'program_office' loop
        perform public._notify(m.id, 'Brief approved: assign to a cohort', '"' || b.title || '" is ready to be assigned.', '/briefs/' || b.id);
      end loop;
    elsif p_action = 'return' then
      perform public._notify(b.sponsor_id, 'Challenge brief returned for changes', a.full_name || ': ' || v_note, '/briefs/' || b.id);
    else
      perform public._notify(b.sponsor_id, 'Challenge brief rejected', a.full_name || ': ' || v_note, '/briefs/' || b.id);
    end if;
  elsif p_action = 'assign' then
    if a.role <> 'program_office' then raise exception 'You are not the responsible role for this action.'; end if;
    if v_from <> 'approved' then raise exception 'This action is not available while the brief is "%".', v_from; end if;
    select * into co from public.cohorts where id = p_payload->>'cohort_id';
    if not found or co.program <> 'BCD' then raise exception 'Choose a BCD cohort.'; end if;
    update public.challenge_briefs set status = 'assigned', cohort_id = co.id, updated_at = now() where id = b.id;
    perform public._notify(b.sponsor_id, 'Brief assigned to a cohort', '"' || b.title || '" is assigned to ' || co.name || '.', '/briefs/' || b.id);
  else
    raise exception 'Unknown action.';
  end if;
  select status into v_from from public.challenge_briefs where id = b.id;
  perform public._event('challenge_brief', b.id, p_actor, p_action, b.status, v_from, v_note);
end $$;

-- ---------- concepts and gates ----------
create or replace function public.submit_gate_evidence(p_actor text, p_gate text, p_summary text) returns void language plpgsql security definer set search_path = public as $$
declare g public.gate_reviews; cp public.concepts; m record; v_stage text;
begin
  select * into g from public.gate_reviews where id = p_gate for update;
  if not found then raise exception 'Gate review not found.'; end if;
  select * into cp from public.concepts where id = g.concept_id;
  if not exists (select 1 from public.enrollments where persona_id = p_actor and team_id = cp.team_id) then raise exception 'Only a member of the concept team can submit the evidence pack.'; end if;
  if g.decision <> 'pending' or g.submitted_at is not null then raise exception 'This gate already has an evidence pack.'; end if;
  if nullif(trim(coalesce(p_summary,'')),'') is null then raise exception 'Summarise the evidence pack.'; end if;
  v_stage := 'gate' || g.gate_no;
  update public.gate_reviews set evidence_summary = p_summary, submitted_at = now() where id = g.id;
  update public.concepts set stage = v_stage, updated_at = now() where id = cp.id;
  for m in select id from public.personas where role = 'committee' loop
    perform public._notify(m.id, 'Gate ' || g.gate_no || ' evidence pack submitted', cp.title, '/concepts/' || cp.id);
  end loop;
  perform public._event('concept', cp.id, p_actor, 'submit_gate_evidence', cp.stage, v_stage, 'Gate ' || g.gate_no || ' evidence pack submitted.');
end $$;

create or replace function public.decide_gate(p_actor text, p_gate text, p_decision text, p_note text, p_value numeric) returns void language plpgsql security definer set search_path = public as $$
declare a public.personas; g public.gate_reviews; cp public.concepts; b public.challenge_briefs; v_stage text; m record; v_positive boolean;
begin
  a := public._persona(p_actor);
  if a.role <> 'committee' then raise exception 'Only the Capability Investment Committee records gate decisions.'; end if;
  select * into g from public.gate_reviews where id = p_gate for update;
  if not found then raise exception 'Gate review not found.'; end if;
  if g.decision <> 'pending' then raise exception 'This gate is already decided.'; end if;
  if g.submitted_at is null then raise exception 'The team has not submitted an evidence pack yet.'; end if;
  if not ((g.gate_no = 1 and p_decision in ('go','pivot','stop')) or (g.gate_no = 2 and p_decision in ('invest','small_scale','pivot','stop')) or (g.gate_no = 3 and p_decision in ('scale','hold','stop'))) then
    raise exception 'That decision is not valid for this gate.'; end if;
  if nullif(trim(coalesce(p_note,'')),'') is null then raise exception 'Record the reasoning for the decision.'; end if;
  select * into cp from public.concepts where id = g.concept_id;
  select * into b from public.challenge_briefs where id = cp.brief_id;
  update public.gate_reviews set decision = p_decision, decided_by_id = p_actor, decided_at = now(), note = p_note, validated_value_thb = p_value where id = g.id;
  v_stage := case
    when p_decision = 'stop' then 'stopped' when p_decision = 'pivot' then 'pivot' when p_decision = 'hold' then 'incubating'
    when g.gate_no = 1 then 'build_case' when g.gate_no = 2 then 'incubating' else 'scaled' end;
  update public.concepts set stage = v_stage, updated_at = now(),
    validated_value_thb = case when g.gate_no = 3 and p_decision = 'scale' then p_value else validated_value_thb end,
    scale_route = case when g.gate_no = 3 and p_decision = 'scale' then coalesce(scale_route, 'internal_high_impact') else scale_route end
    where id = cp.id;
  if g.gate_no = 2 and p_decision in ('invest','small_scale') then
    insert into public.gate_reviews(id, concept_id, gate_no, scheduled_date, decision) values (public._uid('gr'), cp.id, 3, (now() + interval '6 months')::date, 'pending');
  end if;
  v_positive := p_decision in ('go','invest','small_scale','scale');
  for m in select e.id, e.persona_id from public.enrollments e where e.team_id = cp.team_id loop
    perform public._notify(m.persona_id, 'Gate ' || g.gate_no || ' decision: ' || p_decision, cp.title || '. ' || p_note, '/concepts/' || cp.id);
    if v_positive then perform public._mint_from_diagnostic(m.id, m.persona_id, 'gate', g.id); end if;
    if g.gate_no = 3 and p_decision = 'scale' and p_value is not null then
      insert into public.ledger_entries(id, persona_id, bu_id, source_type, source_id, title, objective_type, claimed_value_thb, validated_value_thb, sponsor_id, status, validated_at, tracking_until)
      values (public._uid('lg'), m.persona_id, b.bu_id, 'concept', cp.id, cp.title || ' (Gate 3)', null, p_value, p_value, b.sponsor_id, 'validated', now(), (now() + interval '12 months')::date);
    end if;
  end loop;
  perform public._notify(b.sponsor_id, 'Gate ' || g.gate_no || ' decision: ' || p_decision, cp.title || '. ' || p_note, '/concepts/' || cp.id);
  perform public._event('concept', cp.id, p_actor, 'gate_decision', cp.stage, v_stage, 'Gate ' || g.gate_no || ': ' || p_decision || '. ' || p_note);
end $$;

-- ---------- ledger ----------
create or replace function public.review_ledger_entry(p_actor text, p_entry text, p_decision text, p_value numeric, p_note text) returns void language plpgsql security definer set search_path = public as $$
declare a public.personas; lg public.ledger_entries; c public.impact_contracts; v_from text;
begin
  a := public._persona(p_actor);
  select * into lg from public.ledger_entries where id = p_entry for update;
  if not found then raise exception 'Ledger entry not found.'; end if;
  v_from := lg.status;
  if p_decision = 'audit' then
    if a.role <> 'program_office' then raise exception 'Only the program office records audits.'; end if;
    if lg.status <> 'validated' then raise exception 'Only validated entries can be audited.'; end if;
    if nullif(trim(coalesce(p_note,'')),'') is null then raise exception 'Record the audit finding.'; end if;
    update public.ledger_entries set status = 'audited', audit_note = p_note where id = lg.id;
  else
    if lg.sponsor_id <> p_actor then raise exception 'Only the named sponsor can validate this entry.'; end if;
    if lg.status <> 'pending_validation' then raise exception 'This entry is not waiting for validation.'; end if;
    if p_decision = 'validate' then
      if p_value is null or p_value < 0 then raise exception 'Enter the validated THB value.'; end if;
      update public.ledger_entries set status = 'validated', validated_value_thb = p_value, validated_at = now() where id = lg.id;
      if lg.source_type = 'impact_contract' then
        select * into c from public.impact_contracts where id = lg.source_id;
        if found and c.status = 'showcase_review' then
          update public.impact_contracts set status = 'validated', validated_value_thb = p_value, validated_at = now(), updated_at = now() where id = c.id;
          update public.enrollments set status = 'graduated' where id = c.enrollment_id;
          perform public._mint_from_diagnostic(c.enrollment_id, c.learner_id, 'showcase', c.id);
          perform public._event('impact_contract', c.id, p_actor, 'validate', 'showcase_review', 'validated', p_note);
        end if;
      end if;
      perform public._notify(lg.persona_id, 'Impact validated in the ledger', a.full_name || ' validated THB ' || to_char(p_value, 'FM999,999,999,999') || ' for "' || lg.title || '".', '/ledger');
    elsif p_decision = 'reject' then
      if nullif(trim(coalesce(p_note,'')),'') is null then raise exception 'Explain why the value is rejected.'; end if;
      update public.ledger_entries set status = 'rejected', audit_note = p_note where id = lg.id;
      perform public._notify(lg.persona_id, 'Claimed impact not validated', a.full_name || ': ' || p_note, '/ledger');
    else
      raise exception 'Unknown decision.';
    end if;
  end if;
  select status into lg.status from public.ledger_entries where id = lg.id;
  perform public._event('ledger_entry', lg.id, p_actor, p_decision, v_from, lg.status, p_note);
end $$;

-- ---------- learning, coaching, marketplace, notifications ----------
create or replace function public.update_learning_item(p_actor text, p_item text, p_status text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('planned','in_progress','completed','skipped') then raise exception 'Invalid status.'; end if;
  if not exists (select 1 from public.learning_plan_items li join public.enrollments e on e.id = li.enrollment_id where li.id = p_item and e.persona_id = p_actor) then
    raise exception 'Only the learner can update their plan.'; end if;
  update public.learning_plan_items set status = p_status where id = p_item;
end $$;

create or replace function public.run_diagnostic(p_actor text, p_enrollment text) returns void language plpgsql security definer set search_path = public as $$
declare d public.diagnostics; r record; i int := 0;
begin
  if not exists (select 1 from public.enrollments where id = p_enrollment and persona_id = p_actor) then raise exception 'Only the learner can run their diagnostic.'; end if;
  select * into d from public.diagnostics where enrollment_id = p_enrollment;
  if not found or d.status = 'completed' then raise exception 'The diagnostic is already completed.'; end if;
  update public.diagnostics set status = 'completed', completed_at = now(),
    summary = 'Simulated AI diagnostic. Priority gaps: GenAI copilot practice, data storytelling and improvement planning, matched to payroll query turnaround.' where id = d.id;
  for r in select * from (values ('sk-genai',1,3,1),('sk-datastory',1,3,2),('sk-changeplan',2,3,3),('sk-custneeds',2,3,4),('sk-collab',3,3,null),('sk-opex',0,2,null)) as v(skill_id,cur,tgt,rank) loop
    insert into public.diagnostic_items(id, diagnostic_id, skill_id, current_level, target_level, priority_rank, evidence_source, rationale)
    values (public._uid('dxi'), d.id, r.skill_id, r.cur, r.tgt, r.rank, case when r.cur = 0 then null else 'ai_inferred' end,
      case when r.cur = 0 then 'Not assessed: no work data available for this skill.' else 'Simulated inference from knowledge test and work data.' end);
    if r.cur > 0 then
      insert into public.passport_entries(id, persona_id, skill_id, level, tier, source_type, source_id) values (public._uid('pp'), p_actor, r.skill_id, r.cur, 'ai_inferred', 'diagnostic', d.id);
    end if;
  end loop;
  for r in select * from (values ('mod-genai-1'),('mod-genai-2'),('mod-datastory-1'),('mod-datastory-3'),('mod-changeplan-1'),('mod-custneeds-1')) as v(module_id) loop
    i := i + 1;
    insert into public.learning_plan_items(id, enrollment_id, module_id, sequence, status, reason) values (public._uid('lp'), p_enrollment, r.module_id, i, 'planned', 'Priority gap ' || least((i + 1) / 2, 4));
  end loop;
  update public.enrollments set status = 'diagnosed' where id = p_enrollment and status = 'invited';
end $$;

create or replace function public.mark_clinic_briefing_ready(p_actor text, p_clinic text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.coaching_clinics where id = p_clinic and coach_id = p_actor) then raise exception 'Only the assigned coach can mark the briefing ready.'; end if;
  update public.coaching_clinics set briefing_ready = true where id = p_clinic;
end $$;

create or replace function public.add_coaching_note(p_actor text, p_enrollment text, p_note text, p_clinic text) returns void language plpgsql security definer set search_path = public as $$
declare a public.personas; e public.enrollments;
begin
  a := public._persona(p_actor);
  if a.role <> 'coach' then raise exception 'Only coaches add coaching notes.'; end if;
  if nullif(trim(coalesce(p_note,'')),'') is null then raise exception 'Write the note.'; end if;
  select * into e from public.enrollments where id = p_enrollment;
  if not found then raise exception 'Enrollment not found.'; end if;
  insert into public.coaching_notes(id, enrollment_id, coach_id, clinic_id, note) values (public._uid('cn'), p_enrollment, p_actor, nullif(p_clinic,''), p_note);
  perform public._notify(e.persona_id, 'New coaching note', p_note, '/journey');
end $$;

create or replace function public.express_interest(p_actor text, p_role text) returns void language plpgsql security definer set search_path = public as $$
declare r public.marketplace_roles; a public.personas;
begin
  if exists (select 1 from public.marketplace_interests where role_id = p_role and persona_id = p_actor) then raise exception 'You already expressed interest.'; end if;
  select * into r from public.marketplace_roles where id = p_role;
  if not found then raise exception 'Role not found.'; end if;
  a := public._persona(p_actor);
  insert into public.marketplace_interests(id, role_id, persona_id, status) values (public._uid('mi'), p_role, p_actor, 'expressed');
  perform public._notify(r.owner_id, 'New interest in your marketplace posting', a.full_name || ' expressed interest in "' || r.title || '".', '/marketplace');
end $$;

create or replace function public.mark_notification_read(p_actor text, p_notification text) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.notifications set read_at = now() where id = p_notification and persona_id = p_actor and read_at is null;
end $$;

create or replace function public.append_coach_messages(p_actor text, p_content text, p_lang text, p_reply text, p_module text) returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._persona(p_actor);
  insert into public.coach_messages(id, persona_id, sender, lang, content) values (public._uid('cm'), p_actor, 'user', p_lang, p_content);
  insert into public.coach_messages(id, persona_id, sender, lang, content, cited_module_id) values (public._uid('cm'), p_actor, 'coach', p_lang, p_reply, nullif(p_module,''));
end $$;

-- reset_demo() is defined in the seed migration (it truncates and re-runs seed_demo()).

grant execute on all functions in schema public to anon, authenticated;
