-- =============================================================================
-- Nido - couple hero (Home cover photo)
--
-- The Home hero can carry a cover photo chosen by the couple: the storage path
-- (private `list-photos` bucket, same couple-scoped policies as covers) plus
-- its framing (x/y position in percent, zoom 1..3), mirroring the list cover
-- model. `couples` joins the Realtime publication so the partner's Home hero
-- updates live; RLS already limits reads/updates to members. Idempotent.
-- =============================================================================

alter table public.couples
  add column if not exists hero_path text,
  add column if not exists hero_x real check (hero_x is null or (hero_x between 0 and 100)),
  add column if not exists hero_y real check (hero_y is null or (hero_y between 0 and 100)),
  add column if not exists hero_zoom real check (hero_zoom is null or (hero_zoom between 1 and 3));

-- Realtime: partner sees a new/changed/removed cover without a reload.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'couples'
  ) then
    alter publication supabase_realtime add table public.couples;
    alter table public.couples replica identity full;
  end if;
end;
$$;
