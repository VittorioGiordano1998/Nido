# Piano di progetto — App per coppie (clone funzionale clean-room)

**Data:** 14 ottobre 2026 · **Stato:** bozza per revisione · **Stack:** Flutter + Supabase

---

## 0. Approccio e vincoli legali

**Obiettivo:** costruire un'app per coppie con funzionalità ispirate a Krivo (Android, `com.molverine.youmeus`), implementata **da zero** con codice e design propri.

**Metodo clean-room:**
- Fonti consentite per definire le funzionalità: pagina Play Store, screenshot pubblici, recensioni, sito dell'app. Nient'altro.
- **Vietato:** decompilare l'APK, riusare codice/asset/testi/trademark altrui, analizzare API private.
- Tenere un file `LEGAL-NOTES.md` nel repo con l'elenco delle fonti pubbliche consultate e le date (protegge il progetto in caso di contestazioni).
- Nome e brand devono essere originali (es. **non** "Krivo" e **non** nomi simili).

**Cosa NON copiamo:** identità visiva, testi, nomi delle sezioni, illustrazioni. Le *funzionalità* in sé (calendario condiviso, liste, ecc.) non sono proteggibili: le reimplementiamo con UX e grafica nostre.

---

## 1. Funzionalità per fase

### Fase 0 — Fondamenta
| # | Feature | Note |
|---|---------|------|
| 0.1 | Auth (email, Google, Apple) | Supabase Auth |
| 0.2 | Onboarding + profilo (nome, avatar, compleanno) | |
| 0.3 | Creazione coppia + invito (codice/QR) | Max 2 membri |
| 0.4 | Home shell con navigazione a tab | Home, Calendario, Liste, Noi, Profilo |
| 0.5 | Impostazioni sezioni on/off | Ogni feature si può disattivare |

### Fase 1 — MVP utilizzabile
| # | Feature | Note |
|---|---------|------|
| 1.1 | Calendario condiviso | Eventi, tutto il giorno, ricorrenze (RRULE), promemoria locali, visibilità coppia/privato |
| 1.2 | Liste e attività condivise | Liste multiple (spesa, film, viaggio…), check item, sync realtime, assegnazione |
| 1.3 | Note condivise | Titolo + corpo, editing realtime |
| 1.4 | Notifiche push di base | Modifiche rilevanti del partner |
| 1.5 | Home riepilogo | Prossimi eventi, attività aperte, giorni insieme |

### Fase 2 — Coinvolgimento
| # | Feature | Note |
|---|---------|------|
| 2.1 | Domanda del giorno | Banca da 100 domande, risposta nascosta finché entrambi rispondono, streak |
| 2.2 | Decisioni alla cieca | Cosa mangiamo/guardiamo: voto nascosto, reveal a due |
| 2.3 | Wishlist + radar regali | Prezzo/link, collegato a compleanni e anniversari del calendario |
| 2.4 | Piano settimanale ("fare insieme") | Una proposta a settimana, accetta/rifiuta/alternativa |
| 2.5 | Cosa c'è da sapere | Fatti sul partner (taglie, gusti, allergie) a schede |
| 2.6 | Capsule del tempo | Note che si aprono il giorno scelto |
| 2.7 | Nudge al partner | Promemoria con messaggi ironici, un tap |

### Fase 3 — Privacy e monetizzazione
| # | Feature | Note |
|---|---------|------|
| 3.1 | Cassaforte documenti E2E | Cifratura client-side, server cieco (design in §5) |
| 3.2 | Tracker ciclo | Log privato del proprietario + riassunto condiviso opzionale |
| 3.3 | Premium | Paywall, IAP, entitlement per coppia, un abbonamento = premium per due |
| 3.4 | Progetti di risparmio | Obiettivo, importo, deadline, barra avanzamento |
| 3.5 | Tessere fedeltà | Codici a barre/QR salvati |

### Fase 4 — Rifinitura
| # | Feature | Note |
|---|---------|------|
| 4.1 | Canvas realtime | Disegno a due in tempo reale, salvataggio PNG, sfondo/widget |
| 4.2 | Widget home | Giorni insieme + nota condivisa |
| 4.3 | Recap annuale | Statistiche dell'anno in coppia |
| 4.4 | Localizzazione | IT (default), ES, EN, DE |

---

## 2. Schermate per fase

