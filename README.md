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

Alternative di applicazione: Supabase CLI (`supabase link` + `supabase db push`) oppure il
file unico `supabase/apply-all.sql` incollato nell'SQL Editor del dashboard — pensato per un
**progetto nuovo** (le `create table` falliscono con `42P07` su un progetto già migrato:
in quel caso applicare solo le migrazioni mancanti, oppure l'eventuale file di fix dedicato,
es. `supabase/apply-keepalive.sql`).

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

Il client è una SPA: `app/vercel.json` contiene la rewrite catch-all (`/(.*)` → `/index.html`)
necessaria perché il refresh su una rotta interna (es. `/lists`) non dia 404. Il deploy parte
dalla cartella `app/` e **non richiede un repository git**: la CLI carica i file locali.
Il progetto dichiara `engines.node = 24.x`, che Vercel rispetta.

1. Installa la CLI e accedi (una volta sola):

   ```sh
   npm i -g vercel
   vercel login
   ```

2. Collega il progetto (nome consigliato **nido**, directory `./`):

   ```sh
   cd app
   vercel link
   ```

3. Registra le variabili d'ambiente (stessi valori di `.env.local`; ripeti per `preview`
   se vuoi i deploy di anteprima):

   ```sh
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   ```

   Alternativa: Dashboard Vercel → Project → Settings → Environment Variables.

4. Deploy di produzione:

   ```sh
   vercel --prod
   ```

5. Dopo il primo deploy, su Supabase → Authentication → URL Configuration imposta:
   **Site URL** = `https://<progetto>.vercel.app` (è dove atterrano i link di conferma
   email e il rientro OAuth; durante lo sviluppo locale torna a `http://localhost:5173`);
   **Redirect URLs** = aggiungi `https://<progetto>.vercel.app/**` e
   `http://localhost:5173/**`, entrambi, così valgono locale e produzione.
   Google (quando lo abiliterai): il callback da autorizzare resta
   `https://<project-ref>.supabase.co/auth/v1/callback`.

6. Verifica: apri l'URL, accedi e fai un refresh su una rotta interna (es. `/profile`):
   l'app deve ricaricarsi, non rispondere 404.

Note: la CLI crea `app/.vercel/` (link locale al progetto, non va versionato); `dist/` lo
ricostruisce Vercel a ogni deploy.

## Regole di progetto

- Questo repository **non ha e non deve avere un remote git**: nulla va pushato.
- Regole per agenti e sviluppatori: `docs/agents/RULES.md` + `docs/agents/RULES.local.md`.
- Lavoro tracciato task-first in `docs/development/` (vedi `TASK_INDEX.md`).
- Il piano di prodotto è in `Piano-App-Coppie.md`; la decisione di stack in
  `docs/development/architecture/adr/`.

## Stato

Milestone **M0** (skeleton web + fondamenta Supabase + auth + pairing) in corso:
vedi `docs/development/tasks/in-progress/`.
