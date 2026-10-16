-- ============================================================================
-- Nido - bucket items - cose da fare insieme (idempotente)
--
-- Da usare su un progetto dove le migrazioni sono applicate: crea la tabella `bucket_items` (lista delle esperienze, con la data di completamento) con RLS della coppia e Realtime (TASK-BUCKET-VITTORIOGIORDANOYBQ-001). Si puo'
-- rilanciare quante volte si vuole.
--
-- Alla fine mostra lo stato risultante (ultimi SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261016170000_nido_bucket_items.sql
-- =============================================================================

-- =============================================================================
-- Nido - bucket items (cose da fare insieme)
--
-- A shared bucket list of experiences: title, optional note, done date and a
-- manual order. `memories.bucket_item_id` (next migration) links the journal
-- entry created when an item is completed. Realtime on `bucket_items`.
-- Idempotent.
-- =============================================================================

create table if not exists public.bucket_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  note text,
  done_at timestamptz,
  position int not null default 0,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bucket_items_couple_idx on public.bucket_items (couple_id, position);

alter table public.bucket_items enable row level security;

drop policy if exists bucket_items_select on public.bucket_items;
create policy bucket_items_select on public.bucket_items
  for select to authenticated
  using (public.is_couple_member(couple_id));

drop policy if exists bucket_items_insert on public.bucket_items;
create policy bucket_items_insert on public.bucket_items
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());

drop policy if exists bucket_items_update on public.bucket_items;
create policy bucket_items_update on public.bucket_items
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists bucket_items_delete on public.bucket_items;
create policy bucket_items_delete on public.bucket_items
  for delete to authenticated
  using (public.is_couple_member(couple_id));

drop trigger if exists bucket_items_set_updated_at on public.bucket_items;
create trigger bucket_items_set_updated_at
  before update on public.bucket_items
  for each row execute function public.set_updated_at();

-- Realtime
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bucket_items'
  ) then
    alter publication supabase_realtime add table public.bucket_items;
    alter table public.bucket_items replica identity full;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'bucket_items'
order by ordinal_position;

select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'bucket_items';
