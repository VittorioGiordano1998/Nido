-- ============================================================================
-- Nido - avatars bucket (idempotente)
--
-- Da usare su un progetto dove le migrazioni sono applicate: crea il bucket
-- privato `avatars` per le foto profilo, con le policy della coppia
-- (TASK-PROF-VITTORIOGIORDANOYBQ-002). Si puo' rilanciare quante volte si vuole.
--
-- Alla fine mostra lo stato risultante (ultimi SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261016140000_nido_avatars_bucket.sql
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

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select id, public
from storage.buckets
where id = 'avatars';

select policyname
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'avatars%'
order by policyname;
