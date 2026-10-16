-- =============================================================================
-- Nido - push per bigliettini e check-in (TASK-PUSH-VITTORIOGIORDANOYBQ-003)
--
-- Two triggers call the `send-push` Edge Function on row insert, exactly like
-- `20261015220000_nido_push_events.sql`:
--   * stickies  -> the recipient is notified of the note left for them;
--   * moods     -> the partner is notified of the first check-in of the day
--                  (same-day edits are an UPDATE of the same row, so they do
--                  not fire again).
-- Up to when the placeholders are substituted the triggers are not created and
-- the apply script reports it. Idempotent.
-- =============================================================================

do $$
declare
  v_url text := 'https://<project-ref>.supabase.co/functions/v1/send-push';
  v_secret text := '<SEND_PUSH_SECRET>';
  v_headers text;
begin
  if v_url like '%<%>%' or v_secret like '%<%>%' then
    raise notice 'segnaposto non sostituiti: trigger send_push_on_sticky / send_push_on_mood non creati (sostituisci <project-ref> e <SEND_PUSH_SECRET> e rilancia)';
    return;
  end if;

  if not exists (select 1 from pg_namespace where nspname = 'supabase_functions') then
    raise notice 'schema supabase_functions assente: trigger non creati (crea prima un webhook dal Dashboard e rilancia)';
    return;
  end if;

  v_headers := jsonb_build_object(
    'Content-type', 'application/json',
    'x-webhook-secret', v_secret
  )::text;

  drop trigger if exists send_push_on_sticky on public.stickies;
  execute format($trigger$
    create trigger send_push_on_sticky
      after insert on public.stickies
      for each row
      execute function supabase_functions.http_request(%L, 'POST', %L, '{}', '1000')
  $trigger$, v_url, v_headers);

  drop trigger if exists send_push_on_mood on public.moods;
  execute format($trigger$
    create trigger send_push_on_mood
      after insert on public.moods
      for each row
      execute function supabase_functions.http_request(%L, 'POST', %L, '{}', '1000')
  $trigger$, v_url, v_headers);
end;
$$;
