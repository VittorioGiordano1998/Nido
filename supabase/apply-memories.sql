-- ============================================================================
-- Nido - memories - Ricordi (idempotente)
--
-- Da usare su un progetto dove le migrazioni sono applicate: crea la tabella `memories` (diario fotografico, con `bucket_item_id` verso la bucket list), il bucket privato `memories` e il Realtime (TASK-MEMO-VITTORIOGIORDANOYBQ-001). Si puo'
-- rilanciare quante volte si vuole.
--
-- Alla fine mostra lo stato risultante (ultimi SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261016180000_nido_memories.sql
-- =============================================================================

-- =============================================================================
-- Nido - memories (Ricordi)
--
-- The couple's photo journal: one photo per row (private `memories` bucket,
-- path under `<couple_id>/`), a caption, the day it happened and the author.
-- `bucket_item_id` links the entry to the bucket list item it completed.
-- Both members read and write; Realtime on `memories`. Idempotent.
-- =============================================================================

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  photo_path text not null,
  caption text,
  taken_on date not null default current_date,
  bucket_item_id uuid references public.bucket_items (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists memories_couple_date_idx on public.memories (couple_id, taken_on desc);

alter table public.memories enable row level security;

drop policy if exists memories_select on public.memories;
create policy memories_select on public.memories
  for select to authenticated
  using (public.is_couple_member(couple_id));

drop policy if exists memories_insert on public.memories;
create policy memories_insert on public.memories
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());

drop policy if exists memories_update on public.memories;
create policy memories_update on public.memories
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists memories_delete on public.memories;
create policy memories_delete on public.memories
  for delete to authenticated
  using (public.is_couple_member(couple_id));

-- Realtime
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'memories'
  ) then
    alter publication supabase_realtime add table public.memories;
    alter table public.memories replica identity full;
  end if;
end;
$$;

-- Storage: private `memories` bucket, same couple-scoped policy pattern as
-- `avatars` and `list-photos`.
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;

drop policy if exists memories_objects_select on storage.objects;
create policy memories_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'memories' and public.is_couple_member(public.storage_couple_id(name)));

drop policy if exists memories_objects_insert on storage.objects;
create policy memories_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'memories' and public.is_couple_member(public.storage_couple_id(name)));

drop policy if exists memories_objects_update on storage.objects;
create policy memories_objects_update on storage.objects
  for update to authenticated
  using (bucket_id = 'memories' and public.is_couple_member(public.storage_couple_id(name)))
  with check (bucket_id = 'memories' and public.is_couple_member(public.storage_couple_id(name)));

drop policy if exists memories_objects_delete on storage.objects;
create policy memories_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'memories' and public.is_couple_member(public.storage_couple_id(name)));

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'memories'
order by ordinal_position;

select id, public
from storage.buckets
where id = 'memories';

select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'memories';
