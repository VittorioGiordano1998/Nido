-- =============================================================================
-- Nido - profile preferences (theme and accent)
--
-- Adds the appearance preferences to profiles: theme ('light' | 'dark' |
-- 'system') and accent (preset id). The RLS policies already restrict profile
-- updates to the owner. Idempotent: safe to re-run.
--
-- Preset ids are mirrored in the client constants
-- (app/src/core/appearance.ts): keep the two lists in sync.
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
