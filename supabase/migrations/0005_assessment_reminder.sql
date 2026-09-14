-- Program office, committee, sponsors, managers and coaches can remind a learner to complete the assessment.
create or replace function public.remind_assessment(p_actor text, p_enrollment text) returns void language plpgsql security definer set search_path = public as $$
declare a public.personas; e public.enrollments; c public.cohorts;
begin
  a := public._persona(p_actor);
  if a.role not in ('program_office','committee','bu_sponsor','line_manager','coach') then raise exception 'Only program staff, sponsors, managers or coaches send assessment reminders.'; end if;
  select * into e from public.enrollments where id = p_enrollment;
  if not found then raise exception 'Enrollment not found.'; end if;
  if exists (select 1 from public.diagnostics where enrollment_id = e.id and status = 'completed') then raise exception 'This learner has already completed the assessment.'; end if;
  select * into c from public.cohorts where id = e.cohort_id;
  perform public._notify(e.persona_id, 'Reminder: complete your AI skill diagnostic', a.full_name || ' asks you to complete the assessment for ' || c.name || ' so your personal path is ready before the labs.', '/assessment');
end $$;
grant execute on function public.remind_assessment(text, text) to anon, authenticated;
