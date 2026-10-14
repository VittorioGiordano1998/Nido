-- =============================================================================
-- Nido - Realtime (plan section 6)
-- Postgres changes for shared tables; the live canvas uses Broadcast and needs
-- no schema support. RLS is enforced for Postgres changes subscribers.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;

do $$
declare
  t text;
  subscribed text[] := array[
    'couple_members',
    'events',
    'task_lists',
    'tasks',
    'notes',
    'decisions',
    'decision_votes',
    'daily_answers',
    'wishlist_items',
    'partner_facts',
    'week_plans',
    'savings_projects',
    'loyalty_cards'
  ];
begin
  foreach t in array subscribed loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
      -- deliver old row values (needed for update/delete payloads with RLS)
      execute format('alter table public.%I replica identity full', t);
    end if;
  end loop;
end;
$$;
