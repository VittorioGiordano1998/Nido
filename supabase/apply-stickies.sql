-- ============================================================================
-- Nido - stickies - bigliettini veloci (idempotente)
--
-- Da usare su un progetto dove le migrazioni sono applicate: crea la tabella `stickies` (bigliettini tra partner, congedati dal destinatario) con RLS della coppia e Realtime (TASK-STICK-VITTORIOGIORDANOYBQ-001). Si puo'
-- rilanciare quante volte si vuole.
--
-- Alla fine mostra lo stato risultante (ultimi SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261016160000_nido_stickies.sql
-- =============================================================================

-- =============================================================================
-- Nido - stickies (bigliettini veloci)
--
-- Ephemeral notes one partner leaves for the other: short text, created by the
-- author, dismissed by the recipient (delete) or retracted by the author.
-- Both members read the couple's stickies; no updates (rows are immutable).
-- Realtime on `stickies`. Idempotent.
-- =============================================================================

create table if not exists public.stickies (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 200),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index if not exists stickies_couple_idx on public.stickies (couple_id, created_at desc);

alter table public.stickies enable row level security;

drop policy if exists stickies_select on public.stickies;
create policy stickies_select on public.stickies
  for select to authenticated
  using (public.is_couple_member(couple_id));

drop policy if exists stickies_insert on public.stickies;
create policy stickies_insert on public.stickies
  for insert to authenticated
  with check (
    public.is_couple_member(couple_id)
    and from_user = auth.uid()
    and public.shares_couple_with(to_user)
  );

drop policy if exists stickies_delete on public.stickies;
create policy stickies_delete on public.stickies
  for delete to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

-- Realtime
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'stickies'
  ) then
    alter publication supabase_realtime add table public.stickies;
    alter table public.stickies replica identity full;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'stickies'
order by ordinal_position;

select policyname
from pg_policies
where schemaname = 'public'
  and tablename = 'stickies'
order by policyname;

select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'stickies';
