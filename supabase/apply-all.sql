-- ============================================================================
-- Nido - one-shot apply script
-- Generated from supabase/migrations/ (source of truth). Paste the whole file
-- into the Supabase SQL Editor of project fvhqirvfyehyyucvwjjz and press Run.
-- ============================================================================

-- ============================================================================
-- Source: supabase/migrations/20261014133039_nido_initial_schema.sql
-- ============================================================================

-- =============================================================================
-- Nido - initial schema (plan section 4)
-- Core (Fase 0) through Fase 4 tables, indexes, triggers and pairing RPCs.
-- RLS policies live in the next migration.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CORE
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text,
  invite_code text unique,
  started_at date,
  premium_tier text check (premium_tier in ('monthly', 'semiannual', 'annual', 'lifetime')),
  premium_until timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create table public.device_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  public_key bytea not null,
  label text,
  created_at timestamptz not null default now()
);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('web', 'android', 'ios')),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

-- ---------------------------------------------------------------------------
-- FASE 1 - calendar, shared lists, notes
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  rrule text,
  visibility text not null default 'couple' check (visibility in ('couple', 'private')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_couple_start_idx on public.events (couple_id, start_at);

create table public.task_lists (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  icon text,
  position int not null default 0,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index task_lists_couple_idx on public.task_lists (couple_id, position);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.task_lists (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  note text,
  done boolean not null default false,
  done_by uuid references public.profiles (id) on delete set null,
  done_at timestamptz,
  due_date date,
  assigned_to uuid references public.profiles (id) on delete set null,
  position int not null default 0,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_list_idx on public.tasks (list_id, position);
create index tasks_couple_idx on public.tasks (couple_id);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text,
  body text,
  pinned_to_widget boolean not null default false,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_couple_idx on public.notes (couple_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- FASE 2 - engagement
-- ---------------------------------------------------------------------------

create table public.question_bank (
  id serial primary key,
  lang text not null,
  category text,
  text text not null
);

create table public.daily_answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  question_id int not null references public.question_bank (id),
  answer_date date not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  answer text not null,
  answered_at timestamptz not null default now(),
  unique (couple_id, answer_date, user_id)
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  revealed_at timestamptz,
  result jsonb
);
create index decisions_couple_idx on public.decisions (couple_id, created_at desc);

create table public.decision_votes (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  choice jsonb not null,
  voted_at timestamptz not null default now(),
  unique (decision_id, user_id)
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  url text,
  price numeric(12, 2),
  currency text default 'EUR',
  notes text,
  priority int not null default 0,
  purchased boolean not null default false,
  purchased_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index wishlist_couple_idx on public.wishlist_items (couple_id, owner_id);

create table public.partner_facts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  subject_id uuid not null references public.profiles (id) on delete cascade,
  category text,
  label text not null,
  value text,
  updated_by uuid not null references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now()
);
create index partner_facts_couple_idx on public.partner_facts (couple_id, subject_id);

create table public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text,
  body text,
  opens_at date not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index time_capsules_couple_idx on public.time_capsules (couple_id, opens_at);

create table public.week_plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  week_start date not null,
  proposal text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'replaced')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index week_plans_couple_idx on public.week_plans (couple_id, week_start desc);

create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  message text,
  created_at timestamptz not null default now()
);
create index nudges_couple_idx on public.nudges (couple_id, created_at desc);

-- ---------------------------------------------------------------------------
-- FASE 3 - privacy and monetization
-- ---------------------------------------------------------------------------

create table public.vault_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  category text,
  storage_path text not null,
  enc_alg text not null default 'AES-256-GCM',
  enc_nonce bytea not null,
  size_bytes bigint,
  mime text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index vault_items_couple_idx on public.vault_items (couple_id, category);

create table public.vault_keys (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  device_key_id uuid not null references public.device_keys (id) on delete cascade,
  wrapped_key bytea not null,
  created_at timestamptz not null default now()
);

create table public.cycle_logs (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null,
  flow int check (flow between 1 and 5),
  symptoms jsonb not null default '[]'::jsonb,
  mood int check (mood between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table public.cycle_shares (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  period_start date not null,
  period_end date,
  share_level text not null default 'summary' check (share_level in ('summary', 'dates_only')),
  created_at timestamptz not null default now()
);

create table public.savings_projects (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) not null default 0,
  currency text not null default 'EUR',
  deadline date,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  store_name text not null,
  code text not null,
  barcode_type text,
  color text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- FASE 4 - canvas (live strokes go through Realtime Broadcast, only the PNG
-- is persisted; see plan section 6)
-- ---------------------------------------------------------------------------

create table public.canvases (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  image_path text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create trigger partner_facts_set_updated_at
  before update on public.partner_facts
  for each row execute function public.set_updated_at();

create trigger savings_projects_set_updated_at
  before update on public.savings_projects
  for each row execute function public.set_updated_at();

create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

create trigger canvases_set_updated_at
  before update on public.canvases
  for each row execute function public.set_updated_at();

-- Profile row for every new auth user (display name from OAuth metadata when
-- present, email prefix otherwise).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The "max 2 members" invariant. Locks the couple row so two concurrent joins
-- cannot both pass the count check.
create function public.enforce_couple_size()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform 1 from public.couples where id = new.couple_id for update;
  select count(*) into v_count from public.couple_members where couple_id = new.couple_id;
  if v_count >= 2 then
    raise exception 'couple_full';
  end if;
  return new;
end;
$$;

create trigger couple_members_max_two
  before insert on public.couple_members
  for each row execute function public.enforce_couple_size();

-- ---------------------------------------------------------------------------
-- PAIRING RPCs (security definer: all writes to couples / couple_members go
-- through these, never through direct table access)
-- ---------------------------------------------------------------------------

create function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1),
    ''
  )
  from generate_series(1, 8);
$$;

create function public.create_couple(p_name text default null, p_started_at date default null)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple public.couples;
  v_code text;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.couple_members where user_id = v_user) then
    raise exception 'already_in_couple';
  end if;

  loop
    v_code := public.generate_invite_code();
    begin
      insert into public.couples (name, invite_code, started_at, created_by)
      values (nullif(trim(coalesce(p_name, '')), ''), v_code, p_started_at, v_user)
      returning * into v_couple;
      exit;
    exception when unique_violation then
      -- invite code collision, retry with a fresh code
    end;
  end loop;

  insert into public.couple_members (couple_id, user_id) values (v_couple.id, v_user);
  return v_couple;
end;
$$;

create function public.join_couple(p_code text)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple public.couples;
  v_count int;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.couple_members where user_id = v_user) then
    raise exception 'already_in_couple';
  end if;

  select * into v_couple
  from public.couples
  where invite_code = upper(trim(coalesce(p_code, '')))
  for update;

  if not found then
    raise exception 'invalid_code';
  end if;

  select count(*) into v_count from public.couple_members where couple_id = v_couple.id;
  if v_count >= 2 then
    raise exception 'couple_full';
  end if;

  insert into public.couple_members (couple_id, user_id) values (v_couple.id, v_user);

  -- complete couple: the invite code is no longer needed
  update public.couples set invite_code = null where id = v_couple.id;
  v_couple.invite_code := null;

  return v_couple;
