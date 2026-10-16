-- ============================================================================
-- Nido - moods - check-in "Come stai oggi?" (idempotente)
--
-- Da usare su un progetto dove le migrazioni sono applicate: crea la tabella `moods` (umore 1..5 per membro e giorno) con RLS della coppia e Realtime (TASK-MOOD-VITTORIOGIORDANOYBQ-001). Si puo'
-- rilanciare quante volte si vuole.
--
-- Alla fine mostra lo stato risultante (ultimi SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261016150000_nido_moods.sql
-- =============================================================================

-- =============================================================================
-- Nido - moods (check-in "Come stai oggi?")
--
-- One row per member per day: a mood 1..5 and an optional one-line note. Both
-- partners read the couple's moods (the check-in is meant to be seen); only
-- the owner writes their own row. Realtime on `moods`. Idempotent.
-- =============================================================================

create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  mood_date date not null default current_date,
  mood smallint not null check (mood between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mood_date)
);
create index if not exists moods_couple_date_idx on public.moods (couple_id, mood_date desc);

alter table public.moods enable row level security;

drop policy if exists moods_select on public.moods;
create policy moods_select on public.moods
  for select to authenticated
  using (public.is_couple_member(couple_id));

drop policy if exists moods_insert on public.moods;
create policy moods_insert on public.moods
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and user_id = auth.uid());

drop policy if exists moods_update on public.moods;
create policy moods_update on public.moods
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists moods_delete on public.moods;
create policy moods_delete on public.moods
  for delete to authenticated
  using (user_id = auth.uid());

drop trigger if exists moods_set_updated_at on public.moods;
create trigger moods_set_updated_at
  before update on public.moods
  for each row execute function public.set_updated_at();

-- Realtime
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'moods'
  ) then
    alter publication supabase_realtime add table public.moods;
    alter table public.moods replica identity full;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'moods'
order by ordinal_position;

select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'moods';
