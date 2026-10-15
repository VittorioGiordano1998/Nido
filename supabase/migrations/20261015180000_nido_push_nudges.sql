-- =============================================================================
-- Nido - push subscriptions and live nudges
--
-- - push_tokens.keys: the browser subscription keys (p256dh/auth) needed by
--   Web Push; the token column holds the endpoint.
-- - nudges joins Realtime, so the hub's "recent nudges" list updates live.
-- Idempotent.
-- =============================================================================

alter table public.push_tokens
  add column if not exists keys jsonb;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'nudges'
  ) then
    alter publication supabase_realtime add table public.nudges;
    alter table public.nudges replica identity full;
  end if;
end;
$$;
