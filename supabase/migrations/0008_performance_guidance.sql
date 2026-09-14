-- Allow the 'performance' guidance kind (dashboard AI summary).
alter table public.guidance_notes drop constraint if exists guidance_notes_kind_check;
alter table public.guidance_notes add constraint guidance_notes_kind_check
  check (kind in ('diagnostic','journey','contract','coach','clinic_briefing','performance'));
