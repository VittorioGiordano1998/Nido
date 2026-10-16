-- =============================================================================
-- Nido - couple data reset, v2 (test tool)
--
-- Same SECURITY DEFINER helper as `20261015200000_nido_reset_couple.sql`, with
-- the tables added after it (moods, stickies, bucket items, memories) and the
-- couple hero photo cleared. Keep the list in sync when a feature adds a
-- table; the `memories` bucket objects follow the same rule as list photos
-- (feature data only, files left in storage). Idempotent.
--
-- Not a product feature: review before any public use.
-- =============================================================================

create or replace function public.reset_couple_data(target_couple uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_couple_member(target_couple) then
    raise exception 'not a couple member';
  end if;

  delete from public.moods where couple_id = target_couple;
  delete from public.stickies where couple_id = target_couple;
  delete from public.memories where couple_id = target_couple;
  delete from public.bucket_items where couple_id = target_couple;
  delete from public.daily_answers where couple_id = target_couple;
  delete from public.decisions where couple_id = target_couple;      -- votes cascade
  delete from public.task_lists where couple_id = target_couple;     -- tasks cascade
  delete from public.notes where couple_id = target_couple;
  delete from public.events where couple_id = target_couple;
  delete from public.wishlist_items where couple_id = target_couple;
  delete from public.partner_facts where couple_id = target_couple;
  delete from public.time_capsules where couple_id = target_couple;
  delete from public.week_plans where couple_id = target_couple;
  delete from public.nudges where couple_id = target_couple;
  delete from public.savings_projects where couple_id = target_couple;
  delete from public.loyalty_cards where couple_id = target_couple;
  delete from public.canvases where couple_id = target_couple;
  delete from public.cycle_logs where couple_id = target_couple;
  delete from public.cycle_shares where couple_id = target_couple;
  delete from public.vault_items where couple_id = target_couple;
  delete from public.vault_keys where couple_id = target_couple;

  update public.couples
  set hero_path = null, hero_x = null, hero_y = null, hero_zoom = null
  where id = target_couple;
end;
$$;

comment on function public.reset_couple_data(uuid) is
  'Test tool: clears one couple''s feature data for a member of that couple (cycle data included).';
