-- The Progress Mirror briefs the human coach and the manager before each clinic.
create or replace function public.mark_clinic_briefing_ready(p_actor text, p_clinic text) returns void language plpgsql security definer set search_path = public as $$
declare cl public.coaching_clinics; c public.cohorts; m record; a public.personas;
begin
  select * into cl from public.coaching_clinics where id = p_clinic and coach_id = p_actor;
  if not found then raise exception 'Only the assigned coach can mark the briefing ready.'; end if;
  update public.coaching_clinics set briefing_ready = true where id = cl.id;
  select * into c from public.cohorts where id = cl.cohort_id;
  a := public._persona(p_actor);
  for m in
    select e.manager_id, string_agg(p.full_name, ', ') as learners
    from public.enrollments e join public.personas p on p.id = e.persona_id
    where e.cohort_id = cl.cohort_id and e.coach_id = p_actor and e.manager_id is not null
    group by e.manager_id
  loop
    perform public._notify(m.manager_id, 'Clinic ' || cl.clinic_no || ' briefing ready · ' || c.code, a.full_name || ' prepared the briefing for ' || m.learners || '. Topics: ' || cl.topics, '/team');
  end loop;
end $$;
grant execute on function public.mark_clinic_briefing_ready(text, text) to anon, authenticated;
