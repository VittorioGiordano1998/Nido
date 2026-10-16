-- ============================================================================
-- Nido - photo backdrops for items and covers for lists (idempotente)
--
-- Da usare su un progetto dove le migrazioni sono applicate: aggiunge la foto
-- di sfondo delle voci (scelta + inquadratura) su task_attachments e la
-- copertina delle liste su task_lists (TASK-LIST-VITTORIOGIORDANOYBQ-003).
-- Si puo' rilanciare quante volte si vuole.
--
-- Alla fine mostra le colonne risultanti (ultimi SELECT), per verifica.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261016130000_nido_list_photo_backdrops.sql
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

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'task_attachments'
  and column_name in ('is_backdrop', 'bg_x', 'bg_y', 'bg_zoom')
order by column_name;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'task_lists'
  and column_name in ('cover_path', 'cover_x', 'cover_y', 'cover_zoom')
order by column_name;

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'task_attachments'
  and indexname = 'task_attachments_one_backdrop_idx';
