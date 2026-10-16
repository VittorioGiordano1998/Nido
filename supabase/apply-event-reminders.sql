-- ============================================================================
-- Nido - promemoria personalizzato per evento (idempotente)
--
-- Da usare su un progetto dove le migrazioni sono applicate: aggiunge events.remind_minutes (null = come sempre, 0 = nessuno, minuti prima altrimenti) (TASK-CAL-VITTORIOGIORDANOYBQ-004). Si puo'
-- rilanciare quante volte si vuole.
--
-- Alla fine mostra lo stato risultante (ultimo SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261016230000_nido_event_reminders.sql
-- =============================================================================

-- =============================================================================
-- Nido - promemoria personalizzato per evento (TASK-CAL-VITTORIOGIORDANOYBQ-004)
--
-- `events.remind_minutes`: null keeps the default (15 minutes before, 9:00 for
-- all-day events), 0 mutes the reminder for that event, a positive value is
-- the lead time in minutes (up to a week) counted back from the start — or
-- from 9:00 for all-day events. The client materializes `push_reminders` from
-- it; the existing pipeline is unchanged. Idempotent.
-- =============================================================================

alter table public.events
  add column if not exists remind_minutes int;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_remind_minutes_check'
  ) then
    alter table public.events
      add constraint events_remind_minutes_check
      check (remind_minutes is null or remind_minutes between 0 and 10080);
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'events'
  and column_name = 'remind_minutes';
