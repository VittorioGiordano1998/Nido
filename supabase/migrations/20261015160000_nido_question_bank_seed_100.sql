-- =============================================================================
-- Nido - question bank seed, second batch (Fase 2.1)
--
-- 40 more original Italian questions (bank target: 100; the first seed shipped
-- 60). Same idempotent pattern as the first seed: unique (lang, text) index +
-- "on conflict do nothing", so appending and re-running only inserts the new
-- rows.
--
-- Adding questions can shift future deterministic picks (accepted; past days
-- keep their question_id in the answers).
-- =============================================================================

create unique index if not exists question_bank_lang_text_idx
  on public.question_bank (lang, text);

insert into public.question_bank (lang, category, text) values
  ('it', 'ricordi', 'Qual è la cosa più buffa che ci è successa finora?'),
  ('it', 'ricordi', 'Qual è il posto in cui torneresti subito con me?'),
  ('it', 'ricordi', 'Qual è stato il nostro silenzio più bello?'),
  ('it', 'ricordi', 'Cosa temevi del nostro inizio e come è andata a finire?'),
  ('it', 'ricordi', 'Qual è la prima cosa che ci siamo detti appena svegli?'),
  ('it', 'ricordi', 'Qual è la tradizione nata per caso che ormai teniamo?'),
  ('it', 'ricordi', 'Qual è la serata che rifaresti identica, da capo?'),
  ('it', 'ricordi', 'Cosa della tua infanzia vorresti raccontarmi meglio?'),
  ('it', 'noi', 'Cosa ti fa sentire "noi due" anche nelle giornate storte?'),
  ('it', 'noi', 'Come capisci che ho bisogno di spazio, senza che te lo dica?'),
  ('it', 'noi', 'Qual è la piccola cosa che fai per me e non mi hai mai raccontato?'),
  ('it', 'noi', 'Cosa apprezzi di come litighiamo (sì, proprio quello)?'),
  ('it', 'noi', 'Qual è il complimento che vorresti sentirti dire più spesso?'),
  ('it', 'noi', 'Quando mi vedi preso in qualcosa, cosa ti passa per la testa?'),
  ('it', 'noi', 'Qual è la nostra abitudine che difenderesti a tutti i costi?'),
  ('it', 'noi', 'In quale gesto quotidiano riconosci il nostro volerci bene?'),
  ('it', 'desideri', 'Cosa vorresti fare più spesso, e cosa toglieremmo per farlo?'),
  ('it', 'desideri', 'Qual è il regalo più bello che potresti farmi, che non è un oggetto?'),
  ('it', 'desideri', 'Se questa settimana sparissimo per due giorni, dove andremmo?'),
  ('it', 'desideri', 'Cosa vorresti assaggiare insieme per la prima volta?'),
  ('it', 'desideri', 'Qual è il piccolo lusso che ti concederesti ogni settimana?'),
  ('it', 'desideri', 'Cosa vorresti ricevere più spesso da me, oltre ai baci?'),
  ('it', 'desideri', 'Qual è il sogno che rimandi da tempo, e cosa ti ferma?'),
  ('it', 'desideri', 'Cosa vorresti fare nella prossima giornata tutta nostra?'),
  ('it', 'futuro', 'Come immagini una nostra domenica perfetta tra dieci anni?'),
  ('it', 'futuro', 'Se tra un anno facessimo un brindisi, per cosa sarebbe?'),
  ('it', 'futuro', 'Se un giorno cambiassimo casa, cosa porteremmo di questa?'),
  ('it', 'futuro', 'Cosa vorresti che diventasse una nostra routine tra un anno?'),
  ('it', 'futuro', 'Se scrivessimo una lettera a noi tra dieci anni, cosa ci augureremmo?'),
  ('it', 'futuro', 'Qual è un progetto che ti spaventa e ti attira allo stesso tempo?'),
  ('it', 'futuro', 'Cosa vorresti che non ci mancasse mai?'),
  ('it', 'futuro', 'Quale piccolo cambiamento migliorerebbe le nostre settimane?'),
  ('it', 'gioco', 'Se il nostro nido avesse un profumo, quale sarebbe?'),
  ('it', 'gioco', 'Quale sarebbe il nostro drink ufficiale e come si chiamerebbe?'),
  ('it', 'gioco', 'Se aprissimo un locale, chi farebbe cosa?'),
  ('it', 'gioco', 'Quale oggetto di casa nostra meriterebbe un museo?'),
  ('it', 'gioco', 'Se io fossi un piatto, quale sarei e perché?'),
  ('it', 'gioco', 'Qual è la regola più scema che potremmo inventarci per il weekend?'),
  ('it', 'gioco', 'Se ci dessero un superpotere di coppia, quale sceglieresti?'),
  ('it', 'gioco', 'Come si chiamerebbe la nostra band e che genere suoneremmo?')
on conflict (lang, text) do nothing;
