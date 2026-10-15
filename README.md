# Nido

Nido è lo spazio privato della coppia: calendario condiviso, liste, note e piccoli rituali
da fare in due. Web app (PWA-ready) con backend Supabase.

Progetto **clean-room**: solo fonti pubbliche per definire le funzionalità; codice, testi,
design e brand sono originali. Vedi `docs/legal/LEGAL-NOTES.md`.

## Struttura

| Cartella | Contenuto |
| --- | --- |
| `app/` | Client web: Vite + React + TypeScript + Tailwind CSS |
| `supabase/` | Migrazioni SQL (schema, RLS, Realtime); le Edge Functions arriveranno qui |
| `docs/` | Documentazione, regole per agenti, record (task/ADR/…), note legali |
| `tools/` | Scaffold di progetto (regole, record, comandi) + keep-alive Supabase |

## Avvio in locale

Prerequisiti: Node 24+.

```sh
cd app
npm install
copy .env.example .env.local
# incolla URL e anon key del progetto Supabase in .env.local
npm run dev
```

Senza `.env.local` l'app mostra una schermata di setup con le istruzioni.

Comandi utili (su questa macchina `npm` va lanciato via `cmd /c`):

```sh
npm run dev      # dev server
npm run build    # build di produzione (tsc + vite)
npm run lint     # oxlint
```

## Database

`supabase/migrations/` si applica in ordine:

1. `*_nido_initial_schema.sql` — schema completo (Fase 0–4), trigger, RPC di pairing
2. `*_nido_rls_policies.sql` — RLS su ogni tabella + policy per gli oggetti Storage
3. `*_nido_realtime.sql` — tabelle pubblicate su Realtime
4. `*_nido_keepalive.sql` — heartbeat + RPC di ping + job pg_cron anti-pausa
5. `*_nido_events_privacy.sql` — policy su `events`: la visibilità `private` è applicata
   dal database (solo il creatore legge e scrive i propri eventi privati)
6. `*_nido_question_bank_seed.sql` + `*_nido_question_bank_seed_100.sql` — banca delle domande
   del "Domanda del giorno", in due lotti idempotenti (60 + 40 = 100)
7. `*_nido_profile_preferences.sql` — tema e accento su `profiles`
8. `*_nido_onboarding.sql` — flag di primo avvio (`profiles.onboarded_at`)
9. `*_nido_event_occasions.sql` — occasioni regalo sugli eventi (radar della wishlist)
10. `*_nido_push_nudges.sql` — chiavi push su `push_tokens` + `nudges` su Realtime

Alternative di applicazione: Supabase CLI (`supabase link` + `supabase db push`) oppure il
file unico `supabase/apply-all.sql` incollato nell'SQL Editor del dashboard — pensato per un
**progetto nuovo** (le `create table` falliscono con `42P07` su un progetto già migrato:
in quel caso applicare solo le migrazioni mancanti, oppure l'eventuale file di fix dedicato,
es. `supabase/apply-keepalive.sql`, `supabase/apply-events-privacy.sql`,
`supabase/apply-question-bank.sql`, `supabase/apply-profile-preferences.sql`,
`supabase/apply-onboarding.sql`, `supabase/apply-occasions.sql` o
`supabase/apply-push-nudges.sql`).

### Keep-alive (piano gratuito)

Supabase mette in pausa i progetti free dopo ~7 giorni di bassa attività sul database, e
servono **transazioni reali** (connessioni o sole letture non bastano). Doppia rete:

- **Dentro Supabase (primaria)**: il job pg_cron `nido-heartbeat` fa un UPDATE giornaliero
  sulla tabella `heartbeat` (definito in `*_nido_keepalive.sql`; stato visibile in
  Dashboard → Integrations → Cron e nella tabella `heartbeat`).
- **Sul PC (rete di sicurezza)**: `tools/nido-keepalive.ps1` chiama la stessa logica via
  `POST /rest/v1/rpc/keepalive_ping` ed è registrato come attività pianificata di Windows
  ("Nido Supabase keep-alive", giornaliera, con recupero delle esecuzioni saltate). Log in
  `%LOCALAPPDATA%\Nido\keepalive.log`.

Per disattivare la parte su PC:

```powershell
Unregister-ScheduledTask -TaskName 'Nido Supabase keep-alive'
```

Supabase invia comunque un'email di avviso una settimana prima di un'eventuale pausa.

## Deploy su Vercel

Il deploy è **automatico**: il progetto Vercel **`nido_app`** (team *Vittorio*) è collegato al
repository GitHub, quindi ogni push su `main` pubblica in produzione.

- **URL di produzione:** https://nidoapp-sage.vercel.app
- **Impostazioni che contano** (Settings → Build and Development): **Root Directory = `app`**,
  Framework Preset = Vite, Build Command = `npm run build`, Output Directory = `dist`.
  Senza Root Directory `app` il build non parte e il sito risponde 404: non modificarla.
