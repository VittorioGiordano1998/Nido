-- =============================================================================
-- Nido - avatars bucket
--
-- Profile photos live in the private `avatars` bucket under `<couple_id>/<file>`
-- (same couple-scoped helpers as `list-photos`); `profiles.avatar_url` — a
-- column that exists since the initial schema — holds either the storage path
-- or an external OAuth URL, and the partner may read both through the existing
-- profile policies. Idempotent.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

drop policy if exists avatars_objects_select on storage.objects;
create policy avatars_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and public.is_couple_member(public.storage_couple_id(name)));

drop policy if exists avatars_objects_insert on storage.objects;
create policy avatars_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and public.is_couple_member(public.storage_couple_id(name)));

drop policy if exists avatars_objects_update on storage.objects;
create policy avatars_objects_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and public.is_couple_member(public.storage_couple_id(name)))
  with check (bucket_id = 'avatars' and public.is_couple_member(public.storage_couple_id(name)));

drop policy if exists avatars_objects_delete on storage.objects;
create policy avatars_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and public.is_couple_member(public.storage_couple_id(name)));
