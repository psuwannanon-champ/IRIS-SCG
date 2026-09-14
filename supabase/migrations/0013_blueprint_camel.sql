-- Nested JSON stays camelCase so the client reads back exactly what it wrote.
create or replace function public.adopt_blueprint(p_actor text, p_blueprint text) returns int language plpgsql security definer set search_path = public as $$
declare b public.role_blueprints; r jsonb; n int := 0; v_skill text;
begin
  perform public._require_role(p_actor, array['program_office']);
  select * into b from public.role_blueprints where id = p_blueprint;
  if not found then raise exception 'Blueprint not found.'; end if;
  if b.status <> 'generated' then raise exception 'Generate the capability plan before adopting it.'; end if;
  for r in select * from jsonb_array_elements(coalesce(b.generated->'skills', '[]'::jsonb)) loop
    select id into v_skill from public.skills where code = coalesce(r->>'skillCode', r->>'skill_code');
    if v_skill is not null and not exists (select 1 from public.capability_gaps where bu_id = b.bu_id and skill_id = v_skill and critical_role = b.role_title) then
      insert into public.capability_gaps(id, bu_id, value_pool, critical_role, skill_id, future_skill_note, supply_fte, demand_fte, thb_value_at_risk, decision, funded)
      values (public._uid('gap'), b.bu_id, coalesce(b.generated->>'valuePool', b.generated->>'value_pool', b.operating_model_change), b.role_title, v_skill, coalesce(r->>'why',''),
        coalesce((r->>'supplyFte')::int, (r->>'supply_fte')::int, 0), coalesce((r->>'demandFte')::int, (r->>'demand_fte')::int, b.headcount),
        coalesce((r->>'thbValueAtRisk')::numeric, (r->>'thb_value_at_risk')::numeric, 0), 'undecided', false);
      n := n + 1;
    end if;
  end loop;
  update public.role_blueprints set status = 'adopted', adopted_at = now() where id = b.id;
  return n;
end $$;

create or replace function public.package_case_as_module(p_actor text, p_contract text, p_input jsonb) returns text language plpgsql security definer set search_path = public as $$
declare c public.impact_contracts; l public.personas; v_id text; v_skill text; v_code text; n int;
begin
  perform public._require_role(p_actor, array['program_office','coach']);
  select * into c from public.impact_contracts where id = p_contract;
  if not found then raise exception 'Impact contract not found.'; end if;
  if c.status <> 'validated' then raise exception 'Only validated cases can be packaged.'; end if;
  if exists (select 1 from public.learning_modules where source_contract_id = c.id) then raise exception 'This case is already packaged as a module.'; end if;
  select id, code into v_skill, v_code from public.skills where code = coalesce(p_input->>'skill_code', p_input->>'skillCode');
  if v_skill is null then raise exception 'Choose a skill from the taxonomy.'; end if;
  l := public._persona(c.learner_id);
  select count(*) + 1 into n from public.learning_modules where origin = 'success_case';
  v_id := public._uid('mod');
  insert into public.learning_modules(id, skill_id, code, title, duration_min, format, variant, origin, source_contract_id, bu_id, body)
  values (v_id, v_skill, v_code || '.C' || n, p_input->>'title', coalesce((p_input->>'duration_min')::int, (p_input->>'durationMin')::int, 15), 'exercise',
    'Proven at ' || (select code from public.business_units where id = l.bu_id), 'success_case', c.id, l.bu_id, p_input->'body');
  perform public._notify(c.learner_id, 'Your improvement is now a micro-module', 'The program office packaged "' || c.title || '" as a reusable module for other service teams.', '/learning');
  return v_id;
end $$;

grant execute on all functions in schema public to anon, authenticated;
