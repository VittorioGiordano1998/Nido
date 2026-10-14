-- =============================================================================
-- Nido - Row Level Security (plan section 5)
-- Every table is locked down; access goes through couple membership, with the
-- privacy exceptions from the plan (capsules, daily answers, votes, cycle).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPERS (security definer so policy subqueries never recurse on RLS)
-- ---------------------------------------------------------------------------

create function public.is_couple_member(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members
    where couple_id = cid
      and user_id = auth.uid()
  );
$$;

create function public.my_couple_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select couple_id from public.couple_members where user_id = auth.uid();
$$;

create function public.shares_couple_with(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members me
    join public.couple_members them on them.couple_id = me.couple_id
    where me.user_id = auth.uid()
      and them.user_id = uid
  );
$$;

-- True only when both partners answered the same daily question.
create function public.both_answered(cid uuid, d date)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select count(distinct user_id) >= 2
  from public.daily_answers
  where couple_id = cid
    and answer_date = d;
$$;

-- First path segment of a storage object, when it is a uuid (couple id).
create function public.storage_couple_id(path text)
returns uuid
language plpgsql
immutable
as $$
declare
  v_first text;
begin
  v_first := split_part(path, '/', 1);
  if v_first ~ '^[0-9a-fA-F-]{36}$' then
    return v_first::uuid;
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- CORE
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.device_keys enable row level security;
alter table public.push_tokens enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_couple_with(id));

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Creation / join / leave of couples go through the RPCs (security definer).
create policy couples_select on public.couples
  for select to authenticated
  using (public.is_couple_member(id));

create policy couples_update on public.couples
  for update to authenticated
  using (public.is_couple_member(id))
  with check (public.is_couple_member(id));

create policy couple_members_select on public.couple_members
  for select to authenticated
  using (user_id = auth.uid() or couple_id in (select public.my_couple_ids()));

create policy device_keys_select on public.device_keys
  for select to authenticated
  using (user_id = auth.uid() or public.shares_couple_with(user_id));

create policy device_keys_insert on public.device_keys
  for insert to authenticated
  with check (user_id = auth.uid());

create policy device_keys_update on public.device_keys
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy device_keys_delete on public.device_keys
  for delete to authenticated
  using (user_id = auth.uid());

create policy push_tokens_select on public.push_tokens
  for select to authenticated
  using (user_id = auth.uid());

create policy push_tokens_insert on public.push_tokens
  for insert to authenticated
  with check (user_id = auth.uid());

create policy push_tokens_update on public.push_tokens
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy push_tokens_delete on public.push_tokens
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- FASE 1
-- ---------------------------------------------------------------------------

alter table public.events enable row level security;
alter table public.task_lists enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;

create policy events_select on public.events
  for select to authenticated using (public.is_couple_member(couple_id));
create policy events_insert on public.events
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy events_update on public.events
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy events_delete on public.events
  for delete to authenticated using (public.is_couple_member(couple_id));

create policy task_lists_select on public.task_lists
  for select to authenticated using (public.is_couple_member(couple_id));
create policy task_lists_insert on public.task_lists
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy task_lists_update on public.task_lists
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy task_lists_delete on public.task_lists
  for delete to authenticated using (public.is_couple_member(couple_id));

create policy tasks_select on public.tasks
  for select to authenticated using (public.is_couple_member(couple_id));
create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy tasks_update on public.tasks
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy tasks_delete on public.tasks
  for delete to authenticated using (public.is_couple_member(couple_id));

create policy notes_select on public.notes
  for select to authenticated using (public.is_couple_member(couple_id));
create policy notes_insert on public.notes
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy notes_update on public.notes
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy notes_delete on public.notes
  for delete to authenticated using (public.is_couple_member(couple_id));

-- ---------------------------------------------------------------------------
-- FASE 2
-- ---------------------------------------------------------------------------

