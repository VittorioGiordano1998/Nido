-- =============================================================================
-- Nido - push reminders (calendar reminders delivered with the app closed)
--
-- The client expands recurrences and materializes the next days of reminders
-- as rows here (app/src/features/calendar/reminders.ts); the pg_cron job
-- `nido-push-reminders` calls the Edge Function send-reminders through pg_net
-- every 5 minutes, which sends what is due and marks it sent. Deleting an
-- event takes its reminders with it (FK cascade).
--
--   - only_for null          -> both partners
--   - only_for set           -> that user only (a private event reminds its
--                               creator alone)
--   - sent_at is system-managed: clients may write every column but that one,
--     so re-materializing never un-sends or re-sends a reminder
--
-- The scheduler block needs the two placeholders below replaced (project ref
-- and SEND_REMINDERS_SECRET): until then it raises a notice and schedules
-- nothing, so the file is safe to run as-is. Idempotent.
-- =============================================================================

create table if not exists public.push_reminders (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  occurrence_key text not null,
  fire_at timestamptz not null,
  only_for uuid references public.profiles (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, occurrence_key)
);

create index if not exists push_reminders_due_idx
  on public.push_reminders (fire_at)
  where sent_at is null;
create index if not exists push_reminders_couple_idx
  on public.push_reminders (couple_id, fire_at);

alter table public.push_reminders enable row level security;

-- The couple reads. A private event's reminders stay invisible to the
-- partner (the snapshot carries the title): only_for gates the row.
drop policy if exists push_reminders_select on public.push_reminders;
create policy push_reminders_select on public.push_reminders
  for select to authenticated
  using (
    public.is_couple_member(couple_id)
    and (only_for is null or only_for = auth.uid())
  );

drop policy if exists push_reminders_insert on public.push_reminders;
create policy push_reminders_insert on public.push_reminders
  for insert to authenticated
  with check (
    public.is_couple_member(couple_id)
    and created_by = auth.uid()
    and (only_for is null or only_for = auth.uid())
  );

-- Re-materialization updates the snapshot in place when both devices race on
-- the same occurrence; sent rows are left alone by the delete policy.
drop policy if exists push_reminders_update on public.push_reminders;
create policy push_reminders_update on public.push_reminders
  for update to authenticated
  using (
    public.is_couple_member(couple_id)
    and (only_for is null or only_for = auth.uid())
  )
  with check (
    public.is_couple_member(couple_id)
    and (only_for is null or only_for = auth.uid())
  );

-- Only unsent rows are the client's to clear: history stays for the function
-- to prune.
drop policy if exists push_reminders_delete on public.push_reminders;
create policy push_reminders_delete on public.push_reminders
  for delete to authenticated
  using (
    public.is_couple_member(couple_id)
    and sent_at is null
    and (only_for is null or only_for = auth.uid())
  );

-- sent_at belongs to the system: the Edge Function writes it with the service
-- role, clients cannot touch the column (revoke the table-wide update, grant
-- back every column but sent_at).
revoke update on public.push_reminders from authenticated, anon;
grant update (couple_id, event_id, occurrence_key, fire_at, only_for, created_by, title, body)
  on public.push_reminders to authenticated;

-- ---------------------------------------------------------------------------
-- Scheduler: every 5 minutes, pg_net asks send-reminders for what is due.
-- Replace <project-ref> and <SEND_REMINDERS_SECRET> below, deploy the
-- function (README "Push"), then run this block; re-running replaces the job.
-- ---------------------------------------------------------------------------

do $$
begin
  execute 'create extension if not exists pg_net with schema extensions';
exception when others then
  raise notice 'pg_net non abilitato da SQL (%): abilitalo da Dashboard -> Database -> Extensions', sqlerrm;
end;
$$;

do $$
declare
  v_url text := 'https://<project-ref>.supabase.co/functions/v1/send-reminders';
  v_secret text := '<SEND_REMINDERS_SECRET>';
begin
  if v_url like '%<%>%' or v_secret like '%<%>%' then
    raise notice 'segnaposto non sostituiti: job nido-push-reminders non pianificato (sostituisci <project-ref> e <SEND_REMINDERS_SECRET> e rilancia)';
    return;
  end if;

  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron non installato: job nido-push-reminders non pianificato (abilitalo da Dashboard -> Integrations -> Cron e rilancia)';
    return;
  end if;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'net' and p.proname = 'http_post'
  ) then
    raise notice 'pg_net non installato: job nido-push-reminders non pianificato (abilitalo da Dashboard -> Database -> Extensions e rilancia)';
    return;
  end if;

  if exists (select 1 from cron.job where jobname = 'nido-push-reminders') then
    perform cron.unschedule('nido-push-reminders');
  end if;

  perform cron.schedule(
    'nido-push-reminders',
    '*/5 * * * *',
    format(
      'select net.http_post(url := %L, headers := %L::jsonb, body := ''{}''::jsonb)',
      v_url,
      jsonb_build_object(
        'Content-type', 'application/json',
        'x-webhook-secret', v_secret
      )::text
    )
  );
exception when others then
  raise notice 'job nido-push-reminders non pianificato (%): abilita Cron e pg_net da Dashboard e rilancia questo blocco', sqlerrm;
end;
$$;