end;
$$;

create function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple uuid;
  v_remaining int;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select couple_id into v_couple from public.couple_members where user_id = v_user;
  if v_couple is null then
    raise exception 'not_in_couple';
  end if;

  delete from public.couple_members where couple_id = v_couple and user_id = v_user;

  select count(*) into v_remaining from public.couple_members where couple_id = v_couple;
  if v_remaining = 0 then
    delete from public.couples where id = v_couple;
  else
    -- the remaining partner can invite again
    update public.couples
    set invite_code = public.generate_invite_code()
    where id = v_couple and invite_code is null;
  end if;
end;
$$;

create function public.rotate_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple uuid;
  v_count int;
  v_code text;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select couple_id into v_couple from public.couple_members where user_id = v_user;
  if v_couple is null then
    raise exception 'not_in_couple';
  end if;

  select count(*) into v_count from public.couple_members where couple_id = v_couple;
  if v_count >= 2 then
    raise exception 'couple_full';
  end if;

  loop
    v_code := public.generate_invite_code();
    begin
      update public.couples set invite_code = v_code where id = v_couple;
      exit;
    exception when unique_violation then
      -- collision, retry
    end;
  end loop;

  return v_code;
end;
$$;

-- RPCs are for signed-in users only.
revoke execute on function public.create_couple(text, date) from public, anon;
revoke execute on function public.join_couple(text) from public, anon;
revoke execute on function public.leave_couple() from public, anon;
revoke execute on function public.rotate_invite_code() from public, anon;
grant execute on function public.create_couple(text, date) to authenticated;
grant execute on function public.join_couple(text) to authenticated;
grant execute on function public.leave_couple() to authenticated;
grant execute on function public.rotate_invite_code() to authenticated;

-- ---------------------------------------------------------------------------
-- STORAGE BUCKETS (private; contents are encrypted client-side for the vault)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('canvases', 'canvases', false)
on conflict (id) do nothing;

-- ============================================================================
-- Source: supabase/migrations/20261014133039_nido_rls_policies.sql
-- ============================================================================

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

-- ============================================================================
-- Source: supabase/migrations/20261014133040_nido_realtime.sql
-- ============================================================================

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

-- ============================================================================
-- Source: supabase/migrations/20261014134705_nido_keepalive.sql
-- ============================================================================

