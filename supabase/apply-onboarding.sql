-- ============================================================================
-- Nido - onboarding flag (idempotente)
--
-- Da usare su un progetto dove la migrazione iniziale e' applicata (la tabella
-- profiles esiste): aggiunge la colonna onboarded_at usata dalle slide di
-- primo avvio. Si puo' rilanciare quante volte si vuole.
--
-- Alla fine mostra la colonna risultante (ultimo SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261015113000_nido_onboarding.sql
-- =============================================================================

alter table public.profiles
  add column if not exists onboarded_at timestamptz;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'onboarded_at';
