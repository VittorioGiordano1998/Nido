# Nido

Nido è lo spazio privato della coppia: calendario condiviso, liste, note e piccoli rituali
da fare in due. Web app (PWA-ready) con backend Supabase.

Progetto **clean-room**: solo fonti pubbliche per definire le funzionalità; codice, testi,
design e brand sono originali. Vedi `docs/legal/LEGAL-NOTES.md`.

## Struttura

| Cartella | Contenuto |
| --- | --- |
| `app/` | Client web: Vite + React + TypeScript + Tailwind CSS |
| `supabase/` | Migrazioni SQL (schema, RLS, Realtime) ed Edge Functions |
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
11. `*_nido_push_events.sql` — trigger su `events`: un evento di coppia avvisa il partner
12. `*_nido_push_reminders.sql` — `push_reminders` + il job pg_cron che consegna i
    promemoria a app chiusa
13. `*_nido_profile_sex.sql` — `profiles.sex` (`male` / `female`), la scelta che mostra la
    sezione ciclo solo dove serve
14. `*_nido_cycle_calendar_shares.sql` — condivisione opt-in del ciclo sul calendario
    (`profiles.cycle_calendar_share`, `cycle_shares.source`, Realtime su `cycle_shares`)
15. `*_nido_task_attachments.sql` — allegati delle voci di lista (foto, link, note) con il
    bucket privato `list-photos`

