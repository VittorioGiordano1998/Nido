-- ============================================================================
-- Nido - profile sex (idempotente)
--
-- Da usare su un progetto dove le migrazioni sono applicate: aggiunge
-- profiles.sex ('male' | 'female'), la scelta che mostra la sezione ciclo
-- solo dove serve (TASK-CYC-VITTORIOGIORDANOYBQ-002).
-- Si puo' rilanciare quante volte si vuole.
--
-- Alla fine mostra la colonna risultante (ultimo SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261016090000_nido_profile_sex.sql
-- =============================================================================

alter table public.profiles
  add column if not exists sex text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_sex_check'
  ) then
    alter table public.profiles
      add constraint profiles_sex_check check (sex in ('male', 'female'));
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'sex';
