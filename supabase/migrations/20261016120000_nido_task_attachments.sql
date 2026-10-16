-- =============================================================================
-- Nido - list item attachments (photos, links, notes)
--
-- Owner request (TASK-LIST-VITTORIOGIORDANOYBQ-002): a list item can carry any
-- number of attachments. Photos live in the private `list-photos` bucket under
-- `<couple_id>/<file>`; the row keeps the object path. Rows follow their item
-- (FK cascade) and the couple RLS mirrors `tasks`. Realtime so both partners
-- see new attachments without a refresh. Idempotent.
-- =============================================================================

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  kind text not null check (kind in ('photo', 'link', 'note')),
  value text not null,
  caption text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists task_attachments_task_idx
  on public.task_attachments (task_id, created_at);
create index if not exists task_attachments_couple_idx
  on public.task_attachments (couple_id);

alter table public.task_attachments enable row level security;

drop policy if exists task_attachments_select on public.task_attachments;
create policy task_attachments_select on public.task_attachments
  for select to authenticated using (public.is_couple_member(couple_id));

drop policy if exists task_attachments_insert on public.task_attachments;
create policy task_attachments_insert on public.task_attachments
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());

drop policy if exists task_attachments_update on public.task_attachments;
create policy task_attachments_update on public.task_attachments
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists task_attachments_delete on public.task_attachments;
create policy task_attachments_delete on public.task_attachments
  for delete to authenticated using (public.is_couple_member(couple_id));

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'task_attachments'
  ) then
    alter publication supabase_realtime add table public.task_attachments;
    alter table public.task_attachments replica identity full;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: private bucket, paths `<couple_id>/<file>` (second path segment
-- never matters; the helper reads the first one).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('list-photos', 'list-photos', false)
on conflict (id) do nothing;

drop policy if exists list_photos_objects_select on storage.objects;
create policy list_photos_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'list-photos' and public.is_couple_member(public.storage_couple_id(name)));

drop policy if exists list_photos_objects_insert on storage.objects;
create policy list_photos_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'list-photos' and public.is_couple_member(public.storage_couple_id(name)));

drop policy if exists list_photos_objects_update on storage.objects;
create policy list_photos_objects_update on storage.objects
  for update to authenticated
  using (bucket_id = 'list-photos' and public.is_couple_member(public.storage_couple_id(name)))
  with check (bucket_id = 'list-photos' and public.is_couple_member(public.storage_couple_id(name)));

drop policy if exists list_photos_objects_delete on storage.objects;
create policy list_photos_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'list-photos' and public.is_couple_member(public.storage_couple_id(name)));
