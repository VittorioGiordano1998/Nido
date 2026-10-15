-- ============================================================================
-- Nido - cycle consent flag (idempotente)
--
-- Da usare su un progetto dove la migrazione iniziale e' applicata: aggiunge
-- profiles.cycle_consent_at, il consenso esplicito al diario del ciclo.
-- Si puo' rilanciare quante volte si vuole.
--
-- Alla fine mostra la colonna risultante (ultimo SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261015210000_nido_cycle_consent.sql
-- =============================================================================

alter table public.profiles
  add column if not exists cycle_consent_at timestamptz;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'cycle_consent_at';
