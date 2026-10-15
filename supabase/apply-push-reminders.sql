-- ============================================================================
-- Nido - promemoria eventi con app chiusa (idempotente)
--
-- Da usare su un progetto dove la migrazione iniziale e' applicata: aggiunge
-- push_reminders (tabella + RLS + colonna sent_at di sistema) e il job
-- pg_cron che chiama send-reminders ogni 5 minuti via pg_net.
--
-- PRIMA DI ESEGUIRE: sostituisci <project-ref> e <SEND_REMINDERS_SECRET> con
-- i valori veri, e assicurati che pg_cron e pg_net siano abilitati (Dashboard
-- -> Integrations -> Cron e Dashboard -> Database -> Extensions). Si puo'
-- rilanciare quante volte si vuole.
--
-- Alla fine mostra un Report di verifica (ultimo SELECT).
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261015230000_nido_push_reminders.sql
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

drop policy if exists push_reminders_delete on public.push_reminders;
create policy push_reminders_delete on public.push_reminders
  for delete to authenticated
  using (
    public.is_couple_member(couple_id)
    and sent_at is null
    and (only_for is null or only_for = auth.uid())
  );

revoke update on public.push_reminders from authenticated, anon;
grant update (couple_id, event_id, occurrence_key, fire_at, only_for, created_by, title, body)
  on public.push_reminders to authenticated;

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

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select check_name, status
from (
  values
    (1, 'tabella push_reminders',
      case when to_regclass('public.push_reminders') is not null then 'ok' else 'MISSING' end),
    (2, 'policy su push_reminders',
      (select count(*)::text from pg_policies
        where schemaname = 'public' and tablename = 'push_reminders')),
    (3, 'pg_net installato',
      case when exists (
             select 1 from pg_proc p
             join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'net' and p.proname = 'http_post'
           )
           then 'ok'
           else 'NO - abilitalo da Dashboard -> Database -> Extensions' end),
    (4, 'job nido-push-reminders',
      case when to_regclass('cron.job') is null then 'no pg_cron'
           when exists (select 1 from cron.job where jobname = 'nido-push-reminders') then 'ok'
           else 'non pianificato: sostituisci i segnaposto e rilancia' end)
) as t(ord, check_name, status)
order by ord;