- **Variabili d'ambiente** (Settings → Environment Variables → Production e Preview):
  `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (stessi valori di `app/.env.local`).
  `VITE_` è per definizione pubblico: il valore va salvato come *Config*, non *Secret*.
- `app/vercel.json` contiene la rewrite catch-all (`/(.*)` → `/index.html`) che serve la SPA
  sul refresh delle rotte interne (es. `/calendar`): vale perché Root Directory è `app`.
- `engines.node = 24.x` in `app/package.json` fissa la versione Node del build.

Per un redeploy manuale senza push: Vercel → Deployments → sull'ultima deployment **⋯ →
Redeploy** (senza "use existing build cache"). La CLI (`vercel`, link locale in `app/.vercel`)
resta utile per `vercel env pull` e per i comandi puntuali; il percorso normale è il push.

### Configurazione Supabase (una volta)

Supabase → Authentication → URL Configuration:
- **Site URL** = `https://nidoapp-sage.vercel.app` (è dove atterrano i link di conferma email
  e il rientro OAuth; durante lo sviluppo locale torna a `http://localhost:5173`);
- **Redirect URLs** = aggiungi `https://nidoapp-sage.vercel.app/**` e
  `http://localhost:5173/**`, entrambi, così valgono locale e produzione;
- Google (quando lo abiliterai): il callback da autorizzare resta
  `https://<project-ref>.supabase.co/auth/v1/callback`.

Verifica: apri l'URL, accedi e fai un refresh su una rotta interna (es. `/calendar`): l'app
deve ricaricarsi, non rispondere 404.

### Push (Web Push, una volta)

Le notifiche push usano Web Push con VAPID (decisione in
`ADR-PUSH-VITTORIOGIORDANOYBQ-001`). Passi:

1. **Chiavi VAPID** (una volta sola, sulla macchina): `npx web-push generate-vapid-keys`
   — salva chiave pubblica e privata.
2. **Secret Supabase** (Edge Functions → Secrets, o `supabase secrets set`):
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (es. `mailto:tu@email`),
   `SEND_PUSH_SECRET` (una stringa a caso, es. `openssl rand -hex 32`).
3. **Deploy della funzione**: `supabase functions deploy send-push` (serve `supabase login`
   e il link al progetto; `verify_jwt = false` è già in `supabase/config.toml`, l'autorizzazione
   è l'header segreto).
4. **Database Webhook** (Supabase → Database → Webhooks → nuovo): tabella `nudges`,
   evento **Insert**, tipo HTTP, URL `https://<project-ref>.supabase.co/functions/v1/send-push`,
   header `x-webhook-secret: <SEND_PUSH_SECRET>`.
5. **Vercel**: aggiungi `VITE_VAPID_PUBLIC_KEY` (chiave pubblica) tra le Environment
   Variables e rifai il deploy (basta un push).
6. **Prova**: Profilo → Notifiche → attiva "Notifiche push" sui dispositivi; dall'altro
   account manda un promemoria (Noi → Promemoria al partner, o la campanella su una voce
   di lista) e la notifica arriva. Su iPhone serve prima aggiungere l'app alla schermata
   Home (Safari → Condividi → Aggiungi a Home); con l'app chiusa la notifica arriva solo
   da lì.

Gli avvisi delle **ricorrenze** (promemoria eventi) restano locali e funzionano mentre l'app
è aperta; il push delle novità del partner passa da qui.

## Regole di progetto

- Repository privato: `origin` è `github.com/VittorioGiordano1998/Nido` (account dell'owner) e
  resta l'unico remote; gli agenti non fanno push — i commit restano locali finché non pushi tu.
- Regole per agenti e sviluppatori: `docs/agents/RULES.md` + `docs/agents/RULES.local.md`.
- Lavoro tracciato task-first in `docs/development/` (vedi `TASK_INDEX.md`).
- Il piano di prodotto è il record
  [`PLAN-VITTORIOGIORDANOYBQ-001`](docs/development/plans/agreed/PLAN-VITTORIOGIORDANOYBQ-001-nido-piano-di-prodotto-web-app-supabase-fase-0-4.md);
  la decisione di stack in `docs/development/architecture/adr/`.

## Stato

**M0, M1 e Fase 2** complete e pubblicate (calendario con ricorrenze e occasioni, liste, note,
home, hub "Noi" con domanda del giorno, decisioni, wishlist con radar, piano settimanale,
capsule, fatti, profilo con tema/accenti). **Push e promemoria al partner** implementati:
mancano le chiavi/il deploy lato owner (vedi "Push") e la prova di consegna sul dispositivo.
Prossimo: **Fase 3** (cassaforte E2E, tracker ciclo, premium, risparmi, tessere).
Record in `docs/development/tasks/`.