-- =============================================================================
-- Nido - keep-alive (free-tier pausing)
--
-- Supabase pauses free projects after ~7 days of low database activity, and
-- evidence from Supabase discussion #13121 shows that connections or plain
-- reads are not enough: a real transaction (a write) per day keeps the project
-- out of the pausing window. This migration adds:
--
--   1. public.heartbeat     - singleton row holding the last successful ping
--   2. keepalive_ping()     - one UPDATE, callable with the anon key from any
--                             external scheduler (Windows task, cron service)
--   3. two pg_cron jobs     - the heartbeat runs inside Supabase itself (no
--                             external dependency) + run-history cleanup
--
-- If pg_cron cannot be enabled by this script, enable it from the Dashboard
-- (Integrations -> Cron) and re-run the scheduling block at the bottom.
-- =============================================================================

create table public.heartbeat (
  id smallint primary key default 1 check (id = 1),
  last_ping timestamptz not null default now()
);

insert into public.heartbeat (id) values (1)
on conflict (id) do nothing;

-- Not reachable through the API: deliberately no policies. Only the definer
-- function below and the internal cron job touch this table.
alter table public.heartbeat enable row level security;

create function public.keepalive_ping()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_at timestamptz;
begin
  update public.heartbeat
  set last_ping = now()
  where id = 1
  returning last_ping into v_at;
  return v_at;
end;
$$;

-- Callable without a login: the anon key is public by design and the endpoint
-- only bumps one timestamp, so the exposure is deliberately minimal.
revoke execute on function public.keepalive_ping() from public;
grant execute on function public.keepalive_ping() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Inside-Supabase scheduler. Cron jobs run in UTC: 07:30 UTC is ~09:30 in
-- Italian summer time (~08:30 in winter).
-- ---------------------------------------------------------------------------

do $$
begin
  execute 'create extension if not exists pg_cron';
exception when others then
  raise notice 'pg_cron non abilitato da SQL (%): abilitalo da Dashboard -> Integrations -> Cron e riesegui il blocco di scheduling', sqlerrm;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron non installato: job heartbeat non pianificato (riesegui il blocco dopo aver abilitato Cron)';
    return;
  end if;

  perform cron.schedule(
    'nido-heartbeat',
    '30 7 * * *',
    'update public.heartbeat set last_ping = now() where id = 1'
  );

  -- cron.job_run_details grows forever otherwise; keep the last 30 days.
  perform cron.schedule(
    'nido-cron-log-cleanup',
    '0 4 * * 0',
    'delete from cron.job_run_details where end_time < now() - interval ''30 days'''
  );
exception when others then
  raise notice 'job heartbeat non pianificato (%): abilita Cron da Dashboard -> Integrations e riesegui questo blocco', sqlerrm;
end;
$$;

-- ============================================================================
-- Source: supabase/migrations/20261014161502_nido_events_privacy.sql
-- ============================================================================

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