- **Fase 0:** Splash → Onboarding (3 slide) → Auth → Profilo → Pairing (crea/Ho un codice/QR) → Home shell → Impostazioni sezioni
- **Fase 1:** Home riepilogo · Calendario (mese/settimana/agenda, dettaglio, editor evento) · Liste (elenco, dettaglio) · Note (elenco, editor) · Impostazioni
- **Fase 2:** Domanda del giorno (card home + sezione con streak e archivio) · Decisioni (elenco, crea, voto, reveal) · Wishlist (elenco, dettaglio, radar) · Piano settimanale · Cosa c'è da sapere (griglia schede) · Capsule (elenco, editor, apertura)
- **Fase 3:** Cassaforte (elenco categorie, upload, visualizzatore, setup chiavi) · Ciclo (calendario personale, editor log, condivisione riassunto) · Paywall · Risparmi · Tessere
- **Fase 4:** Canvas (tela, palette, salva) · Widget config · Recap (slides)

---

## 3. Architettura tecnica

| Livello | Scelta | Motivo |
|---------|--------|--------|
| App | Flutter (Dart 3) | Android + iOS, sviluppo rapido |
| State mgmt | Riverpod (+ codegen) | Testabile, scala bene |
| Routing | go_router | Standard de facto |
| Modelli | freezed + json_serializable | Immutabili, serializzazione |
| Backend | Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) | Sync realtime e RLS out of the box |
| Push | FCM (via Edge Function) | Gratis |
| Widget | `home_widget` + Glance (Android) / WidgetKit (iOS) | Ponte standard |
| IAP | RevenueCat (`purchases_flutter`) | Gestisce receipt/abbonamenti su entrambi gli store |
| Cifratura | `cryptography` (X25519 + AES-256-GCM) | Solo per cassaforte e dati sensibili |
| Localizzazione | flutter_localizations + intl (ARB) | IT/ES/EN/DE |

**Strategia offline:** online-first per MVP (listener realtime Supabase + cache in memoria). Il caching locale persistente (drift/sqlite) si valuta in Fase 2 in base all'uso reale.

---

## 4. Modello dati (Postgres)

> Tutto nello schema `public`, `couple_id` su ogni tabella "di coppia". RLS attiva ovunque.