Alternative di applicazione: Supabase CLI (`supabase link` + `supabase db push`) oppure il
file unico `supabase/apply-all.sql` incollato nell'SQL Editor del dashboard — pensato per un
**progetto nuovo** (le `create table` falliscono con `42P07` su un progetto già migrato:
in quel caso applicare solo le migrazioni mancanti, oppure l'eventuale file di fix dedicato,
es. `supabase/apply-keepalive.sql`, `supabase/apply-events-privacy.sql`,
`supabase/apply-question-bank.sql`, `supabase/apply-profile-preferences.sql`,
`supabase/apply-onboarding.sql`, `supabase/apply-occasions.sql`,
`supabase/apply-push-nudges.sql`, `supabase/apply-push-events.sql`,
`supabase/apply-push-reminders.sql`, `supabase/apply-profile-sex.sql`,
`supabase/apply-cycle-calendar.sql` o `supabase/apply-list-attachments.sql`).

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
   `SEND_PUSH_SECRET` (una stringa a caso, es. `openssl rand -hex 32`) e
   `SEND_REMINDERS_SECRET` (un'altra stringa a caso, per il cron dei promemoria).
3. **Deploy delle funzioni**: `supabase functions deploy send-push` e
   `supabase functions deploy send-reminders` (serve `supabase login` e il link al
   progetto; `verify_jwt = false` è già in `supabase/config.toml`, l'autorizzazione è
   l'header segreto).
4. **Database Webhook nudge** (Supabase → Database → Webhooks → nuovo): tabella `nudges`,
   evento **Insert**, tipo HTTP, URL `https://<project-ref>.supabase.co/functions/v1/send-push`,
   header `x-webhook-secret: <SEND_PUSH_SECRET>`.
5. **Webhook eventi (SQL, una volta)**: incolla `supabase/apply-push-events.sql` nell'SQL
   Editor sostituendo `<project-ref>` e `<SEND_PUSH_SECRET>`: quando il partner crea un
   evento di coppia arriva "{Nome} ha aggiunto «Titolo»" con data e ora; gli eventi
   privati non avvisano e le modifiche restano silenziose.
6. **Promemoria a app chiusa (SQL, una volta)**: assicurati che pg_cron (Dashboard →
   Integrations → Cron) e pg_net (Dashboard → Database → Extensions) siano abilitati, poi
   incolla `supabase/apply-push-reminders.sql` sostituendo `<project-ref>` e
   `SEND_REMINDERS_SECRET`: il job `nido-push-reminders` ogni 5 minuti consegna i
   promemoria che l'app ha materializzato.
7. **Vercel**: aggiungi `VITE_VAPID_PUBLIC_KEY` (chiave pubblica) tra le Environment
   Variables e rifai il deploy (basta un push).
8. **Prova**: Profilo → Notifiche → attiva "Notifiche push" sui dispositivi; dall'altro
   account manda un promemoria (Noi → Promemoria al partner, o la campanella su una voce
   di lista) e la notifica arriva. Su iPhone serve prima aggiungere l'app alla schermata
   Home (Safari → Condividi → Aggiungi a Home); con l'app chiusa la notifica arriva solo
   da lì.

I **promemoria eventi** funzionano su più canali: mentre l'app è aperta scatta la notifica
locale (15 minuti prima; alle 9 per i "tutto il giorno"); con l'app chiusa arrivano via push
sui dispositivi con le notifiche attive **e via email** (Brevo) sugli indirizzi degli
account. L'email è il canale affidabile: non dipende da browser, PWA o permessi del
dispositivo. I promemoria lato server coprono i prossimi 7
giorni e si aggiornano a ogni apertura dell'app o modifica degli eventi: se l'app non viene
mai aperta per più di 7 giorni, oltre quell'orizzonte non arriva nulla (limite accettato).
Gli eventi **privati** avvisano solo chi li ha creati.

### Email dei promemoria (Brevo, una volta)

I promemoria dei prossimi 7 giorni vengono anche inviati per email (oggetto
`Promemoria: {titolo}`) dalla Edge Function `send-reminders`, così la consegna non dipende
dallo stato del browser:

1. **Account Brevo** e verifica del mittente: crea l'account (piano gratuito, ~300
   email/giorno) e verifica l'indirizzo che invierà (Brevo → Senders).
2. **Chiave API** (Brevo → SMTP & API → API keys, accesso "Transactional email").
3. **Secret Supabase**: `BREVO_API_KEY` (la chiave), `EMAIL_FROM` (il mittente verificato,
   es. `Nido <tu@email>` oppure solo l'indirizzo) e `APP_URL` (l'origine dell'app per il
   link al calendario, es. `https://nidoapp-sage.vercel.app`) — con `supabase secrets set`
   o dalla Dashboard → Edge Functions → Secrets.
4. **Deploy**: `supabase functions deploy send-reminders`.

Senza `BREVO_API_KEY` o `EMAIL_FROM` il canale email resta spento e la funzione lo segnala
nei log; gli altri canali continuano a funzionare.

### Eliminazione account e reset (una volta)

Due strumenti pensati per l'uso privato/test:

- **Eliminazione account (GDPR)**: `supabase functions deploy delete-account` — nessun
  secret aggiuntivo (la funzione verifica il JWT di chi la chiama). Dal Profilo →
  *Elimina account*, con doppia conferma (si scrive `ELIMINA`). Il partner che resta tiene
  la coppia e i dati condivisi; se non resta nessuno, anche la coppia viene rimossa.
- **Reset dei dati di coppia (strumento di test)**: incolla `supabase/apply-reset-couple.sql`
  nel SQL Editor. Dal Profilo → *Zona test* → *Svuota i dati della coppia* (si scrive
  `RESET`): eventi, liste, note, wishlist, decisioni, promemoria, risparmi, tessere, capsule
  e ciclo vengono svuotati; account, coppia e banca domande restano. È pensato per riprovare
  i flussi da zero: da rivedere prima di un uso pubblico.

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
capsule, fatti, profilo con tema/accenti). **Push e promemoria** (novità eventi, promemoria
al partner, promemoria a app chiusa) implementati e deployati; i promemoria arrivano anche
**via email** (Brevo), così la consegna non dipende dallo stato del browser. Restano la
prova di consegna sul dispositivo e i passi owner ancora aperti (vedi "Push").
Prossimo: **Fase 3** (cassaforte E2E, tracker ciclo, premium, risparmi, tessere) — avviata:
il **ciclo** ha il diario con consenso esplicito, la scelta maschio/femmina nel profilo e la
condivisione opt-in sul calendario; le **liste** hanno gli allegati (foto, link, note) su
ogni voce. Passi owner: `apply-profile-sex.sql`, `apply-cycle-calendar.sql` e
`apply-list-attachments.sql` (vedi Database), poi il giro di prova a due account. Restano
cassaforte E2E, premium, risparmi e tessere.
Record in `docs/development/tasks/`.