-- ============================================================================
-- Source: supabase/migrations/20261014172345_nido_question_bank_seed.sql
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
  ('it', 'ricordi', 'Qual è il tuo ricordo preferito del nostro primo mese insieme?'),
  ('it', 'ricordi', 'Cosa hai pensato la prima volta che mi hai visto?'),
  ('it', 'ricordi', 'Qual è la prima cosa che ti ha fatto ridere di me?'),
  ('it', 'ricordi', 'Qual è il viaggio che ci racconteremo per sempre?'),
  ('it', 'ricordi', 'Qual è il momento più imbarazzante che abbiamo passato insieme?'),
  ('it', 'ricordi', 'Cosa ti ricordi del nostro primo litigio?'),
  ('it', 'ricordi', 'Qual è la canzone che ti fa pensare a noi?'),
  ('it', 'ricordi', 'Qual era il tuo posto preferito da bambino?'),
  ('it', 'ricordi', 'Qual è il regalo più bello che ti ho fatto?'),
  ('it', 'ricordi', 'Cosa abbiamo fatto insieme che non avresti mai immaginato di fare?'),
  ('it', 'ricordi', 'Qual è la cena più memorabile che abbiamo condiviso?'),
  ('it', 'ricordi', 'Qual è la foto di noi due che guarderesti mille volte?'),
  ('it', 'noi', 'Cosa apprezzi di più di come stiamo insieme?'),
  ('it', 'noi', 'In quale momento della giornata pensi più spesso a me?'),
  ('it', 'noi', 'Cosa ti fa sentire a casa quando siamo insieme?'),
  ('it', 'noi', 'Qual è la piccola abitudine che ti fa sorridere di me?'),
  ('it', 'noi', 'Cosa vorresti che facessimo più spesso in due?'),
  ('it', 'noi', 'Come ti accorgi che ho avuto una brutta giornata?'),
  ('it', 'noi', 'Qual è la cosa che ti fa sentire più amato o amata?'),
  ('it', 'noi', 'Cosa rende perfetta una serata per noi due?'),
  ('it', 'noi', 'Qual è la promessa che vorresti mantenere sempre?'),
  ('it', 'noi', 'Cosa ti piace di come facciamo pace dopo un litigio?'),
  ('it', 'noi', 'Qual è il gesto di tutti i giorni che vale più di un regalo?'),
  ('it', 'noi', 'Cosa significa "nido" per te?'),
  ('it', 'desideri', 'Cosa vorresti imparare a fare insieme a me?'),
  ('it', 'desideri', 'In quale posto del mondo ci vedi tra cinque anni?'),
  ('it', 'desideri', 'Cosa vorresti provare almeno una volta nella vita?'),
  ('it', 'desideri', 'Qual è la cosa che desideri per noi e non hai mai detto?'),
  ('it', 'desideri', 'Se potessimo partire domani, dove andremmo?'),
  ('it', 'desideri', 'Cosa vorresti che ti insegnassi?'),
  ('it', 'desideri', 'Qual è il tuo sogno piccolo per questa settimana?'),
  ('it', 'desideri', 'Per cosa vorresti avere più tempo?'),
  ('it', 'desideri', 'Quale tradizione ti piacerebbe inventare per noi?'),
  ('it', 'desideri', 'Cosa vorresti fare per il nostro prossimo anniversario?'),
  ('it', 'desideri', 'Qual è un desiderio che non hai mai confessato a nessuno?'),
  ('it', 'desideri', 'Cosa ti piacerebbe ricevere in un giorno qualunque?'),
  ('it', 'futuro', 'Come immagini la nostra casa ideale?'),
  ('it', 'futuro', 'Cosa non vorresti mai cambiasse di noi?'),
  ('it', 'futuro', 'Qual è un progetto che vorresti iniziare con me quest''anno?'),
  ('it', 'futuro', 'Come festeggeremo il prossimo traguardo importante?'),
  ('it', 'futuro', 'Cosa ti piacerebbe che dicessero di noi tra dieci anni?'),
  ('it', 'futuro', 'Qual è un problema che vorresti risolvere insieme, piano piano?'),
  ('it', 'futuro', 'Qual è la prossima cosa che vorresti scoprire di me?'),
  ('it', 'futuro', 'Come vorresti prenderti cura di noi quando saremo più grandi?'),
  ('it', 'futuro', 'Cosa ti piacerebbe costruire insieme, anche in piccolo?'),
  ('it', 'futuro', 'Quale tradizione vorresti che durasse per sempre?'),
  ('it', 'futuro', 'Dove ti piacerebbe svegliarti in una domenica perfetta?'),
  ('it', 'futuro', 'Cosa vorresti aver imparato su di noi tra un anno?'),
  ('it', 'gioco', 'Se fossimo una serie TV, che titolo avrebbe?'),
  ('it', 'gioco', 'Quale superpotere sceglieresti per me e perché?'),
  ('it', 'gioco', 'Come si chiamerebbe un nostro ristorante?'),
  ('it', 'gioco', 'Qual è la cosa più strana che metteresti in valigia per un viaggio con me?'),
  ('it', 'gioco', 'Se io fossi un animale, quale sarei?'),
  ('it', 'gioco', 'Qual è la sfida più buffa che potremmo fare stasera?'),
  ('it', 'gioco', 'Qual è la parola che dico troppo spesso?'),
  ('it', 'gioco', 'Se vincessimo alla lotteria domani, cosa compreresti per primo?'),
  ('it', 'gioco', 'Quale canzone dovrebbe essere la nostra sigla?'),
  ('it', 'gioco', 'Se cucinassimo una cena a tema "noi", cosa serviremmo?'),
  ('it', 'gioco', 'Qual è il costume perfetto per noi due a Carnevale?'),
  ('it', 'gioco', 'Cosa ci farebbe ridere per ore anche a una cena noiosa?')
on conflict (lang, text) do nothing;

-- ============================================================================
-- Source: supabase/migrations/20261015101500_nido_profile_preferences.sql
-- ============================================================================

alter table public.profiles
  add column if not exists theme text not null default 'system';

alter table public.profiles
  add column if not exists accent text not null default 'terra';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_theme_check'
  ) then
    alter table public.profiles
      add constraint profiles_theme_check check (theme in ('light', 'dark', 'system'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_accent_check'
  ) then
    alter table public.profiles
      add constraint profiles_accent_check
      check (accent in ('terra', 'oliva', 'mare', 'prugna'));
  end if;
end $$;

-- ============================================================================
-- Source: supabase/migrations/20261015113000_nido_onboarding.sql
-- ============================================================================

alter table public.profiles
  add column if not exists onboarded_at timestamptz;
