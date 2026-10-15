-- ============================================================================
-- Nido - event occasions: gift radar tag (idempotente)
--
-- Da usare su un progetto dove la migrazione iniziale e' applicata (la tabella
-- events esiste): aggiunge le colonne occasion/occasion_for usate dal radar
-- regali della wishlist. Si puo' rilanciare quante volte si vuole.
--
-- Alla fine mostra le colonne risultanti (ultimo SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261015163000_nido_event_occasions.sql
-- =============================================================================

alter table public.events
  add column if not exists occasion text;

alter table public.events
  add column if not exists occasion_for uuid references public.profiles (id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_occasion_check'
  ) then
    alter table public.events
      add constraint events_occasion_check check (occasion in ('birthday', 'anniversary'));
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'events'
  and column_name in ('occasion', 'occasion_for')
order by column_name;
