# LEGAL-NOTES — registro clean-room

Progetto **Nido**. Obiettivo (piano §0): un'app per coppie con funzionalità ispirate a
quelle pubblicamente documentate di app commerciali (es. Krivo — `com.molverine.youmeus`),
sviluppata da zero: codice, testi, grafica e brand originali.

## Regole rispettate

- Nessuna decompilazione di APK; nessun riuso di codice, asset, testi o marchi altrui.
- Nessuna analisi di API private o di traffico di rete di app terze.
- Fonti ammesse: pagina Play Store / App Store, screenshot pubblici, recensioni
  pubbliche, sito ufficiale dell'app.

## Fonti consultate

| Data | Fonte | Cosa ne è stato tratto | Note |
| --- | --- | --- | --- |
| 2026-10-14 | `Piano-App-Coppie.md` (documento interno dell'owner) | Elenco funzionalità per fasi, architettura tecnica, modello dati | Il piano riassume le fonti pubbliche elencate dall'owner stesso |
| 2026-10-14 | Ricerca web su Google Play (verifica nome "Nido") | Solo disponibilità del nome: esistono app "NIDO" in altri settori (seggiolini auto, gestione affitti, monitoraggio serre), nessuna nel settore coppie | Nessun contenuto copiato; non è vicino a "Krivo" |

## Componenti UI di terze parti

| Data | Libreria | Licenza | Cosa è stato incluso |
| --- | --- | --- | --- |
| 2026-10-14 | [React Bits](https://reactbits.dev) (`DavidHDev/react-bits`) | MIT + Commons Clause (uso personale e commerciale; vieta solo la rivendita della libreria) | Sorgenti dei componenti `CountUp`, `BlurText`, `StarBorder`, `DotGrid` in `app/src/ui/reactbits/`, con provenienza nell'header di ogni file |

## Da fare quando si pubblicherà

- Aggiornare questo registro ad ogni nuova fonte pubblica consultata (data, fonte, cosa).
- Verifica del marchio "Nido" per il settore app (UIBM/EUIPO) prima della pubblicazione.
- Google Play Data safety e Apple App Privacy quando/se si pubblicherà sugli store.
