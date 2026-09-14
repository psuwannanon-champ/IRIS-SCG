-- The client sends gate JSON verbatim (camelCase). Accept both key styles.
create or replace function public.submit_gate_pack(p_actor text, p_gate text, p_summary text, p_evidence jsonb, p_case jsonb, p_attachments jsonb) returns void language plpgsql security definer set search_path = public as $$
declare g public.gate_reviews; cp public.concepts; m record; v_stage text;
begin
  select * into g from public.gate_reviews where id = p_gate for update;
  if not found then raise exception 'Gate review not found.'; end if;
  select * into cp from public.concepts where id = g.concept_id;
  if not exists (select 1 from public.enrollments where persona_id = p_actor and team_id = cp.team_id) then raise exception 'Only a member of the concept team can submit the evidence pack.'; end if;
  if g.decision <> 'pending' or g.submitted_at is not null then raise exception 'This gate already has an evidence pack.'; end if;
  if nullif(trim(coalesce(p_summary,'')),'') is null then raise exception 'Summarise the evidence pack.'; end if;
  if g.gate_no = 2 and coalesce(p_case->>'paybackMonths', p_case->>'payback_months', '') = '' then raise exception 'Gate 2 needs the business case: pricing, payback and best / worst case.'; end if;
  v_stage := 'gate' || g.gate_no;
  update public.gate_reviews set evidence_summary = p_summary, evidence = p_evidence, business_case = p_case, attachments = coalesce(p_attachments, '[]'::jsonb), submitted_at = now() where id = g.id;
  update public.concepts set stage = v_stage, updated_at = now() where id = cp.id;
  for m in select id from public.personas where role = 'committee' loop
    perform public._notify(m.id, 'Gate ' || g.gate_no || ' pack submitted', cp.title || ' · pre-read ready for review.', '/concepts/' || cp.id);
  end loop;
  perform public._event('concept', cp.id, p_actor, 'submit_gate_evidence', cp.stage, v_stage, 'Gate ' || g.gate_no || ' pack submitted.');
end $$;
