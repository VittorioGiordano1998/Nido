-- ============================================================================
-- Nido - push per bigliettini e check-in (idempotente)
--
-- Da usare su un progetto dove le migrazioni sono applicate: aggiunge i trigger send_push_on_sticky e send_push_on_mood che chiamano send-push (TASK-PUSH-VITTORIOGIORDANOYBQ-003). Si puo'
-- rilanciare quante volte si vuole.
--
-- Alla fine mostra lo stato risultante (ultimo SELECT), per verifica.
--
-- PRIMA DI ESEGUIRE: sostituisci <project-ref> e <SEND_PUSH_SECRET> con gli stessi
-- valori gia' usati dal webhook sugli eventi. Si puo' rilanciare quante volte si
-- vuole: fino a quando i segnaposto ci sono, i trigger non vengono creati e il
-- Report di verifica lo segnala.
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261016210000_nido_push_moments.sql
-- =============================================================================

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

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select check_name, status
from (
  values
    (1, 'trigger send_push_on_sticky',
      case when exists (select 1 from pg_trigger where tgname = 'send_push_on_sticky')
           then 'ok'
           else 'MISSING: sostituisci i segnaposto e rilancia' end),
    (2, 'trigger send_push_on_mood',
      case when exists (select 1 from pg_trigger where tgname = 'send_push_on_mood')
           then 'ok'
           else 'MISSING: sostituisci i segnaposto e rilancia' end),
    (3, 'schema supabase_functions',
      case when exists (select 1 from pg_namespace where nspname = 'supabase_functions')
           then 'ok'
           else 'MISSING: crea prima un webhook dal Dashboard' end)
) as t(ord, check_name, status)
order by ord;
