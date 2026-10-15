-- ============================================================================
-- Nido - profile preferences: theme and accent (idempotente)
--
-- Da usare su un progetto dove la migrazione iniziale e' applicata (la tabella
-- profiles esiste): aggiunge le preferenze di aspetto usate dalla scheda
-- "Personalizzazione" nel Profilo. Si puo' rilanciare quante volte si vuole.
--
-- Alla fine mostra le colonne risultanti (ultimo SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261015101500_nido_profile_preferences.sql
-- =============================================================================

alter table public.profiles
  add column if not exists theme text not null default 'system';

alter table public.profiles
  add column if not exists accent text not null default 'terra';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_theme_check'
  ) then
    alter table public.profiles
      add constraint profiles_theme_check check (theme in ('light', 'dark', 'system'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_accent_check'
  ) then
    alter table public.profiles
      add constraint profiles_accent_check
      check (accent in ('terra', 'oliva', 'mare', 'prugna'));
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('theme', 'accent')
order by column_name;
