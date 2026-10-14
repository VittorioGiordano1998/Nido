-- ============================================================================
-- Nido - question bank seed (idempotente)
--
-- Da usare su un progetto dove la migrazione iniziale e' applicata e manca la
-- banca delle domande (o per aggiungere quelle nuove). Si puo' rilanciare
-- quante volte si vuole: l'indice unico e "on conflict do nothing" rendono
-- ogni run innocuo.
--
-- Alla fine mostra una tabella di verifica (ultimo SELECT).
-- ============================================================================

-- =============================================================================
-- Nido - question bank seed (Fase 2.1)
--
-- 60 original Italian questions for the daily ritual (plan target: 100; this
-- is the first seed). The unique index on (lang, text) makes every re-run
-- idempotent: append new questions at the bottom and re-apply, only the new
-- ones land.
--
-- The daily pick is deterministic on the client (hash of couple + date over
-- the ordered bank), so both partners see the same question with no cron.
-- =============================================================================

create unique index if not exists question_bank_lang_text_idx
  on public.question_bank (lang, text);

insert into public.question_bank (lang, category, text) values
  ('it', 'ricordi', 'Qual Ã¨ il tuo ricordo preferito del nostro primo mese insieme?'),
  ('it', 'ricordi', 'Cosa hai pensato la prima volta che mi hai visto?'),
  ('it', 'ricordi', 'Qual Ã¨ la prima cosa che ti ha fatto ridere di me?'),
  ('it', 'ricordi', 'Qual Ã¨ il viaggio che ci racconteremo per sempre?'),
  ('it', 'ricordi', 'Qual Ã¨ il momento piÃ¹ imbarazzante che abbiamo passato insieme?'),
  ('it', 'ricordi', 'Cosa ti ricordi del nostro primo litigio?'),
  ('it', 'ricordi', 'Qual Ã¨ la canzone che ti fa pensare a noi?'),
  ('it', 'ricordi', 'Qual era il tuo posto preferito da bambino?'),
  ('it', 'ricordi', 'Qual Ã¨ il regalo piÃ¹ bello che ti ho fatto?'),
  ('it', 'ricordi', 'Cosa abbiamo fatto insieme che non avresti mai immaginato di fare?'),
  ('it', 'ricordi', 'Qual Ã¨ la cena piÃ¹ memorabile che abbiamo condiviso?'),
  ('it', 'ricordi', 'Qual Ã¨ la foto di noi due che guarderesti mille volte?'),
  ('it', 'noi', 'Cosa apprezzi di piÃ¹ di come stiamo insieme?'),
  ('it', 'noi', 'In quale momento della giornata pensi piÃ¹ spesso a me?'),
  ('it', 'noi', 'Cosa ti fa sentire a casa quando siamo insieme?'),
  ('it', 'noi', 'Qual Ã¨ la piccola abitudine che ti fa sorridere di me?'),
  ('it', 'noi', 'Cosa vorresti che facessimo piÃ¹ spesso in due?'),
  ('it', 'noi', 'Come ti accorgi che ho avuto una brutta giornata?'),
  ('it', 'noi', 'Qual Ã¨ la cosa che ti fa sentire piÃ¹ amato o amata?'),
  ('it', 'noi', 'Cosa rende perfetta una serata per noi due?'),
  ('it', 'noi', 'Qual Ã¨ la promessa che vorresti mantenere sempre?'),
  ('it', 'noi', 'Cosa ti piace di come facciamo pace dopo un litigio?'),
  ('it', 'noi', 'Qual Ã¨ il gesto di tutti i giorni che vale piÃ¹ di un regalo?'),
  ('it', 'noi', 'Cosa significa "nido" per te?'),
  ('it', 'desideri', 'Cosa vorresti imparare a fare insieme a me?'),
  ('it', 'desideri', 'In quale posto del mondo ci vedi tra cinque anni?'),
  ('it', 'desideri', 'Cosa vorresti provare almeno una volta nella vita?'),
  ('it', 'desideri', 'Qual Ã¨ la cosa che desideri per noi e non hai mai detto?'),
  ('it', 'desideri', 'Se potessimo partire domani, dove andremmo?'),
  ('it', 'desideri', 'Cosa vorresti che ti insegnassi?'),
  ('it', 'desideri', 'Qual Ã¨ il tuo sogno piccolo per questa settimana?'),
  ('it', 'desideri', 'Per cosa vorresti avere piÃ¹ tempo?'),
  ('it', 'desideri', 'Quale tradizione ti piacerebbe inventare per noi?'),
  ('it', 'desideri', 'Cosa vorresti fare per il nostro prossimo anniversario?'),
  ('it', 'desideri', 'Qual Ã¨ un desiderio che non hai mai confessato a nessuno?'),
  ('it', 'desideri', 'Cosa ti piacerebbe ricevere in un giorno qualunque?'),
  ('it', 'futuro', 'Come immagini la nostra casa ideale?'),
  ('it', 'futuro', 'Cosa non vorresti mai cambiasse di noi?'),
  ('it', 'futuro', 'Qual Ã¨ un progetto che vorresti iniziare con me quest''anno?'),
  ('it', 'futuro', 'Come festeggeremo il prossimo traguardo importante?'),
  ('it', 'futuro', 'Cosa ti piacerebbe che dicessero di noi tra dieci anni?'),
  ('it', 'futuro', 'Qual Ã¨ un problema che vorresti risolvere insieme, piano piano?'),
  ('it', 'futuro', 'Qual Ã¨ la prossima cosa che vorresti scoprire di me?'),
  ('it', 'futuro', 'Come vorresti prenderti cura di noi quando saremo piÃ¹ grandi?'),
  ('it', 'futuro', 'Cosa ti piacerebbe costruire insieme, anche in piccolo?'),
  ('it', 'futuro', 'Quale tradizione vorresti che durasse per sempre?'),
  ('it', 'futuro', 'Dove ti piacerebbe svegliarti in una domenica perfetta?'),
  ('it', 'futuro', 'Cosa vorresti aver imparato su di noi tra un anno?'),
  ('it', 'gioco', 'Se fossimo una serie TV, che titolo avrebbe?'),
  ('it', 'gioco', 'Quale superpotere sceglieresti per me e perchÃ©?'),
  ('it', 'gioco', 'Come si chiamerebbe un nostro ristorante?'),
  ('it', 'gioco', 'Qual Ã¨ la cosa piÃ¹ strana che metteresti in valigia per un viaggio con me?'),
  ('it', 'gioco', 'Se io fossi un animale, quale sarei?'),
  ('it', 'gioco', 'Qual Ã¨ la sfida piÃ¹ buffa che potremmo fare stasera?'),
  ('it', 'gioco', 'Qual Ã¨ la parola che dico troppo spesso?'),
  ('it', 'gioco', 'Se vincessimo alla lotteria domani, cosa compreresti per primo?'),
  ('it', 'gioco', 'Quale canzone dovrebbe essere la nostra sigla?'),
  ('it', 'gioco', 'Se cucinassimo una cena a tema "noi", cosa serviremmo?'),
  ('it', 'gioco', 'Qual Ã¨ il costume perfetto per noi due a Carnevale?'),
  ('it', 'gioco', 'Cosa ci farebbe ridere per ore anche a una cena noiosa?')
on conflict (lang, text) do nothing;

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select lang, category, count(*) as questions
from public.question_bank
group by lang, category
order by lang, category;
