-- =============================================================================
-- Nido - push on couple event insert (activity notifications)
--
-- A second database webhook on `events`: when a partner creates a couple
-- event, send-push delivers "{Nome} ha aggiunto «Titolo»" (with date and
-- time) to the other partner; tapping opens /calendar. Private events never
-- notify: the trigger condition filters them and the function re-checks the
-- row server-side. Updates are deliberately out of scope in the MVP.
--
-- The trigger mirrors the dashboard webhook on `nudges`: same function, same
-- supabase_functions.http_request shape, same x-webhook-secret. Replace
-- <project-ref> and <SEND_PUSH_SECRET> below before applying (apply script:
-- supabase/apply-push-events.sql); until then nothing is created, so the file
-- is safe to run as-is and idempotent.
-- =============================================================================

do $$
declare
  v_url text := 'https://<project-ref>.supabase.co/functions/v1/send-push';
  v_secret text := '<SEND_PUSH_SECRET>';
  v_headers text;
begin
  if v_url like '%<%>%' or v_secret like '%<%>%' then
    raise notice 'segnaposto non sostituiti: trigger send_push_on_event non creato (sostituisci <project-ref> e <SEND_PUSH_SECRET> e rilancia)';
    return;
  end if;

  if not exists (select 1 from pg_namespace where nspname = 'supabase_functions') then
    raise notice 'schema supabase_functions assente: trigger send_push_on_event non creato (crea prima un webhook dal Dashboard e rilancia)';
    return;
  end if;

  v_headers := jsonb_build_object(
    'Content-type', 'application/json',
    'x-webhook-secret', v_secret
  )::text;

  drop trigger if exists send_push_on_event on public.events;
  execute format($trigger$
    create trigger send_push_on_event
      after insert on public.events
      for each row
      when (new.visibility = 'couple')
      execute function supabase_functions.http_request(%L, 'POST', %L, '{}', '1000')
  $trigger$, v_url, v_headers);
end;
$$;
