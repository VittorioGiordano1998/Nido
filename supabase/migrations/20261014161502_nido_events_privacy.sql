-- =============================================================================
-- Nido - events: 'private' visibility enforced in RLS (KI-VITTORIOGIORDANOYBQ-001)
--
-- The plan promises "visibilita' coppia/privato" for the calendar (section 1.1):
-- an event with visibility = 'private' must stay invisible to the partner.
-- The initial policies only checked couple membership, so a private event was
-- readable by the partner through the API. These policies add the rule:
--
--   couple member AND (visibility = 'couple' OR created_by = auth.uid())
--
-- The insert check is unchanged (is_couple_member and created_by = auth.uid()).
-- Idempotent by design: this file may be re-run (apply-events-privacy.sql).
-- =============================================================================

drop policy if exists events_select on public.events;
drop policy if exists events_update on public.events;
drop policy if exists events_delete on public.events;

create policy events_select on public.events
  for select to authenticated
  using (
    public.is_couple_member(couple_id)
    and (visibility = 'couple' or created_by = auth.uid())
  );

-- A couple event stays editable by both partners; a private one only by its
-- creator. The check keeps the resulting row under the same rule, so a partner
-- cannot turn somebody else's event into a private one.
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