alter table public.question_bank enable row level security;
alter table public.daily_answers enable row level security;
alter table public.decisions enable row level security;
alter table public.decision_votes enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.partner_facts enable row level security;
alter table public.time_capsules enable row level security;
alter table public.week_plans enable row level security;
alter table public.nudges enable row level security;

create policy question_bank_select on public.question_bank
  for select to authenticated using (true);

-- Answers stay hidden until both partners answered the same question/day.
create policy daily_answers_select on public.daily_answers
  for select to authenticated
  using (
    public.is_couple_member(couple_id)
    and (user_id = auth.uid() or public.both_answered(couple_id, answer_date))
  );
create policy daily_answers_insert on public.daily_answers
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_couple_member(couple_id));
create policy daily_answers_update on public.daily_answers
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_couple_member(couple_id));
create policy daily_answers_delete on public.daily_answers
  for delete to authenticated using (user_id = auth.uid());

create policy decisions_select on public.decisions
  for select to authenticated using (public.is_couple_member(couple_id));
create policy decisions_insert on public.decisions
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy decisions_update on public.decisions
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy decisions_delete on public.decisions
  for delete to authenticated using (public.is_couple_member(couple_id));

-- Votes stay hidden until the decision is revealed (decisions RLS scopes the
-- subquery to my own couple).
create policy decision_votes_select on public.decision_votes
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.decisions d
      where d.id = decision_id and d.revealed_at is not null
    )
  );
create policy decision_votes_insert on public.decision_votes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.decisions d
      where d.id = decision_id and d.revealed_at is null
    )
  );
create policy decision_votes_update on public.decision_votes
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy decision_votes_delete on public.decision_votes
  for delete to authenticated using (user_id = auth.uid());

create policy wishlist_items_select on public.wishlist_items
  for select to authenticated using (public.is_couple_member(couple_id));
create policy wishlist_items_insert on public.wishlist_items
  for insert to authenticated
  with check (public.is_couple_member(couple_id));
create policy wishlist_items_update on public.wishlist_items
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy wishlist_items_delete on public.wishlist_items
  for delete to authenticated using (public.is_couple_member(couple_id));

create policy partner_facts_select on public.partner_facts
  for select to authenticated using (public.is_couple_member(couple_id));
create policy partner_facts_insert on public.partner_facts
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and updated_by = auth.uid());
create policy partner_facts_update on public.partner_facts
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and updated_by = auth.uid());
create policy partner_facts_delete on public.partner_facts
  for delete to authenticated using (public.is_couple_member(couple_id));

-- A capsule is readable by its author right away, by the partner only once it
-- opens.
create policy time_capsules_select on public.time_capsules
  for select to authenticated
  using (
    created_by = auth.uid()
    or (public.is_couple_member(couple_id) and opens_at <= current_date)
  );
create policy time_capsules_insert on public.time_capsules
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy time_capsules_update on public.time_capsules
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid() and public.is_couple_member(couple_id));
create policy time_capsules_delete on public.time_capsules
  for delete to authenticated using (created_by = auth.uid());

create policy week_plans_select on public.week_plans
  for select to authenticated using (public.is_couple_member(couple_id));
create policy week_plans_insert on public.week_plans
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy week_plans_update on public.week_plans
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy week_plans_delete on public.week_plans
  for delete to authenticated using (public.is_couple_member(couple_id));

create policy nudges_select on public.nudges
  for select to authenticated using (public.is_couple_member(couple_id));
create policy nudges_insert on public.nudges
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and from_user = auth.uid());

-- ---------------------------------------------------------------------------
-- FASE 3
-- ---------------------------------------------------------------------------

alter table public.vault_items enable row level security;
alter table public.vault_keys enable row level security;
alter table public.cycle_logs enable row level security;
alter table public.cycle_shares enable row level security;
alter table public.savings_projects enable row level security;
alter table public.loyalty_cards enable row level security;

-- The vault payload is end-to-end encrypted: the server stores opaque blobs.
create policy vault_items_select on public.vault_items
  for select to authenticated using (public.is_couple_member(couple_id));