```sql
-- ============ CORE ============
profiles (                      -- 1:1 con auth.users
  id uuid pk references auth.users,
  display_name text not null,
  avatar_url text,
  birth_date date,
  created_at timestamptz default now()
);

couples (
  id uuid pk default gen_random_uuid(),
  name text,
  invite_code text unique,      -- 6-8 char, null dopo il join del partner
  started_at date,              -- data inizio relazione (per "giorni insieme")
  premium_tier text,            -- monthly | semiannual | annual | lifetime
  premium_until timestamptz,
  created_at timestamptz default now()
);

couple_members (
  couple_id uuid fk references couples on delete cascade,
  user_id uuid fk references profiles,
  joined_at timestamptz default now(),
  pk (couple_id, user_id)       -- max 2 membri: trigger di enforcement
);

device_keys (                   -- chiavi pubbliche per E2E e nuovi dispositivi
  id uuid pk default gen_random_uuid(),
  user_id uuid fk,
  public_key bytea not null,    -- X25519
  label text,                   -- "Pixel di Vittorio"
  created_at timestamptz default now()
);

push_tokens (
  id uuid pk, user_id uuid fk, token text, platform text, updated_at timestamptz
);

-- ============ FASE 1 ============
events (
  id uuid pk, couple_id uuid fk,
  title text not null, description text, location text,
  start_at timestamptz not null, end_at timestamptz, all_day boolean default false,
  rrule text,                   -- ricorrenza iCal
  visibility text default 'couple',  -- 'couple' | 'private'
  created_by uuid, created_at timestamptz, updated_at timestamptz
);

task_lists (
  id uuid pk, couple_id uuid fk,
  title text not null, icon text, position int default 0,
  created_by uuid, created_at timestamptz
);

tasks (
  id uuid pk, list_id uuid fk references task_lists on delete cascade,
  couple_id uuid fk,
  title text not null, note text,
  done boolean default false, done_by uuid, done_at timestamptz,
  due_date date, assigned_to uuid,
  position int default 0,
  created_by uuid, created_at timestamptz, updated_at timestamptz
);

notes (
  id uuid pk, couple_id uuid fk,
  title text, body text,
  pinned_to_widget boolean default false,   -- per il widget "nota condivisa"
  created_by uuid, created_at timestamptz, updated_at timestamptz
);

-- ============ FASE 2 ============
question_bank (               -- contenuto seed, 100 domande per lingua
  id serial pk, lang text, category text, text text not null
);

daily_answers (               -- risposta del giorno: coppia + giorno
  id uuid pk, couple_id uuid fk, question_id int fk,
  answer_date date not null,
  user_id uuid, answer text not null, answered_at timestamptz
  -- unique (couple_id, answer_date, user_id)
);

decisions (
  id uuid pk, couple_id uuid fk,
  question text not null, options jsonb not null,
  created_by uuid, created_at timestamptz,
  revealed_at timestamptz, result jsonb
);

decision_votes (
  id uuid pk, decision_id uuid fk on delete cascade,
  user_id uuid, choice jsonb not null, voted_at timestamptz
  -- unique (decision_id, user_id)
);

wishlist_items (
  id uuid pk, couple_id uuid fk,
  owner_id uuid,               -- per chi è il desiderio
  title text not null, url text, price numeric, currency text,
  notes text, priority int,
  purchased boolean default false, purchased_by uuid,
  created_at timestamptz
);

partner_facts (
  id uuid pk, couple_id uuid fk,
  subject_id uuid,             -- di chi è il fatto
  category text,               -- taglie | gusti | altro
  label text, value text,
  updated_by uuid, updated_at timestamptz
);

time_capsules (
  id uuid pk, couple_id uuid fk,
  title text, body text,
  opens_at date not null,
  created_by uuid, created_at timestamptz
);

week_plans (                  -- "fare insieme"
  id uuid pk, couple_id uuid fk,
  week_start date, proposal text,
  status text default 'pending',   -- pending | accepted | declined | replaced
  created_by uuid, created_at timestamptz
);

nudges (
  id uuid pk, couple_id uuid fk,
  task_id uuid, from_user uuid, to_user uuid,
  message text, created_at timestamptz
  -- insert → Edge Function invia push
);

-- ============ FASE 3 ============
vault_items (
  id uuid pk, couple_id uuid fk,
  title text not null, category text,
  storage_path text not null,  -- bucket privato 'vault'
  enc_alg text default 'AES-256-GCM', enc_nonce bytea not null,
  size_bytes bigint, mime text,
  created_by uuid, created_at timestamptz
);

vault_keys (                  -- chiave coppia incapsulata per ogni dispositivo
  id uuid pk, couple_id uuid fk,
  device_key_id uuid fk references device_keys,
  wrapped_key bytea not null,
  created_at timestamptz
);

cycle_logs (                  -- SOLO proprietario, mai visibile al partner
  id uuid pk, couple_id uuid fk, user_id uuid,
  log_date date not null, flow int, symptoms jsonb, mood int, notes text,
  created_at timestamptz
);

cycle_shares (                -- riassunto condiviso creato esplicitamente
  id uuid pk, couple_id uuid fk, user_id uuid,
  period_start date, period_end date,
  share_level text default 'summary',  -- summary | dates_only
  created_at timestamptz
);

savings_projects (
  id uuid pk, couple_id uuid fk,
  title text, target_amount numeric, current_amount numeric default 0,
  currency text, deadline date,
  created_by uuid, created_at timestamptz, updated_at timestamptz
);

loyalty_cards (
  id uuid pk, couple_id uuid fk,
  store_name text, code text, barcode_type text,
  color text, created_by uuid, created_at timestamptz
);

-- ============ FASE 4 ============
canvases (
  id uuid pk, couple_id uuid fk,
  image_path text,             -- bucket 'canvases'
  updated_at timestamptz
);
-- I tratti del disegno live NON si persistono: passano via Realtime Broadcast.
-- Solo il PNG finale viene salvato su Storage.
```

---

## 5. Sicurezza

### RLS (Regole generali)
```sql
-- Funzione helper (SECURITY DEFINER)
create function public.is_couple_member(cid uuid) returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from couple_members
    where couple_id = cid and user_id = auth.uid()
  );
$$;
```

| Tabella | SELECT | INSERT/UPDATE/DELETE |
|---------|--------|----------------------|
| events, task_lists, tasks, notes, wishlist_items, partner_facts, savings_projects, loyalty_cards, week_plans, decisions(base) | `is_couple_member(couple_id)` | come select + `created_by = auth.uid()` all'insert |
| daily_answers | propria riga **o** solo se ho già risposto alla stessa domanda/giorno (helper `has_answered()`) | solo la propria |
| decision_votes | proprio voto **o** decisione già rivelata | solo il proprio |
| time_capsules | creatore sempre; partner solo se `opens_at <= current_date` | solo il creatore |
| cycle_logs | **solo** `user_id = auth.uid()` | solo il proprietario |
| cycle_shares | coppia | solo il proprietario |
| vault_items / vault_keys | coppia (i contenuti sono cifrati: il server è cieco) | coppia |

### Cassaforte E2E (design)
1. Al primo avvio ogni dispositivo genera una coppia di chiavi **X25519**; privata in `flutter_secure_storage`, pubblica in `device_keys`.
2. Al pairing, un dispositivo genera la **chiave coppia** (32 byte random) e la incapsula per sé e per il partner via ECDH → righe in `vault_keys`.
3. Nuovo dispositivo: mostra la propria chiave pubblica; un dispositivo esistente (tuo o del partner) approva e aggiunge l'incapsulamento. UX: schermata "approva nuovo dispositivo".
4. File: AES-256-GCM con nonce random per file; blob cifrato su Storage, metadati in `vault_items`. Il server non ha mai la chiave.
5. **Punto critico da testare bene:** perdita di tutti i dispositivi = perdita dei dati cassaforte (by design). Prevedere una "frase di recupero" opzionale in Fase 3.

