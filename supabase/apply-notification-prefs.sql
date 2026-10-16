-- ============================================================================
-- Nido - preferenze di notifica per tipo (idempotente)
--
-- Da usare su un progetto dove le migrazioni sono applicate: aggiunge profiles.notification_prefs (eventi, promemoria, bigliettini, check-in, campanelli), letta dalle Edge Function send-push e send-reminders (TASK-NOTIF-VITTORIOGIORDANOYBQ-002). Si puo'
-- rilanciare quante volte si vuole.
--
-- Alla fine mostra lo stato risultante (ultimo SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261016220000_nido_notification_prefs.sql
-- =============================================================================

-- =============================================================================
-- Nido - notification preferences (TASK-NOTIF-VITTORIOGIORDANOYBQ-002)
--
-- Per-account switchboard for partner notifications, stored on `profiles` so
-- it applies to every device and to the server-side deliveries: `send-push`
-- and `send-reminders` read the recipient's row and skip muted types. Five
-- boolean keys, all on by default; an absent or malformed value behaves as on.
-- Idempotent.
-- =============================================================================

alter table public.profiles
  add column if not exists notification_prefs jsonb not null
  default '{"events":true,"reminders":true,"stickies":true,"moods":true,"nudges":true}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_notification_prefs_object_check'
  ) then
    alter table public.profiles
      add constraint profiles_notification_prefs_object_check
      check (jsonb_typeof(notification_prefs) = 'object');
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
  and column_name = 'notification_prefs';
