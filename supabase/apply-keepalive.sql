-- ============================================================================
-- Nido - keep-alive fix (idempotente)
--
-- Da usare su un progetto dove le migrazioni principali sono gia' applicate
-- (profiles..canvases esistono) ma manca la parte heartbeat/keep-alive.
-- Ogni istruzione e' protetta o in stile "create or replace": si puo' rilanciare
-- quante volte si vuole, senza errori.
--
-- Alla fine mostra una tabella di verifica (ultimo SELECT).
-- ============================================================================

create table if not exists public.heartbeat (
  id smallint primary key default 1 check (id = 1),
  last_ping timestamptz not null default now()
);

insert into public.heartbeat (id) values (1)
on conflict (id) do nothing;

alter table public.heartbeat enable row level security;

create or replace function public.keepalive_ping()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_at timestamptz;
begin
  update public.heartbeat
  set last_ping = now()
  where id = 1
  returning last_ping into v_at;
  return v_at;
end;
$$;

revoke execute on function public.keepalive_ping() from public;
grant execute on function public.keepalive_ping() to anon, authenticated;

do $$
begin
  execute 'create extension if not exists pg_cron';
exception when others then
  raise notice 'pg_cron non abilitato da SQL (%): abilitalo da Dashboard -> Integrations -> Cron e riesegui questo file', sqlerrm;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron non installato: job heartbeat non pianificato (abilita Cron e riesegui questo file)';
    return;
  end if;

  perform cron.schedule(
    'nido-heartbeat',
    '30 7 * * *',
    'update public.heartbeat set last_ping = now() where id = 1'
  );

  perform cron.schedule(
    'nido-cron-log-cleanup',
    '0 4 * * 0',
    'delete from cron.job_run_details where end_time < now() - interval ''30 days'''
  );
exception when others then
  raise notice 'job heartbeat non pianificato (%): abilita Cron da Dashboard -> Integrations e riesegui questo file', sqlerrm;
end;
$$;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------
select check_name, status
from (
  values
    (1, 'heartbeat table',
      case when to_regclass('public.heartbeat') is not null then 'ok' else 'MISSING' end),
    (2, 'tables with RLS enabled (public)',
      (select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity) || ' / ' ||
      (select count(*)::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r')),
    (3, 'RLS policies (public)',
      (select count(*)::text from pg_policies where schemaname = 'public')),
    (4, 'realtime published tables',
      (select count(*)::text from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public')),
    (5, 'pg_cron installed',
      case when to_regclass('cron.job') is not null then 'yes'
           else 'NO - enable Dashboard -> Integrations -> Cron, then re-run this file' end)
) as t(ord, check_name, status)
order by ord;
