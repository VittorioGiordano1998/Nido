-- ============================================================================
-- Nido - cycle calendar sharing (idempotente)
--
-- Da usare su un progetto dove le migrazioni sono applicate: aggiunge
-- profiles.cycle_calendar_share (interruttore esplicito del diario),
-- cycle_shares.source ('manual' | 'auto') e porta cycle_shares su Realtime
-- (TASK-CYC-VITTORIOGIORDANOYBQ-002).
-- Si puo' rilanciare quante volte si vuole.
--
-- Alla fine mostra lo stato risultante (ultimi SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261016110000_nido_cycle_calendar_shares.sql
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

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'cycle_calendar_share';

select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'cycle_shares'
  and column_name = 'source';

select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename = 'cycle_shares';
