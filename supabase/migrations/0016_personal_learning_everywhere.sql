-- Deck p10: "mass assessment AND personalized learning for every employee", and the path is
-- "re-personalized after every activity". Two limits removed here:
--  1 · a learning plan required a cohort enrolment, so a baselined employee had no path;
--  2 · the plan was written once at diagnostic time and never re-sequenced afterwards.

alter table public.learning_plan_items alter column enrollment_id drop not null;
alter table public.learning_plan_items add column if not exists persona_id text references public.personas(id);
alter table public.learning_plan_items add column if not exists revision int not null default 1;
update public.learning_plan_items li set persona_id = e.persona_id from public.enrollments e where e.id = li.enrollment_id and li.persona_id is null;

-- A learner owns their plan whether it hangs off an enrolment or off the person.
create or replace function public.update_learning_item(p_actor text, p_item text, p_status text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('planned','in_progress','completed','skipped') then raise exception 'Invalid status.'; end if;
  if not exists (
    select 1 from public.learning_plan_items li
    left join public.enrollments e on e.id = li.enrollment_id
    where li.id = p_item and coalesce(e.persona_id, li.persona_id) = p_actor
  ) then raise exception 'Only the learner can update their plan.'; end if;
  update public.learning_plan_items set status = p_status where id = p_item;
end $$;

-- Writes or rewrites a path. Completed and in-progress items are never discarded: re-personalising
-- re-sequences what is still ahead, so progress and the audit trail survive.
-- p_enrollment null = the org-wide personal path, keyed to the person.
create or replace function public.save_learning_path(p_actor text, p_enrollment text, p_plan jsonb, p_reason text) returns int language plpgsql security definer set search_path = public as $$
declare r jsonb; i int; v_rev int; v_kept int; v_added int := 0;
begin
  if p_enrollment is not null and not exists (select 1 from public.enrollments where id = p_enrollment and persona_id = p_actor) then
    raise exception 'Only the learner can change their own path.'; end if;
  if p_enrollment is null and not exists (select 1 from public.personas where id = p_actor) then raise exception 'Unknown persona.'; end if;

  select coalesce(max(revision), 0) + 1 into v_rev from public.learning_plan_items
    where (p_enrollment is not null and enrollment_id = p_enrollment) or (p_enrollment is null and enrollment_id is null and persona_id = p_actor);

  -- keep anything already started or finished; drop only untouched planned/skipped items
  delete from public.learning_plan_items
    where ((p_enrollment is not null and enrollment_id = p_enrollment) or (p_enrollment is null and enrollment_id is null and persona_id = p_actor))
      and status in ('planned','skipped');
  select count(*) into v_kept from public.learning_plan_items
    where (p_enrollment is not null and enrollment_id = p_enrollment) or (p_enrollment is null and enrollment_id is null and persona_id = p_actor);

  i := v_kept;
  for r in select * from jsonb_array_elements(coalesce(p_plan, '[]'::jsonb)) loop
    if exists (select 1 from public.learning_modules where id = coalesce(r->>'moduleId', r->>'module_id'))
       and not exists (
         select 1 from public.learning_plan_items li
         where ((p_enrollment is not null and li.enrollment_id = p_enrollment) or (p_enrollment is null and li.enrollment_id is null and li.persona_id = p_actor))
           and li.module_id = coalesce(r->>'moduleId', r->>'module_id')) then
      i := i + 1; v_added := v_added + 1;
      insert into public.learning_plan_items(id, enrollment_id, persona_id, module_id, sequence, status, reason, revision)
      values (public._uid('lp'), p_enrollment, p_actor, coalesce(r->>'moduleId', r->>'module_id'), i, 'planned', r->>'reason', v_rev);
    end if;
  end loop;

  perform public._notify(p_actor, case when v_rev = 1 then 'Your learning path is ready' else 'Your learning path was re-personalised' end,
    coalesce(nullif(p_reason,''), 'Updated from your latest progress.') || ' ' || v_added || ' module(s) ahead of you.', '/learning');
  perform public._event('persona', p_actor, p_actor, 'personalise_path', 'revision ' || greatest(v_rev - 1, 0), 'revision ' || v_rev, coalesce(nullif(p_reason,''), 'Learning path personalised.'));
  return v_added;
end $$;

alter table public.guidance_notes drop constraint if exists guidance_notes_kind_check;
alter table public.guidance_notes add constraint guidance_notes_kind_check
  check (kind in ('diagnostic','journey','contract','coach','clinic_briefing','performance','role_blueprint','practice','talent_review','repersonalise'));
