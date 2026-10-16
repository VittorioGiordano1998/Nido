-- =============================================================================
-- Nido - cycle calendar sharing (opt-in)
--
-- The diary can publish the period dates it computes onto the couple calendar:
-- `profiles.cycle_calendar_share` is the explicit, revocable switch, and the
-- published rows are `cycle_shares` with source = 'auto' (dates only — flow,
-- mood, symptoms and notes never leave `cycle_logs`). Manual summaries keep
-- source = 'manual' so the automatic reconcile never touches them.
-- `cycle_shares` joins Realtime so both calendars update without a refresh.
-- Idempotent.
-- =============================================================================

alter table public.profiles
  add column if not exists cycle_calendar_share boolean not null default false;

alter table public.cycle_shares
  add column if not exists source text not null default 'manual';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cycle_shares_source_check'
  ) then
    alter table public.cycle_shares
      add constraint cycle_shares_source_check check (source in ('manual', 'auto'));
  end if;
end $$;

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
      and tablename = 'cycle_shares'
  ) then
    alter publication supabase_realtime add table public.cycle_shares;
    alter table public.cycle_shares replica identity full;
  end if;
end;
$$;
