-- ============================================================================
-- Nido - push subscriptions and live nudges (idempotente)
--
-- Da usare su un progetto dove la migrazione iniziale e' applicata: aggiunge
-- le chiavi di sottoscrizione a push_tokens e pubblica nudges su Realtime.
-- Si puo' rilanciare quante volte si vuole.
--
-- Alla fine mostra le colonne risultanti (ultimo SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261015180000_nido_push_nudges.sql
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

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'push_tokens'
  and column_name = 'keys';

select pubname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime' and tablename = 'nudges';
