-- =============================================================================
-- Nido - profile sex
--
-- Owner request (TASK-CYC-VITTORIOGIORDANOYBQ-002): a male/female value on the
-- profile gates the cycle section, so the diary entry point only shows where it
-- makes sense. The column is nullable on purpose: unset keeps today's behaviour
-- and nothing else reads it. Idempotent.
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