### GDPR / Store
- Diritto alla cancellazione: Edge Function che cancella account + dati coppia (richiesto da Apple).
- Sezione ciclo = dati sanitari: consenso esplicito, minimizzazione, mai sync automatico col partner.
- Data safety form di Google Play e App Privacy di Apple da compilare prima della pubblicazione.

---

## 6. Realtime e notifiche

**Realtime (Postgres changes):** `events`, `task_lists`, `tasks`, `notes`, `wishlist_items`, `decisions`, `decision_votes`, `daily_answers`, `partner_facts`, `savings_projects`, `loyalty_cards`, `week_plans`.

**Broadcast (effimero, non persistito):** canale `couple:{id}:canvas` per i tratti del disegno.

**Edge Functions:**
| Funzione | Trigger | Cosa fa |
|----------|---------|---------|
| `send-push` | webhook su insert `nudges` | Invia FCM al partner |
| `gift-radar` | cron giornaliero | Compleanni/anniversari entro 30 giorni + wishlist → promemoria |
| `revenuecat-webhook` | webhook RevenueCat | Aggiorna `premium_tier/until` su `couples` |
| `delete-account` | chiamata client | Cancella account e dati |

La domanda del giorno **non** richiede cron: selezione deterministica lato client (hash di data+coppia sull'indice della banca domande).

---

## 7. Struttura repository Flutter

```
couples-app/
├─ docs/
│  ├─ PLAN.md            ← questo documento
│  └─ LEGAL-NOTES.md     ← registro fonti clean-room
├─ supabase/
│  ├─ migrations/        ← schema SQL versionato
│  └─ functions/         ← edge functions
├─ lib/
│  ├─ main.dart
│  ├─ app/               ← router, theme, l10n
│  ├─ core/              ← supabase client, env, widget condivisi, utils
│  └─ features/
│     ├─ auth/  coupling/  home/  settings/
│     ├─ calendar/  lists/  notes/
│     ├─ question_of_day/  decisions/  wishlist/  facts/  capsules/  week_plan/  nudges/
│     ├─ vault/  cycle/  savings/  loyalty/  premium/
│     └─ canvas/  widget_bridge/  recap/
│        └─ (per feature: data/ · domain/ · presentation/)
├─ android/  ios/
└─ test/
```

---

## 8. Milestone e stime (sviluppatore singolo, part-time)

| Milestone | Contenuto | Stima |
|-----------|-----------|-------|
| M0 | Scaffold + Supabase progetto + schema + RLS + auth + pairing | ~1 settimana |
| M1 | **MVP usabile**: calendario, liste, note, notifiche base, home | ~3–4 settimane |
| M2 | Coinvolgimento: domanda del giorno, decisioni, wishlist+radar, fatti, capsule, piano, nudge | ~4–5 settimane |
| M3 | Privacy + premium: cassaforte E2E, ciclo, paywall, risparmi, tessere | ~4–6 settimane |
| M4 | Canvas, widget, recap, i18n, rifinitura store | ~3–4 settimane |

**Totale: ~3–4 mesi part-time** fino a prodotto completo; MVP in ~1 mese.

---

## 9. Rischi e decisioni aperte

| Rischio / decisione | Nota |
|---------------------|------|
| E2E multi-dispositivo | Il flusso di approvazione nuovi dispositivi è la parte più delicata: da prototipare presto (spike) |
| Offline | Per MVP online-first; l'app resta usabile senza rete solo in lettura cache parziale — accettabile? |
| Costi | Supabase free tier (500 MB DB, 1 GB storage, 200 connessioni realtime) basta per partire; FCM gratis; RevenueCat gratis fino a ~2,5k$ MRR |
| RevenueCat vs `in_app_purchase` nativo | RevenueCat semplifica moltissimo su due store; da confermare |
| Nome/brand | Da decidere prima dello scaffold (serve per package name e bundle id) |
| iOS subito o solo Android | Incide sulla pianificazione (Apple review, WidgetKit, acquisti) |
| Contenuto banca domande | 100 domande it/es/en/de da scrivere o acquistare (contenuto originale!) |

---

## 10. Prossimi passi

1. **Revisione di questo piano** (tu): feature da tagliare/aggiungere, decisioni aperte in §9.
2. Scaffold progetto Flutter + setup Supabase (M0).
3. Porting schema SQL in `supabase/migrations` + policy RLS.
4. Sviluppo M1 (MVP) con test manuali tra due dispositivi.
