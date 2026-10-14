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

Alternative di applicazione: Supabase CLI (`supabase link` + `supabase db push`) oppure il
file unico `supabase/apply-all.sql` incollato nell'SQL Editor del dashboard — pensato per un
**progetto nuovo** (le `create table` falliscono con `42P07` su un progetto già migrato:
in quel caso applicare solo le migrazioni mancanti, oppure l'eventuale file di fix dedicato,
es. `supabase/apply-keepalive.sql` o `supabase/apply-events-privacy.sql`).

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

## Regole di progetto

- Repository privato: `origin` è `github.com/VittorioGiordano1998/Nido` (account dell'owner) e
  resta l'unico remote; gli agenti non fanno push — i commit restano locali finché non pushi tu.
- Regole per agenti e sviluppatori: `docs/agents/RULES.md` + `docs/agents/RULES.local.md`.
- Lavoro tracciato task-first in `docs/development/` (vedi `TASK_INDEX.md`).
- Il piano di prodotto è il record
  [`PLAN-VITTORIOGIORDANOYBQ-001`](docs/development/plans/agreed/PLAN-VITTORIOGIORDANOYBQ-001-nido-piano-di-prodotto-web-app-supabase-fase-0-4.md);
  la decisione di stack in `docs/development/architecture/adr/`.

## Stato

Milestone **M1** (MVP: calendario, liste, note, home) in corso: il calendario è
implementato e in verifica, le liste e le note sono i prossimi blocchi. **M0** è completa
salvo il deploy su Vercel, che resta sul tuo account. Record in `docs/development/tasks/`.
