-- =============================================================================
-- Nido - push wiring (TASK-PUSH-VITTORIOGIORDANOYBQ-003, TASK-PUSH-...-002, 001)
--
-- The SQL-only path for partner notifications, no Dashboard webhook needed: a
-- trigger bridge on pg_net (`public.nido_http_request`) plus the four triggers
-- that call the `send-push` Edge Function:
--   events   -> a couple event was added (couple visibility only)
--   nudges   -> a bell on a list item
--   stickies -> a sticky note was left
--   moods    -> the first check-in of the day (same-day edits are UPDATEs)
--
-- Substitute <project-ref> and <SEND_PUSH_SECRET> (the same secret of the
-- function; Edge Functions -> Secrets). Until the placeholders are replaced
-- the triggers are not created and the report says so. Idempotent.
--
-- Do NOT create Dashboard webhooks for these four tables: they would fire in
-- addition to these triggers. This file supersedes apply-push-events.sql and
-- apply-push-moments.sql (kept for projects that went the Dashboard route).
-- =============================================================================

create or replace function public.nido_http_request()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $$
declare
  v_url text := tg_argv[0];
  v_method text := coalesce(tg_argv[1], 'POST');
  v_headers jsonb := coalesce(nullif(tg_argv[2], ''), '{}')::jsonb;
  v_timeout integer := coalesce(nullif(tg_argv[4], '')::integer, 1000);
  v_payload jsonb;
begin
  v_payload := jsonb_build_object(
    'type', tg_op,
    'table', tg_table_name,
    'schema', tg_table_schema,
    'record', to_jsonb(new)
  );
  if tg_op <> 'INSERT' then
    v_payload := v_payload || jsonb_build_object('old_record', to_jsonb(old));
  end if;

  if upper(v_method) = 'GET' then
    perform net.http_get(url := v_url, headers := v_headers, timeout_milliseconds := v_timeout);
  else
    perform net.http_post(url := v_url, body := v_payload, headers := v_headers, timeout_milliseconds := v_timeout);
  end if;

  return new;
end;
$$;

comment on function public.nido_http_request() is
  'Ponte dei trigger verso la Edge Function send-push (pg_net): payload {table, record}.';

do $$
declare
  v_url text := 'https://<project-ref>.supabase.co/functions/v1/send-push';
  v_secret text := '<SEND_PUSH_SECRET>';
  v_headers text;
begin
  if v_url like '%<%>%' or v_secret like '%<%>%' then
    raise notice 'segnaposto non sostituiti: trigger push non creati (sostituisci <project-ref> e <SEND_PUSH_SECRET> e rilancia)';
    return;
  end if;

  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise notice 'pg_net assente: abilita l''estensione (Dashboard -> Database -> Extensions) e rilancia';
    return;
  end if;

  v_headers := jsonb_build_object(
    'Content-type', 'application/json',
    'x-webhook-secret', v_secret
  )::text;

  drop trigger if exists send_push_on_event on public.events;
  execute format($t$
    create trigger send_push_on_event
      after insert on public.events
      for each row
      when (new.visibility = 'couple')
      execute function public.nido_http_request(%L, 'POST', %L, '{}', '1000')
  $t$, v_url, v_headers);

  drop trigger if exists send_push_on_nudge on public.nudges;
  execute format($t$
    create trigger send_push_on_nudge
      after insert on public.nudges
      for each row
      execute function public.nido_http_request(%L, 'POST', %L, '{}', '1000')
  $t$, v_url, v_headers);

  drop trigger if exists send_push_on_sticky on public.stickies;
  execute format($t$
    create trigger send_push_on_sticky
      after insert on public.stickies
      for each row
      execute function public.nido_http_request(%L, 'POST', %L, '{}', '1000')
  $t$, v_url, v_headers);

  drop trigger if exists send_push_on_mood on public.moods;
  execute format($t$
    create trigger send_push_on_mood
      after insert on public.moods
      for each row
      execute function public.nido_http_request(%L, 'POST', %L, '{}', '1000')
  $t$, v_url, v_headers);
end;
$$;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select check_name, status
from (
  values
    (1, 'pg_net',
      case when exists (select 1 from pg_extension where extname = 'pg_net')
           then 'ok' else 'MISSING: abilita Extensions e rilancia' end),
    (2, 'funzione nido_http_request',
      case when exists (select 1 from pg_proc where proname = 'nido_http_request')
           then 'ok' else 'MISSING' end),
    (3, 'trigger send_push_on_event',
      case when exists (select 1 from pg_trigger where tgname = 'send_push_on_event')
           then 'ok' else 'MISSING: controlla i segnaposto e rilancia' end),
    (4, 'trigger send_push_on_nudge',
      case when exists (select 1 from pg_trigger where tgname = 'send_push_on_nudge')
           then 'ok' else 'MISSING: controlla i segnaposto e rilancia' end),
    (5, 'trigger send_push_on_sticky',
      case when exists (select 1 from pg_trigger where tgname = 'send_push_on_sticky')
           then 'ok' else 'MISSING: controlla i segnaposto e rilancia' end),
    (6, 'trigger send_push_on_mood',
      case when exists (select 1 from pg_trigger where tgname = 'send_push_on_mood')
           then 'ok' else 'MISSING: controlla i segnaposto e rilancia' end),
    (7, 'segreti sostituiti',
      case when exists (
        select 1 from pg_trigger
        where tgname like 'send_push_on_%'
          and pg_get_triggerdef(oid) like '%<SEND_PUSH_SECRET>%')
           then 'MISSING: sostituisci <SEND_PUSH_SECRET> e rilancia'
           else 'ok' end)
) as t(ord, check_name, status)
order by ord;
