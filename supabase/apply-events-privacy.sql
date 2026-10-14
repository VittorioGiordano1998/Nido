-- ============================================================================
-- Nido - events privacy fix (idempotente)
--
-- Da usare su un progetto dove le migrazioni principali sono gia' applicate
-- (la tabella events esiste): sostituisce le policy select/update/delete di
-- events con la versione che rispetta visibility = 'private'. Ogni istruzione
-- e' in stile "drop if exists + create": si puo' rilanciare quante volte si
-- vuole, senza errori.
--
-- Alla fine mostra le policy risultanti (ultimo SELECT), per verifica.
-- ============================================================================

drop policy if exists events_select on public.events;
drop policy if exists events_update on public.events;
drop policy if exists events_delete on public.events;

create policy events_select on public.events
  for select to authenticated
  using (
    public.is_couple_member(couple_id)
    and (visibility = 'couple' or created_by = auth.uid())
  );

create policy events_update on public.events
  for update to authenticated
  using (
    public.is_couple_member(couple_id)
    and (visibility = 'couple' or created_by = auth.uid())
  )
  with check (
    public.is_couple_member(couple_id)
    and (visibility = 'couple' or created_by = auth.uid())
  );

create policy events_delete on public.events
  for delete to authenticated
  using (
    public.is_couple_member(couple_id)
    and (visibility = 'couple' or created_by = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Report di verifica (il SQL Editor mostra queste righe)
-- ----------------------------------------------------------------------------

select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'events'
order by policyname;
