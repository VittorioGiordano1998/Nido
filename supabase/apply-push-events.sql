-- ============================================================================
-- Nido - push sulle novita' del calendario (idempotente)
--
-- SUPERATO da supabase/apply-push-wiring.sql (percorso solo-SQL, senza webhook
-- dal Dashboard): il cablaggio live usa i trigger verso public.nido_http_request.
-- Questo file resta per i progetti che seguono la via Dashboard.
--
-- Da usare su un progetto dove la migrazione iniziale e' applicata: aggiunge
-- il trigger che chiama send-push quando nasce un evento di coppia.
--
-- PRIMA DI ESEGUIRE: sostituisci <project-ref> e <SEND_PUSH_SECRET> con gli
-- stessi valori gia' usati dal webhook sui nudge. Si puo' rilanciare quante
-- volte si vuole: fino a quando i segnaposto ci sono, il trigger non viene
-- creato e il Report lo segnala.
--
-- Alla fine mostra un Report di verifica (ultimo SELECT).
-- ============================================================================

-- =============================================================================
-- Source: supabase/migrations/20261015220000_nido_push_events.sql
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

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select check_name, status
from (
  values
    (1, 'trigger send_push_on_event',
      case when exists (select 1 from pg_trigger where tgname = 'send_push_on_event')
           then 'ok'
           else 'MISSING: sostituisci i segnaposto e rilancia' end),
    (2, 'schema supabase_functions',
      case when exists (select 1 from pg_namespace where nspname = 'supabase_functions')
           then 'ok'
           else 'MISSING: crea prima un webhook dal Dashboard' end)
) as t(ord, check_name, status)
order by ord;
