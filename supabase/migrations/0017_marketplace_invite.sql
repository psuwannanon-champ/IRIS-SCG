-- Deck p4 and p12: the marketplace "allocates key talent to roles, projects and gigs by verified
-- skills". It only ran one direction: a person expressed interest and the owner sorted the people
-- who happened to volunteer. A posting owner could not search the workforce and invite a match.

alter table public.marketplace_interests drop constraint if exists marketplace_interests_status_check;
alter table public.marketplace_interests add constraint marketplace_interests_status_check
  check (status in ('expressed','shortlisted','declined','placed','invited'));
alter table public.marketplace_interests add column if not exists invited_by text references public.personas(id);

-- The posting owner (or the program office) invites a person the verified-skill match surfaced.
create or replace function public.invite_to_role(p_actor text, p_role text, p_persona text, p_note text) returns void language plpgsql security definer set search_path = public as $$
declare r public.marketplace_roles; a public.personas; t public.personas;
begin
  select * into r from public.marketplace_roles where id = p_role;
  if not found then raise exception 'Role not found.'; end if;
  if r.owner_id <> p_actor and (select role from public.personas where id = p_actor) <> 'program_office' then
    raise exception 'Only the posting owner or the program office can invite someone.'; end if;
  t := public._persona(p_persona);
  if t.employment_status = 'left' then raise exception 'That person has left SCG.'; end if;
  if exists (select 1 from public.marketplace_interests where role_id = p_role and persona_id = p_persona) then
    raise exception 'That person is already on this posting.'; end if;
  a := public._persona(p_actor);
  insert into public.marketplace_interests(id, role_id, persona_id, status, invited_by)
  values (public._uid('mi'), p_role, p_persona, 'invited', p_actor);
  perform public._notify(p_persona, 'You were invited to a marketplace posting',
    a.full_name || ' invited you to "' || r.title || '" on your verified skills.' || coalesce(' ' || nullif(p_note,''), '') || ' Open the marketplace to accept or decline.', '/marketplace');
end $$;

-- The invited person answers. Accepting puts them in the owner's candidate list as a normal interest.
create or replace function public.respond_to_invite(p_actor text, p_interest text, p_accept boolean) returns void language plpgsql security definer set search_path = public as $$
declare i public.marketplace_interests; r public.marketplace_roles; a public.personas;
begin
  select * into i from public.marketplace_interests where id = p_interest;
  if not found then raise exception 'Invitation not found.'; end if;
  if i.persona_id <> p_actor then raise exception 'Only the invited person can answer.'; end if;
  if i.status <> 'invited' then raise exception 'That invitation has already been answered.'; end if;
  select * into r from public.marketplace_roles where id = i.role_id;
  a := public._persona(p_actor);
  update public.marketplace_interests set status = case when p_accept then 'expressed' else 'declined' end where id = i.id;
  perform public._notify(r.owner_id, case when p_accept then 'Invitation accepted' else 'Invitation declined' end,
    a.full_name || ' ' || case when p_accept then 'accepted' else 'declined' end || ' your invitation to "' || r.title || '".', '/marketplace');
end $$;
