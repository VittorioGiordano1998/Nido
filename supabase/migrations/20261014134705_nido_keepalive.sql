-- =============================================================================
-- Nido - keep-alive (free-tier pausing)
--
-- Supabase pauses free projects after ~7 days of low database activity, and
-- evidence from Supabase discussion #13121 shows that connections or plain
-- reads are not enough: a real transaction (a write) per day keeps the project
-- out of the pausing window. This migration adds:
--
--   1. public.heartbeat     - singleton row holding the last successful ping
--   2. keepalive_ping()     - one UPDATE, callable with the anon key from any
--                             external scheduler (Windows task, cron service)
--   3. two pg_cron jobs     - the heartbeat runs inside Supabase itself (no
--                             external dependency) + run-history cleanup
--
-- If pg_cron cannot be enabled by this script, enable it from the Dashboard
-- (Integrations -> Cron) and re-run the scheduling block at the bottom.
-- =============================================================================

create table public.heartbeat (
  id smallint primary key default 1 check (id = 1),
  last_ping timestamptz not null default now()
);

insert into public.heartbeat (id) values (1)
on conflict (id) do nothing;

-- Not reachable through the API: deliberately no policies. Only the definer
-- function below and the internal cron job touch this table.
alter table public.heartbeat enable row level security;

create function public.keepalive_ping()
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

-- Callable without a login: the anon key is public by design and the endpoint
-- only bumps one timestamp, so the exposure is deliberately minimal.
revoke execute on function public.keepalive_ping() from public;
grant execute on function public.keepalive_ping() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Inside-Supabase scheduler. Cron jobs run in UTC: 07:30 UTC is ~09:30 in
-- Italian summer time (~08:30 in winter).
-- ---------------------------------------------------------------------------

do $$
begin
  execute 'create extension if not exists pg_cron';
exception when others then
  raise notice 'pg_cron non abilitato da SQL (%): abilitalo da Dashboard -> Integrations -> Cron e riesegui il blocco di scheduling', sqlerrm;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron non installato: job heartbeat non pianificato (riesegui il blocco dopo aver abilitato Cron)';
    return;
  end if;

  perform cron.schedule(
    'nido-heartbeat',
    '30 7 * * *',
    'update public.heartbeat set last_ping = now() where id = 1'
  );

  -- cron.job_run_details grows forever otherwise; keep the last 30 days.
  perform cron.schedule(
    'nido-cron-log-cleanup',
    '0 4 * * 0',
    'delete from cron.job_run_details where end_time < now() - interval ''30 days'''
  );
exception when others then
  raise notice 'job heartbeat non pianificato (%): abilita Cron da Dashboard -> Integrations e riesegui questo blocco', sqlerrm;
end;
$$;
