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
