# ui/reactbits — componenti vendored

Componenti di terze parti presi da **React Bits** (https://reactbits.dev), installati come
sorgente (il codice è nostro da modificare), con licenza **MIT + Commons Clause**
(https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md): liberi per uso personale e
commerciale; vieta solo rivendere la libreria stessa.

| File | Componente | Usato in | Adattamenti locali |
| --- | --- | --- | --- |
| `CountUp.tsx` | CountUp | Home (giorni insieme) | solo header |
| `BlurText.tsx` | BlurText | Home (saluto) | `React.FC` → funzione tipizzata |
| `StarBorder.tsx` | StarBorder | Pairing (copia codice invito) | usi del namespace `React` → import di tipi |
| `DotGrid.tsx` | DotGrid (WebGL2) | Login (sfondo) | solo header |

Regole:

- Questi file sono **Views** (nessuna logica di dati): al massimo si adattano i colori ai
  token del tema (clay/sage/cream).
- Ad ogni aggiornamento da React Bits, mantenere la provenienza nell'header del file.
- Registrati in `docs/legal/LEGAL-NOTES.md` — aggiornare quel registro se si aggiunge un
  componente.