create policy vault_items_insert on public.vault_items
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy vault_items_update on public.vault_items
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy vault_items_delete on public.vault_items
  for delete to authenticated using (public.is_couple_member(couple_id));

create policy vault_keys_select on public.vault_keys
  for select to authenticated using (public.is_couple_member(couple_id));
create policy vault_keys_insert on public.vault_keys
  for insert to authenticated
  with check (public.is_couple_member(couple_id));
create policy vault_keys_delete on public.vault_keys
  for delete to authenticated using (public.is_couple_member(couple_id));

-- Cycle data is health data: visible to its owner only, never to the partner.
create policy cycle_logs_select on public.cycle_logs
  for select to authenticated using (user_id = auth.uid());
create policy cycle_logs_insert on public.cycle_logs
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_couple_member(couple_id));
create policy cycle_logs_update on public.cycle_logs
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy cycle_logs_delete on public.cycle_logs
  for delete to authenticated using (user_id = auth.uid());

-- What is shared is only the explicit summary the owner creates.
create policy cycle_shares_select on public.cycle_shares
  for select to authenticated using (public.is_couple_member(couple_id));
create policy cycle_shares_insert on public.cycle_shares
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_couple_member(couple_id));
create policy cycle_shares_update on public.cycle_shares
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy cycle_shares_delete on public.cycle_shares
  for delete to authenticated using (user_id = auth.uid());

create policy savings_projects_select on public.savings_projects
  for select to authenticated using (public.is_couple_member(couple_id));
create policy savings_projects_insert on public.savings_projects
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy savings_projects_update on public.savings_projects
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy savings_projects_delete on public.savings_projects
  for delete to authenticated using (public.is_couple_member(couple_id));

create policy loyalty_cards_select on public.loyalty_cards
  for select to authenticated using (public.is_couple_member(couple_id));
create policy loyalty_cards_insert on public.loyalty_cards
  for insert to authenticated
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy loyalty_cards_update on public.loyalty_cards
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy loyalty_cards_delete on public.loyalty_cards
  for delete to authenticated using (public.is_couple_member(couple_id));

-- ---------------------------------------------------------------------------
-- FASE 4
-- ---------------------------------------------------------------------------

alter table public.canvases enable row level security;

create policy canvases_select on public.canvases
  for select to authenticated using (public.is_couple_member(couple_id));
create policy canvases_insert on public.canvases
  for insert to authenticated
  with check (public.is_couple_member(couple_id));
create policy canvases_update on public.canvases
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy canvases_delete on public.canvases
  for delete to authenticated using (public.is_couple_member(couple_id));

-- ---------------------------------------------------------------------------
-- STORAGE OBJECTS (paths are `<couple_id>/<file>`; private buckets)
-- ---------------------------------------------------------------------------

create policy vault_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'vault' and public.is_couple_member(public.storage_couple_id(name)));

create policy vault_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vault' and public.is_couple_member(public.storage_couple_id(name)));

create policy vault_objects_update on storage.objects
  for update to authenticated
  using (bucket_id = 'vault' and public.is_couple_member(public.storage_couple_id(name)))
  with check (bucket_id = 'vault' and public.is_couple_member(public.storage_couple_id(name)));

create policy vault_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'vault' and public.is_couple_member(public.storage_couple_id(name)));

create policy canvases_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'canvases' and public.is_couple_member(public.storage_couple_id(name)));

create policy canvases_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'canvases' and public.is_couple_member(public.storage_couple_id(name)));

create policy canvases_objects_update on storage.objects
  for update to authenticated
  using (bucket_id = 'canvases' and public.is_couple_member(public.storage_couple_id(name)))
  with check (bucket_id = 'canvases' and public.is_couple_member(public.storage_couple_id(name)));

create policy canvases_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'canvases' and public.is_couple_member(public.storage_couple_id(name)));
