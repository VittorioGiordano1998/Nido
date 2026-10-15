-- =============================================================================
-- Nido - event occasions (gift radar)
--
-- Tags calendar events as gift occasions and names who the occasion is for;
-- the wishlist radar reads recurring occurrences tagged here to suggest the
-- right wishes (TASK-WISH-VITTORIOGIORDANOYBQ-002). Idempotent.
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
