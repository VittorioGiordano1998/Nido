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
