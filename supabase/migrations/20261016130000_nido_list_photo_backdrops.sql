-- =============================================================================
-- Nido - photo backdrops for list items and covers for lists
--
-- An item photo can be its card's backdrop (one per item) with a stored
-- framing: position in percent (0-100) and zoom (1.00-3.00). The framing only
-- matters while the photo is the backdrop, but it is kept per attachment so
-- switching back restores what the user chose. A list can carry its own cover
-- photo with the same framing fields.
--
-- cover_path stores a storage object path that may also be one of the item
-- photos: the client clears the cover fields when that photo is deleted rather
-- than the database cascading, so the item keeps its photo and the cover
-- simply disappears.
--
-- No RLS or Realtime changes: both tables already carry the couple policies
-- and are published (`task_attachments` since TASK-LIST-...-002, `task_lists`
-- since the initial schema). Idempotent.
-- =============================================================================

alter table public.task_attachments
  add column if not exists is_backdrop boolean not null default false;
alter table public.task_attachments
  add column if not exists bg_x smallint;
alter table public.task_attachments
  add column if not exists bg_y smallint;
alter table public.task_attachments
  add column if not exists bg_zoom numeric(3, 2);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'task_attachments_bg_range_check'
  ) then
    alter table public.task_attachments
      add constraint task_attachments_bg_range_check
      check (
        (bg_x is null or bg_x between 0 and 100)
        and (bg_y is null or bg_y between 0 and 100)
        and (bg_zoom is null or bg_zoom between 1 and 3)
      );
  end if;
end $$;

create unique index if not exists task_attachments_one_backdrop_idx
  on public.task_attachments (task_id)
  where is_backdrop;

alter table public.task_lists
  add column if not exists cover_path text;
alter table public.task_lists
  add column if not exists cover_x smallint;
alter table public.task_lists
  add column if not exists cover_y smallint;
alter table public.task_lists
  add column if not exists cover_zoom numeric(3, 2);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'task_lists_cover_range_check'
  ) then
    alter table public.task_lists
      add constraint task_lists_cover_range_check
      check (
        (cover_x is null or cover_x between 0 and 100)
        and (cover_y is null or cover_y between 0 and 100)
        and (cover_zoom is null or cover_zoom between 1 and 3)
      );
  end if;
end $$;
